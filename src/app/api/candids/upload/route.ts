import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { isFormEffectivelyClosed } from "../../../../lib/utils/formStatus";

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

// GET - Fetch existing candid submission by email
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email || !email.endsWith('@mit.edu')) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    const supabase = createAdminClient();
    const { data } = await supabase
      .from('community_candids')
      .select('event_name, event_type, event_description, image_urls')
      .eq('email', email)
      .single();

    return NextResponse.json({
      data: data ? {
        eventName: data.event_name || '',
        eventDescription: data.event_description || '',
        imageUrls: data.image_urls || [],
      } : null,
    });
  } catch (error) {
    console.error("Candids fetch error:", error);
    return NextResponse.json({ data: null }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if form is closed
    const supabaseCheck = createAdminClient();
    const { data: formSettings } = await supabaseCheck
      .from('form_settings')
      .select('is_frozen, closes_at, reopens_at, unfrozen_at')
      .eq('form_name', 'candids_form')
      .single();
    if (isFormEffectivelyClosed(formSettings)) {
      return NextResponse.json(
        { error: "This form is currently closed" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const email = formData.get('email') as string | null;
    const eventName = formData.get('organizationName') as string | null; // Legacy field name from UI
    const eventType = formData.get('organizationType') as string | null; // Legacy field name from UI
    const eventDescription = formData.get('eventDescription') as string | null;
    const keepImageUrlsJson = formData.get('keepImageUrls') as string | null;
    let keepImageUrls: string[] = [];
    try {
      keepImageUrls = keepImageUrlsJson ? JSON.parse(keepImageUrlsJson) : [];
    } catch {
      keepImageUrls = [];
    }

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

    if (files.length === 0 && keepImageUrls.length === 0) {
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
          { error: `File too large: ${file.name}. Maximum size is 20MB` },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    // Check for existing submission by this email — delete old images if re-submitting
    const { data: existing } = await supabase
      .from('community_candids')
      .select('id, image_urls')
      .eq('email', normalizedEmail)
      .single();

    if (existing?.image_urls?.length) {
      // Delete old images from storage, but keep ones the user wants to retain
      for (const url of existing.image_urls) {
        if (keepImageUrls.includes(url)) continue;
        // Try each bucket to find and delete the file (includes legacy bucket names)
        for (const bucket of ['community-candids', 'club-images', 'living-group-images', 'sports-images', 'anonymous-submissions']) {
          const match = url.match(new RegExp(`/${bucket}/(.+)$`));
          if (match) {
            await supabase.storage.from(bucket).remove([decodeURIComponent(match[1])]);
            break;
          }
        }
      }
    }

    const timestamp = Date.now();
    const uploadedUrls: string[] = [...keepImageUrls];

    // Determine bucket and path based on event
    const bucketName = 'community-candids';
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop() || 'jpg';
      let filePath: string;

      if (eventName) {
        const safeName = eventName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        filePath = `events/${safeName}/${timestamp}_${i + 1}.${fileExt}`;
      } else {
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
        .from('community_candids')
        .update({
          event_name: eventName || null,
          event_type: eventType || null,
          event_description: eventDescription?.trim() || null,
          image_urls: uploadedUrls,
          created_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('community_candids')
        .insert({
          email: normalizedEmail,
          event_name: eventName || null,
          event_type: eventType || null,
          event_description: eventDescription?.trim() || null,
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
