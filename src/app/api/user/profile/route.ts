import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getSession } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { isFormEffectivelyClosed } from "../../../../lib/utils/formStatus";

// GET - Get current user profile
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const supabase = createAdminClient();

    // Check if bio form is closed (for staph)
    if (user.role === 'staph') {
      const { data: formSettings } = await supabase
        .from('form_settings')
        .select('is_frozen, closes_at, reopens_at, unfrozen_at')
        .eq('form_name', 'senior_bio')
        .single();

      if (isFormEffectivelyClosed(formSettings)) {
        return NextResponse.json(
          { error: "Senior bio form is currently closed" },
          { status: 403 }
        );
      }
    }

    // Validate and sanitize fields
    const allowedFields = [
      'name',
      'major',
      'second_major',
      'quote',
      'achievements',
      'school_year',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Validate quote length
    if (updateData.quote && typeof updateData.quote === 'string' && updateData.quote.length > 300) {
      return NextResponse.json(
        { error: "Quote must be 300 characters or less" },
        { status: 400 }
      );
    }

    // Update user
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error("Update profile error:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
