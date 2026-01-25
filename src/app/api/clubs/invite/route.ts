import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// POST - Send invitation to a student
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Check if user is club account or a leader of a club
    let clubId: string | null = null;

    if (user.role === 'club') {
      const { data: club } = await supabase
        .from('clubs')
        .select('id, has_leader')
        .eq('user_id', user.id)
        .single();

      if (!club?.has_leader) {
        return NextResponse.json(
          { error: "Club must have a leader before sending invitations" },
          { status: 403 }
        );
      }
      clubId = club?.id || null;
    } else if (user.role === 'student') {
      const { data: membership } = await supabase
        .from('club_memberships')
        .select('club_id')
        .eq('user_id', user.id)
        .eq('role', 'leader')
        .single();
      clubId = membership?.club_id || null;
    }

    if (!clubId) {
      return NextResponse.json(
        { error: "Only club accounts and club leaders can send invitations" },
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

    // Verify the student exists
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, email, role')
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
        { error: "Can only invite students" },
        { status: 400 }
      );
    }

    // Check if student is already a member
    const { data: existingMembership } = await supabase
      .from('club_memberships')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', user_id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "Student is already a member of this club" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('club_invitations')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', user_id)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { error: "An invitation is already pending for this student" },
        { status: 400 }
      );
    }

    // Check if there's a pending join request (they should approve that instead)
    const { data: existingRequest } = await supabase
      .from('club_join_requests')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', user_id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: "This student has a pending join request. Please approve or deny it instead." },
        { status: 400 }
      );
    }

    // Create the invitation
    const { error: inviteError } = await supabase
      .from('club_invitations')
      .insert({
        club_id: clubId,
        user_id: user_id,
        invited_by: user.id,
        status: 'pending',
      });

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);
      return NextResponse.json(
        { error: "Failed to send invitation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

// GET - Get pending outgoing invitations for this club
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Check if user is club account or a leader of a club
    let clubId: string | null = null;

    if (user.role === 'club') {
      const { data: club } = await supabase
        .from('clubs')
        .select('id')
        .eq('user_id', user.id)
        .single();
      clubId = club?.id || null;
    } else if (user.role === 'student') {
      const { data: membership } = await supabase
        .from('club_memberships')
        .select('club_id')
        .eq('user_id', user.id)
        .eq('role', 'leader')
        .single();
      clubId = membership?.club_id || null;
    }

    if (!clubId) {
      return NextResponse.json(
        { error: "Only club accounts and club leaders can view invitations" },
        { status: 403 }
      );
    }

    // Get pending outgoing invitations
    const { data: invitations, error } = await supabase
      .from('club_invitations')
      .select(`
        id,
        status,
        created_at,
        user:users!club_invitations_user_id_fkey (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('club_id', clubId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching invitations:", error);
      return NextResponse.json(
        { error: "Failed to fetch invitations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invitations: invitations || [] });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a pending invitation
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const invitationId = searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json(
        { error: "Invitation ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('club_invitations')
      .select('club_id, status')
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: "Can only cancel pending invitations" },
        { status: 400 }
      );
    }

    // Verify user is club account or leader of this club
    let clubId: string | null = null;

    if (user.role === 'club') {
      const { data: club } = await supabase
        .from('clubs')
        .select('id')
        .eq('user_id', user.id)
        .single();
      clubId = club?.id || null;
    } else if (user.role === 'student') {
      const { data: membership } = await supabase
        .from('club_memberships')
        .select('club_id')
        .eq('user_id', user.id)
        .eq('role', 'leader')
        .single();
      clubId = membership?.club_id || null;
    }

    if (clubId !== invitation.club_id) {
      return NextResponse.json(
        { error: "Not authorized to cancel this invitation" },
        { status: 403 }
      );
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from('club_invitations')
      .delete()
      .eq('id', invitationId);

    if (deleteError) {
      console.error("Error cancelling invitation:", deleteError);
      return NextResponse.json(
        { error: "Failed to cancel invitation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    return NextResponse.json(
      { error: "Failed to cancel invitation" },
      { status: 500 }
    );
  }
}
