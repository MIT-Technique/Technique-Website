import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Get pending invitations for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only students and living group leaders can receive invitations
    if (user.role !== 'student' && user.role !== 'living_group_leader') {
      return NextResponse.json({ invitations: [] });
    }

    const supabase = createAdminClient();

    // Get pending invitations for this user
    const { data: invitations, error } = await supabase
      .from('club_invitations')
      .select(`
        id,
        status,
        created_at,
        club:clubs (
          id,
          name,
          description
        ),
        inviter:users!club_invitations_invited_by_fkey (
          first_name,
          last_name
        )
      `)
      .eq('user_id', user.id)
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

// PUT - Accept or decline an invitation
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'student' && user.role !== 'living_group_leader') {
      return NextResponse.json(
        { error: "Only students can respond to invitations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { invitation_id, action } = body;

    if (!invitation_id || !action) {
      return NextResponse.json(
        { error: "Invitation ID and action are required" },
        { status: 400 }
      );
    }

    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json(
        { error: "Action must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('club_invitations')
      .select('id, club_id, user_id, status')
      .eq('id', invitation_id)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Verify this invitation is for the current user
    if (invitation.user_id !== user.id) {
      return NextResponse.json(
        { error: "This invitation is not for you" },
        { status: 403 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: "This invitation has already been processed" },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // Check if user is already a member (edge case)
      const { data: existingMembership } = await supabase
        .from('club_memberships')
        .select('id')
        .eq('club_id', invitation.club_id)
        .eq('user_id', user.id)
        .single();

      if (existingMembership) {
        // Update invitation status and return
        await supabase
          .from('club_invitations')
          .update({
            status: 'accepted',
            resolved_at: new Date().toISOString(),
          })
          .eq('id', invitation_id);

        return NextResponse.json({
          success: true,
          message: "You are already a member of this club",
        });
      }

      // Add user as member
      const { error: membershipError } = await supabase
        .from('club_memberships')
        .insert({
          club_id: invitation.club_id,
          user_id: user.id,
          role: 'member',
          joined_at: new Date().toISOString(),
        });

      if (membershipError) {
        console.error("Error creating membership:", membershipError);
        return NextResponse.json(
          { error: "Failed to join club" },
          { status: 500 }
        );
      }

      // Update invitation status
      await supabase
        .from('club_invitations')
        .update({
          status: 'accepted',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', invitation_id);

      return NextResponse.json({
        success: true,
        message: "You have joined the club!",
      });
    } else {
      // Decline the invitation
      const { error: updateError } = await supabase
        .from('club_invitations')
        .update({
          status: 'declined',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', invitation_id);

      if (updateError) {
        console.error("Error declining invitation:", updateError);
        return NextResponse.json(
          { error: "Failed to decline invitation" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Invitation declined",
      });
    }
  } catch (error) {
    console.error("Error processing invitation:", error);
    return NextResponse.json(
      { error: "Failed to process invitation" },
      { status: 500 }
    );
  }
}
