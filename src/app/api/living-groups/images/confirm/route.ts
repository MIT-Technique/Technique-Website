import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== 'living_group') {
      return NextResponse.json(
        { error: "Only living group accounts can upload images" },
        { status: 403 }
      );
    }

    const { path, sectionName, livingGroupId } = await request.json();

    if (!path || !sectionName || !livingGroupId) {
      return NextResponse.json(
        { error: "Missing path, sectionName, or livingGroupId" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify the living group belongs to this user
    const { data: livingGroup } = await supabase
      .from('living_groups')
      .select('id, section_images')
      .eq('id', livingGroupId)
      .eq('user_id', user.id)
      .single();

    if (!livingGroup) {
      return NextResponse.json(
        { error: "Living group not found or unauthorized" },
        { status: 403 }
      );
    }

    // Get public URL with cache-busting parameter
    const { data: urlData } = supabase.storage
      .from('living-group-images')
      .getPublicUrl(path);

    const publicUrlWithCache = `${urlData.publicUrl}?t=${Date.now()}`;

    // Update section_images JSONB
    const sectionImages = livingGroup.section_images || {};
    sectionImages[sectionName] = publicUrlWithCache;

    const { error: updateError } = await supabase
      .from('living_groups')
      .update({
        section_images: sectionImages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', livingGroupId);

    if (updateError) {
      console.error("Update living group error:", updateError);
      return NextResponse.json(
        { error: "Failed to update living group with image URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: publicUrlWithCache,
      section_name: sectionName,
    });
  } catch (error) {
    console.error("Confirm upload error:", error);
    return NextResponse.json(
      { error: "Failed to confirm upload" },
      { status: 500 }
    );
  }
}
