import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { isFormEffectivelyClosed } from "../../../lib/utils/formStatus";

export const dynamic = 'force-dynamic';

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

    const { data: setting, error: dbError } = await supabase
      .from("form_settings")
      .select("is_frozen, closes_at, reopens_at, unfrozen_at")
      .eq("form_name", formName)
      .single();

    if (dbError) {
      console.error("Error fetching form setting:", dbError);
    }

    const result = isFormEffectivelyClosed(setting);
    console.log(`[form-status] form=${formName} setting=${JSON.stringify(setting)} result=${result}`);

    return NextResponse.json({
      isFrozen: result,
    });
  } catch (error) {
    console.error("Error checking form status:", error);
    return NextResponse.json({ isFrozen: false });
  }
}
