import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { RequestStatus } from "../../../../lib/supabase/types";

// GET - List all promotion requests
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let query = supabase
      .from('promotion_requests')
      .select(`
        *,
        user:users(id, email, first_name, last_name, role),
        reviewed_by_user:users!promotion_requests_reviewed_by_fkey(id, email, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('request_type', type);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error("Error fetching promotion requests:", error);
      return NextResponse.json(
        { error: "Failed to fetch promotion requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching promotion requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotion requests" },
      { status: 500 }
    );
  }
}

// PUT - Approve or deny a promotion request
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { requestId, action, notes } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    const validActions: RequestStatus[] = ['approved', 'denied'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'approved' or 'denied'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the request details
    const { data: promotionRequest, error: fetchError } = await supabase
      .from('promotion_requests')
      .select('*, user:users(id, email, role)')
      .eq('id', requestId)
      .single();

    if (fetchError || !promotionRequest) {
      return NextResponse.json(
        { error: "Promotion request not found" },
        { status: 404 }
      );
    }

    if (promotionRequest.status !== 'pending') {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 409 }
      );
    }

    // Update the request
    const { error: updateError } = await supabase
      .from('promotion_requests')
      .update({
        status: action,
        review_notes: notes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      console.error("Error updating promotion request:", updateError);
      return NextResponse.json(
        { error: "Failed to update promotion request" },
        { status: 500 }
      );
    }

    // If approved, update user role and create corresponding entry
    if (action === 'approved') {
      const targetUserId = promotionRequest.user_id;
      const requestType = promotionRequest.request_type;

      if (requestType === 'club_promotion') {
        // Update user role to club
        const { error: roleError } = await supabase
          .from('users')
          .update({
            role: 'club',
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId);

        if (roleError) {
          console.error("Error updating user role:", roleError);
          return NextResponse.json(
            { error: "Failed to update user role" },
            { status: 500 }
          );
        }

        // Generate 4-digit club ID
        const clubId = String(Math.floor(1000 + Math.random() * 9000));

        // Create club entry
        const { error: clubError } = await supabase
          .from('clubs')
          .insert({
            user_id: targetUserId,
            club_id: clubId,
            name: '',
            approval_status: 'pending',
          });

        if (clubError) {
          console.error("Error creating club:", clubError);
          // Don't fail the whole request, the user role is already updated
        }
      } else if (requestType === 'living_group_leader') {
        // Update user role to living_group_leader
        const { error: roleError } = await supabase
          .from('users')
          .update({
            role: 'living_group_leader',
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId);

        if (roleError) {
          console.error("Error updating user role:", roleError);
          return NextResponse.json(
            { error: "Failed to update user role" },
            { status: 500 }
          );
        }

        // Create living group entry
        const { error: lgError } = await supabase
          .from('living_groups')
          .insert({
            user_id: targetUserId,
            name: promotionRequest.living_group_name || '',
            status: 'active',
            promoted_by: user.id,
            promoted_at: new Date().toISOString(),
          });

        if (lgError) {
          console.error("Error creating living group:", lgError);
          // Don't fail the whole request, the user role is already updated
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Request ${action === 'approved' ? 'approved' : 'denied'} successfully`,
    });
  } catch (error) {
    console.error("Error processing promotion request:", error);
    return NextResponse.json(
      { error: "Failed to process promotion request" },
      { status: 500 }
    );
  }
}
