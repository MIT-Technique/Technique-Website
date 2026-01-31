import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { createLog } from "../../../../lib/admin-logs";

async function emptyBucket(supabase: ReturnType<typeof createAdminClient>, bucket: string) {
  const prefixes = [''];
  const allFiles: string[] = [];

  while (prefixes.length > 0) {
    const prefix = prefixes.pop()!;
    const { data: items } = await supabase.storage.from(bucket).list(prefix, { limit: 10000 });
    if (!items) continue;

    for (const item of items) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) {
        allFiles.push(path);
      } else {
        prefixes.push(path);
      }
    }
  }

  if (allFiles.length > 0) {
    // Supabase remove has a limit, batch in groups of 1000
    for (let i = 0; i < allFiles.length; i += 1000) {
      await supabase.storage.from(bucket).remove(allFiles.slice(i, i + 1000));
    }
  }

  return allFiles.length;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();
    const supabase = createAdminClient();

    switch (action) {
      case 'clear_booking_times': {
        await supabase.from('living_group_time_assignments').delete().gte('created_at', '1970-01-01');
        await supabase.from('time_proposals').delete().gte('created_at', '1970-01-01');
        await supabase.from('photoshoot_times').update({
          living_group_id: null,
          booked_at: null,
          booked_by: null,
        }).not('living_group_id', 'is', null);
        break;
      }

      case 'clear_senior_bios': {
        await supabase.from('senior_bios').delete().gte('created_at', '1970-01-01');
        break;
      }

      case 'clear_community_candids': {
        await emptyBucket(supabase, 'community-candids');
        await supabase.from('community_candids').delete().gte('created_at', '1970-01-01');
        break;
      }

      case 'clear_student_work': {
        await emptyBucket(supabase, 'student-work-images');
        await supabase.from('student_work_submissions').delete().gte('created_at', '1970-01-01');
        break;
      }

      case 'clear_org_images': {
        for (const bucket of ['club-images', 'living-group-images', 'sports-images']) {
          await emptyBucket(supabase, bucket);
        }
        await supabase.from('clubs').update({
          candid_image_1: null,
          candid_image_2: null,
          candid_image_3: null,
          updated_at: new Date().toISOString(),
        }).gte('created_at', '1970-01-01');
        await supabase.from('living_groups').update({
          section_images: {},
          updated_at: new Date().toISOString(),
        }).gte('created_at', '1970-01-01');
        await supabase.from('sports').update({
          candid_image_1: null,
          candid_image_2: null,
          candid_image_3: null,
          mens_candid_image_1: null,
          mens_candid_image_2: null,
          mens_candid_image_3: null,
          womens_candid_image_1: null,
          womens_candid_image_2: null,
          womens_candid_image_3: null,
          updated_at: new Date().toISOString(),
        }).gte('created_at', '1970-01-01');
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await createLog(user.id, `reset_${action}`, 'system', null, { action });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
