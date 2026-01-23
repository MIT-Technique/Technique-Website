import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Get all pending club leader requests (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Get all pending leader requests with user and club details
    const { data: requests, error } = await supabase
      .from('club_leader_requests')
      .select(`
        id,
        user_id,
        requested_by,
        status,
        created_at,
        user:users!club_leader_requests_user_id_fkey (
          id,
          email,
          first_name,
          last_name
        ),
        club:clubs (
          id,
          name
        ),
        requester:users!club_leader_requests_requested_by_fkey (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Get leader requests error:", error);
      return NextResponse.json(
        { error: "Failed to get leader requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error("Get leader requests error:", error);
    return NextResponse.json(
      { error: "Failed to get leader requests" },
      { status: 500 }
    );
  }
}

// PUT - Approve or deny a leader request (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: "Admin access required" },
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

    // Get the leader request
    const { data: leaderRequest, error: requestError } = await supabase
      .from('club_leader_requests')
      .select('id, club_id, user_id, status')
      .eq('id', request_id)
      .single();

    if (requestError || !leaderRequest) {
      return NextResponse.json(
        { error: "Leader request not found" },
        { status: 404 }
      );
    }

    if (leaderRequest.status !== 'pending') {
      return NextResponse.json(
        { error: "Request has already been processed" },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'denied';

    // Update the leader request status
    const { error: updateError } = await supabase
      .from('club_leader_requests')
      .update({
        status: newStatus,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      })
      .eq('id', request_id);

    if (updateError) {
      console.error("Update leader request error:", updateError);
      return NextResponse.json(
        { error: "Failed to update leader request" },
        { status: 500 }
      );
    }

    // If approved, promote the member to leader
    if (action === 'approve') {
      // First check current leader count (trigger will also enforce this)
      const { data: leaders } = await supabase
        .from('club_memberships')
        .select('id')
        .eq('club_id', leaderRequest.club_id)
        .eq('role', 'leader');

      if (leaders && leaders.length >= 2) {
        // Rollback the request update
        await supabase
          .from('club_leader_requests')
          .update({
            status: 'pending',
            resolved_at: null,
            resolved_by: null,
          })
          .eq('id', request_id);

        return NextResponse.json(
          { error: "Club already has 2 leaders. One must be demoted first." },
          { status: 400 }
        );
      }

      // Update membership to leader
      const { error: membershipError } = await supabase
        .from('club_memberships')
        .update({ role: 'leader' })
        .eq('club_id', leaderRequest.club_id)
        .eq('user_id', leaderRequest.user_id);

      if (membershipError) {
        console.error("Update membership error:", membershipError);
        // Rollback the request update
        await supabase
          .from('club_leader_requests')
          .update({
            status: 'pending',
            resolved_at: null,
            resolved_by: null,
          })
          .eq('id', request_id);

        return NextResponse.json(
          { error: "Failed to promote member to leader" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Process leader request error:", error);
    return NextResponse.json(
      { error: "Failed to process leader request" },
      { status: 500 }
    );
  }
}
