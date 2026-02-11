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

    if (user.role !== 'sports') {
      return NextResponse.json(
        { error: "Only sports accounts can upload images" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const slot = formData.get('slot') as string;
    const team = formData.get('team') as string | null; // 'mens', 'womens', or null

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

    if (team && !['mens', 'womens'].includes(team)) {
      return NextResponse.json(
        { error: "Invalid team. Must be 'mens' or 'womens'" },
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

    // Get sports team
    const { data: sports } = await supabase
      .from('sports')
      .select('id, name')
      .eq('user_id', user.id)
      .single();

    if (!sports) {
      return NextResponse.json(
        { error: "Sports team not found" },
        { status: 404 }
      );
    }

    // Build storage path: sports/{safeName}/{team}/Candid{suffix}.{ext}
    const fileExt = file.name.split('.').pop();
    const safeName = (sports.name || sports.id).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const suffix = slot === '1' ? '' : `_${slot}`;
    const teamFolder = team ? `${team}/` : '';
    const bucketName = 'sports-images';
    const fileName = `sports/${safeName}/${teamFolder}Candid${suffix}.${fileExt}`;

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find((b: { name: string }) => b.name === bucketName)) {
      await supabase.storage.createBucket(bucketName, { public: true, fileSizeLimit: 20 * 1024 * 1024 });
    }

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
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
      .from(bucketName)
      .getPublicUrl(fileName);

    // Add timestamp to bust browser cache on re-uploads
    const publicUrlWithCache = `${urlData.publicUrl}?t=${Date.now()}`;

    // Determine which DB column to update
    const teamPrefix = team ? `${team}_` : '';
    const imageField = `${teamPrefix}candid_image_${slot}`;

    const { error: updateError } = await supabase
      .from('sports')
      .update({
        [imageField]: publicUrlWithCache,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sports.id);

    if (updateError) {
      console.error("Update sports error:", updateError);
      return NextResponse.json(
        { error: "Failed to update sports with image URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: publicUrlWithCache,
      slot,
      team: team || null,
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

    if (user.role !== 'sports') {
      return NextResponse.json(
        { error: "Only sports accounts can delete images" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const slot = searchParams.get('slot');
    const team = searchParams.get('team'); // 'mens', 'womens', or null

    if (!slot || !['1', '2', '3'].includes(slot)) {
      return NextResponse.json(
        { error: "Invalid slot. Must be 1, 2, or 3" },
        { status: 400 }
      );
    }

    if (team && !['mens', 'womens'].includes(team)) {
      return NextResponse.json(
        { error: "Invalid team. Must be 'mens' or 'womens'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get sports with current image URL
    const teamPrefix = team ? `${team}_` : '';
    const imageField = `${teamPrefix}candid_image_${slot}`;

    const { data: sports } = await supabase
      .from('sports')
      .select('id, candid_image_1, candid_image_2, candid_image_3, mens_candid_image_1, mens_candid_image_2, mens_candid_image_3, womens_candid_image_1, womens_candid_image_2, womens_candid_image_3')
      .eq('user_id', user.id)
      .single();

    if (!sports) {
      return NextResponse.json(
        { error: "Sports team not found" },
        { status: 404 }
      );
    }

    // Delete file from storage
    const imageUrl = (sports as Record<string, unknown>)[imageField] as string | null;
    if (imageUrl) {
      // Strip query params before extracting path
      const urlWithoutParams = imageUrl.split('?')[0];
      const match = urlWithoutParams.match(/\/sports-images\/(.+)$/);
      if (match) {
        await supabase.storage.from('sports-images').remove([decodeURIComponent(match[1])]);
      }
    }

    // Clear the image URL in database
    const { error: updateError } = await supabase
      .from('sports')
      .update({
        [imageField]: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sports.id);

    if (updateError) {
      console.error("Update sports error:", updateError);
      return NextResponse.json(
        { error: "Failed to remove image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slot,
      team: team || null,
    });
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
