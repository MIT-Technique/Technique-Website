import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Fetch admin logs with pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "20");
    const days = searchParams.get("days");
    const offset = page * limit;

    // Fetch logs with actor info
    let query = supabase
      .from("admin_logs")
      .select(
        `
        id,
        action_type,
        target_type,
        target_id,
        details,
        created_at,
        actor:actor_id(id, email, name, role, is_staph)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(days));
      query = query.gte("created_at", cutoff.toISOString());
    }

    const { data: logs, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching logs:", error);
      return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
