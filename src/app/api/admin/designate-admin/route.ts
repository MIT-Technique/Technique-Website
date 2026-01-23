import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

const SUPER_ADMIN_EMAIL = "technique@mit.edu";
const MAX_DESIGNATED_ADMINS = 2;

// POST - Designate a staph member as admin (super admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Only super admin can designate
    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Only the super admin can designate administrators" },
        { status: 403 }
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

    const supabase = createAdminClient();

    // Verify target user exists and is staph
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (targetUser.role !== 'staph') {
      return NextResponse.json(
        { error: "Can only designate staph members as admin" },
        { status: 400 }
      );
    }

    // Check current admin count (excluding super admin)
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')
      .neq('email', SUPER_ADMIN_EMAIL);

    if (countError) {
      console.error("Error counting admins:", countError);
      return NextResponse.json(
        { error: "Failed to check admin count" },
        { status: 500 }
      );
    }

    if ((count || 0) >= MAX_DESIGNATED_ADMINS) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_DESIGNATED_ADMINS} designated admins reached` },
        { status: 400 }
      );
    }

    // Promote to admin
    const { error: updateError } = await supabase
      .from('users')
      .update({
        role: 'admin',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error("Error updating user role:", updateError);
      return NextResponse.json(
        { error: "Failed to designate admin" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User designated as admin successfully",
    });
  } catch (error) {
    console.error("Designate admin error:", error);
    return NextResponse.json(
      { error: "Failed to designate admin" },
      { status: 500 }
    );
  }
}

// GET - Get current admin count (for display purposes)
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Count admins excluding super admin
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')
      .neq('email', SUPER_ADMIN_EMAIL);

    if (error) {
      console.error("Error counting admins:", error);
      return NextResponse.json(
        { error: "Failed to get admin count" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      count: count || 0,
      max: MAX_DESIGNATED_ADMINS,
      isSuperAdmin: user.email === SUPER_ADMIN_EMAIL,
    });
  } catch (error) {
    console.error("Get admin count error:", error);
    return NextResponse.json(
      { error: "Failed to get admin count" },
      { status: 500 }
    );
  }
}
