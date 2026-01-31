import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: candids, error: candidsError } = await supabase
      .from('community_candids')
      .select('*')
      .order('created_at', { ascending: false });

    if (candidsError) {
      console.error("Error fetching candids:", candidsError);
      return NextResponse.json({ error: "Failed to fetch candids" }, { status: 500 });
    }

    const { data: studentWork, error: swError } = await supabase
      .from('student_work_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (swError) {
      console.error("Error fetching student work:", swError);
      return NextResponse.json({ error: "Failed to fetch student work" }, { status: 500 });
    }

    const uniqueEvents = Array.from(new Set((candids || []).map(c => c.event_name).filter(Boolean)));

    let candidImageCount = 0;
    let studentWorkImageCount = 0;
    try {
      const { data: cFiles } = await supabase.storage.from('community-candids').list('', { limit: 10000 });
      candidImageCount = (cFiles || []).filter(f => f.name && !f.name.endsWith('/')).length;
    } catch (e) { console.error("Error listing candid images:", e); }

    try {
      const { data: swFiles } = await supabase.storage.from('student-work-images').list('', { limit: 10000 });
      studentWorkImageCount = (swFiles || []).filter(f => f.name && !f.name.endsWith('/')).length;
    } catch (e) { console.error("Error listing student work images:", e); }

    return NextResponse.json({
      candids: (candids || []).map(c => ({
        id: c.id,
        email: c.email,
        eventName: c.event_name,
        eventDescription: c.event_description,
        imageCount: (c.image_urls || []).length,
      })),
      studentWork: (studentWork || []).map(sw => ({
        id: sw.id,
        email: sw.email,
        projectTitle: sw.project_title,
        members: sw.members || [],
        imageCount: (sw.image_urls || []).length,
      })),
      stats: {
        totalCandids: (candids || []).length,
        uniqueEvents,
        totalStudentWork: (studentWork || []).length,
      },
      candidImageCount,
      studentWorkImageCount,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
