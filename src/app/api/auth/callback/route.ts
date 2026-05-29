import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getSession } from "../../../../lib/auth/session";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const code = searchParams.get('code');
  const clubName = searchParams.get('clubName');

  const supabase = createAdminClient();

  try {
    // Handle Supabase Auth callback (admin magic link or club signup)
    if (code) {
      // Exchange the code for a session
      const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

      if (authError || !authData.user) {
        console.error("Auth callback error:", authError);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/login?error=auth_failed`
        );
      }

      const email = authData.user.email!;
      const supabaseAuthId = authData.user.id;

      // Check if user exists in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      let user = existingUser;

      if (type === 'club') {
        // Club signup or login
        if (!existingUser) {
          // NEW CLUB SIGNUP - create user and club entry
          if (!clubName) {
            console.error("Club signup error: no club name provided");
            return NextResponse.redirect(
              `${process.env.NEXT_PUBLIC_APP_URL}/login/club?error=missing_club_name`
            );
          }

          // Create new user with club role
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              email,
              role: 'club',
              name: clubName,
              supabase_auth_id: supabaseAuthId,
              is_active: true,
            })
            .select()
            .single();

          if (createError) {
            console.error("Error creating club user:", createError);
            return NextResponse.redirect(
              `${process.env.NEXT_PUBLIC_APP_URL}/login/club?error=user_create_failed`
            );
          }

          // Create clubs table entry
          const { error: clubCreateError } = await supabase
            .from('clubs')
            .insert({
              user_id: newUser.id,
              club_id: `CLUB-${Date.now()}`,
              name: clubName,
              has_leader: false,
              approval_status: 'pending',
            });

          if (clubCreateError) {
            console.error("Error creating club entry:", clubCreateError);
            // Don't fail - user is created, they can still access
          }

          user = newUser;
        } else if (existingUser.role !== 'club') {
          // User exists but isn't a club account
          console.error("Club callback error: user exists but not a club account");
          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/login/club?error=not_club_account`
          );
        } else {
          // EXISTING CLUB LOGIN
          user = existingUser;

          // Update supabase_auth_id if not set
          if (!user.supabase_auth_id) {
            await supabase
              .from('users')
              .update({
                supabase_auth_id: supabaseAuthId,
                updated_at: new Date().toISOString(),
              })
              .eq('email', email);
          }
        }

        // Get club name for session
        const { data: clubData } = await supabase
          .from('clubs')
          .select('name')
          .eq('user_id', user.id)
          .single();

        // Create session
        const session = await getSession();
        session.isLoggedIn = true;
        session.userId = user?.id;
        session.userInfo = {
          sub: email,
          name: clubData?.name || 'Club User',
          email,
          email_verified: true,
        };
        await session.save();

        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/club`
        );
      }
    }

    // Fallback - redirect to login
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login`
    );
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=callback_failed`
    );
  }
}
