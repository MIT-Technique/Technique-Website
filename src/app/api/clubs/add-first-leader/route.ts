import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// POST - Add first leader to a club (direct add, no acceptance required)
// This is used during club onboarding before the club has any leaders
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'club') {
      return NextResponse.json(
        { error: "Only club accounts can add first leader" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "Student user_id is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the club for this club account
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, has_leader')
      .eq('user_id', user.id)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    // Check if club already has a leader
    if (club.has_leader) {
      return NextResponse.json(
        { error: "Club already has a leader. Use the invite system to add more members." },
        { status: 400 }
      );
    }

    // Verify the student exists and is an MIT student
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name')
      .eq('id', user_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: "Student not found" },
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

    // Check if student is already a member of this club
    const { data: existingMembership } = await supabase
      .from('club_memberships')
      .select('id')
      .eq('club_id', club.id)
      .eq('user_id', user_id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "Student is already a member of this club" },
        { status: 400 }
      );
    }

    // Add student as leader (direct add, no acceptance required for first leader)
    const { error: membershipError } = await supabase
      .from('club_memberships')
      .insert({
        club_id: club.id,
        user_id: user_id,
        role: 'leader',
        joined_at: new Date().toISOString(),
      });

    if (membershipError) {
      console.error("Error adding leader:", membershipError);
      return NextResponse.json(
        { error: "Failed to add leader" },
        { status: 500 }
      );
    }

    // Update club to indicate it has a leader
    const { error: updateError } = await supabase
      .from('clubs')
      .update({
        has_leader: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', club.id);

    if (updateError) {
      console.error("Error updating club has_leader:", updateError);
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
