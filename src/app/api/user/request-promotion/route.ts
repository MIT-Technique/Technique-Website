import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

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
    const { request_type, request_reason } = body;

    // Allow staph_request and photographer_request
    if (request_type !== 'staph_request' && request_type !== 'photographer_request') {
      return NextResponse.json(
        { error: "Invalid request type" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if user already has a pending request of this type
    const { data: existingRequest } = await supabase
      .from('promotion_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('request_type', request_type)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending request of this type" },
        { status: 409 }
      );
    }

    // Create the promotion request
    const { data, error } = await supabase
      .from('promotion_requests')
      .insert({
        user_id: user.id,
        request_type,
        status: 'pending',
        request_reason: request_reason || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Create promotion request error:", error);
      return NextResponse.json(
        { error: "Failed to create promotion request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      request: data,
    });
  } catch (error) {
    console.error("Promotion request error:", error);
    return NextResponse.json(
      { error: "Failed to process promotion request" },
      { status: 500 }
    );
  }
}

// GET - Get user's promotion requests
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

    const { data, error } = await supabase
      .from('promotion_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Get promotion requests error:", error);
      return NextResponse.json(
        { error: "Failed to get promotion requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: data });
  } catch (error) {
    console.error("Get promotion requests error:", error);
    return NextResponse.json(
      { error: "Failed to get promotion requests" },
      { status: 500 }
    );
  }
}
