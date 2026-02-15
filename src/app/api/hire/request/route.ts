import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "../../../../lib/supabase/admin";
import crypto from "crypto";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mittnq@gmail.com",
    pass: process.env.GOOGLE_PASSWORD,
  },
});

export const dynamic = "force-dynamic";

// GET - Look up an existing request by confirmation code + email
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const email = searchParams.get("email");

    if (!code || !email) {
      return NextResponse.json({ error: "Code and email are required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("hire_requests")
      .select("*")
      .eq("confirmation_code", code.toUpperCase())
      .eq("requester_email", email.trim().toLowerCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      request: {
        requesterName: data.requester_name,
        requesterEmail: data.requester_email,
        eventName: data.event_name,
        eventType: data.event_type,
        eventDate: data.event_date,
        startTime: data.start_time?.slice(0, 5),
        endTime: data.end_time?.slice(0, 5),
        location: data.location || "",
        description: data.description || "",
      },
    });
  } catch (error) {
    console.error("Error looking up hire request:", error);
    return NextResponse.json({ error: "Failed to look up request" }, { status: 500 });
  }
}

function generateConfirmationCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      requesterName,
      requesterEmail,
      eventName,
      eventType,
      eventDate,
      startTime,
      endTime,
      location,
      description,
      confirmationCode: existingCode,
    } = body;

    // Validate required fields
    if (!requesterName || !requesterEmail || !eventName || !eventType || !eventDate || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validTypes = ["conference", "performance", "social", "competition", "other"];
    if (!validTypes.includes(eventType)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    // Fetch current rate
    const supabase = createAdminClient();
    const { data: rateSetting } = await supabase
      .from("form_settings")
      .select("config_value")
      .eq("form_name", "hire_hourly_rate")
      .single();

    const hourlyRate = rateSetting?.config_value?.rate ?? 85;

    // Calculate duration
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    // Reject past dates/times
    const now = new Date();
    const eventStart = new Date(`${eventDate}T${startTime}`);
    if (eventStart < now) {
      return NextResponse.json({ error: "Event date and time must be in the future" }, { status: 400 });
    }

    const durationHours = Math.round(((endMinutes - startMinutes) / 60) * 100) / 100;
    const totalCost = Math.round(hourlyRate * durationHours * 100) / 100;

    if (existingCode) {
      // Update existing request
      const { data: existing, error: findError } = await supabase
        .from("hire_requests")
        .select("id")
        .eq("confirmation_code", existingCode)
        .eq("requester_email", requesterEmail)
        .single();

      if (findError || !existing) {
        return NextResponse.json({ error: "Request not found. Check your confirmation code and email." }, { status: 404 });
      }

      const { error: updateError } = await supabase
        .from("hire_requests")
        .update({
          requester_name: requesterName,
          event_name: eventName,
          event_type: eventType,
          event_date: eventDate,
          start_time: startTime,
          end_time: endTime,
          location: location || null,
          description: description || null,
          hourly_rate: hourlyRate,
          duration_hours: durationHours,
          total_cost: totalCost,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Error updating hire request:", updateError);
        return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
      }

      return NextResponse.json({
        confirmationCode: existingCode,
        hourlyRate,
        durationHours,
        totalCost,
        updated: true,
      });
    }

    // Create new request
    const confirmationCode = generateConfirmationCode();

    const { error: insertError } = await supabase.from("hire_requests").insert({
      confirmation_code: confirmationCode,
      requester_name: requesterName,
      requester_email: requesterEmail,
      event_name: eventName,
      event_type: eventType,
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime,
      location: location || null,
      description: description || null,
      hourly_rate: hourlyRate,
      duration_hours: durationHours,
      total_cost: totalCost,
    });

    if (insertError) {
      console.error("Error creating hire request:", insertError);
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }

    // Send notice email to Technique (non-blocking)
    try {
      const eventDateStr = new Date(eventDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "America/New_York",
      });

      const formatTime = (time: string) => {
        const [h, m] = time.split(":");
        const hour = parseInt(h);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm} EST`;
      };

      const timeRange = `${formatTime(startTime)} – ${formatTime(endTime)}`;

      const noticeHtml = `
        <div style="font-family: Raleway, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F9F5F5; color: #1A1A1A; font-weight: 300;">
          <div style="background: #750014; padding: 32px 32px 28px; text-align: center;">
            <h1 style="color: #ffffff; font-weight: 700; font-size: 22px; margin: 0 0 6px; letter-spacing: 0.5px;">MIT TECHNIQUE</h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0; font-weight: 400; letter-spacing: 0.3px;">New Photography Request</p>
          </div>

          <div style="padding: 28px 32px 32px;">
            <p style="margin: 0 0 24px; line-height: 1.6; font-size: 15px;">A new event photography request has been submitted and is awaiting a photographer.</p>

            <div style="background: #ffffff; border-left: 3px solid #750014; border-radius: 4px; padding: 20px 24px; margin: 0 0 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #750014; margin: 0 0 12px; font-weight: 600;">Requester Info</p>
              <p style="margin: 0 0 6px; font-size: 15px; line-height: 1.5;">${requesterName}</p>
              <p style="margin: 0; font-size: 15px; line-height: 1.5;"><a href="mailto:${requesterEmail}" style="color: #750014; text-decoration: none;">${requesterEmail}</a></p>
            </div>

            <div style="background: #ffffff; border-left: 3px solid #750014; border-radius: 4px; padding: 20px 24px; margin: 0 0 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #750014; margin: 0 0 12px; font-weight: 600;">Event Details</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 4px 0; font-size: 13px; color: #888; width: 90px; vertical-align: top;">Event</td><td style="padding: 4px 0; font-size: 15px;">${eventName}</td></tr>
                <tr><td style="padding: 4px 0; font-size: 13px; color: #888; vertical-align: top;">Type</td><td style="padding: 4px 0; font-size: 15px; text-transform: capitalize;">${eventType}</td></tr>
                <tr><td style="padding: 4px 0; font-size: 13px; color: #888; vertical-align: top;">Date</td><td style="padding: 4px 0; font-size: 15px;">${eventDateStr}</td></tr>
                <tr><td style="padding: 4px 0; font-size: 13px; color: #888; vertical-align: top;">Time</td><td style="padding: 4px 0; font-size: 15px;">${timeRange}</td></tr>
                ${location ? `<tr><td style="padding: 4px 0; font-size: 13px; color: #888; vertical-align: top;">Location</td><td style="padding: 4px 0; font-size: 15px;">${location}</td></tr>` : ""}
                ${description ? `<tr><td style="padding: 4px 0; font-size: 13px; color: #888; vertical-align: top;">Details</td><td style="padding: 4px 0; font-size: 15px;">${description}</td></tr>` : ""}
              </table>
            </div>

            <div style="background: #ffffff; border-left: 3px solid #750014; border-radius: 4px; padding: 20px 24px; margin: 0 0 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #750014; margin: 0 0 12px; font-weight: 600;">Pricing</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 4px 0; font-size: 13px; color: #888; width: 90px;">Rate</td><td style="padding: 4px 0; font-size: 15px;">$${hourlyRate}/hr</td></tr>
                <tr><td style="padding: 4px 0; font-size: 13px; color: #888;">Duration</td><td style="padding: 4px 0; font-size: 15px;">${durationHours} hour${durationHours === 1 ? "" : "s"}</td></tr>
                <tr><td style="padding: 4px 0; font-size: 13px; color: #888;">Total</td><td style="padding: 4px 0; font-size: 15px; font-weight: 600;">$${totalCost}</td></tr>
              </table>
            </div>

            <div style="text-align: center; margin: 0 0 28px;">
              <a href="https://technique.mit.edu/en/hire" style="display: inline-block; background: #750014; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 24px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">View &amp; Assign Photographer</a>
            </div>

            <div style="border-top: 1px solid #E0D6D6; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0 0 4px;">MIT Technique &middot; Walker Memorial, Room 50-320</p>
              <p style="color: #999; font-size: 12px; margin: 0;"><a href="mailto:technique@mit.edu" style="color: #999; text-decoration: none;">technique@mit.edu</a></p>
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: "mittnq@gmail.com",
        to: "technique@mit.edu",
        subject: `New Hire Request: ${eventName}`,
        html: noticeHtml,
      });
    } catch (emailError) {
      console.error("Failed to send hire notice email:", emailError);
    }

    return NextResponse.json({
      confirmationCode,
      hourlyRate,
      durationHours,
      totalCost,
      updated: false,
    });
  } catch (error) {
    console.error("Error processing hire request:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

// DELETE - Cancel a hire request by confirmation code + email
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const email = searchParams.get("email");

    if (!code || !email) {
      return NextResponse.json({ error: "Code and email are required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error: findError } = await supabase
      .from("hire_requests")
      .select("id, status")
      .eq("confirmation_code", code.toUpperCase())
      .eq("requester_email", email.trim().toLowerCase())
      .single();

    if (findError || !data) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (data.status === "claimed") {
      return NextResponse.json({ error: "Cannot cancel a claimed request" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("hire_requests")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", data.id);

    if (updateError) {
      console.error("Error cancelling hire request:", updateError);
      return NextResponse.json({ error: "Failed to cancel request" }, { status: 500 });
    }

    return NextResponse.json({ cancelled: true });
  } catch (error) {
    console.error("Error cancelling hire request:", error);
    return NextResponse.json({ error: "Failed to cancel request" }, { status: 500 });
  }
}
