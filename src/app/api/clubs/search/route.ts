import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Search approved clubs by name
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    const supabase = createAdminClient();

    // Search approved clubs with leaders (discoverable clubs only)
    let queryBuilder = supabase
      .from('clubs')
      .select('id, name, description')
      .eq('has_leader', true)
      .order('name');

    if (query) {
      queryBuilder = queryBuilder.ilike('name', `%${query}%`);
    }

    const { data: clubs, error } = await queryBuilder.limit(20);

    if (error) {
      console.error("Search clubs error:", error);
      return NextResponse.json(
        { error: "Failed to search clubs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ clubs });
  } catch (error) {
    console.error("Search clubs error:", error);
    return NextResponse.json(
      { error: "Failed to search clubs" },
      { status: 500 }
    );
  }
}
