import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Get pending join requests for the club
export async function GET() {
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
        { error: "Only club accounts can access join requests" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Get club ID for current user
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    // Get pending join requests with user details
    const { data: requests, error } = await supabase
      .from('club_join_requests')
      .select(`
        id,
        status,
        created_at,
        user:users (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('club_id', club.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Get join requests error:", error);
      return NextResponse.json(
        { error: "Failed to get join requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error("Get join requests error:", error);
    return NextResponse.json(
      { error: "Failed to get join requests" },
      { status: 500 }
    );
  }
}

// PUT - Approve or deny a join request
export async function PUT(request: NextRequest) {
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
        { error: "Only club accounts can approve/deny join requests" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { request_id, action } = body;

    if (!request_id || !action) {
      return NextResponse.json(
        { error: "Request ID and action are required" },
        { status: 400 }
      );
    }

    if (!['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'deny'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get club ID for current user
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    // Get the join request
    const { data: joinRequest, error: requestError } = await supabase
      .from('club_join_requests')
      .select('id, club_id, user_id, status')
      .eq('id', request_id)
      .single();

    if (requestError || !joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    if (joinRequest.club_id !== club.id) {
      return NextResponse.json(
        { error: "Join request does not belong to your club" },
        { status: 403 }
      );
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json(
        { error: "Join request has already been processed" },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'denied';

    // Update the join request status
    const { error: updateError } = await supabase
      .from('club_join_requests')
      .update({
        status: newStatus,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', request_id);

    if (updateError) {
      console.error("Update join request error:", updateError);
      return NextResponse.json(
        { error: "Failed to update join request" },
        { status: 500 }
      );
    }

    // If approved, create membership
    if (action === 'approve') {
      const { error: membershipError } = await supabase
        .from('club_memberships')
        .insert({
          club_id: club.id,
          user_id: joinRequest.user_id,
          role: 'member',
        });

      if (membershipError) {
        console.error("Create membership error:", membershipError);
        // Rollback the join request update
        await supabase
          .from('club_join_requests')
          .update({
            status: 'pending',
            resolved_at: null,
          })
          .eq('id', request_id);

        return NextResponse.json(
          { error: "Failed to add member to club" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Process join request error:", error);
    return NextResponse.json(
      { error: "Failed to process join request" },
      { status: 500 }
    );
  }
}
