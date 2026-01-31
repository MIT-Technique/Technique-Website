import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getSession } from "../../../../lib/auth/session";

const ADMIN_EMAIL = "tnq-exec@mit.edu";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Use provided email or default to admin email
    const loginEmail = email ? email.trim().toLowerCase() : ADMIN_EMAIL;

    // Authenticate with Supabase Auth using password
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Get user from our users table
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", loginEmail)
      .single();

    if (userError || !user) {
      // Auto-create admin user record if logging in with admin email
      if (loginEmail === ADMIN_EMAIL) {
        const { data: newUser, error: createError } = await supabaseAdmin
          .from("users")
          .insert({
            email: ADMIN_EMAIL,
            role: "admin",
            name: "Technique Admin",
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

        const session = await getSession();
        session.isLoggedIn = true;
        session.access_token = authData.session?.access_token;
        session.userId = newUser.id;
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
      }

      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    // Verify user has admin or staph role
    if (user.role !== "admin" && user.role !== "staph") {
      return NextResponse.json(
        { error: "This login is for admin and staph only" },
        { status: 403 }
      );
    }

    // Update supabase_auth_id if needed
    if (!user.supabase_auth_id) {
      await supabaseAdmin
        .from("users")
        .update({
          supabase_auth_id: authData.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("email", loginEmail);
    }

    // Create technique_session
    const session = await getSession();
    session.isLoggedIn = true;
    session.access_token = authData.session?.access_token;
    session.userId = user.id;
    session.userInfo = {
      sub: loginEmail,
      name: user.name || (user.role === "admin" ? "Admin" : "Staph"),
      email: loginEmail,
      email_verified: true,
    };
    await session.save();

    // Redirect based on role
    const redirectUrl = user.role === "admin"
      ? `${process.env.NEXT_PUBLIC_APP_URL}/en/dashboard`
      : `${process.env.NEXT_PUBLIC_APP_URL}/en/dashboard`;

    return NextResponse.json({
      success: true,
      redirectUrl,
    });
  } catch (error) {
    console.error("Admin/staph login error:", error);
    return NextResponse.json(
      { error: "Failed to process login" },
      { status: 500 }
    );
  }
}
