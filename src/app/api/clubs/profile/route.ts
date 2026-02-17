import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { isFormEffectivelyClosed } from "../../../../lib/utils/formStatus";

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

    // Check if club form is closed
    const { data: formSettings } = await supabase
      .from('form_settings')
      .select('is_frozen, closes_at, reopens_at, unfrozen_at')
      .eq('form_name', 'club_submission')
      .single();

    if (isFormEffectivelyClosed(formSettings)) {
      return NextResponse.json(
        { error: "Club submission form is currently closed" },
        { status: 403 }
      );
    }

    // Get existing club
    const { data: existingClub } = await supabase
      .from('clubs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Validate and sanitize fields
    // Note: 'name' is intentionally excluded - club names cannot be changed after creation
    const allowedFields = [
      'description',
      'member_list',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Validate description word count
    if (typeof updateData.description === 'string') {
      const wordCount = updateData.description.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 75) {
        return NextResponse.json(
          { error: "Description must be 75 words or fewer" },
          { status: 400 }
        );
      }
    }

    let data;
    let error;

    if (existingClub) {
      // Update existing club
      const result = await supabase
        .from('clubs')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingClub.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Create new club record for this user
      const result = await supabase
        .from('clubs')
        .insert({
          user_id: user.id,
          club_id: `CLUB-${Date.now()}`,
          ...updateData,
          has_leader: false,
          approval_status: 'pending',
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Update/create club error:", error);
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
