import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import crypto from "crypto";

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
