import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "../../../../lib/supabase/admin";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mittnq@gmail.com",
    pass: process.env.GOOGLE_PASSWORD,
  },
});

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const today = new Date().toISOString().split("T")[0];

    // Find claimed requests where the event date has passed and no dropbox link submitted
    const { data: overdueRequests, error } = await supabase
      .from("hire_requests")
      .select("*")
      .eq("status", "claimed")
      .is("dropbox_link", null)
      .lt("event_date", today)
      .order("event_date", { ascending: true });

    if (error) {
      console.error("Error fetching overdue requests:", error);
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }

    if (!overdueRequests || overdueRequests.length === 0) {
      return NextResponse.json({ sent: 0, reason: "No overdue claimed requests" });
    }

    // Group by photographer email
    const byPhotographer: Record<string, typeof overdueRequests> = {};
    for (const req of overdueRequests) {
      const email = req.claimed_by;
      if (!email) continue;
      if (!byPhotographer[email]) byPhotographer[email] = [];
      byPhotographer[email].push(req);
    }

    const formatTime = (time: string | null) => {
      if (!time) return "TBD";
      const [h, m] = time.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm} EST`;
    };

    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return "TBD";
      return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "America/New_York",
      });
    };

    let sentCount = 0;

    for (const [photographerEmail, requests] of Object.entries(byPhotographer)) {
      const requestRows = requests
        .map(
          (r) => `
          <tr>
            <td style="padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #E0D6D6;">
              <strong>${r.event_name}</strong>
              <br/><span style="color: #888; font-size: 12px; text-transform: capitalize;">${r.event_type}</span>
            </td>
            <td style="padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #E0D6D6;">
              ${formatDate(r.event_date)}
              <br/><span style="color: #888; font-size: 12px;">${formatTime(r.start_time)} – ${formatTime(r.end_time)}</span>
            </td>
            <td style="padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #E0D6D6;">${r.location || "TBD"}</td>
            <td style="padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #E0D6D6;">
              ${r.requester_name}
              <br/><a href="mailto:${r.requester_email}" style="color: #750014; text-decoration: none; font-size: 12px;">${r.requester_email}</a>
            </td>
            <td style="padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #E0D6D6; font-weight: 600;">$${r.total_cost}</td>
          </tr>`
        )
        .join("");

      const htmlContent = `
        <div style="font-family: Raleway, Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #F9F5F5; color: #1A1A1A; font-weight: 300;">
          <div style="background: #750014; padding: 32px 32px 28px; text-align: center;">
            <h1 style="color: #ffffff; font-weight: 700; font-size: 22px; margin: 0 0 6px; letter-spacing: 0.5px;">MIT TECHNIQUE</h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0; font-weight: 400; letter-spacing: 0.3px;">Photo Delivery Reminder</p>
          </div>

          <div style="padding: 28px 32px 32px;">
            <p style="margin: 0 0 8px; line-height: 1.6; font-size: 15px;">Hi,</p>
            <p style="margin: 0 0 24px; line-height: 1.6; font-size: 15px;">
              You have <strong>${requests.length}</strong> past event${requests.length === 1 ? "" : "s"} still awaiting photo delivery. Please upload the photos and submit the Dropbox link at your earliest convenience.
            </p>

            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                <thead>
                  <tr style="background: #750014; color: #ffffff;">
                    <th style="padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: left;">Event</th>
                    <th style="padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: left;">Date &amp; Time</th>
                    <th style="padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: left;">Location</th>
                    <th style="padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: left;">Requester</th>
                    <th style="padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: left;">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${requestRows}
                </tbody>
              </table>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="https://technique.mit.edu/en/hire" style="display: inline-block; background: #750014; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 24px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Submit Photos</a>
            </div>

            <div style="border-top: 1px solid #E0D6D6; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0 0 4px;">MIT Technique &middot; Walker Memorial, Room 50-320</p>
              <p style="color: #999; font-size: 12px; margin: 0;"><a href="mailto:technique@mit.edu" style="color: #999; text-decoration: none;">technique@mit.edu</a></p>
            </div>
          </div>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: "mittnq@gmail.com",
          to: photographerEmail,
          cc: "technique@mit.edu",
          subject: `Reminder: ${requests.length} Event${requests.length === 1 ? "" : "s"} Awaiting Photo Delivery | MIT Technique`,
          html: htmlContent,
        });
        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send reminder to ${photographerEmail}:`, emailError);
      }
    }

    return NextResponse.json({ sent: sentCount, photographers: Object.keys(byPhotographer).length });
  } catch (error) {
    console.error("Error sending photographer reminders:", error);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
