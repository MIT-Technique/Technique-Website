import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { isFormEffectivelyClosed } from "../../../../lib/utils/formStatus";

// GET - Get current user's sports profile
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

    const { data: sports, error } = await supabase
      .from('sports')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Get sports error:", error);
      return NextResponse.json(
        { error: "Failed to get sports profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sports });
  } catch (error) {
    console.error("Get sports error:", error);
    return NextResponse.json(
      { error: "Failed to get sports profile" },
      { status: 500 }
    );
  }
}

// PUT - Update sports profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'sports') {
      return NextResponse.json(
        { error: "Only sports accounts can update sports profiles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const supabase = createAdminClient();

    // Check if sports form is closed
    const { data: formSettings } = await supabase
      .from('form_settings')
      .select('is_frozen, closes_at, reopens_at, unfrozen_at')
      .eq('form_name', 'sports_form')
      .single();

    if (isFormEffectivelyClosed(formSettings)) {
      return NextResponse.json(
        { error: "Sports submission form is currently closed" },
        { status: 403 }
      );
    }

    const allowedFields = [
      'description',
      'has_gender_teams',
      'achievement_summary',
      'mens_achievement_summary',
      'womens_achievement_summary',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from('sports')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error("Update sports error:", error);
      return NextResponse.json(
        { error: "Failed to update sports profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sports: data });
  } catch (error) {
    console.error("Update sports error:", error);
    return NextResponse.json(
      { error: "Failed to update sports profile" },
      { status: 500 }
    );
  }
}
