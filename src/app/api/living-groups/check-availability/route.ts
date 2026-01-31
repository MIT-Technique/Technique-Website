import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/living-groups/check-availability
// Returns list of dorm names that are already registered (for graying out in signup dropdown)
// No auth required - this is used on the signup form
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all registered dorm names
    const { data: livingGroups, error } = await supabase
      .from("living_groups")
      .select("name")
      .eq("living_group_type", "dorm");

    if (error) {
      console.error("Check availability error:", error);
      return NextResponse.json(
        { error: "Failed to check availability" },
        { status: 500 }
      );
    }

    const takenDorms = (livingGroups || []).map((lg) => lg.name);

    return NextResponse.json({ takenDorms });
  } catch (error) {
    console.error("Check availability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
