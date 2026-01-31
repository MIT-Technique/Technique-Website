import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { isValidTimeSlot, timeToMinutes } from "../../../../lib/utils/time";

/**
 * GET /api/living-groups/time-assignments
 *
 * Fetch time assignments for a photoshoot or living group
 *
 * Query params:
 * - photoshootTimeId: Get assignments for specific photoshoot
 * - livingGroupId: Get all assignments for a living group
 */
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

    // Build query
    let query = supabase
      .from("living_group_time_assignments")
      .select("*");

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
        { error: "Failed to get time assignments", details: error.message },
        { status: 500 }
      );
    }

    // Format response
    const formatted = (assignments || []).map((a: any) => ({
      id: a.id,
      photoshootTimeId: a.photoshoot_time_id,
      livingGroupId: a.living_group_id,
      sectionName: a.section_name,
      slotStart: a.slot_start,
      slotEnd: a.slot_end,
      createdAt: a.created_at,
    }));

    return NextResponse.json({ assignments: formatted });
  } catch (error) {
    console.error("Get time assignments error:", error);
    return NextResponse.json(
      { error: "Failed to get time assignments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/living-groups/time-assignments
 *
 * Create or update a time assignment (upsert)
 *
 * Body:
 * - photoshootTimeId: UUID of photoshoot time
 * - livingGroupId: UUID of living group
 * - sectionName: Name of section (optional, null = unassigned)
 * - slotStart: Start time (HH:MM, must be XX:00, XX:15, XX:30, or XX:45)
 * - slotEnd: End time (HH:MM, must be XX:00, XX:15, XX:30, or XX:45)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { photoshootTimeId, livingGroupId, sectionName, slotStart, slotEnd } = body;

    // Validation: Required fields
    if (!photoshootTimeId || !livingGroupId || !slotStart || !slotEnd) {
      return NextResponse.json(
        { error: "photoshootTimeId, livingGroupId, slotStart, and slotEnd are required" },
        { status: 400 }
      );
    }

    // Validation: Time slots on 15-min boundaries
    if (!isValidTimeSlot(slotStart) || !isValidTimeSlot(slotEnd)) {
      return NextResponse.json(
        { error: "Time slots must be on 15-minute boundaries (XX:00, XX:15, XX:30, or XX:45)" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get living group and verify access
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id, user_id, name, dorm_sections")
      .eq("id", livingGroupId)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json({ error: "Living group not found" }, { status: 404 });
    }

    // Authorization check
    const isOwner = livingGroup.user_id === user.id;
    const isAdmin = user.role === "admin" || user.is_staph;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
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
    const { data: photoshootTime, error: ptError } = await supabase
      .from("photoshoot_times")
      .select("id, living_group_id, start_time, end_time, date")
      .eq("id", photoshootTimeId)
      .single();

    if (ptError || !photoshootTime) {
      return NextResponse.json({ error: "Photoshoot time not found" }, { status: 404 });
    }

    if (photoshootTime.living_group_id !== livingGroupId) {
      return NextResponse.json(
        { error: "Photoshoot time does not belong to this living group" },
        { status: 400 }
      );
    }

    // Verify slot is within photoshoot time range
    const slotStartMins = timeToMinutes(slotStart);
    const slotEndMins = timeToMinutes(slotEnd);
    const photoshootStartMins = timeToMinutes(photoshootTime.start_time);
    const photoshootEndMins = timeToMinutes(photoshootTime.end_time);

    if (slotStartMins < photoshootStartMins || slotEndMins > photoshootEndMins) {
      return NextResponse.json(
        { error: "Time slot must be within the photoshoot time range" },
        { status: 400 }
      );
    }

    // Check if this slot already has an assignment (upsert)
    const { data: existingAssignment } = await supabase
      .from("living_group_time_assignments")
      .select("id")
      .eq("photoshoot_time_id", photoshootTimeId)
      .eq("slot_start", slotStart)
      .eq("slot_end", slotEnd)
      .maybeSingle();

    if (existingAssignment) {
      // UPDATE existing
      const { error: updateError } = await supabase
        .from("living_group_time_assignments")
        .update({
          section_name: sectionName || null,
          assigned_by: user.id,
        })
        .eq("id", existingAssignment.id);

      if (updateError) {
        console.error("Update assignment error:", updateError);
        return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Assignment updated",
        assignmentId: existingAssignment.id,
      });
    }

    // INSERT new assignment
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
      return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Section assigned to time slot",
      assignmentId: newAssignment.id,
    });
  } catch (error) {
    console.error("Create time assignment error:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}

/**
 * DELETE /api/living-groups/time-assignments
 *
 * Remove a time assignment
 *
 * Query params:
 * - assignmentId: UUID of assignment to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get the assignment
    const { data: assignment, error: assError } = await supabase
      .from("living_group_time_assignments")
      .select("id, living_group_id")
      .eq("id", assignmentId)
      .single();

    if (assError || !assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Verify access
    const { data: livingGroup } = await supabase
      .from("living_groups")
      .select("id, user_id")
      .eq("id", assignment.living_group_id)
      .single();

    if (!livingGroup) {
      return NextResponse.json({ error: "Living group not found" }, { status: 404 });
    }

    const isOwner = livingGroup.user_id === user.id;
    const isAdmin = user.role === "admin" || user.is_staph;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete the assignment
    const { error: deleteError } = await supabase
      .from("living_group_time_assignments")
      .delete()
      .eq("id", assignmentId);

    if (deleteError) {
      console.error("Delete assignment error:", deleteError);
      return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Assignment removed" });
  } catch (error) {
    console.error("Delete time assignment error:", error);
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
