import { NextResponse } from "next/server";
import { getSession as getNewSession } from "../../../../lib/auth/session";
import { getSession as getOriginalSession } from "../../../../lib/lib";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function GET() {
  try {
    // Check new session first (for admin magic link, club signup)
    const newSession = await getNewSession();

    // Check original MIT SSO session
    const originalSession = await getOriginalSession();

    // Determine which session is active
    const isNewSessionActive = newSession.isLoggedIn && newSession.userInfo?.email;
    const isOriginalSessionActive = originalSession.isLoggedIn && originalSession.userInfo?.email;

    if (!isNewSessionActive && !isOriginalSessionActive) {
      return NextResponse.json({
        isLoggedIn: false,
        user: null,
      });
    }

    // Use whichever session is active (prefer new session if both)
    const activeSession = isNewSessionActive ? newSession : originalSession;
    const userEmail = activeSession.userInfo!.email;

    // Get full user data from Supabase
    const supabase = createAdminClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        isLoggedIn: true,
        user: null,
        userInfo: activeSession.userInfo,
      });
    }

    // Get additional data based on role (at top level for useUser hook)
    let club = null;
    let livingGroup = null;
    let sports = null;

    if (user.role === 'club') {
      const { data } = await supabase
        .from('clubs')
        .select('*')
        .eq('user_id', user.id)
        .single();
      club = data;
    }

    if (user.role === 'living_group') {
      const { data } = await supabase
        .from('living_groups')
        .select('*')
        .eq('user_id', user.id)
        .single();
      livingGroup = data;
    }

    if (user.role === 'sports') {
      const { data } = await supabase
        .from('sports')
        .select('*')
        .eq('user_id', user.id)
        .single();
      sports = data;
    }

    // Get frozen forms status (return full objects for page components)
    const { data: formSettings } = await supabase
      .from('form_settings')
      .select('form_name, is_frozen');

    const frozenForms = formSettings || [];

    return NextResponse.json({
      isLoggedIn: true,
      user,
      club,
      livingGroup,
      sports,
      frozenForms,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}
