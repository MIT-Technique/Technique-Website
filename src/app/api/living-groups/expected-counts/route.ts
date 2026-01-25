import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "../../../../lib/auth/session";

interface UpdateExpectedCountRequest {
  sectionName?: string | null; // null for FSILG total
  expectedCount: number;
}

// GET /api/living-groups/expected-counts
// Get expected counts for the leader's living group
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "living_group") {
      return NextResponse.json(
        { error: "Only living group accounts can view expected counts" },
        { status: 403 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the leader's living group
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id, name, living_group_type, dorm_sections")
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Get expected counts
    const { data: expectedCounts, error } = await supabase
      .from("section_expected_counts")
      .select(`
        id,
        section_name,
        expected_count,
        updated_at
      `)
      .eq("living_group_id", livingGroup.id);

    if (error) {
      console.error("Get expected counts error:", error);
      return NextResponse.json(
        { error: "Failed to get expected counts" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      livingGroup,
      expectedCounts: expectedCounts || [],
    });
  } catch (error) {
    console.error("Get expected counts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/living-groups/expected-counts
// Update expected count for a section (or total for FSILG)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "living_group") {
      return NextResponse.json(
        { error: "Only living group accounts can update expected counts" },
        { status: 403 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body: UpdateExpectedCountRequest = await request.json();
    const { sectionName, expectedCount } = body;

    if (typeof expectedCount !== "number" || expectedCount < 0) {
      return NextResponse.json(
        { error: "Expected count must be a non-negative number" },
        { status: 400 }
      );
    }

    // Get the leader's living group
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id, name, living_group_type, dorm_sections")
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // For dorms, validate section belongs to this dorm
    if (livingGroup.living_group_type === "dorm" && sectionName) {
      const dormSections = livingGroup.dorm_sections || [];
      if (!dormSections.includes(sectionName)) {
        return NextResponse.json(
          { error: "Invalid section for this dorm" },
          { status: 400 }
        );
      }
    }

    // For FSILGs, section should be null
    if (livingGroup.living_group_type === "fsilg" && sectionName) {
      return NextResponse.json(
        { error: "FSILGs do not have sections" },
        { status: 400 }
      );
    }

    // Upsert the expected count
    const { data: result, error: upsertError } = await supabase
      .from("section_expected_counts")
      .upsert(
        {
          living_group_id: livingGroup.id,
          section_name: sectionName || null,
          expected_count: expectedCount,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        },
        {
          onConflict: "living_group_id,section_name",
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Update expected count error:", upsertError);
      return NextResponse.json(
        { error: "Failed to update expected count" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      expectedCount: result,
    });
  } catch (error) {
    console.error("Update expected count error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
