import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { createLog } from "../../../../lib/admin-logs";

// PUT - Toggle is_staph boolean for a user (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Only admins can toggle staph status
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

    const supabase = createAdminClient();

    // Get the target user
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role, is_staph')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Can only toggle staph for students
    if (targetUser.role !== 'student') {
      return NextResponse.json(
        { error: "Can only toggle staph status for students" },
        { status: 400 }
      );
    }

    // Toggle the is_staph value
    const newIsStaph = !targetUser.is_staph;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_staph: newIsStaph,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error("Error updating is_staph:", updateError);
      return NextResponse.json(
        { error: "Failed to update staph status" },
        { status: 500 }
      );
    }

    // Log the staph toggle
    await createLog(user.id, "staph_toggle", "user", userId, {
      target_email: targetUser.email,
      new_value: newIsStaph,
    });

    return NextResponse.json({
      success: true,
      is_staph: newIsStaph,
      message: newIsStaph ? "User granted staph access" : "Staph access revoked",
    });
  } catch (error) {
    console.error("Toggle staph error:", error);
    return NextResponse.json(
      { error: "Failed to toggle staph status" },
      { status: 500 }
    );
  }
}
