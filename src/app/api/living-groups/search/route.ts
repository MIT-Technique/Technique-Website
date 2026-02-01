import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "../../../../lib/auth/session";

// GET /api/living-groups/search?q=baker&type=dorm
// Search living groups by name
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.isLoggedIn || !session?.userInfo?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type"); // 'dorm' or 'fsilg' or null for all

    let supabaseQuery = supabase
      .from("living_groups")
      .select(`
        id,
        name,
        living_group_type,
        status,
        user:users!living_groups_user_id_fkey(id, email)
      `)
      .eq("status", "active");

    if (query) {
      supabaseQuery = supabaseQuery.ilike("name", `%${query}%`);
    }

    if (type === "dorm" || type === "fsilg") {
      supabaseQuery = supabaseQuery.eq("living_group_type", type);
    }

    const { data: livingGroups, error } = await supabaseQuery
      .order("name", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Search living groups error:", error);
      return NextResponse.json(
        { error: "Failed to search living groups" },
        { status: 500 }
      );
    }

    return NextResponse.json({ livingGroups: livingGroups || [] });
  } catch (error) {
    console.error("Search living groups error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
