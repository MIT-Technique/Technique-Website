import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../../lib/supabase/admin";
import { createLog } from "../../../../../../lib/admin-logs";

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !(user.is_staph && user.access?.includes('living_groups')))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { livingGroupId, manuallyBooked } = await request.json();

    if (!livingGroupId || typeof manuallyBooked !== 'boolean') {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('living_groups')
      .update({
        manually_booked: manuallyBooked,
        manually_booked_by: manuallyBooked ? user.id : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', livingGroupId);

    if (error) {
      console.error("Error updating booking status:", error);
      return NextResponse.json({ error: "Failed to update booking status" }, { status: 500 });
    }

    await createLog(user.id, manuallyBooked ? 'manual_book_lg' : 'manual_unbook_lg', 'living_group', livingGroupId, {
      manuallyBooked,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
