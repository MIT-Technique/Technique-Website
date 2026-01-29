import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "sports") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ email: user.email || "" });
  } catch (error) {
    console.error("Error fetching sports email:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "sports") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    const supabaseAdmin = createAdminClient();

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ email: email.trim() || null })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating email:", updateError);
      return NextResponse.json({ error: "Failed to update email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating sports email:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
