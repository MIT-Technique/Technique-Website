import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../../lib/supabase/admin";

const ALLOWED_BUCKETS = ['club-images', 'living-group-images', 'sports-images', 'community-candids', 'student-work-images', 'senior-photos'];

async function listAllFiles(supabase: ReturnType<typeof createAdminClient>, bucket: string, prefix: string = ''): Promise<string[]> {
  const paths: string[] = [];
  const { data: items } = await supabase.storage.from(bucket).list(prefix, { limit: 10000 });

  for (const item of (items || [])) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.metadata) {
      // It's a file
      paths.push(fullPath);
    } else {
      // It's a folder, recurse
      const subPaths = await listAllFiles(supabase, bucket, fullPath);
      paths.push(...subPaths);
    }
  }

  return paths;
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

    // Generate signed URLs (1 hour expiry)
    const signedUrls: { path: string; url: string }[] = [];
    for (const path of filePaths) {
      const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
      if (data?.signedUrl) {
        signedUrls.push({ path, url: data.signedUrl });
      }
    }

    return NextResponse.json({ files: signedUrls });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
