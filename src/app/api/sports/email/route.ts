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

    const newEmail = email?.trim();
    if (!newEmail) {
      return NextResponse.json({ error: "Email cannot be empty" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Get the user's Supabase Auth ID
    const { data: userData, error: userFetchError } = await supabaseAdmin
      .from("users")
      .select("supabase_auth_id, email")
      .eq("id", user.id)
      .single();

    if (userFetchError || !userData) {
      console.error("Error fetching user:", userFetchError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update Supabase Auth email if auth ID exists
    if (userData.supabase_auth_id) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        userData.supabase_auth_id,
        { email: newEmail }
      );

      if (authUpdateError) {
        console.error("Error updating Supabase Auth email:", authUpdateError);
        return NextResponse.json(
          { error: "Failed to update authentication email" },
          { status: 500 }
        );
      }
    }

    // Update the user's email in the database
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ email: newEmail })
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
