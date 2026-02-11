import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// POST - Upload a candid image
export async function POST(request: NextRequest) {
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
        { error: "Only living group accounts can upload images" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const slot = formData.get('slot') as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!['1', '2', '3', '4'].includes(slot)) {
      return NextResponse.json(
        { error: "Invalid slot. Must be 1, 2, 3, or 4" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20MB" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get living group
    const { data: livingGroup } = await supabase
      .from('living_groups')
      .select('id, name, living_group_type')
      .eq('user_id', user.id)
      .single();

    if (!livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const safeName = (livingGroup.name || livingGroup.id).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const suffix = slot === '1' ? '' : `_${slot}`;
    const livingGroupTypeFolder = livingGroup.living_group_type === 'fsilg' ? 'fsilgs' : 'dorms';

    // Both FSILGs and dorms get their own subfolder
    const fileName = `${livingGroupTypeFolder}/${safeName}/Candid${suffix}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('living-group-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get public URL with cache-busting parameter
    const { data: urlData } = supabase.storage
      .from('living-group-images')
      .getPublicUrl(fileName);

    const publicUrlWithCache = `${urlData.publicUrl}?t=${Date.now()}`;

    // Update living group record
    const imageField = `candid_image_${slot}`;
    const { error: updateError } = await supabase
      .from('living_groups')
      .update({
        [imageField]: publicUrlWithCache,
        updated_at: new Date().toISOString(),
      })
      .eq('id', livingGroup.id);

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
      slot,
    });
  } catch (error) {
    console.error("Upload image error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a candid image
export async function DELETE(request: NextRequest) {
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
        { error: "Only living group accounts can delete images" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const slot = searchParams.get('slot');

    if (!slot || !['1', '2', '3', '4'].includes(slot)) {
      return NextResponse.json(
        { error: "Invalid slot. Must be 1, 2, 3, or 4" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get living group with current image URL
    const imageField = `candid_image_${slot}`;
    const { data: livingGroup } = await supabase
      .from('living_groups')
      .select('id, candid_image_1, candid_image_2, candid_image_3, candid_image_4')
      .eq('user_id', user.id)
      .single();

    if (!livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Delete file from storage
    const imageUrl = (livingGroup as Record<string, unknown>)[imageField] as string | null;
    if (imageUrl) {
      const urlWithoutParams = imageUrl.split('?')[0];
      const match = urlWithoutParams.match(/\/living-group-images\/(.+)$/);
      if (match) {
        await supabase.storage
          .from('living-group-images')
          .remove([decodeURIComponent(match[1])]);
      }
    }

    // Clear the image URL in database
    const { error: updateError } = await supabase
      .from('living_groups')
      .update({
        [imageField]: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', livingGroup.id);

    if (updateError) {
      console.error("Update living group error:", updateError);
      return NextResponse.json(
        { error: "Failed to remove image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slot,
    });
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
