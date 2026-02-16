import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { RequestStatus } from "../../../../lib/supabase/types";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mittnq@gmail.com",
    pass: process.env.GOOGLE_PASSWORD,
  },
});

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
        user:users!promotion_requests_user_id_fkey(id, email, name, role),
        reviewed_by_user:users!promotion_requests_reviewed_by_fkey(id, email, name)
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

        // Send photographer approval email (non-blocking)
        const photographerEmail = promotionRequest.user?.email;
        const photographerName = promotionRequest.user?.name;
        if (photographerEmail) {
          try {
            await transporter.sendMail({
              from: "mittnq@gmail.com",
              to: photographerEmail,
              subject: "Photographer Access Approved — MIT Technique",
              html: `
                <div style="font-family: Raleway, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F9F5F5; color: #1A1A1A; font-weight: 300;">
                  <div style="background: #750014; padding: 32px 32px 28px; text-align: center;">
                    <h1 style="color: #ffffff; font-weight: 700; font-size: 22px; margin: 0 0 6px; letter-spacing: 0.5px;">MIT TECHNIQUE</h1>
                    <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0; font-weight: 400; letter-spacing: 0.3px;">Photographer Access Approved</p>
                  </div>
                  <div style="padding: 28px 32px 32px;">
                    <p style="margin: 0 0 24px; line-height: 1.6; font-size: 15px;">Hi${photographerName ? ` ${photographerName}` : ""}, your photographer access has been approved!</p>
                    <p style="margin: 0 0 24px; line-height: 1.6; font-size: 15px;">You can now view and claim available photography times on the Hire Us page. Sign in with your MIT email to get started.</p>
                    <div style="text-align: center; margin: 0 0 28px;">
                      <a href="https://technique.mit.edu/en/hire" style="display: inline-block; background: #750014; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 24px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">View Available Times</a>
                    </div>
                    <div style="border-top: 1px solid #E0D6D6; padding-top: 20px; text-align: center;">
                      <p style="color: #999; font-size: 12px; margin: 0 0 4px;">MIT Technique &middot; Walker Memorial, Room 50-320</p>
                      <p style="color: #999; font-size: 12px; margin: 0;"><a href="mailto:technique@mit.edu" style="color: #999; text-decoration: none;">technique@mit.edu</a></p>
                    </div>
                  </div>
                </div>
              `,
            });
          } catch (emailError) {
            console.error("Failed to send photographer approval email:", emailError);
          }
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
