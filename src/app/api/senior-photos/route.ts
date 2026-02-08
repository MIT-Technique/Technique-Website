import { NextRequest, NextResponse } from "next/server";
import { createAdminClientForSeniors } from "../../../lib/supabase/admin";

// GET - Fetch senior photo by email
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({
        data: { imageUrl: null }
      }, { status: 200 });
    }

    if (!email.endsWith('@mit.edu')) {
      return NextResponse.json(
        { error: "Must be a valid @mit.edu email address" },
        { status: 400 }
      );
    }

    const supabase = createAdminClientForSeniors();

    const { data: photo } = await supabase
      .from('senior_photos')
      .select('image_url')
      .eq('email', email)
      .single();

    return NextResponse.json({
      data: { imageUrl: photo?.image_url || null }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching senior photo:", error);
    return NextResponse.json(
      { error: "There was an error retrieving photo" },
      { status: 500 }
    );
  }
}

// POST - Upload senior photo
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const firstName = (formData.get('firstName') as string)?.trim() || '';
    const lastName = (formData.get('lastName') as string)?.trim() || '';

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!email.endsWith('@mit.edu')) {
      return NextResponse.json(
        { error: "Must be a valid @mit.edu email address" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
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

    const supabase = createAdminClientForSeniors();

    // Check if there's an existing photo to delete
    const { data: existingPhoto } = await supabase
      .from('senior_photos')
      .select('image_url')
      .eq('email', email)
      .single();

    // Delete old file from storage if it exists
    if (existingPhoto?.image_url) {
      const urlWithoutParams = existingPhoto.image_url.split('?')[0];
      const match = urlWithoutParams.match(/\/senior-photos\/(.+)$/);
      if (match) {
        await supabase.storage.from('senior-photos').remove([decodeURIComponent(match[1])]);
      }
    }

    // Upload to Supabase Storage with naming format: First_Last-kerb.ext
    const fileExt = file.name.split('.').pop();
    const kerb = email.split('@')[0];

    // Sanitize names: remove special characters, replace spaces with nothing
    const safeFirstName = firstName.replace(/[^a-zA-Z]/g, '');
    const safeLastName = lastName.replace(/[^a-zA-Z]/g, '');

    // Build filename: First_Last-kerb.ext or just kerb.ext if no names provided
    let fileName: string;
    if (safeFirstName && safeLastName) {
      fileName = `seniors/${safeFirstName}_${safeLastName}-${kerb}.${fileExt}`;
    } else {
      fileName = `seniors/${kerb}.${fileExt}`;
    }

    const { error: uploadError } = await supabase.storage
      .from('senior-photos')
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
      .from('senior-photos')
      .getPublicUrl(fileName);

    const publicUrlWithCache = `${urlData.publicUrl}?t=${Date.now()}`;

    // Upsert senior_photos record
    const { error: upsertError } = await supabase
      .from('senior_photos')
      .upsert({
        email,
        image_url: publicUrlWithCache,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return NextResponse.json(
        { error: "Failed to save photo record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: publicUrlWithCache,
    });
  } catch (error) {
    console.error("Upload senior photo error:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}

// DELETE - Remove senior photo
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!email.endsWith('@mit.edu')) {
      return NextResponse.json(
        { error: "Must be a valid @mit.edu email address" },
        { status: 400 }
      );
    }

    const supabase = createAdminClientForSeniors();

    // Get existing photo URL
    const { data: existingPhoto } = await supabase
      .from('senior_photos')
      .select('image_url')
      .eq('email', email)
      .single();

    // Delete file from storage if it exists
    if (existingPhoto?.image_url) {
      const urlWithoutParams = existingPhoto.image_url.split('?')[0];
      const match = urlWithoutParams.match(/\/senior-photos\/(.+)$/);
      if (match) {
        await supabase.storage.from('senior-photos').remove([decodeURIComponent(match[1])]);
      }
    }

    // Update record to clear image_url
    const { error: updateError } = await supabase
      .from('senior_photos')
      .update({
        image_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to remove photo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete senior photo error:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
