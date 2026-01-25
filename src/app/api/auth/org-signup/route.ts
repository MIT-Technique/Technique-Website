import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

// Predefined list of valid dorm names
const VALID_DORMS = [
  "Baker House",
  "Burton-Conner House",
  "East Campus",
  "Macgregor House",
  "Maseeh Hall",
  "McCormick Hall",
  "New House",
  "New Vassar",
  "Next House",
  "Random Hall",
  "Simmons Hall",
];

// Generate a system email for living groups (internal use only)
function generateSystemEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug}@lg.technique.mit.edu`;
}

interface OrgSignupRequest {
  // For clubs: email is required
  email?: string;
  password: string;
  organizationType: "club" | "living_group";
  clubName?: string;
  livingGroupType?: "dorm" | "fsilg";
  dormName?: string;
  fsilgName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OrgSignupRequest = await request.json();
    const { email, password, organizationType, clubName, livingGroupType, dormName, fsilgName } = body;

    // Validate password (at least 8 characters and contains a number or symbol)
    const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password || "");
    if (!password || password.length < 8 || !hasNumberOrSymbol) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters and contain a number or symbol", code: "INVALID_PASSWORD" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // ==================== CLUB SIGNUP ====================
    if (organizationType === "club") {
      // Clubs still require email
      if (!email || !email.toLowerCase().endsWith("@mit.edu")) {
        return NextResponse.json(
          { error: "Email must be an @mit.edu address", code: "INVALID_EMAIL" },
          { status: 400 }
        );
      }

      if (!clubName || !clubName.trim()) {
        return NextResponse.json(
          { error: "Club name is required", code: "MISSING_CLUB_NAME" },
          { status: 400 }
        );
      }

      // Check for existing club with the same name (case-insensitive)
      const { data: existingClub } = await supabase
        .from("clubs")
        .select("id")
        .ilike("name", clubName.trim())
        .single();

      if (existingClub) {
        return NextResponse.json(
          { error: "A club with this name already exists", code: "CLUB_NAME_EXISTS" },
          { status: 409 }
        );
      }

      // Check for existing user with this email
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this email already exists", code: "EMAIL_EXISTS" },
          { status: 409 }
        );
      }

      // Create Supabase Auth user (requires email verification)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: false,
      });

      if (authError || !authData.user) {
        console.error("Error creating Supabase Auth user:", authError);
        return NextResponse.json(
          { error: "Failed to create account", code: "AUTH_ERROR" },
          { status: 500 }
        );
      }

      // Send verification email
      const { error: emailError } = await supabase.auth.resend({
        type: "signup",
        email: email.toLowerCase(),
      });

      if (emailError) {
        console.error("Error sending verification email:", emailError);
      }

      // Create user record
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          email: email.toLowerCase(),
          role: "club",
          first_name: clubName.trim(),
          auth_provider: "supabase_auth",
          supabase_auth_id: authData.user.id,
          is_active: true,
        })
        .select()
        .single();

      if (userError || !newUser) {
        console.error("Error creating user record:", userError);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: "Failed to create user record", code: "USER_ERROR" },
          { status: 500 }
        );
      }

      // Create club record
      const { error: clubError } = await supabase.from("clubs").insert({
        user_id: newUser.id,
        club_id: `CLUB-${Date.now()}`,
        name: clubName.trim(),
        approval_status: "pending",
      });

      if (clubError) {
        console.error("Error creating club record:", clubError);
        await supabase.from("users").delete().eq("id", newUser.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: "Failed to create club record", code: "CLUB_ERROR" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Account created. Please check your email to verify.",
      });
    }

    // ==================== LIVING GROUP SIGNUP ====================
    if (organizationType === "living_group") {
      if (!livingGroupType) {
        return NextResponse.json(
          { error: "Living group type is required", code: "MISSING_LG_TYPE" },
          { status: 400 }
        );
      }

      let livingGroupName: string;

      if (livingGroupType === "dorm") {
        if (!dormName) {
          return NextResponse.json(
            { error: "Dorm name is required", code: "MISSING_DORM" },
            { status: 400 }
          );
        }

        // Validate dorm name is in the predefined list
        if (!VALID_DORMS.includes(dormName)) {
          return NextResponse.json(
            { error: "Invalid dorm name", code: "INVALID_DORM" },
            { status: 400 }
          );
        }

        livingGroupName = dormName;
      } else if (livingGroupType === "fsilg") {
        if (!fsilgName?.trim()) {
          return NextResponse.json(
            { error: "FSILG name is required", code: "MISSING_FSILG" },
            { status: 400 }
          );
        }
        livingGroupName = fsilgName.trim();
      } else {
        return NextResponse.json(
          { error: "Invalid living group type", code: "INVALID_LG_TYPE" },
          { status: 400 }
        );
      }

      // Check for existing living group with the same name (case-insensitive)
      const { data: existingLG } = await supabase
        .from("living_groups")
        .select("id")
        .ilike("name", livingGroupName)
        .single();

      if (existingLG) {
        return NextResponse.json(
          { error: "A living group with this name already exists", code: "LG_NAME_EXISTS" },
          { status: 409 }
        );
      }

      // Generate system email for this living group
      const systemEmail = generateSystemEmail(livingGroupName);

      // Check if system email already exists (shouldn't happen if name check passed)
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", systemEmail)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: "A living group with this name already exists", code: "LG_NAME_EXISTS" },
          { status: 409 }
        );
      }

      // Create Supabase Auth user with system email (auto-confirm since no real email)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: systemEmail,
        password,
        email_confirm: true, // Auto-confirm - no real email to verify
      });

      if (authError || !authData.user) {
        console.error("Error creating Supabase Auth user:", authError);
        return NextResponse.json(
          { error: "Failed to create account", code: "AUTH_ERROR" },
          { status: 500 }
        );
      }

      // Create user record with system email
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          email: systemEmail,
          role: "living_group_leader",
          first_name: livingGroupName,
          auth_provider: "supabase_auth",
          supabase_auth_id: authData.user.id,
          is_active: true,
        })
        .select()
        .single();

      if (userError || !newUser) {
        console.error("Error creating user record:", userError);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: "Failed to create user record", code: "USER_ERROR" },
          { status: 500 }
        );
      }

      // Create living group record with has_leader = false
      const { error: lgError } = await supabase.from("living_groups").insert({
        user_id: newUser.id,
        name: livingGroupName,
        living_group_type: livingGroupType,
        status: "pending",
        has_leader: false,
      });

      if (lgError) {
        console.error("Error creating living group record:", lgError);
        await supabase.from("users").delete().eq("id", newUser.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: "Failed to create living group record", code: "LG_ERROR" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Account created successfully.",
      });
    }

    // Invalid organization type
    return NextResponse.json(
      { error: "Invalid organization type", code: "INVALID_ORG_TYPE" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Org signup error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
