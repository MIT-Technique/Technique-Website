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

    const stats = {
      total: requests?.length || 0,
      pending: requests?.filter(r => r.status === 'pending').length || 0,
      claimed: requests?.filter(r => r.status === 'claimed').length || 0,
      completed: requests?.filter(r => r.status === 'completed').length || 0,
      cancelled: requests?.filter(r => r.status === 'cancelled').length || 0,
    };

    return NextResponse.json({ requests: requests || [], stats });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
