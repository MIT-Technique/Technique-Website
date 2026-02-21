import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Check if current user is an active photographer
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user has the photographer role — if so, they're always a photographer
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role === "photographer") {
      return NextResponse.json({
        isPhotographer: true,
        permission: null,
        hasPendingRequest: false,
        pendingRequest: null,
      });
    }

    // Check if user has an active photographer permission
    const { data: permission, error } = await supabase
      .from("photographer_permissions")
      .select("id, is_active, approved_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Get photographer status error:", error);
      return NextResponse.json(
        { error: "Failed to get photographer status" },
        { status: 500 }
      );
    }

    // Also check if there's a pending photographer request
    const { data: pendingRequest } = await supabase
      .from("promotion_requests")
      .select("id, created_at")
      .eq("user_id", user.id)
      .eq("request_type", "photographer_request")
      .eq("status", "pending")
      .single();

    return NextResponse.json({
      isPhotographer: !!permission,
      permission: permission || null,
      hasPendingRequest: !!pendingRequest,
      pendingRequest: pendingRequest || null,
    });
  } catch (error) {
    console.error("Get photographer status error:", error);
    return NextResponse.json(
      { error: "Failed to get photographer status" },
      { status: 500 }
    );
  }
}
