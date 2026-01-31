import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only living group accounts can access this
    if (user.role !== "living_group") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const livingGroupId = searchParams.get("livingGroupId");

    if (!livingGroupId) {
      return NextResponse.json({ error: "Living group ID required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Get the living group's user email - verify ownership
    const { data: livingGroup, error } = await supabaseAdmin
      .from("living_groups")
      .select("user_id, users!living_groups_user_id_fkey(email)")
      .eq("id", livingGroupId)
      .eq("user_id", user.id)
      .single();

    if (error || !livingGroup) {
      return NextResponse.json({ error: "Living group not found" }, { status: 404 });
    }

    const email = (livingGroup.users as any)?.email || "";

    return NextResponse.json({ email });
  } catch (error) {
    console.error("Error fetching living group email:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only living group accounts can update email
    if (user.role !== "living_group") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { livingGroupId, email } = body;

    if (!livingGroupId) {
      return NextResponse.json({ error: "Living group ID required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Get the living group - verify ownership
    const { data: livingGroup, error: lgError } = await supabaseAdmin
      .from("living_groups")
      .select("user_id")
      .eq("id", livingGroupId)
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json({ error: "Living group not found" }, { status: 404 });
    }

    // Update the user's email
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ email: email.trim() || null })
      .eq("id", livingGroup.user_id);

    if (updateError) {
      console.error("Error updating email:", updateError);
      return NextResponse.json({ error: "Failed to update email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating living group email:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
