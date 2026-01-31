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

    if (user.role !== 'club') {
      return NextResponse.json(
        { error: "Only club accounts can upload images" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const slot = formData.get('slot') as string; // '1', '2', or '3'

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!['1', '2', '3'].includes(slot)) {
      return NextResponse.json(
        { error: "Invalid slot. Must be 1, 2, or 3" },
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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get club
    const { data: club } = await supabase
      .from('clubs')
      .select('id, club_id, name')
      .eq('user_id', user.id)
      .single();

    if (!club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const safeName = (club.name || club.club_id).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const suffix = slot === '1' ? '' : `_${slot}`;
    const fileName = `clubs/${safeName}_Candid${suffix}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('club-images')
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

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('club-images')
      .getPublicUrl(fileName);

    // Update club record
    const imageField = `candid_image_${slot}`;
    const { error: updateError } = await supabase
      .from('clubs')
      .update({
        [imageField]: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', club.id);

    if (updateError) {
      console.error("Update club error:", updateError);
      return NextResponse.json(
        { error: "Failed to update club with image URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
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

    if (user.role !== 'club') {
      return NextResponse.json(
        { error: "Only club accounts can delete images" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const slot = searchParams.get('slot');

    if (!slot || !['1', '2', '3'].includes(slot)) {
      return NextResponse.json(
        { error: "Invalid slot. Must be 1, 2, or 3" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get club with current image URL
    const imageField = `candid_image_${slot}`;
    const { data: club } = await supabase
      .from('clubs')
      .select('id, candid_image_1, candid_image_2, candid_image_3')
      .eq('user_id', user.id)
      .single();

    if (!club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    // Delete file from storage
    const imageUrl = (club as Record<string, unknown>)[imageField] as string | null;
    if (imageUrl) {
      const match = imageUrl.match(/\/club-images\/(.+)$/);
      if (match) {
        await supabase.storage.from('club-images').remove([decodeURIComponent(match[1])]);
      }
    }

    // Clear the image URL in database
    const { error: updateError } = await supabase
      .from('clubs')
      .update({
        [imageField]: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', club.id);

    if (updateError) {
      console.error("Update club error:", updateError);
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
