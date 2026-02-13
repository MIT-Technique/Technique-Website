import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

const DEFAULT_SECTION_KEY = "__default__";

// POST - Upload a section image
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
    const sectionName = formData.get('section_name') as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!sectionName) {
      return NextResponse.json(
        { error: "No section name provided" },
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

    // Validate file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 25MB" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get living group
    const { data: livingGroup } = await supabase
      .from('living_groups')
      .select('id, name, living_group_type, section_images')
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
    const safeOrgName = (livingGroup.name || livingGroup.id).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const isDefaultSlot = sectionName === DEFAULT_SECTION_KEY;
    const bucketName = 'living-group-images';
    const subfolder = livingGroup.living_group_type === 'fsilg' ? 'fsilgs' : 'dorms';
    const fileName = isDefaultSlot
      ? `${subfolder}/${safeOrgName}/Candid.${fileExt}`
      : `${subfolder}/${safeOrgName}/${sectionName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}_Candid.${fileExt}`;

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

    // Update section_images JSONB
    const sectionImages = livingGroup.section_images || {};
    sectionImages[sectionName] = publicUrlWithCache;

    const { error: updateError } = await supabase
      .from('living_groups')
      .update({
        section_images: sectionImages,
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
      section_name: sectionName,
    });
  } catch (error) {
    console.error("Upload image error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a section image
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
    const sectionName = searchParams.get('section_name');

    if (!sectionName) {
      return NextResponse.json(
        { error: "No section name provided" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get living group
    const { data: livingGroup } = await supabase
      .from('living_groups')
      .select('id, section_images')
      .eq('user_id', user.id)
      .single();

    if (!livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Delete file from storage
    const sectionImages = livingGroup.section_images || {};
    const imageUrl = sectionImages[sectionName];
    if (imageUrl) {
      // Strip query params before extracting path
      const urlWithoutParams = imageUrl.split('?')[0];
      const match = urlWithoutParams.match(/\/living-group-images\/(.+)$/);
      if (match) {
        await supabase.storage.from('living-group-images').remove([decodeURIComponent(match[1])]);
      }
    }

    // Remove section from JSONB
    delete sectionImages[sectionName];

    const { error: updateError } = await supabase
      .from('living_groups')
      .update({
        section_images: sectionImages,
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
      section_name: sectionName,
    });
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
