import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getSession } from "../../../../lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, signOut } = body;

    // Handle sign-out
    if (signOut) {
      const session = await getSession();
      session.photographerEmail = undefined;
      await session.save();
      return NextResponse.json({ success: true });
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabase = createAdminClient();

    // Check authorized_photographers
    const { data: photographer } = await supabase
      .from("authorized_photographers")
      .select("id, email")
      .eq("email", normalizedEmail)
      .eq("is_active", true)
      .single();

    // Check if admin or staph
    let isAuthorizedUser = false;
    if (!photographer) {
      const { data: user } = await supabase
        .from("users")
        .select("id, role, is_staph")
        .eq("email", normalizedEmail)
        .single();

      isAuthorizedUser = !!user && (user.role === "admin" || user.role === "staph" || user.is_staph);
    }

    if (!photographer && !isAuthorizedUser) {
      return NextResponse.json({ success: false, authorized: false });
    }

    // Set session
    const session = await getSession();
    session.photographerEmail = normalizedEmail;
    await session.save();

    return NextResponse.json({ success: true, authorized: true });
  } catch (error) {
    console.error("Error in photographer sign-in:", error);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
