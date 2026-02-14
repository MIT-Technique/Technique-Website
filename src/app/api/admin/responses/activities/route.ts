import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !(user.is_staph && user.access?.includes('activities')))) {
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

    const candidImageCount = (candids || []).reduce((sum, c) => sum + (c.image_urls || []).length, 0);
    const studentWorkImageCount = (studentWork || []).reduce((sum, sw) => sum + (sw.image_urls || []).length, 0);

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
