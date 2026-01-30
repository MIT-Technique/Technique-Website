import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    // Check if form is frozen
    const supabaseCheck = createAdminClient();
    const { data: formSettings } = await supabaseCheck
      .from('form_settings')
      .select('is_frozen')
      .eq('form_name', 'candids_form')
      .single();
    if (formSettings?.is_frozen) {
      return NextResponse.json(
        { error: "This form is currently closed" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const email = formData.get('email') as string | null;
    const organizationName = formData.get('organizationName') as string | null;
    const organizationType = formData.get('organizationType') as string | null;
    const livingGroupType = formData.get('livingGroupType') as string | null;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: "MIT email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith('@mit.edu')) {
      return NextResponse.json(
        { error: "Must be a valid @mit.edu email address" },
        { status: 400 }
      );
    }

    // Collect files (up to 3)
    const files: File[] = [];
    for (let i = 1; i <= 3; i++) {
      const file = formData.get(`file${i}`) as File | null;
      if (file && file.size > 0) files.push(file);
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    // Validate all files
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only JPEG, PNG, WebP, and GIF are allowed` },
          { status: 400 }
        );
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size is 5MB` },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    // Check for existing submission by this email — delete old images if re-submitting
    const { data: existing } = await supabase
      .from('anonymous_candid_submissions')
      .select('id, image_urls')
      .eq('email', normalizedEmail)
      .single();

    if (existing?.image_urls?.length) {
      // Delete old images from storage
      for (const url of existing.image_urls) {
        // Try each bucket to find and delete the file
        for (const bucket of ['club-images', 'living-group-images', 'sports-images', 'anonymous-submissions']) {
          const match = url.match(new RegExp(`/${bucket}/(.+)$`));
          if (match) {
            await supabase.storage.from(bucket).remove([decodeURIComponent(match[1])]);
            break;
          }
        }
      }
    }

    const timestamp = Date.now();
    const uploadedUrls: string[] = [];

    // Determine bucket and path based on organization
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop() || 'jpg';
      let bucketName: string;
      let filePath: string;

      if (organizationName && organizationType) {
        const safeName = organizationName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');

        switch (organizationType) {
          case 'club':
            bucketName = 'club-images';
            filePath = `clubs/${safeName}/Anonymous/${timestamp}_${i + 1}.${fileExt}`;
            break;
          case 'living_group': {
            bucketName = 'living-group-images';
            const subfolder = livingGroupType === 'fsilg' ? 'fsilgs' : 'dorms';
            filePath = `${subfolder}/${safeName}/Anonymous/${timestamp}_${i + 1}.${fileExt}`;
            break;
          }
          case 'sports':
            bucketName = 'sports-images';
            filePath = `sports/${safeName}/Anonymous/${timestamp}_${i + 1}.${fileExt}`;
            break;
          default:
            bucketName = 'anonymous-submissions';
            filePath = `misc/${timestamp}_${i + 1}.${fileExt}`;
        }
      } else {
        bucketName = 'anonymous-submissions';
        filePath = `misc/${timestamp}_${i + 1}.${fileExt}`;
      }

      // Ensure bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find((b: { name: string }) => b.name === bucketName)) {
        await supabase.storage.createBucket(bucketName, { public: true, fileSizeLimit: MAX_SIZE });
      }

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json(
          { error: `Failed to upload image ${i + 1}` },
          { status: 500 }
        );
      }

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      uploadedUrls.push(urlData.publicUrl);
    }

    // Upsert submission record by email
    if (existing) {
      await supabase
        .from('anonymous_candid_submissions')
        .update({
          organization_name: organizationName || null,
          organization_type: organizationType || null,
          image_urls: uploadedUrls,
          created_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('anonymous_candid_submissions')
        .insert({
          email: normalizedEmail,
          organization_name: organizationName || null,
          organization_type: organizationType || null,
          image_urls: uploadedUrls,
        });
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length,
    });
  } catch (error) {
    console.error("Candids upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}
