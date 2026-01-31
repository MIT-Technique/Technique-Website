import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { createLog } from "../../../../lib/admin-logs";

const VALID_ACCESS = ['clubs', 'living_groups', 'sports', 'activities', 'seniors'];

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, access } = await request.json();

    if (!userId || !Array.isArray(access)) {
      return NextResponse.json({ error: "userId and access array required" }, { status: 400 });
    }

    if (access.some((a: string) => !VALID_ACCESS.includes(a))) {
      return NextResponse.json({ error: "Invalid access value" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: targetUser } = await supabase
      .from('users')
      .select('email, is_staph')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from('users')
      .update({ access, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error("Error updating access:", error);
      return NextResponse.json({ error: "Failed to update access" }, { status: 500 });
    }

    await createLog(user.id, "access_change", "user", userId, {
      target_email: targetUser.email,
      access,
    });

    return NextResponse.json({ success: true, access });
  } catch (error) {
    console.error("Error updating access:", error);
    return NextResponse.json({ error: "Failed to update access" }, { status: 500 });
  }
}
