import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Get current user's club profile
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

    const { data: club, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Get club error:", error);
      return NextResponse.json(
        { error: "Failed to get club profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ club });
  } catch (error) {
    console.error("Get club error:", error);
    return NextResponse.json(
      { error: "Failed to get club profile" },
      { status: 500 }
    );
  }
}

// PUT - Update club profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'club') {
      return NextResponse.json(
        { error: "Only club accounts can update club profiles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const supabase = createAdminClient();

    // Check if club form is frozen
    const { data: formSettings } = await supabase
      .from('form_settings')
      .select('is_frozen')
      .eq('form_name', 'club_submission')
      .single();

    if (formSettings?.is_frozen) {
      return NextResponse.json(
        { error: "Club submission form is currently frozen" },
        { status: 403 }
      );
    }

    // Get existing club
    const { data: existingClub } = await supabase
      .from('clubs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!existingClub) {
      return NextResponse.json(
        { error: "Club profile not found" },
        { status: 404 }
      );
    }

    // Validate and sanitize fields
    const allowedFields = [
      'name',
      'description',
      'member_list',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Update club
    const { data, error } = await supabase
      .from('clubs')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingClub.id)
      .select()
      .single();

    if (error) {
      console.error("Update club error:", error);
      return NextResponse.json(
        { error: "Failed to update club profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ club: data });
  } catch (error) {
    console.error("Update club error:", error);
    return NextResponse.json(
      { error: "Failed to update club profile" },
      { status: 500 }
    );
  }
}
