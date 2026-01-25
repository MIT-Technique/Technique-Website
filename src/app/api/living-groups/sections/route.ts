import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "../../../../lib/auth/session";

// GET /api/living-groups/sections?livingGroupId=xxx
// Get sections for a specific living group (from dorm_sections column)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const searchParams = request.nextUrl.searchParams;
    const livingGroupId = searchParams.get("livingGroupId");

    if (!livingGroupId) {
      return NextResponse.json(
        { error: "Living group ID is required" },
        { status: 400 }
      );
    }

    // Get the living group's sections from the dorm_sections column
    const { data: livingGroup, error } = await supabase
      .from("living_groups")
      .select("id, name, living_group_type, dorm_sections")
      .eq("id", livingGroupId)
      .single();

    if (error || !livingGroup) {
      console.error("Get living group error:", error);
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Convert the text array to objects for consistency with frontend
    const sections = (livingGroup.dorm_sections || []).map((name: string, index: number) => ({
      name,
      displayOrder: index,
    }));

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("Get sections error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
