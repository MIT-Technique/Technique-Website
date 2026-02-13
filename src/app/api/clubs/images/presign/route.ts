import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== 'club') {
      return NextResponse.json(
        { error: "Only club accounts can upload images" },
        { status: 403 }
      );
    }

    const { fileName, fileType, slot } = await request.json();

    if (!fileName || !slot) {
      return NextResponse.json(
        { error: "Missing fileName or slot" },
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
    if (fileType && !allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" },
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

    // If club doesn't exist, create it
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

    const safeName = (club.name || club.id).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = fileName.split('.').pop();
    const suffix = slot === '1' ? '' : `_${slot}`;
    const path = `clubs/${safeName}/Candid${suffix}.${ext}`;

    // Generate presigned upload URL (valid 120 seconds)
    const { data, error } = await supabase.storage
      .from('club-images')
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
      clubId: club.id,
      slot,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
