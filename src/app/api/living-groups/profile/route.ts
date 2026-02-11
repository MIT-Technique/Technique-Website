import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Get current user's living group profile
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    const { data: livingGroup, error } = await supabase
      .from('living_groups')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Get living group error:", error);
      return NextResponse.json(
        { error: "Failed to get living group profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ livingGroup });
  } catch (error) {
    console.error("Get living group error:", error);
    return NextResponse.json(
      { error: "Failed to get living group profile" },
      { status: 500 }
    );
  }
}

// PUT - Update living group profile (description only, for FSILGs)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'living_group') {
      return NextResponse.json(
        { error: "Only living group accounts can update profiles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const supabase = createAdminClient();

    // Get existing living group
    const { data: existingLG, error: fetchError } = await supabase
      .from('living_groups')
      .select('id, living_group_type')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingLG) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Only FSILGs can update description
    if (existingLG.living_group_type !== 'fsilg') {
      return NextResponse.json(
        { error: "Only FSILGs can update profile description" },
        { status: 403 }
      );
    }

    // Check if living group form is frozen
    const { data: formSettings } = await supabase
      .from('form_settings')
      .select('is_frozen')
      .eq('form_name', 'living_group_submission')
      .single();

    if (formSettings?.is_frozen) {
      return NextResponse.json(
        { error: "Living group submission form is currently frozen" },
        { status: 403 }
      );
    }

    // Validate and sanitize fields
    const allowedFields = ['description'];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Validate description word count (75 words max, same as clubs)
    if (typeof updateData.description === 'string') {
      const wordCount = updateData.description.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 75) {
        return NextResponse.json(
          { error: "Description must be 75 words or fewer" },
          { status: 400 }
        );
      }
    }

    // Update living group
    const { data, error } = await supabase
      .from('living_groups')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingLG.id)
      .select()
      .single();

    if (error) {
      console.error("Update living group error:", error);
      return NextResponse.json(
        { error: "Failed to update living group profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ livingGroup: data });
  } catch (error) {
    console.error("Update living group error:", error);
    return NextResponse.json(
      { error: "Failed to update living group profile" },
      { status: 500 }
    );
  }
}
