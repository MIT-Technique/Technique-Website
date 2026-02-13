import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== 'club') {
      return NextResponse.json(
        { error: "Only club accounts can upload images" },
        { status: 403 }
      );
    }

    const { path, slot, clubId } = await request.json();

    if (!path || !slot || !clubId) {
      return NextResponse.json(
        { error: "Missing path, slot, or clubId" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify the club belongs to this user
    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('id', clubId)
      .eq('user_id', user.id)
      .single();

    if (!club) {
      return NextResponse.json(
        { error: "Club not found or unauthorized" },
        { status: 403 }
      );
    }

    // Get public URL with cache-busting parameter
    const { data: urlData } = supabase.storage
      .from('club-images')
      .getPublicUrl(path);

    const publicUrlWithCache = `${urlData.publicUrl}?t=${Date.now()}`;

    // Update club record
    const imageField = `candid_image_${slot}`;
    const { error: updateError } = await supabase
      .from('clubs')
      .update({
        [imageField]: publicUrlWithCache,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clubId);

    if (updateError) {
      console.error("Update club error:", updateError);
      return NextResponse.json(
        { error: "Failed to update club with image URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: publicUrlWithCache,
      slot,
    });
  } catch (error) {
    console.error("Confirm upload error:", error);
    return NextResponse.json(
      { error: "Failed to confirm upload" },
      { status: 500 }
    );
  }
}
