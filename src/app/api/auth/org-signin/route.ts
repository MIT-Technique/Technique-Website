import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getSession } from "../../../../lib/auth/session";

// Generate the same system email as signup
function generateSystemEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug}@lg.technique.mit.edu`;
}

interface OrgSigninRequest {
  // For clubs: email is required
  email?: string;
  // For living groups: name is required
  name?: string;
  password: string;
  orgType: "club" | "living_group" | "sports";
}

export async function POST(request: NextRequest) {
  try {
    const body: OrgSigninRequest = await request.json();
    const { email, name, password, orgType } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required", code: "MISSING_PASSWORD" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();
    let authEmail: string;
    let expectedRole: string;

    // ==================== CLUB SIGNIN ====================
    if (orgType === "club") {
      // Support both email and name-based login for clubs
      if (!email && !name) {
        return NextResponse.json(
          { error: "Email or club name is required", code: "MISSING_EMAIL_OR_NAME" },
          { status: 400 }
        );
      }

      if (name && !email) {
        // Look up club by name to get the email
        const { data: club, error: clubError } = await supabaseAdmin
          .from("clubs")
          .select("id, name, user_id")
          .ilike("name", name.trim())
          .single();

        if (clubError || !club) {
          return NextResponse.json(
            { error: "Club not found", code: "CLUB_NOT_FOUND" },
            { status: 404 }
          );
        }

        // Get the user record to find the email
        const { data: clubUser, error: userLookupError } = await supabaseAdmin
          .from("users")
          .select("email")
          .eq("id", club.user_id)
          .single();

        if (userLookupError || !clubUser) {
          return NextResponse.json(
            { error: "Club account not found", code: "CLUB_ACCOUNT_NOT_FOUND" },
            { status: 404 }
          );
        }

        authEmail = clubUser.email;
      } else {
        authEmail = email.toLowerCase();
      }
      expectedRole = "club";
    }
    // ==================== LIVING GROUP SIGNIN ====================
    else if (orgType === "living_group") {
      if (!name) {
        return NextResponse.json(
          { error: "Living group name is required", code: "MISSING_NAME" },
          { status: 400 }
        );
      }

      // Look up living group by name to get the system email
      const { data: livingGroup, error: lgError } = await supabaseAdmin
        .from("living_groups")
        .select("id, name, user_id")
        .ilike("name", name.trim())
        .single();

      if (lgError || !livingGroup) {
        return NextResponse.json(
          { error: "Living group not found", code: "LG_NOT_FOUND" },
          { status: 404 }
        );
      }

      // Get the user record to find the system email
      const { data: lgUser, error: userLookupError } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("id", livingGroup.user_id)
        .single();

      if (userLookupError || !lgUser) {
        return NextResponse.json(
          { error: "Living group account not found", code: "LG_ACCOUNT_NOT_FOUND" },
          { status: 404 }
        );
      }

      authEmail = lgUser.email;
      expectedRole = "living_group";
    }
    // ==================== SPORTS SIGNIN ====================
    else if (orgType === "sports") {
      if (!name) {
        return NextResponse.json(
          { error: "Sports team name is required", code: "MISSING_NAME" },
          { status: 400 }
        );
      }

      // Look up sports team by name
      const { data: sportsTeam, error: sportsError } = await supabaseAdmin
        .from("sports")
        .select("id, name, user_id")
        .ilike("name", name.trim())
        .single();

      if (sportsError || !sportsTeam) {
        return NextResponse.json(
          { error: "Sports team not found", code: "SPORTS_NOT_FOUND" },
          { status: 404 }
        );
      }

      // Get the user record to find the email
      const { data: sportsUser, error: userLookupError } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("id", sportsTeam.user_id)
        .single();

      if (userLookupError || !sportsUser) {
        return NextResponse.json(
          { error: "Sports account not found", code: "SPORTS_ACCOUNT_NOT_FOUND" },
          { status: 404 }
        );
      }

      authEmail = sportsUser.email;
      expectedRole = "sports";
    } else {
      return NextResponse.json(
        { error: "Invalid organization type", code: "INVALID_ORG_TYPE" },
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
      email: authEmail,
      password,
    });

    if (authError || !authData.user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Invalid credentials", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    // Check if email is verified (only for clubs - living groups use system emails that are auto-confirmed)
    if (orgType === "club" && !authData.user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Please verify your email before signing in", code: "EMAIL_NOT_VERIFIED" },
        { status: 401 }
      );
    }

    // Get user record from our users table
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", authEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User account not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Verify user has the expected organization role
    if (user.role !== expectedRole) {
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
    } else if (user.role === "sports") {
      redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/en/sports`;
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
