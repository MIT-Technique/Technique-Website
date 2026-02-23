import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getSession, getCurrentUser } from "../../../../lib/auth/session";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_PHOTOS = 10;
const BUCKET_NAME = "hire-event-photos";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const user = await getCurrentUser();

    const isAdmin = user?.role === "admin";
    const isPhotographer = !!session.photographerEmail;

    if (!isAdmin && !isPhotographer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const claimedByEmail = session.photographerEmail || user?.email;

    const formData = await request.formData();
    const requestId = formData.get("requestId") as string | null;

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify request exists and photographer owns it
    const { data: existing, error: findError } = await supabase
      .from("hire_requests")
      .select("id, status, claimed_by, photo_urls")
      .eq("id", requestId)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (!isAdmin && existing.claimed_by !== claimedByEmail) {
      return NextResponse.json({ error: "You can only upload photos to requests you claimed" }, { status: 403 });
    }

    if (existing.status !== "claimed" && existing.status !== "completed") {
      return NextResponse.json({ error: "Request must be claimed or completed" }, { status: 400 });
    }

    // Collect files
    const files: File[] = [];
    for (let i = 1; i <= MAX_PHOTOS; i++) {
      const file = formData.get(`file${i}`) as File | null;
      if (file && file.size > 0) files.push(file);
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
    }

    const currentPhotos = existing.photo_urls || [];
    if (currentPhotos.length + files.length > MAX_PHOTOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS} photos allowed. You have ${currentPhotos.length} already.` },
        { status: 400 }
      );
    }

    // Validate files
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only JPEG, PNG, WebP, and GIF are allowed` },
          { status: 400 }
        );
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size is 25MB` },
          { status: 400 }
        );
      }
    }

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find((b: { name: string }) => b.name === BUCKET_NAME)) {
      await supabase.storage.createBucket(BUCKET_NAME, { public: true, fileSizeLimit: MAX_SIZE });
    }

    const timestamp = Date.now();
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `${requestId}/${timestamp}_${i + 1}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
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
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      uploadedUrls.push(urlData.publicUrl);
    }

    const allPhotoUrls = [...currentPhotos, ...uploadedUrls];
    const isFirstUpload = currentPhotos.length === 0;

    const updateData: Record<string, unknown> = {
      photo_urls: allPhotoUrls,
      updated_at: new Date().toISOString(),
    };

    if (isFirstUpload) {
      updateData.photos_submitted_at = new Date().toISOString();
    }

    // Auto-transition to completed if still claimed
    if (existing.status === "claimed") {
      updateData.status = "completed";
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("hire_requests")
      .update(updateData)
      .eq("id", requestId);

    if (updateError) {
      console.error("Error updating request:", updateError);
      return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      allPhotoUrls,
      count: allPhotoUrls.length,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json({ error: "Failed to upload photos" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    const user = await getCurrentUser();

    const isAdmin = user?.role === "admin";
    const isPhotographer = !!session.photographerEmail;

    if (!isAdmin && !isPhotographer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const claimedByEmail = session.photographerEmail || user?.email;

    const { requestId, photoUrl } = await request.json();

    if (!requestId || !photoUrl) {
      return NextResponse.json({ error: "Request ID and photo URL are required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: existing, error: findError } = await supabase
      .from("hire_requests")
      .select("id, claimed_by, photo_urls, photos_submitted_at")
      .eq("id", requestId)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (!isAdmin && existing.claimed_by !== claimedByEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Remove from storage
    const match = photoUrl.match(new RegExp(`/${BUCKET_NAME}/(.+)$`));
    if (match) {
      await supabase.storage.from(BUCKET_NAME).remove([decodeURIComponent(match[1])]);
    }

    // Filter out the deleted URL
    const updatedUrls = (existing.photo_urls || []).filter((url: string) => url !== photoUrl);

    const updateData: Record<string, unknown> = {
      photo_urls: updatedUrls,
      updated_at: new Date().toISOString(),
    };

    // Clear photos_submitted_at if no photos left
    if (updatedUrls.length === 0) {
      updateData.photos_submitted_at = null;
    }

    const { error: updateError } = await supabase
      .from("hire_requests")
      .update(updateData)
      .eq("id", requestId);

    if (updateError) {
      console.error("Error updating request:", updateError);
      return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
    }

    return NextResponse.json({ success: true, photoUrls: updatedUrls });
  } catch (error) {
    console.error("Photo delete error:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
