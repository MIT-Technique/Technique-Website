import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { UserRole } from "../../../../lib/supabase/types";
import { createLog } from "../../../../lib/admin-logs";
import crypto from "crypto";

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// PUT - Update user role
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, role, isActive } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const validRoles: UserRole[] = ['admin', 'staph', 'club', 'living_group', 'photographer'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get current user data to check if we need to create clubs entry or auth account
    const { data: existingUser } = await supabase
      .from('users')
      .select('role, email, name, supabase_auth_id')
      .eq('id', userId)
      .single();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.is_active = isActive;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    // Log role change
    if (role && existingUser?.role !== role) {
      await createLog(user.id, "role_change", "user", userId, {
        old_role: existingUser?.role,
        new_role: role,
        target_email: updatedUser?.email,
      });
    }

    // If promoting to staph/admin and user has no Supabase auth account, create one
    let generatedPassword: string | null = null;
    if (role && (role === 'staph' || role === 'admin') && existingUser && !existingUser.supabase_auth_id) {
      const password = crypto.randomBytes(12).toString("base64url");
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: existingUser.email,
        password,
        email_confirm: true,
        user_metadata: { name: existingUser.name || '' },
      });

      if (authError || !authData.user) {
        console.error("Error creating auth user on promotion:", authError);
        return NextResponse.json(
          { error: "Role updated but failed to create login credentials. Try again." },
          { status: 500 }
        );
      }

      // Link auth account to user
      await supabase
        .from('users')
        .update({ supabase_auth_id: authData.user.id, updated_at: new Date().toISOString() })
        .eq('id', userId);

      generatedPassword = password;
    }

    // If changing role to 'photographer', upsert into authorized_photographers for hire system backward compat
    if (role === 'photographer' && existingUser?.role !== 'photographer') {
      const { error: photoError } = await supabase
        .from('authorized_photographers')
        .upsert(
          {
            email: updatedUser.email,
            name: updatedUser.name || null,
            added_by: user.id,
            is_active: true,
          },
          { onConflict: 'email' }
        );

      if (photoError) {
        console.error("Error upserting authorized_photographers:", photoError);
      }
    }

    // If changing role to 'club' and user wasn't already a club, create clubs entry
    if (role === 'club' && existingUser?.role !== 'club') {
      // Check if clubs entry already exists
      const { data: existingClub } = await supabase
        .from('clubs')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existingClub) {
        const { error: clubError } = await supabase
          .from('clubs')
          .insert({
            user_id: userId,
            club_id: `CLUB-${Date.now()}`,
            name: '',
            has_leader: false,
            approval_status: 'pending',
          });

        if (clubError) {
          console.error("Error creating clubs entry:", clubError);
          // Don't fail the whole request, just log the error
        }
      }
    }

    return NextResponse.json({ user: updatedUser, generatedPassword });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE - Hard delete a user
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent deleting yourself
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get target user to check if super admin
    const { data: targetUser } = await supabase
      .from('users')
      .select('email, role, name')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent deleting super admin
    if (targetUser.email === 'technique@mit.edu') {
      return NextResponse.json(
        { error: "Cannot delete the super admin account" },
        { status: 400 }
      );
    }

    // If photographer, also deactivate in authorized_photographers
    if (targetUser.role === 'photographer') {
      await supabase
        .from('authorized_photographers')
        .update({ is_active: false })
        .eq('email', targetUser.email);
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 }
      );
    }

    await createLog(user.id, "user_deleted", "user", userId, {
      target_email: targetUser.email,
      target_role: targetUser.role,
      target_name: targetUser.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
