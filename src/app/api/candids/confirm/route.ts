import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { email, paths, eventName, eventDescription, keepImageUrls } = await request.json();

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

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      // If no new paths but we have keepImageUrls, just update the record
      if (!keepImageUrls || !Array.isArray(keepImageUrls) || keepImageUrls.length === 0) {
        return NextResponse.json(
          { error: "At least one image is required" },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    // Check if form is frozen
    const { data: formSettings } = await supabase
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

    // Check for existing submission by this email
    const { data: existing } = await supabase
      .from('community_candids')
      .select('id, image_urls')
      .eq('email', normalizedEmail)
      .single();

    // Delete old images that are not being kept
    const urlsToKeep = keepImageUrls || [];
    if (existing?.image_urls?.length) {
      for (const url of existing.image_urls) {
        if (urlsToKeep.includes(url)) continue;
        // Extract path from URL and delete
        const match = url.match(/\/community-candids\/(.+?)(?:\?|$)/);
        if (match) {
          await supabase.storage.from('community-candids').remove([decodeURIComponent(match[1])]);
        }
      }
    }

    // Get public URLs for newly uploaded files
    const uploadedUrls: string[] = [...urlsToKeep];
    for (const path of (paths || [])) {
      const { data: urlData } = supabase.storage
        .from('community-candids')
        .getPublicUrl(path);
      uploadedUrls.push(`${urlData.publicUrl}?t=${Date.now()}`);
    }

    // Upsert submission record by email
    if (existing) {
      const { error: updateError } = await supabase
        .from('community_candids')
        .update({
          event_name: eventName || null,
          event_type: 'event',
          event_description: eventDescription?.trim() || null,
          image_urls: uploadedUrls,
          created_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error("Update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update submission" },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabase
        .from('community_candids')
        .insert({
          email: normalizedEmail,
          event_name: eventName || null,
          event_type: 'event',
          event_description: eventDescription?.trim() || null,
          image_urls: uploadedUrls,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        return NextResponse.json(
          { error: "Failed to create submission" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length,
    });
  } catch (error) {
    console.error("Confirm upload error:", error);
    return NextResponse.json(
      { error: "Failed to confirm upload" },
      { status: 500 }
    );
  }
}
