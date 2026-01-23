import { getClientConfig, getSession } from "../../../lib/lib";
import { upsertMitSsoUser } from "../../../lib/auth/session";
import { headers } from "next/headers";
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
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/en/dashboard`);
  }
  if (user?.role === 'club') {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/en/club`);
  }
  if (user?.role === 'living_group_leader') {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/en/living-group`);
  }

  // Default to profile page for students
  return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/en/profile`);
}
