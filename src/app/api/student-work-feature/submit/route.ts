import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string | null;
    const membersJson = formData.get('members') as string | null;
    const additionalCredits = formData.get('additionalCredits') as string | null;
    const projectTitle = formData.get('projectTitle') as string | null;
    const projectDescription = formData.get('projectDescription') as string | null;
    const links = formData.get('links') as string | null;

    // Validate required fields
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: "MIT email is required" }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith('@mit.edu')) {
      return NextResponse.json({ error: "Must be a valid @mit.edu email address" }, { status: 400 });
    }
    let members: string[] = [];
    try {
      members = membersJson ? JSON.parse(membersJson) : [];
    } catch {
      return NextResponse.json({ error: "Invalid members data" }, { status: 400 });
    }
    members = members.map((m: string) => m.trim()).filter(Boolean);
    if (members.length === 0) {
      return NextResponse.json({ error: "At least one member name is required" }, { status: 400 });
    }
    if (!projectTitle || !projectTitle.trim()) {
      return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    }
    if (!projectDescription || !projectDescription.trim()) {
      return NextResponse.json({ error: "Project description is required" }, { status: 400 });
    }

    // Collect files
    const files: File[] = [];
    for (let i = 1; i <= MAX_FILES; i++) {
      const file = formData.get(`file${i}`) as File | null;
      if (file && file.size > 0) files.push(file);
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
          { error: `File too large: ${file.name}. Maximum size is 10MB` },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    // Check for existing submission by email — upsert
    const { data: existing } = await supabase
      .from('student_work_submissions')
      .select('id, image_urls')
      .eq('email', normalizedEmail)
      .single();

    // Delete old images if re-submitting
    if (existing?.image_urls?.length) {
      const bucketName = 'student-work-images';
      for (const url of existing.image_urls) {
        const match = url.match(new RegExp(`/${bucketName}/(.+)$`));
        if (match) {
          await supabase.storage.from(bucketName).remove([decodeURIComponent(match[1])]);
        }
      }
    }

    const timestamp = Date.now();
    const uploadedUrls: string[] = [];
    const bucketName = 'student-work-images';

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find((b: { name: string }) => b.name === bucketName)) {
      await supabase.storage.createBucket(bucketName, { public: true, fileSizeLimit: MAX_SIZE });
    }

    // Upload files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop() || 'jpg';
      const safeTitle = projectTitle.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      const filePath = `projects/${safeTitle}/${timestamp}_${i + 1}.${fileExt}`;

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

    const record = {
      email: normalizedEmail,
      members,
      additional_credits: additionalCredits?.trim() || null,
      project_title: projectTitle.trim(),
      project_description: projectDescription.trim(),
      links: links?.trim() || null,
      image_urls: uploadedUrls,
      created_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from('student_work_submissions')
        .update(record)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('student_work_submissions')
        .insert(record);
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
    });
  } catch (error) {
    console.error("Student work submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit student work" },
      { status: 500 }
    );
  }
}
