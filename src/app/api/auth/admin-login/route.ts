import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getSession } from "../../../../lib/auth/session";

const ADMIN_EMAIL = "tnq-exec@mit.edu";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Authenticate with Supabase Auth using password
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Get or create admin user in our users table
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", ADMIN_EMAIL)
      .single();

    let user = existingUser;

    if (!existingUser) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from("users")
        .insert({
          email: ADMIN_EMAIL,
          role: "admin",
          first_name: "Technique",
          last_name: "Admin",
          auth_provider: "supabase_auth",
          supabase_auth_id: authData.user.id,
          is_active: true,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating admin user:", createError);
        return NextResponse.json(
          { error: "Failed to create admin account" },
          { status: 500 }
        );
      }
      user = newUser;
    } else {
      // Update supabase_auth_id if needed
      if (!existingUser.supabase_auth_id) {
        await supabaseAdmin
          .from("users")
          .update({
            supabase_auth_id: authData.user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("email", ADMIN_EMAIL);
      }
    }

    // Verify user has admin role
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "This account is not an admin" },
        { status: 403 }
      );
    }

    // Create technique_session
    const session = await getSession();
    session.isLoggedIn = true;
    session.access_token = authData.session?.access_token;
    session.userId = user.id;
    session.userInfo = {
      sub: ADMIN_EMAIL,
      name: "Admin",
      email: ADMIN_EMAIL,
      email_verified: true,
    };
    await session.save();

    return NextResponse.json({
      success: true,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/en/dashboard`,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Failed to process admin login" },
      { status: 500 }
    );
  }
}
