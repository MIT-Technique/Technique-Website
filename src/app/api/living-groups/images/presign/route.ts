import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../lib/supabase/admin";

const DEFAULT_SECTION_KEY = "__default__";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== 'living_group') {
      return NextResponse.json(
        { error: "Only living group accounts can upload images" },
        { status: 403 }
      );
    }

    const { fileName, fileType, sectionName } = await request.json();

    if (!fileName || !sectionName) {
      return NextResponse.json(
        { error: "Missing fileName or sectionName" },
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

    // Get living group
    const { data: livingGroup } = await supabase
      .from('living_groups')
      .select('id, name, living_group_type')
      .eq('user_id', user.id)
      .single();

    if (!livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    const fileExt = fileName.split('.').pop();
    const safeOrgName = (livingGroup.name || livingGroup.id).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const isDefaultSlot = sectionName === DEFAULT_SECTION_KEY;
    const bucketName = 'living-group-images';
    const subfolder = livingGroup.living_group_type === 'fsilg' ? 'fsilgs' : 'dorms';
    const path = isDefaultSlot
      ? `${subfolder}/${safeOrgName}/Candid.${fileExt}`
      : `${subfolder}/${safeOrgName}/${sectionName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}_Candid.${fileExt}`;

    // Generate presigned upload URL (valid 120 seconds)
    // Note: The bucket must be created manually in Supabase with public access enabled
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
      livingGroupId: livingGroup.id,
      sectionName,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
