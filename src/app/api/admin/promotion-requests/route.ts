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
        user:users!promotion_requests_user_id_fkey(id, email, first_name, last_name, role),
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
      .select('*, user:users!promotion_requests_user_id_fkey(id, email, role)')
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

    // If approved, apply the appropriate change
    if (action === 'approved') {
      const targetUserId = promotionRequest.user_id;
      const requestType = promotionRequest.request_type;

      if (requestType === 'staph_request') {
        // Update user role to staph
        const { error: roleError } = await supabase
          .from('users')
          .update({
            role: 'staph',
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
      } else if (requestType === 'photographer_request') {
        // Create photographer permission record
        const { error: permissionError } = await supabase
          .from('photographer_permissions')
          .insert({
            user_id: targetUserId,
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            is_active: true,
          });

        if (permissionError) {
          console.error("Error creating photographer permission:", permissionError);
          return NextResponse.json(
            { error: "Failed to grant photographer permission" },
            { status: 500 }
          );
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
