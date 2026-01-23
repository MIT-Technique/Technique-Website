import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "../../../../lib/auth/session";

// GET /api/living-groups/sections?dorm=Baker House
// Get sections for a specific dorm
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const searchParams = request.nextUrl.searchParams;
    const dormName = searchParams.get("dorm");

    if (!dormName) {
      return NextResponse.json(
        { error: "Dorm name is required" },
        { status: 400 }
      );
    }

    const { data: sections, error } = await supabase
      .from("dorm_sections")
      .select("id, dorm_name, section_name, display_order")
      .eq("dorm_name", dormName)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Get sections error:", error);
      return NextResponse.json(
        { error: "Failed to get sections" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sections: sections || [] });
  } catch (error) {
    console.error("Get sections error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/living-groups/sections/all
// Get all dorms with their sections (for listing available dorms)
