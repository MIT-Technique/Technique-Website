import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// POST - Request to promote a member to leader (requires admin approval)
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
        { error: "Only club accounts can request leader promotions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get club for current user
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

    // Check current leader count
    const { data: leaders, error: leadersError } = await supabase
      .from('club_memberships')
      .select('id')
      .eq('club_id', club.id)
      .eq('role', 'leader');

    if (leadersError) {
      console.error("Check leaders error:", leadersError);
      return NextResponse.json(
        { error: "Failed to check leader count" },
        { status: 500 }
      );
    }

    if (leaders && leaders.length >= 2) {
      return NextResponse.json(
        { error: "Maximum of 2 leaders per club. Demote an existing leader first." },
        { status: 400 }
      );
    }

    // Verify user is a member of this club
    const { data: membership, error: membershipError } = await supabase
      .from('club_memberships')
      .select('id, role')
      .eq('club_id', club.id)
      .eq('user_id', user_id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "User is not a member of this club" },
        { status: 400 }
      );
    }

    if (membership.role === 'leader') {
      return NextResponse.json(
        { error: "User is already a leader" },
        { status: 400 }
      );
    }

    // Check if there's already a pending request for this user
    const { data: existingRequest } = await supabase
      .from('club_leader_requests')
      .select('id, status')
      .eq('club_id', club.id)
      .eq('user_id', user_id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: "A promotion request is already pending for this user" },
        { status: 400 }
      );
    }

    // Create leader promotion request
    const { data, error } = await supabase
      .from('club_leader_requests')
      .insert({
        club_id: club.id,
        user_id: user_id,
        requested_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error("Create leader request error:", error);
      return NextResponse.json(
        { error: "Failed to create leader request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ request: data });
  } catch (error) {
    console.error("Create leader request error:", error);
    return NextResponse.json(
      { error: "Failed to create leader request" },
      { status: 500 }
    );
  }
}

// GET - Get pending leader requests for this club
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
        { error: "Only club accounts can view leader requests" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Get club for current user
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

    // Get pending leader requests
    const { data: requests, error } = await supabase
      .from('club_leader_requests')
      .select(`
        id,
        user_id,
        status,
        created_at,
        user:users!club_leader_requests_user_id_fkey (
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

// DELETE - Cancel a pending leader request
export async function DELETE(request: NextRequest) {
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
        { error: "Only club accounts can cancel leader requests" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get("id");

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get club for current user
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

    // Verify request belongs to this club and is pending
    const { data: leaderRequest, error: requestError } = await supabase
      .from('club_leader_requests')
      .select('id, club_id, status')
      .eq('id', requestId)
      .single();

    if (requestError || !leaderRequest) {
      return NextResponse.json(
        { error: "Leader request not found" },
        { status: 404 }
      );
    }

    if (leaderRequest.club_id !== club.id) {
      return NextResponse.json(
        { error: "Leader request does not belong to your club" },
        { status: 403 }
      );
    }

    if (leaderRequest.status !== 'pending') {
      return NextResponse.json(
        { error: "Only pending requests can be cancelled" },
        { status: 400 }
      );
    }

    // Delete the request
    const { error } = await supabase
      .from('club_leader_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error("Delete leader request error:", error);
      return NextResponse.json(
        { error: "Failed to cancel leader request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel leader request error:", error);
    return NextResponse.json(
      { error: "Failed to cancel leader request" },
      { status: 500 }
    );
  }
}
