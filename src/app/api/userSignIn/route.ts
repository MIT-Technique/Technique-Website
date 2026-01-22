import { getClientConfig, getSession, clientConfig } from "../../../lib/lib";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
export async function GET(request: NextRequest, response: NextResponse) {
  // console.log("Getting Session");
  const session = await getSession();
  // console.log("Getting CLient Config");
  const openIdClientConfig = await getClientConfig();
  const headerList = headers();
  const host =
    headerList.get("x-forwarded-host") || headerList.get("host") || "localhost";
  const protocol = headerList.get("x-forwarded-proto") || "https";
  const currentUrl = new URL(
    `${protocol}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  // console.log("Getting client auth code grant");

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
  // console.log("Getting client fetch user info");

  //This call is what was making logging in timeout for Max
  // const userinfo = await client.fetchUserInfo(
  //   openIdClientConfig,
  //   access_token,
  //   sub
  // );

  // console.log(`claims: ${JSON.stringify(claims, null, 2)}`);
  // store userinfo in session
  session.userInfo = {
    sub: claims.sub,
    name: claims.given_name! as string,
    email: claims.sub as string,
    email_verified: true,
  };
  // console.log("Saving session");
  // console.log(`session user info: ${JSON.stringify(session, null, 2)}`);
  await session.save();
  // console.log("All async commands finished");
  
  return Response.redirect(`${clientConfig.post_login_route}`);
}
