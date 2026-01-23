import { getClientConfig, clientConfig, getSession } from "../../../lib/lib";
import * as client from "openid-client";

export async function GET(request: Request, response: Response) {
  const session = await getSession();
  let code_verifier = client.randomPKCECodeVerifier();
  let code_challenge = await client.calculatePKCECodeChallenge(code_verifier);
  const openIdClientConfig = await getClientConfig();
  let parameters: Record<string, string> = {
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/userSignIn`!,
    scope: process.env.NEXT_PUBLIC_SCOPE!,
    code_challenge,
    code_challenge_method: `${clientConfig.code_challenge_method}`!,
  };
  let state!: string;
  state = client.randomState();
  parameters.state = state;
  session.code_verifier = code_verifier;
  session.state = state;
  await session.save();
  //This endpoint first redirects to the oidc provider (SIPB petrock)
  //  which then redirects to /api/userSignIn
  let redirectTo = client.buildAuthorizationUrl(openIdClientConfig, parameters);
  return Response.redirect(redirectTo.href);
}
