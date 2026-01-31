import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { kerb, name, access } = await request.json();

    if (!kerb || !kerb.trim()) {
      return NextResponse.json({ error: "Kerberos username is required" }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const validAccess = ["clubs", "living_groups", "sports", "activities", "seniors"];
    const filteredAccess = (access || []).filter((a: string) => validAccess.includes(a));

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

    // Generate password
    const password = crypto.randomBytes(12).toString("base64url");

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name.trim() },
    });

    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);
      return NextResponse.json({ error: "Failed to create auth account" }, { status: 500 });
    }

    // Create user record
    const { error: userError } = await supabase.from("users").insert({
      email,
      role: "staph",
      name: name.trim(),
      is_staph: true,
      access: filteredAccess,
      supabase_auth_id: authData.user.id,
      is_active: true,
    });

    if (userError) {
      console.error("Error creating user record:", userError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: "Failed to create user record" }, { status: 500 });
    }

    // Log the action
    const { createLog } = await import("../../../../lib/admin-logs");
    await createLog(user.id, "create_staph", "user", null, {
      email,
      name: name.trim(),
      access: filteredAccess,
    });

    return NextResponse.json({
      success: true,
      email,
      password,
    });
  } catch (error) {
    console.error("Error creating staph:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
