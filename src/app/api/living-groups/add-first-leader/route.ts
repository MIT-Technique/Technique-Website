import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// POST - Add first leader to a living group (direct add, no acceptance required)
// This is used during FSILG onboarding before the living group has any leaders
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'living_group') {
      return NextResponse.json(
        { error: "Only living group accounts can add first leader" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentEmail } = body;

    if (!studentEmail) {
      return NextResponse.json(
        { error: "Student email is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the living group for this account
    const { data: livingGroup, error: lgError } = await supabase
      .from('living_groups')
      .select('id, has_leader, living_group_type, name')
      .eq('user_id', user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Check if living group already has a leader
    if (livingGroup.has_leader) {
      return NextResponse.json(
        { error: "Living group already has a leader. Use the member system to add more members." },
        { status: 400 }
      );
    }

    // Look up the student by email
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name')
      .eq('email', studentEmail.toLowerCase())
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: "No student found with this email" },
        { status: 404 }
      );
    }

    if (student.role !== 'student') {
      return NextResponse.json(
        { error: "Only student accounts can be added as leaders" },
        { status: 400 }
      );
    }

    if (!student.email?.endsWith('@mit.edu')) {
      return NextResponse.json(
        { error: "Only MIT students can be added as leaders" },
        { status: 400 }
      );
    }

    // Check if student is already a member of this living group
    const { data: existingMembership } = await supabase
      .from('living_group_memberships')
      .select('id')
      .eq('living_group_id', livingGroup.id)
      .eq('user_id', student.id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "Student is already a member of this living group" },
        { status: 400 }
      );
    }

    // Add student as leader (direct add, no acceptance required for first leader)
    // Note: living_group_memberships doesn't have a 'role' column like clubs
    // The first member added via this route is considered the leader
    const { error: membershipError } = await supabase
      .from('living_group_memberships')
      .insert({
        living_group_id: livingGroup.id,
        user_id: student.id,
        membership_type: livingGroup.living_group_type,
        status: 'active',
        joined_at: new Date().toISOString(),
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      });

    if (membershipError) {
      console.error("Error adding leader:", membershipError);
      return NextResponse.json(
        { error: "Failed to add leader" },
        { status: 500 }
      );
    }

    // Update living group to indicate it has a leader
    const { error: updateError } = await supabase
      .from('living_groups')
      .update({
        has_leader: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', livingGroup.id);

    if (updateError) {
      console.error("Error updating living group has_leader:", updateError);
      // Don't fail - leader was added successfully
    }

    return NextResponse.json({
      success: true,
      message: "Leader added successfully",
      leader: {
        id: student.id,
        email: student.email,
        first_name: student.first_name,
        last_name: student.last_name,
      },
    });
  } catch (error) {
    console.error("Error adding first leader:", error);
    return NextResponse.json(
      { error: "Failed to add leader" },
      { status: 500 }
    );
  }
}
