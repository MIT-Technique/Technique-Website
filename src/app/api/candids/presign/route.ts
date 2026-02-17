import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { isFormEffectivelyClosed } from "../../../../lib/utils/formStatus";

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    const { email, fileName, fileType, slot, eventName } = await request.json();

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

    if (!fileName || !slot) {
      return NextResponse.json(
        { error: "Missing fileName or slot" },
        { status: 400 }
      );
    }

    if (!['1', '2', '3'].includes(String(slot))) {
      return NextResponse.json(
        { error: "Invalid slot. Must be 1, 2, or 3" },
        { status: 400 }
      );
    }

    // Validate file type
    if (fileType && !ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if form is closed
    const { data: formSettings } = await supabase
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

    const timestamp = Date.now();
    const ext = fileName.split('.').pop() || 'jpg';

    // Use events/{eventName}/ structure like original upload route
    let path: string;
    if (eventName) {
      const safeName = eventName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      path = `events/${safeName}/${timestamp}_${slot}.${ext}`;
    } else {
      path = `misc/${timestamp}_${slot}.${ext}`;
    }

    const bucketName = 'community-candids';
    const maxFileSize = 25 * 1024 * 1024; // 25MB

    // Ensure bucket exists with correct file size limit
    const { data: buckets } = await supabase.storage.listBuckets();
    const existingBucket = buckets?.find((b: { name: string }) => b.name === bucketName);
    if (!existingBucket) {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: maxFileSize,
      });
    } else {
      // Update bucket to ensure file size limit is correct
      await supabase.storage.updateBucket(bucketName, {
        public: true,
        fileSizeLimit: maxFileSize,
      });
    }

    // Generate presigned upload URL (valid 120 seconds)
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(path, { upsert: true });

    if (error) {
      console.error("Presign error:", error);
      return NextResponse.json(
        { error: "Failed to generate upload URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      slot: String(slot),
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
