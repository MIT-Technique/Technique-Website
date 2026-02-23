import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getSession, getCurrentUser } from "../../../../lib/auth/session";

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

    const { requestId, photographerNotes } = await request.json();
    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const claimedByEmail = session.photographerEmail || user?.email;

    const supabase = createAdminClient();

    const { data: existing, error: findError } = await supabase
      .from("hire_requests")
      .select("id, status, claimed_by")
      .eq("id", requestId)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (existing.status !== "claimed") {
      return NextResponse.json({ error: "Request must be in claimed status" }, { status: 400 });
    }

    if (!isAdmin && existing.claimed_by !== claimedByEmail) {
      return NextResponse.json({ error: "You can only complete requests you claimed" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from("hire_requests")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        photographer_notes: photographerNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("Error completing request:", updateError);
      return NextResponse.json({ error: "Failed to complete request" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing request:", error);
    return NextResponse.json({ error: "Failed to complete request" }, { status: 500 });
  }
}
