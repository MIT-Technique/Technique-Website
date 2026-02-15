import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createLog } from "../../../../lib/admin-logs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("form_settings")
      .select("config_value")
      .eq("form_name", "hire_hourly_rate")
      .single();

    if (error || !data) {
      return NextResponse.json({ rate: 85 });
    }

    const rate = data.config_value?.rate ?? 85;
    return NextResponse.json({ rate });
  } catch (error) {
    console.error("Error fetching hire rate:", error);
    return NextResponse.json({ error: "Failed to fetch rate" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { rate } = await request.json();
    if (typeof rate !== "number" || rate <= 0) {
      return NextResponse.json({ error: "Invalid rate" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("form_settings")
      .upsert(
        { form_name: "hire_hourly_rate", config_value: { rate } },
        { onConflict: "form_name" }
      );

    if (error) {
      console.error("Error updating hire rate:", error);
      return NextResponse.json({ error: "Failed to update rate" }, { status: 500 });
    }

    await createLog(user.id, "update_hire_rate", "form_settings", null, { rate });

    return NextResponse.json({ success: true, rate });
  } catch (error) {
    console.error("Error updating hire rate:", error);
    return NextResponse.json({ error: "Failed to update rate" }, { status: 500 });
  }
}
