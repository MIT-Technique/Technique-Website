import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../../lib/supabase/admin";

const ALLOWED_BUCKETS = ['club-images', 'living-group-images', 'sports-images', 'community-candids', 'student-work-images', 'senior-photos'];

async function listAllFiles(supabase: ReturnType<typeof createAdminClient>, bucket: string, prefix: string = ''): Promise<string[]> {
  const { data: items } = await supabase.storage.from(bucket).list(prefix, { limit: 10000 });

  const files: string[] = [];
  const folderPromises: Promise<string[]>[] = [];

  for (const item of (items || [])) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.metadata) {
      files.push(fullPath);
    } else {
      folderPromises.push(listAllFiles(supabase, bucket, fullPath));
    }
  }

  const nestedFiles = await Promise.all(folderPromises);
  return files.concat(...nestedFiles);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !(user.is_staph && user.access?.length > 0))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bucket = request.nextUrl.searchParams.get('bucket');
    if (!bucket || !ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const filePaths = await listAllFiles(supabase, bucket);

    // Generate signed URLs in batch (1 hour expiry)
    let signedUrls: { path: string; url: string }[] = [];
    if (filePaths.length > 0) {
      const { data } = await supabase.storage.from(bucket).createSignedUrls(filePaths, 3600);
      signedUrls = (data || [])
        .filter(item => item.signedUrl)
        .map(item => ({ path: item.path!, url: item.signedUrl }));
    }

    return NextResponse.json({ files: signedUrls });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
