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

    const { requestId } = await request.json();
    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const claimedByEmail = session.photographerEmail || user?.email;

    const supabase = createAdminClient();

    // Verify request is pending
    const { data: existing, error: findError } = await supabase
      .from("hire_requests")
      .select("id, status")
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error claiming request:", error);
    return NextResponse.json({ error: "Failed to claim request" }, { status: 500 });
  }
}
