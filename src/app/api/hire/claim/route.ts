import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getSession, getCurrentUser } from "../../../../lib/auth/session";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mittnq@gmail.com",
    pass: process.env.GOOGLE_PASSWORD,
  },
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const user = await getCurrentUser();

    const isAdmin = user?.role === "admin";
    const isPhotographer = !!session.photographerEmail;

    if (!isAdmin && !isPhotographer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { requestId } = await request.json();
    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const claimedByEmail = session.photographerEmail || user?.email;

    const supabase = createAdminClient();

    // Verify request is pending
    const { data: existing, error: findError } = await supabase
      .from("hire_requests")
      .select("id, status, requester_name, requester_email, event_name, event_type, event_date, start_time, end_time, location, description, hourly_rate, duration_hours, total_cost, confirmation_code")
      .eq("id", requestId)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (existing.status !== "pending") {
      return NextResponse.json({ error: "Request is no longer available" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("hire_requests")
      .update({
        status: "claimed",
        claimed_by: claimedByEmail,
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("Error claiming request:", updateError);
      return NextResponse.json({ error: "Failed to claim request" }, { status: 500 });
    }

    // Send confirmation email to requester (non-blocking)
    try {
      const eventDate = existing.event_date
        ? new Date(existing.event_date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "America/New_York",
          })
        : "TBD";

      const formatTime = (time: string | null) => {
        if (!time) return null;
        const [h, m] = time.split(":");
        const hour = parseInt(h);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm} EST`;
      };

      const startTime = formatTime(existing.start_time);
      const endTime = formatTime(existing.end_time);
      const timeRange =
        startTime && endTime ? `${startTime} – ${endTime}` : startTime || "TBD";

      const htmlContent = `
        <div style="font-family: Raleway, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F9F5F5; color: #1A1A1A; font-weight: 300;">
          <div style="background: #750014; padding: 32px 32px 28px; text-align: center;">
            <h1 style="color: #ffffff; font-weight: 700; font-size: 22px; margin: 0 0 6px; letter-spacing: 0.5px;">MIT TECHNIQUE</h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0; font-weight: 400; letter-spacing: 0.3px;">Request Confirmed</p>
          </div>

          <div style="padding: 28px 32px 32px;">
            <p style="margin: 0 0 8px; line-height: 1.6; font-size: 15px;">Hi ${existing.requester_name || "there"},</p>
            <p style="margin: 0 0 24px; line-height: 1.6; font-size: 15px;">Great news — a photographer has been assigned to your event. Here are the details:</p>

            <div style="background: #ffffff; border-left: 3px solid #750014; border-radius: 4px; padding: 20px 24px; margin: 0 0 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #750014; margin: 0 0 12px; font-weight: 600;">Event Details</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 4px 0; font-size: 13px; color: #888; width: 90px; vertical-align: top;">Event</td><td style="padding: 4px 0; font-size: 15px;">${existing.event_name}</td></tr>
                ${existing.event_type ? `<tr><td style="padding: 4px 0; font-size: 13px; color: #888; vertical-align: top;">Type</td><td style="padding: 4px 0; font-size: 15px; text-transform: capitalize;">${existing.event_type}</td></tr>` : ""}
                <tr><td style="padding: 4px 0; font-size: 13px; color: #888; vertical-align: top;">Date</td><td style="padding: 4px 0; font-size: 15px;">${eventDate}</td></tr>
                <tr><td style="padding: 4px 0; font-size: 13px; color: #888; vertical-align: top;">Time</td><td style="padding: 4px 0; font-size: 15px;">${timeRange}</td></tr>
                ${existing.location ? `<tr><td style="padding: 4px 0; font-size: 13px; color: #888; vertical-align: top;">Location</td><td style="padding: 4px 0; font-size: 15px;">${existing.location}</td></tr>` : ""}
                ${existing.description ? `<tr><td style="padding: 4px 0; font-size: 13px; color: #888; vertical-align: top;">Details</td><td style="padding: 4px 0; font-size: 15px;">${existing.description}</td></tr>` : ""}
              </table>
            </div>

            <div style="background: #ffffff; border-left: 3px solid #750014; border-radius: 4px; padding: 20px 24px; margin: 0 0 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #750014; margin: 0 0 12px; font-weight: 600;">Cost Breakdown</p>
              <table style="width: 100%; border-collapse: collapse;">
                ${existing.hourly_rate != null ? `<tr><td style="padding: 4px 0; font-size: 13px; color: #888; width: 90px;">Rate</td><td style="padding: 4px 0; font-size: 15px;">$${existing.hourly_rate}/hr</td></tr>` : ""}
                ${existing.duration_hours != null ? `<tr><td style="padding: 4px 0; font-size: 13px; color: #888;">Duration</td><td style="padding: 4px 0; font-size: 15px;">${existing.duration_hours} hour${existing.duration_hours === 1 ? "" : "s"}</td></tr>` : ""}
                ${existing.total_cost != null ? `<tr><td style="padding: 4px 0; font-size: 13px; color: #888;">Total</td><td style="padding: 4px 0; font-size: 15px; font-weight: 600;">$${existing.total_cost}</td></tr>` : ""}
              </table>
            </div>

            <div style="background: #ffffff; border-left: 3px solid #750014; border-radius: 4px; padding: 20px 24px; margin: 0 0 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #750014; margin: 0 0 12px; font-weight: 600;">Your Photographer</p>
              <p style="margin: 0 0 6px; font-size: 15px; line-height: 1.5;"><a href="mailto:${claimedByEmail}" style="color: #750014; text-decoration: none;">${claimedByEmail}</a></p>
              <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">Feel free to reach out to coordinate any additional details.</p>
            </div>

            ${existing.confirmation_code ? `
            <div style="text-align: center; margin: 24px 0;">
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #888; margin: 0 0 8px; font-weight: 600;">Confirmation Code</p>
              <span style="display: inline-block; background: #750014; color: #ffffff; font-family: 'Courier New', Courier, monospace; font-size: 18px; font-weight: 700; letter-spacing: 3px; padding: 10px 24px; border-radius: 6px;">${existing.confirmation_code}</span>
            </div>
            ` : ""}

            <div style="border-top: 1px solid #E0D6D6; padding-top: 20px; margin-top: 28px; text-align: center;">
              <p style="color: #888; font-size: 13px; margin: 0 0 6px; line-height: 1.5;">Questions? Contact us at <a href="mailto:technique@mit.edu" style="color: #750014; text-decoration: none;">technique@mit.edu</a></p>
              <p style="color: #999; font-size: 12px; margin: 0;">MIT Technique &middot; Walker Memorial, Room 50-320</p>
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: "mittnq@gmail.com",
        to: existing.requester_email,
        cc: claimedByEmail,
        subject: `Photography Request Approved - ${existing.event_name}`,
        html: htmlContent,
      });
    } catch (emailError) {
      console.error("Failed to send claim confirmation email:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error claiming request:", error);
    return NextResponse.json({ error: "Failed to claim request" }, { status: 500 });
  }
}
