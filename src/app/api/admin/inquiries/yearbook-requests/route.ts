import { NextRequest, NextResponse } from "next/server";
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
      .from('yearbook_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching yearbook requests:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const stats = {
      total: requests?.length || 0,
      pending: requests?.filter(r => r.status === 'pending').length || 0,
      fulfilled: requests?.filter(r => r.status === 'fulfilled').length || 0,
      cancelled: requests?.filter(r => r.status === 'cancelled').length || 0,
    };

    return NextResponse.json({ requests: requests || [], stats });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await request.json();

    if (!id || !['pending', 'fulfilled', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('yearbook_requests')
      .update({
        status,
        status_updated_by: user.id,
        status_updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error("Error updating yearbook request:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
