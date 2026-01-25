import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Get leaders for a living group
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const livingGroupId = searchParams.get("livingGroupId");

    if (!livingGroupId) {
      return NextResponse.json(
        { error: "Living group ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify user has access to this living group (is a leader or it's their LG account)
    const { data: livingGroup } = await supabase
      .from("living_groups")
      .select("id, user_id, name")
      .eq("id", livingGroupId)
      .single();

    if (!livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Check if user owns the LG account or is a leader
    const isOwner = livingGroup.user_id === user.id;

    let isLeader = false;
    if (!isOwner) {
      const { data: leaderPermission } = await supabase
        .from("living_group_leader_permissions")
        .select("id")
        .eq("living_group_id", livingGroupId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();
      isLeader = !!leaderPermission;
    }

    if (!isOwner && !isLeader && user.role !== "admin" && user.role !== "staph") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get all leaders (active and pending)
    const { data: leaders, error } = await supabase
      .from("living_group_leader_permissions")
      .select(`
        id,
        user_id,
        status,
        invited_at,
        accepted_at,
        invited_by,
        user:users!living_group_leader_permissions_user_id_fkey(
          id,
          email,
          first_name,
          last_name
        ),
        inviter:users!living_group_leader_permissions_invited_by_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq("living_group_id", livingGroupId)
      .in("status", ["active", "pending"])
      .order("accepted_at", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Get leaders error:", error);
      return NextResponse.json(
        { error: "Failed to get leaders" },
        { status: 500 }
      );
    }

    // Separate active leaders and pending invitations
    const activeLeaders = (leaders || [])
      .filter(l => l.status === "active")
      .map(l => {
        const userData = Array.isArray(l.user) ? l.user[0] : l.user;
        return {
          id: l.id,
          userId: l.user_id,
          email: userData?.email,
          firstName: userData?.first_name,
          lastName: userData?.last_name,
          acceptedAt: l.accepted_at,
        };
      });

    const pendingInvitations = (leaders || [])
      .filter(l => l.status === "pending")
      .map(l => {
        const userData = Array.isArray(l.user) ? l.user[0] : l.user;
        const inviterData = Array.isArray(l.inviter) ? l.inviter[0] : l.inviter;
        return {
          id: l.id,
          userId: l.user_id,
          email: userData?.email,
          firstName: userData?.first_name,
          lastName: userData?.last_name,
          invitedAt: l.invited_at,
          invitedBy: inviterData ? {
            email: inviterData.email,
            firstName: inviterData.first_name,
            lastName: inviterData.last_name,
          } : null,
        };
      });

    return NextResponse.json({
      activeLeaders,
      pendingInvitations,
    });
  } catch (error) {
    console.error("Get leaders error:", error);
    return NextResponse.json(
      { error: "Failed to get leaders" },
      { status: 500 }
    );
  }
}

// POST - Invite a student as leader
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { livingGroupId, studentEmail } = body;

    if (!livingGroupId || !studentEmail) {
      return NextResponse.json(
        { error: "Living group ID and student email are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify user has access to this living group
    const { data: livingGroup } = await supabase
      .from("living_groups")
      .select("id, user_id, name")
      .eq("id", livingGroupId)
      .single();

    if (!livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Check if user owns the LG account or is a leader
    const isOwner = livingGroup.user_id === user.id;

    let isLeader = false;
    if (!isOwner) {
      const { data: leaderPermission } = await supabase
        .from("living_group_leader_permissions")
        .select("id")
        .eq("living_group_id", livingGroupId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();
      isLeader = !!leaderPermission;
    }

    if (!isOwner && !isLeader && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only living group owners, leaders, or admins can invite leaders" },
        { status: 403 }
      );
    }

    // Find the student
    const { data: student, error: studentError } = await supabase
      .from("users")
      .select("id, email, role, first_name, last_name")
      .eq("email", studentEmail.toLowerCase())
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: "No student found with this email" },
        { status: 404 }
      );
    }

    if (student.role !== "student") {
      return NextResponse.json(
        { error: "Only student accounts can be invited as leaders" },
        { status: 400 }
      );
    }

    if (!student.email?.endsWith("@mit.edu")) {
      return NextResponse.json(
        { error: "Only MIT students can be invited as leaders" },
        { status: 400 }
      );
    }

    // Check if student already has a permission record for this LG
    const { data: existingPermission } = await supabase
      .from("living_group_leader_permissions")
      .select("id, status")
      .eq("living_group_id", livingGroupId)
      .eq("user_id", student.id)
      .single();

    if (existingPermission) {
      if (existingPermission.status === "active") {
        return NextResponse.json(
          { error: "This student is already a leader of this living group" },
          { status: 400 }
        );
      }
      if (existingPermission.status === "pending") {
        return NextResponse.json(
          { error: "An invitation is already pending for this student" },
          { status: 400 }
        );
      }
      // If status is 'declined' or 'removed', update to pending
      const { error: updateError } = await supabase
        .from("living_group_leader_permissions")
        .update({
          status: "pending",
          invited_by: user.id,
          invited_at: new Date().toISOString(),
          accepted_at: null,
          removed_by: null,
          removed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPermission.id);

      if (updateError) {
        console.error("Update invitation error:", updateError);
        return NextResponse.json(
          { error: "Failed to send invitation" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Invitation sent",
        invitation: {
          id: existingPermission.id,
          userId: student.id,
          email: student.email,
          firstName: student.first_name,
          lastName: student.last_name,
        },
      });
    }

    // Create new invitation
    const { data: newPermission, error: insertError } = await supabase
      .from("living_group_leader_permissions")
      .insert({
        user_id: student.id,
        living_group_id: livingGroupId,
        invited_by: user.id,
        invited_at: new Date().toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Create invitation error:", insertError);
      return NextResponse.json(
        { error: "Failed to send invitation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Invitation sent",
      invitation: {
        id: newPermission.id,
        userId: student.id,
        email: student.email,
        firstName: student.first_name,
        lastName: student.last_name,
      },
    });
  } catch (error) {
    console.error("Invite leader error:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a leader or cancel an invitation
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get("permissionId");

    if (!permissionId) {
      return NextResponse.json(
        { error: "Permission ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the permission record
    const { data: permission, error: permError } = await supabase
      .from("living_group_leader_permissions")
      .select("id, user_id, living_group_id, status")
      .eq("id", permissionId)
      .single();

    if (permError || !permission) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 }
      );
    }

    // Get the living group
    const { data: livingGroup } = await supabase
      .from("living_groups")
      .select("id, user_id, name")
      .eq("id", permission.living_group_id)
      .single();

    if (!livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to remove
    const isOwner = livingGroup.user_id === user.id;
    const isSelf = permission.user_id === user.id;

    let isLeader = false;
    if (!isOwner && !isSelf) {
      const { data: leaderPermission } = await supabase
        .from("living_group_leader_permissions")
        .select("id")
        .eq("living_group_id", permission.living_group_id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();
      isLeader = !!leaderPermission;
    }

    if (!isOwner && !isLeader && !isSelf && user.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Update the permission status to removed
    const { error: updateError } = await supabase
      .from("living_group_leader_permissions")
      .update({
        status: "removed",
        removed_by: user.id,
        removed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", permissionId);

    if (updateError) {
      console.error("Remove leader error:", updateError);
      return NextResponse.json(
        { error: "Failed to remove leader" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: permission.status === "pending" ? "Invitation cancelled" : "Leader removed",
    });
  } catch (error) {
    console.error("Remove leader error:", error);
    return NextResponse.json(
      { error: "Failed to remove leader" },
      { status: 500 }
    );
  }
}
