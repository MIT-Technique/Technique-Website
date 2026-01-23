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
          `${process.env.NEXT_PUBLIC_APP_URL}/en/login?error=auth_failed`
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

      if (type === 'admin' && email === 'technique@mit.edu') {
        // Admin login - upsert admin user
        if (!existingUser) {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              email,
              role: 'admin',
              first_name: 'Technique',
              last_name: 'Admin',
              auth_provider: 'supabase_auth',
              supabase_auth_id: supabaseAuthId,
              is_active: true,
            })
            .select()
            .single();

          if (createError) {
            console.error("Error creating admin user:", createError);
            return NextResponse.redirect(
              `${process.env.NEXT_PUBLIC_APP_URL}/en/login?error=user_create_failed`
            );
          }
          user = newUser;
        } else {
          // Update supabase_auth_id if not set
          await supabase
            .from('users')
            .update({
              supabase_auth_id: supabaseAuthId,
              updated_at: new Date().toISOString(),
            })
            .eq('email', email);
        }

        // Create session
        const session = await getSession();
        session.isLoggedIn = true;
        session.userId = user?.id;
        session.userInfo = {
          sub: email,
          name: 'Admin',
          email,
          email_verified: true,
        };
        await session.save();

        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/en/dashboard`
        );
      }

      if (type === 'club') {
        // Club signup - create user and club record
        if (!existingUser) {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              email,
              role: 'student', // Start as student, needs promotion
              auth_provider: 'supabase_auth',
              supabase_auth_id: supabaseAuthId,
              is_active: true,
            })
            .select()
            .single();

          if (createError) {
            console.error("Error creating club user:", createError);
            return NextResponse.redirect(
              `${process.env.NEXT_PUBLIC_APP_URL}/en/login?error=user_create_failed`
            );
          }
          user = newUser;

          // Create pending club record
          if (clubName) {
            await supabase
              .from('clubs')
              .insert({
                user_id: user.id,
                name: clubName,
                approval_status: 'pending',
              });
          }
        }

        // Create session
        const session = await getSession();
        session.isLoggedIn = true;
        session.userId = user?.id;
        session.userInfo = {
          sub: email,
          name: clubName || 'Club User',
          email,
          email_verified: true,
        };
        await session.save();

        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/en/account`
        );
      }
    }

    // Fallback - redirect to login
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/en/login`
    );
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/en/login?error=callback_failed`
    );
  }
}
