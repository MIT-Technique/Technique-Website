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
        <div style="font-family: Raleway, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFCFC; border-top: 4px solid #750014; padding: 32px; color: #1A1A1A; font-weight: 300;">
          <h2 style="color: #750014; font-weight: 600;">New Photography Hire Request</h2>
          <p>A new event photography request has been submitted and is awaiting a photographer.</p>

          <div style="background: #FFF0F0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #750014; font-weight: 500;">Requester</h3>
            <p><strong>Name:</strong> ${requesterName}</p>
            <p><strong>Email:</strong> <a href="mailto:${requesterEmail}" style="color: #750014;">${requesterEmail}</a></p>
          </div>

          <div style="background: #FFF0F0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #750014; font-weight: 500;">Event Details</h3>
            <p><strong>Event:</strong> ${eventName}</p>
            <p><strong>Type:</strong> ${eventType}</p>
            <p><strong>Date:</strong> ${eventDateStr}</p>
            <p><strong>Time:</strong> ${timeRange}</p>
            ${location ? `<p><strong>Location:</strong> ${location}</p>` : ""}
            ${description ? `<p><strong>Description:</strong> ${description}</p>` : ""}
          </div>

          <div style="background: #FFF0F0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #750014; font-weight: 500;">Cost</h3>
            <p><strong>Rate:</strong> $${hourlyRate}/hr</p>
            <p><strong>Duration:</strong> ${durationHours} hour${durationHours === 1 ? "" : "s"}</p>
            <p><strong>Total:</strong> $${totalCost}</p>
          </div>

          <div style="text-align: center; margin: 28px 0 12px;">
            <a href="https://technique.mit.edu/en/hire" style="display: inline-block; background: #750014; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 4px; font-weight: 500; font-size: 14px; letter-spacing: 0.5px;">Sign In to Approve</a>
          </div>

          <p style="color: #750014; font-size: 14px; font-weight: 500;">— MIT Technique</p>
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
