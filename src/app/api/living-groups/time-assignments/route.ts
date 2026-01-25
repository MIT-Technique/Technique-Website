import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { isValidTimeSlot, generateTimeSlots } from "../../../../lib/utils/time";

// GET - Get time slot assignments for a photoshoot
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const photoshootTimeId = searchParams.get("photoshootTimeId");
    const livingGroupId = searchParams.get("livingGroupId");

    if (!photoshootTimeId && !livingGroupId) {
      return NextResponse.json(
        { error: "Either photoshootTimeId or livingGroupId is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Build query based on parameters
    let query = supabase
      .from("living_group_time_assignments")
      .select(`
        id,
        photoshoot_time_id,
        living_group_id,
        section_name,
        slot_start,
        slot_end,
        assigned_by,
        created_at,
        photoshoot_time:photoshoot_times!living_group_time_assignments_photoshoot_time_id_fkey(
          id,
          date,
          start_time,
          end_time,
          location
        )
      `);

    if (photoshootTimeId) {
      query = query.eq("photoshoot_time_id", photoshootTimeId);
    }
    if (livingGroupId) {
      query = query.eq("living_group_id", livingGroupId);
    }

    const { data: assignments, error } = await query.order("slot_start", { ascending: true });

    if (error) {
      console.error("Get time assignments error:", error);
      return NextResponse.json(
        { error: "Failed to get time assignments" },
        { status: 500 }
      );
    }

    const formattedAssignments = (assignments || []).map(a => {
      const photoshoot = Array.isArray(a.photoshoot_time) ? a.photoshoot_time[0] : a.photoshoot_time;
      return {
        id: a.id,
        photoshootTimeId: a.photoshoot_time_id,
        livingGroupId: a.living_group_id,
        sectionName: a.section_name,
        slotStart: a.slot_start,
        slotEnd: a.slot_end,
        photoshootDate: photoshoot?.date,
        photoshootStartTime: photoshoot?.start_time,
        photoshootEndTime: photoshoot?.end_time,
        photoshootLocation: photoshoot?.location,
        createdAt: a.created_at,
      };
    });

    return NextResponse.json({
      assignments: formattedAssignments,
    });
  } catch (error) {
    console.error("Get time assignments error:", error);
    return NextResponse.json(
      { error: "Failed to get time assignments" },
      { status: 500 }
    );
  }
}

// POST - Assign a section to a time slot
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { photoshootTimeId, livingGroupId, sectionName, slotStart, slotEnd } = body;

    if (!photoshootTimeId || !livingGroupId || !slotStart || !slotEnd) {
      return NextResponse.json(
        { error: "photoshootTimeId, livingGroupId, slotStart, and slotEnd are required" },
        { status: 400 }
      );
    }

    // Validate time slots are on 30-minute boundaries
    if (!isValidTimeSlot(slotStart) || !isValidTimeSlot(slotEnd)) {
      return NextResponse.json(
        { error: "Time slots must be on 30-minute boundaries (XX:00 or XX:30)" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify living group exists and user has access
    const { data: livingGroup } = await supabase
      .from("living_groups")
      .select("id, user_id, name, dorm_sections")
      .eq("id", livingGroupId)
      .single();

    if (!livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Check authorization
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

    // Validate section name if provided
    if (sectionName) {
      const dormSections = livingGroup.dorm_sections || [];
      if (!dormSections.includes(sectionName)) {
        return NextResponse.json(
          { error: "Invalid section for this living group" },
          { status: 400 }
        );
      }
    }

    // Verify photoshoot time exists and belongs to this living group
    const { data: photoshootTime } = await supabase
      .from("photoshoot_times")
      .select("id, living_group_id, start_time, end_time, date")
      .eq("id", photoshootTimeId)
      .single();

    if (!photoshootTime) {
      return NextResponse.json(
        { error: "Photoshoot time not found" },
        { status: 404 }
      );
    }

    if (photoshootTime.living_group_id !== livingGroupId) {
      return NextResponse.json(
        { error: "Photoshoot time does not belong to this living group" },
        { status: 400 }
      );
    }

    // Verify slot is within photoshoot time range
    const slotStartMins = parseInt(slotStart.split(':')[0]) * 60 + parseInt(slotStart.split(':')[1]);
    const slotEndMins = parseInt(slotEnd.split(':')[0]) * 60 + parseInt(slotEnd.split(':')[1]);
    const photoshootStartMins = parseInt(photoshootTime.start_time.split(':')[0]) * 60 + parseInt(photoshootTime.start_time.split(':')[1]);
    const photoshootEndMins = parseInt(photoshootTime.end_time.split(':')[0]) * 60 + parseInt(photoshootTime.end_time.split(':')[1]);

    if (slotStartMins < photoshootStartMins || slotEndMins > photoshootEndMins) {
      return NextResponse.json(
        { error: "Time slot must be within the photoshoot time range" },
        { status: 400 }
      );
    }

    // Check if this slot is already assigned
    const { data: existingAssignment } = await supabase
      .from("living_group_time_assignments")
      .select("id")
      .eq("photoshoot_time_id", photoshootTimeId)
      .eq("slot_start", slotStart)
      .eq("slot_end", slotEnd)
      .single();

    if (existingAssignment) {
      // Update existing assignment
      const { error: updateError } = await supabase
        .from("living_group_time_assignments")
        .update({
          section_name: sectionName || null,
          assigned_by: user.id,
        })
        .eq("id", existingAssignment.id);

      if (updateError) {
        console.error("Update assignment error:", updateError);
        return NextResponse.json(
          { error: "Failed to update assignment" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Assignment updated",
        assignmentId: existingAssignment.id,
      });
    }

    // Create new assignment
    const { data: newAssignment, error: insertError } = await supabase
      .from("living_group_time_assignments")
      .insert({
        photoshoot_time_id: photoshootTimeId,
        living_group_id: livingGroupId,
        section_name: sectionName || null,
        slot_start: slotStart,
        slot_end: slotEnd,
        assigned_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Create assignment error:", insertError);
      return NextResponse.json(
        { error: "Failed to create assignment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Section assigned to time slot",
      assignmentId: newAssignment.id,
    });
  } catch (error) {
    console.error("Create time assignment error:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a time slot assignment
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the assignment
    const { data: assignment, error: assError } = await supabase
      .from("living_group_time_assignments")
      .select("id, living_group_id")
      .eq("id", assignmentId)
      .single();

    if (assError || !assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Verify user has access to the living group
    const { data: livingGroup } = await supabase
      .from("living_groups")
      .select("id, user_id")
      .eq("id", assignment.living_group_id)
      .single();

    if (!livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    const isOwner = livingGroup.user_id === user.id;
    let isLeader = false;
    if (!isOwner) {
      const { data: leaderPermission } = await supabase
        .from("living_group_leader_permissions")
        .select("id")
        .eq("living_group_id", assignment.living_group_id)
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

    // Delete the assignment
    const { error: deleteError } = await supabase
      .from("living_group_time_assignments")
      .delete()
      .eq("id", assignmentId);

    if (deleteError) {
      console.error("Delete assignment error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete assignment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Assignment removed",
    });
  } catch (error) {
    console.error("Delete time assignment error:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
