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
    const offset = page * limit;

    // Fetch logs with actor info
    const { data: logs, error, count } = await supabase
      .from("admin_logs")
      .select(
        `
        id,
        action_type,
        target_type,
        target_id,
        details,
        created_at,
        actor:users!admin_logs_actor_id_fkey(id, email, first_name, last_name, role, is_staph)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

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

// Helper function to create a log entry (exported for use in other routes)
export async function createLog(
  actorId: string,
  actionType: string,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown>
) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("admin_logs").insert({
    actor_id: actorId,
    action_type: actionType,
    target_type: targetType,
    target_id: targetId,
    details,
  });

  if (error) {
    console.error("Error creating log:", error);
  }
}
