import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Get pending leader invitations for current user
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: invitations, error } = await supabase
      .from("living_group_leader_permissions")
      .select(`
        id,
        living_group_id,
        invited_at,
        invited_by,
        living_group:living_groups!living_group_leader_permissions_living_group_id_fkey(
          id,
          name,
          living_group_type
        ),
        inviter:users!living_group_leader_permissions_invited_by_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (error) {
      console.error("Get invitations error:", error);
      return NextResponse.json(
        { error: "Failed to get invitations" },
        { status: 500 }
      );
    }

    const formattedInvitations = (invitations || []).map(inv => {
      const lg = Array.isArray(inv.living_group) ? inv.living_group[0] : inv.living_group;
      const inviter = Array.isArray(inv.inviter) ? inv.inviter[0] : inv.inviter;
      return {
        id: inv.id,
        livingGroupId: inv.living_group_id,
        livingGroupName: lg?.name,
        livingGroupType: lg?.living_group_type,
        invitedAt: inv.invited_at,
        invitedBy: inviter ? {
          email: inviter.email,
          firstName: inviter.first_name,
          lastName: inviter.last_name,
        } : null,
      };
    });

    return NextResponse.json({
      invitations: formattedInvitations,
    });
  } catch (error) {
    console.error("Get invitations error:", error);
    return NextResponse.json(
      { error: "Failed to get invitations" },
      { status: 500 }
    );
  }
}

// PUT - Accept or decline an invitation
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invitationId, action } = body;

    if (!invitationId || !action) {
      return NextResponse.json(
        { error: "Invitation ID and action are required" },
        { status: 400 }
      );
    }

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json(
        { error: "Action must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the invitation
    const { data: invitation, error: invError } = await supabase
      .from("living_group_leader_permissions")
      .select("id, user_id, living_group_id, status")
      .eq("id", invitationId)
      .single();

    if (invError || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Verify invitation belongs to current user
    if (invitation.user_id !== user.id) {
      return NextResponse.json(
        { error: "This invitation is not for you" },
        { status: 403 }
      );
    }

    // Verify invitation is still pending
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "This invitation is no longer pending" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      // Update to active
      const { error: updateError } = await supabase
        .from("living_group_leader_permissions")
        .update({
          status: "active",
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      if (updateError) {
        console.error("Accept invitation error:", updateError);
        return NextResponse.json(
          { error: "Failed to accept invitation" },
          { status: 500 }
        );
      }

      // Update living group has_leader if this is the first leader
      const { data: existingLeaders } = await supabase
        .from("living_group_leader_permissions")
        .select("id")
        .eq("living_group_id", invitation.living_group_id)
        .eq("status", "active");

      if (existingLeaders && existingLeaders.length === 1) {
        // This is the first (and only) active leader
        await supabase
          .from("living_groups")
          .update({
            has_leader: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invitation.living_group_id);
      }

      return NextResponse.json({
        success: true,
        message: "Invitation accepted! You are now a leader of this living group.",
      });
    } else {
      // Decline
      const { error: updateError } = await supabase
        .from("living_group_leader_permissions")
        .update({
          status: "declined",
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      if (updateError) {
        console.error("Decline invitation error:", updateError);
        return NextResponse.json(
          { error: "Failed to decline invitation" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Invitation declined.",
      });
    }
  } catch (error) {
    console.error("Update invitation error:", error);
    return NextResponse.json(
      { error: "Failed to update invitation" },
      { status: 500 }
    );
  }
}
