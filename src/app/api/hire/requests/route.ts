import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getSession, getCurrentUser } from "../../../../lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    const user = await getCurrentUser();

    const isAdmin = user?.role === "admin";
    const isPhotographer = !!session.photographerEmail;

    if (!isAdmin && !isPhotographer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const isStaph = user?.role === "staph";

    const supabase = createAdminClient();
    let query = supabase
      .from("hire_requests")
      .select("*")
      .order("status", { ascending: true })
      .order("event_date", { ascending: true });

    // Only admin/staph can see cancelled requests
    if (!isAdmin && !isStaph) {
      query = query.neq("status", "cancelled");
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error("Error fetching hire requests:", error);
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error("Error fetching hire requests:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}
