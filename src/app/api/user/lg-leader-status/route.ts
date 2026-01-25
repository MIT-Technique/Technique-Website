import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Check if current user is a Living Group Leader
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user has active leader permissions
    const { data: permissions, error } = await supabase
      .from("living_group_leader_permissions")
      .select(`
        id,
        living_group_id,
        status,
        accepted_at,
        living_group:living_groups!living_group_leader_permissions_living_group_id_fkey(
          id,
          name,
          living_group_type
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Get LG leader status error:", error);
      return NextResponse.json(
        { error: "Failed to get leader status" },
        { status: 500 }
      );
    }

    // Also check for pending leader invitations
    const { data: pendingInvitations } = await supabase
      .from("living_group_leader_permissions")
      .select(`
        id,
        living_group_id,
        invited_at,
        living_group:living_groups!living_group_leader_permissions_living_group_id_fkey(
          id,
          name,
          living_group_type
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "pending");

    // Extract living groups from active permissions
    const livingGroups = (permissions || []).map((p) => {
      const lg = Array.isArray(p.living_group) ? p.living_group[0] : p.living_group;
      return {
        id: lg?.id,
        name: lg?.name,
        living_group_type: lg?.living_group_type,
        permissionId: p.id,
        acceptedAt: p.accepted_at,
      };
    }).filter(lg => lg.id);

    // Extract pending invitations
    const invitations = (pendingInvitations || []).map((p) => {
      const lg = Array.isArray(p.living_group) ? p.living_group[0] : p.living_group;
      return {
        id: lg?.id,
        name: lg?.name,
        living_group_type: lg?.living_group_type,
        permissionId: p.id,
        invitedAt: p.invited_at,
      };
    }).filter(lg => lg.id);

    return NextResponse.json({
      isLeader: livingGroups.length > 0,
      livingGroups,
      hasPendingInvitations: invitations.length > 0,
      pendingInvitations: invitations,
    });
  } catch (error) {
    console.error("Get LG leader status error:", error);
    return NextResponse.json(
      { error: "Failed to get leader status" },
      { status: 500 }
    );
  }
}
