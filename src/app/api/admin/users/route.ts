import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { UserRole } from "../../../../lib/supabase/types";
import { createLog } from "../../../../lib/admin-logs";

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

    const validRoles: UserRole[] = ['admin', 'staph', 'club', 'living_group'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get current user role to check if we need to create clubs entry
    const { data: existingUser } = await supabase
      .from('users')
      .select('role')
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

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
