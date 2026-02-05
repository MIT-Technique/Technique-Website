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

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20MB" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get club
    let { data: club } = await supabase
      .from('clubs')
      .select('id, name')
      .eq('user_id', user.id)
      .single();

    // If club doesn't exist, create it (fallback for incomplete signup)
    if (!club) {
      const { data: newClub, error: createError } = await supabase
        .from('clubs')
        .insert({
          user_id: user.id,
          name: user.email?.split('@')[0] || 'Unknown Club',
          approval_status: 'pending',
        })
        .select('id, name')
        .single();

      if (createError) {
        console.error("Create club error:", createError);
        return NextResponse.json(
          { error: "Failed to create club record" },
          { status: 500 }
        );
      }
      club = newClub;
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const safeName = (club.name || club.id).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const suffix = slot === '1' ? '' : `_${slot}`;
    const fileName = `clubs/${safeName}/Candid${suffix}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
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

    // Get public URL with cache-busting parameter
    const { data: urlData } = supabase.storage
      .from('club-images')
      .getPublicUrl(fileName);

    // Add timestamp to bust browser cache on re-uploads
    const publicUrlWithCache = `${urlData.publicUrl}?t=${Date.now()}`;

    // Update club record
    const imageField = `candid_image_${slot}`;
    const { error: updateError } = await supabase
      .from('clubs')
      .update({
        [imageField]: publicUrlWithCache,
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
    let { data: club } = await supabase
      .from('clubs')
      .select('id, candid_image_1, candid_image_2, candid_image_3')
      .eq('user_id', user.id)
      .single();

    // If club doesn't exist, create it (fallback for incomplete signup)
    if (!club) {
      const { data: newClub, error: createError } = await supabase
        .from('clubs')
        .insert({
          user_id: user.id,
          name: user.email?.split('@')[0] || 'Unknown Club',
          approval_status: 'pending',
        })
        .select('id, candid_image_1, candid_image_2, candid_image_3')
        .single();

      if (createError) {
        console.error("Create club error:", createError);
        return NextResponse.json(
          { error: "Failed to create club record" },
          { status: 500 }
        );
      }
      club = newClub;
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
