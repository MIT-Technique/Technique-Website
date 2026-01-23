import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getSession } from "../../../../lib/auth/session";

interface OrgSigninRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OrgSigninRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    // Create a client-side Supabase client for auth (not admin)
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (authError || !authData.user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Invalid email or password", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!authData.user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Please verify your email before signing in", code: "EMAIL_NOT_VERIFIED" },
        { status: 401 }
      );
    }

    // Get user record from our users table
    const supabaseAdmin = createAdminClient();
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User account not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Verify user has an organization role
    if (user.role !== "club" && user.role !== "living_group_leader") {
      return NextResponse.json(
        { error: "This login is for organizations only", code: "INVALID_ROLE" },
        { status: 403 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: "Your account has been disabled", code: "ACCOUNT_DISABLED" },
        { status: 403 }
      );
    }

    // Create technique_session
    const session = await getSession();
    session.isLoggedIn = true;
    session.access_token = authData.session?.access_token;
    session.userId = user.id;
    session.userInfo = {
      sub: user.email,
      name: user.first_name || "",
      email: user.email,
      email_verified: true,
    };
    await session.save();

    // Determine redirect URL based on role
    let redirectUrl: string;
    if (user.role === "club") {
      redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/en/club`;
    } else {
      redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/en/living-group`;
    }

    return NextResponse.json({
      success: true,
      redirectUrl,
    });
  } catch (error) {
    console.error("Org signin error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
