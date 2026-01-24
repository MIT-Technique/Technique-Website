import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "../../../../lib/auth/session";

// GET /api/living-groups/join-requests
// Get pending join requests for the leader's FSILG
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "living_group_leader") {
      return NextResponse.json(
        { error: "Only living group leaders can view join requests" },
        { status: 403 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the leader's living group
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id, name, living_group_type")
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Only FSILGs have join requests (dorms auto-approve)
    if (livingGroup.living_group_type !== "fsilg") {
      return NextResponse.json({
        livingGroup,
        joinRequests: [],
        message: "Dorms do not require approval for new members",
      });
    }

    // Get pending join requests
    const { data: joinRequests, error } = await supabase
      .from("living_group_memberships")
      .select(`
        id,
        status,
        joined_at,
        user:users!living_group_memberships_user_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq("living_group_id", livingGroup.id)
      .eq("status", "pending")
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Get join requests error:", error);
      return NextResponse.json(
        { error: "Failed to get join requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      livingGroup,
      joinRequests: joinRequests || [],
    });
  } catch (error) {
    console.error("Get join requests error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
