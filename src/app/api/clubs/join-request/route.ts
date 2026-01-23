import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// POST - Submit a join request to a club
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { club_id } = body;

    if (!club_id) {
      return NextResponse.json(
        { error: "Club ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if club exists and is approved
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name')
      .eq('id', club_id)
      .eq('approval_status', 'approved')
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { error: "Club not found or not approved" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('club_memberships')
      .select('id')
      .eq('club_id', club_id)
      .eq('user_id', user.id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of this club" },
        { status: 400 }
      );
    }

    // Check if user already has a pending request
    const { data: existingRequest } = await supabase
      .from('club_join_requests')
      .select('id, status')
      .eq('club_id', club_id)
      .eq('user_id', user.id)
      .single();

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          { error: "You already have a pending request for this club" },
          { status: 400 }
        );
      }
      // If denied, allow them to request again by updating the existing record
      const { data, error } = await supabase
        .from('club_join_requests')
        .update({
          status: 'pending',
          resolved_at: null,
          created_at: new Date().toISOString(),
        })
        .eq('id', existingRequest.id)
        .select()
        .single();

      if (error) {
        console.error("Update join request error:", error);
        return NextResponse.json(
          { error: "Failed to submit join request" },
          { status: 500 }
        );
      }

      return NextResponse.json({ request: data, club_name: club.name });
    }

    // Create new join request
    const { data, error } = await supabase
      .from('club_join_requests')
      .insert({
        club_id,
        user_id: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error("Create join request error:", error);
      return NextResponse.json(
        { error: "Failed to submit join request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ request: data, club_name: club.name });
  } catch (error) {
    console.error("Submit join request error:", error);
    return NextResponse.json(
      { error: "Failed to submit join request" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a pending join request
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
    const requestId = searchParams.get("id");

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if request exists and belongs to user
    const { data: existingRequest, error: fetchError } = await supabase
      .from('club_join_requests')
      .select('id, status')
      .eq('id', requestId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    if (existingRequest.status !== 'pending') {
      return NextResponse.json(
        { error: "Only pending requests can be cancelled" },
        { status: 400 }
      );
    }

    // Delete the request
    const { error } = await supabase
      .from('club_join_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error("Delete join request error:", error);
      return NextResponse.json(
        { error: "Failed to cancel join request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel join request error:", error);
    return NextResponse.json(
      { error: "Failed to cancel join request" },
      { status: 500 }
    );
  }
}
