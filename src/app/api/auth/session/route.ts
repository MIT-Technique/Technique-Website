import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { isFormEffectivelyClosed } from "../../../../lib/utils/formStatus";

// Disable caching for session data
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();

    const noCacheHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    };

    if (!session.isLoggedIn || !session.userInfo?.email) {
      return NextResponse.json({
        isLoggedIn: false,
        user: null,
        ...(session.photographerEmail ? { photographerEmail: session.photographerEmail } : {}),
      }, { headers: noCacheHeaders });
    }

    const userEmail = session.userInfo.email;

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
        userInfo: session.userInfo,
      }, { headers: noCacheHeaders });
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

    // Get form status (return full objects with computed is_closed for page components)
    const { data: formSettings } = await supabase
      .from('form_settings')
      .select('form_name, is_frozen, closes_at, reopens_at, unfrozen_at, note');

    const frozenForms = (formSettings || []).map((f) => ({
      ...f,
      is_closed: isFormEffectivelyClosed(f),
    }));

    const responseData: Record<string, unknown> = {
      isLoggedIn: true,
      user,
      club,
      livingGroup,
      sports,
      frozenForms,
    };

    if (session.photographerEmail) {
      responseData.photographerEmail = session.photographerEmail;
    }

    return NextResponse.json(responseData, { headers: noCacheHeaders });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}
