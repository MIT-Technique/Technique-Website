import { getClientConfig, getSession, clientConfig } from "../../../lib/lib";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
export async function GET(request: NextRequest, response: NextResponse) {
  console.log("Getting Session");
  const session = await getSession();
  console.log("Getting CLient Config");
  const openIdClientConfig = await getClientConfig();
  const headerList = headers();
  const host =
    headerList.get("x-forwarded-host") || headerList.get("host") || "localhost";
  const protocol = headerList.get("x-forwarded-proto") || "https";
  const currentUrl = new URL(
    `${protocol}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  console.log("Getting client auth code grant");

  const tokenSet = await client.authorizationCodeGrant(
    openIdClientConfig,
    currentUrl,
    {
      pkceCodeVerifier: session.code_verifier,
      expectedState: session.state,
    }
  );

  const { access_token } = tokenSet;
  session.isLoggedIn = true;
  session.access_token = access_token;
  let claims = tokenSet.claims()!;
  const { sub } = claims;
  // call userinfo endpoint to get user info
  console.log("Getting client fetch user info");
  // const claims = tokenSet.claims();
  // const userinfo = await client.fetchUserInfo(
  //   openIdClientConfig,
  //   access_token,
  //   sub
  // );

  // store userinfo in session
  session.userInfo = {
    sub: claims.sub,
    name: claims.given_name! as string,
    email: claims.email! as string,
    email_verified: Boolean(claims.email_verified)!,
  };
  console.log("Saving session");
  await session.save();
  console.log("All async commands finished");
  return Response.redirect(`${clientConfig.post_login_route}`);
}
