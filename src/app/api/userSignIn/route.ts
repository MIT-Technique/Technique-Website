import { getClientConfig, getSession } from "../../../lib/lib";
import { upsertMitSsoUser } from "../../../lib/auth/session";
import { headers, cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";

export async function GET(request: NextRequest, response: NextResponse) {
  const session = await getSession();
  const openIdClientConfig = await getClientConfig();
  const headerList = headers();
  const host =
    headerList.get("x-forwarded-host") || headerList.get("host") || "localhost";
  const protocol = headerList.get("x-forwarded-proto") || "https";
  const currentUrl = new URL(
    `${protocol}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`
  );

  const tokenSet = await client.authorizationCodeGrant(
    openIdClientConfig,
    currentUrl,
    {
      pkceCodeVerifier: session.code_verifier,
      expectedState: session.state,
    }
  );

  const { access_token } = tokenSet;
  let claims = tokenSet.claims()!;

  const email = claims.sub as string;
  const firstName = (claims.given_name || '') as string;

  // Upsert user in Supabase
  const user = await upsertMitSsoUser(email, firstName);

  // Store session info in original MIT SSO session
  session.isLoggedIn = true;
  session.access_token = access_token;
  session.userInfo = {
    sub: claims.sub,
    name: firstName,
    email: email,
    email_verified: true,
  };
  await session.save();

  // Redirect based on role
  if (user?.role === 'admin') {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/en/dashboard`);
  }
  if (user?.role === 'club') {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/en/club`);
  }
  if (user?.role === 'living_group_leader') {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/en/living-group`);
  }

  // For students, check for returnUrl from cookie (set by /api/login before OAuth redirect)
  const cookieStore = cookies();
  const returnUrlCookie = cookieStore.get('auth_return_url');
  console.log('[/api/userSignIn] auth_return_url cookie:', returnUrlCookie?.value);

  if (returnUrlCookie?.value && returnUrlCookie.value.startsWith('/')) {
    console.log('[/api/userSignIn] Redirecting to cookie returnUrl:', returnUrlCookie.value);
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${returnUrlCookie.value}`);
    // Clear the cookie after use
    response.cookies.delete('auth_return_url');
    return response;
  }

  // Default to profile page for students
  console.log('[/api/userSignIn] No returnUrl cookie, redirecting to default /en/profile');
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/en/profile`);
}
