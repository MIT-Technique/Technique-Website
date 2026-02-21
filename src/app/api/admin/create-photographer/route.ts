import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { kerb, name } = await request.json();

    if (!kerb || !kerb.trim()) {
      return NextResponse.json({ error: "Kerberos username is required" }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const email = kerb.trim().toLowerCase().replace(/@mit\.edu$/, "") + "@mit.edu";

    const supabase = createAdminClient();

    // Check for existing user
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    // Create user record (no Supabase auth — photographers don't need to log in)
    const { error: userError } = await supabase.from("users").insert({
      email,
      role: "photographer",
      name: name.trim(),
      is_staph: false,
      access: [],
      is_active: true,
    });

    if (userError) {
      console.error("Error creating user record:", userError);
      return NextResponse.json({ error: "Failed to create user record" }, { status: 500 });
    }

    // Also upsert into authorized_photographers for hire system backward compat
    const { error: photoError } = await supabase
      .from("authorized_photographers")
      .upsert(
        {
          email,
          name: name.trim(),
          added_by: user.id,
          is_active: true,
        },
        { onConflict: "email" }
      );

    if (photoError) {
      console.error("Error upserting authorized_photographers:", photoError);
    }

    // Log the action
    const { createLog } = await import("../../../../lib/admin-logs");
    await createLog(user.id, "create_photographer", "user", null, {
      email,
      name: name.trim(),
    });

    return NextResponse.json({
      success: true,
      email,
    });
  } catch (error) {
    console.error("Error creating photographer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
