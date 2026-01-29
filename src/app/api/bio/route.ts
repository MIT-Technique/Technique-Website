import { NextRequest, NextResponse } from "next/server";
import { getSession as getNewSession } from "../../../lib/auth/session";
import { getSession as getOriginalSession } from "../../../lib/lib";
import { createAdminClient } from "../../../lib/supabase/admin";

// GET - Fetch current user's bio data
// Name/major from users table, quote/achievements from senior_bios table
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check both sessions (new technique session and original MIT SSO session)
    const newSession = await getNewSession();
    const originalSession = await getOriginalSession();

    const isNewSessionActive = newSession.isLoggedIn && newSession.userInfo?.email;
    const isOriginalSessionActive = originalSession.isLoggedIn && originalSession.userInfo?.email;

    if (!isNewSessionActive && !isOriginalSessionActive) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use whichever session is active
    const userEmail = isNewSessionActive
      ? newSession.userInfo!.email
      : originalSession.userInfo!.email;

    const supabase = createAdminClient();

    // Get user basic info
    const { data: user, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, major, second_major')
      .eq('email', userEmail)
      .single();

    if (error || !user) {
      return NextResponse.json({
        data: {
          firstName: '',
          lastName: '',
          major: '',
          second_major: '',
          quote: '',
          achievements: '',
        }
      }, { status: 200 });
    }

    // Get senior bio data
    const { data: seniorBio } = await supabase
      .from('senior_bios')
      .select('quote, achievements')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      data: {
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        major: user.major || '',
        second_major: user.second_major || '',
        quote: seniorBio?.quote || '',
        achievements: seniorBio?.achievements || '',
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching bio:", error);
    return NextResponse.json(
      { error: "There was an error retrieving user info" },
      { status: 500 }
    );
  }
}

// PUT - Update current user's bio data
// Name/major saved to users table, quote/achievements saved to senior_bios table
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Check both sessions
    const newSession = await getNewSession();
    const originalSession = await getOriginalSession();

    const isNewSessionActive = newSession.isLoggedIn && newSession.userInfo?.email;
    const isOriginalSessionActive = originalSession.isLoggedIn && originalSession.userInfo?.email;

    if (!isNewSessionActive && !isOriginalSessionActive) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = isNewSessionActive
      ? newSession.userInfo!.email
      : originalSession.userInfo!.email;

    // Parse request body
    const body = await request.json();
    const { firstName, lastName, major, second_major, quote, achievements } = body;

    // Validate required fields
    if (!firstName || !lastName || !major) {
      return NextResponse.json(
        { error: "First name, last name, and major are required" },
        { status: 400 }
      );
    }

    // Validate quote length (max 300 characters)
    if (quote && quote.length > 300) {
      return NextResponse.json(
        { error: "Quote must be 300 characters or less" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    let userId: string;

    if (fetchError || !existingUser) {
      // Create new user if not exists
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: userEmail,
          first_name: firstName,
          last_name: lastName,
          major: major,
          second_major: second_major || null,
          role: 'student',
          auth_provider: 'mit_sso',
          is_active: true,
        })
        .select('id')
        .single();

      if (insertError || !newUser) {
        console.error("Error creating user:", insertError);
        return NextResponse.json(
          { error: "Failed to save bio data" },
          { status: 500 }
        );
      }
      userId = newUser.id;
    } else {
      // Update existing user (name/major only)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          major: major,
          second_major: second_major || null,
          updated_at: new Date().toISOString(),
        })
        .eq('email', userEmail);

      if (updateError) {
        console.error("Error updating user:", updateError);
        return NextResponse.json(
          { error: "Failed to save bio data" },
          { status: 500 }
        );
      }
      userId = existingUser.id;
    }

    // Upsert senior bio (quote/achievements)
    const { error: bioError } = await supabase
      .from('senior_bios')
      .upsert({
        user_id: userId,
        quote: quote || null,
        achievements: achievements || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (bioError) {
      console.error("Error saving senior bio:", bioError);
      return NextResponse.json(
        { error: "Failed to save senior bio data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating bio:", error);
    return NextResponse.json(
      { error: "There was an error saving bio data" },
      { status: 500 }
    );
  }
}
