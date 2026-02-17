import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { isFormEffectivelyClosed } from "../../../lib/utils/formStatus";

// GET - Public endpoint to check if a specific form is closed
export async function GET(request: NextRequest) {
  try {
    const formName = request.nextUrl.searchParams.get("form");

    if (!formName) {
      return NextResponse.json(
        { error: "form parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: setting } = await supabase
      .from("form_settings")
      .select("is_frozen, closes_at, reopens_at, unfrozen_at, note")
      .eq("form_name", formName)
      .single();

    return NextResponse.json({
      isFrozen: isFormEffectivelyClosed(setting),
      note: setting?.note || null,
    });
  } catch (error) {
    console.error("Error checking form status:", error);
    return NextResponse.json({ isFrozen: false });
  }
}
