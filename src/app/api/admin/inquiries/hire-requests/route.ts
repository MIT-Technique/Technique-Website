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
    const { data: requests, error } = await supabase
      .from('hire_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching hire requests:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const withPhotos = requests?.filter(r => r.photo_urls?.length > 0).length || 0;

    // Calculate average turnaround: photos_submitted_at - event_date (in days)
    const turnaroundDays: number[] = [];
    for (const r of (requests || [])) {
      if (r.photos_submitted_at && r.event_date) {
        const eventDate = new Date(r.event_date + "T00:00:00");
        const submittedAt = new Date(r.photos_submitted_at);
        const diffMs = submittedAt.getTime() - eventDate.getTime();
        if (diffMs >= 0) {
          turnaroundDays.push(diffMs / (1000 * 60 * 60 * 24));
        }
      }
    }
    const avgTurnaround = turnaroundDays.length > 0
      ? Math.round((turnaroundDays.reduce((a, b) => a + b, 0) / turnaroundDays.length) * 10) / 10
      : null;

    const stats = {
      total: requests?.length || 0,
      pending: requests?.filter(r => r.status === 'pending').length || 0,
      claimed: requests?.filter(r => r.status === 'claimed').length || 0,
      completed: requests?.filter(r => r.status === 'completed').length || 0,
      cancelled: requests?.filter(r => r.status === 'cancelled').length || 0,
      withPhotos,
      avgTurnaround,
    };

    return NextResponse.json({ requests: requests || [], stats });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
