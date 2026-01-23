import { getClientConfig, clientConfig, getSession } from "../../../lib/lib";
import { NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const url = new URL(request.url);
  const returnUrl = url.searchParams.get('returnUrl');

  let code_verifier = client.randomPKCECodeVerifier();
  let code_challenge = await client.calculatePKCECodeChallenge(code_verifier);
  const openIdClientConfig = await getClientConfig();
  let parameters: Record<string, string> = {
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/userSignIn`!,
    scope: process.env.NEXT_PUBLIC_SCOPE!,
    code_challenge,
    code_challenge_method: `${clientConfig.code_challenge_method}`!,
  };
  // Create state that includes returnUrl (encoded as base64 JSON)
  const randomState = client.randomState();
  const stateData = returnUrl
    ? { r: randomState, u: returnUrl }
    : { r: randomState };
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

  console.log('[/api/login] returnUrl from query:', returnUrl);
  console.log('[/api/login] stateData:', stateData);
  console.log('[/api/login] encoded state:', state);

  parameters.state = state;
  session.code_verifier = code_verifier;
  session.state = state;
  await session.save();

  //This endpoint first redirects to the oidc provider (SIPB petrock)
  //  which then redirects to /api/userSignIn
  let redirectTo = client.buildAuthorizationUrl(openIdClientConfig, parameters);

  // Create redirect response and set returnUrl cookie BEFORE redirecting to OAuth
  const response = NextResponse.redirect(redirectTo.href);
  if (returnUrl) {
    console.log('[/api/login] Setting auth_return_url cookie:', returnUrl);
    response.cookies.set('auth_return_url', returnUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutes
    });
  }
  return response;
}
