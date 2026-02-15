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
        <div style="font-family: Raleway, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFCFC; border-top: 4px solid #750014; padding: 32px; color: #1A1A1A; font-weight: 300;">
          <h2 style="color: #750014; font-weight: 600;">Your Photography Request Has Been Claimed!</h2>
          <p>Hi ${existing.requester_name || "there"},</p>
          <p>Great news — a photographer has claimed your event photography request. Here are the details:</p>

          <div style="background: #FFF0F0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #750014; font-weight: 500;">Event Details</h3>
            <p><strong>Event:</strong> ${existing.event_name}</p>
            ${existing.event_type ? `<p><strong>Type:</strong> ${existing.event_type}</p>` : ""}
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Time:</strong> ${timeRange}</p>
            ${existing.location ? `<p><strong>Location:</strong> ${existing.location}</p>` : ""}
            ${existing.description ? `<p><strong>Description:</strong> ${existing.description}</p>` : ""}
          </div>

          <div style="background: #FFF0F0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #750014; font-weight: 500;">Cost Breakdown</h3>
            ${existing.hourly_rate != null ? `<p><strong>Hourly Rate:</strong> $${existing.hourly_rate}</p>` : ""}
            ${existing.duration_hours != null ? `<p><strong>Duration:</strong> ${existing.duration_hours} hour${existing.duration_hours === 1 ? "" : "s"}</p>` : ""}
            ${existing.total_cost != null ? `<p><strong>Total Cost:</strong> $${existing.total_cost}</p>` : ""}
          </div>

          <div style="background: #FFF0F0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #750014; font-weight: 500;">Your Photographer</h3>
            <p><strong>Email:</strong> <a href="mailto:${claimedByEmail}" style="color: #750014;">${claimedByEmail}</a></p>
            <p>Feel free to reach out to coordinate any additional details.</p>
          </div>

          ${existing.confirmation_code ? `<p><strong>Confirmation Code:</strong> ${existing.confirmation_code}</p>` : ""}

          <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 20px 0;" />
          <p style="color: #666666; font-size: 14px;">
            If you have any questions, contact us at
            <a href="mailto:technique@mit.edu" style="color: #750014;">technique@mit.edu</a>.
          </p>
          <p style="color: #750014; font-size: 14px; font-weight: 500;">— MIT Technique</p>
        </div>
      `;

      await transporter.sendMail({
        from: "mittnq@gmail.com",
        to: existing.requester_email,
        subject: `Photography Request Claimed - ${existing.event_name}`,
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
