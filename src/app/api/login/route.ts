import { getClientConfig, getSession, clientConfig } from "../../../lib";
import * as client from "openid-client";

export async function GET(request: Request, response: Response) {
  console.log("Hello");
  const session = await getSession();
  console.log(`Session=${JSON.stringify(session)}`);
  let code_verifier = client.randomPKCECodeVerifier();
  let code_challenge = await client.calculatePKCECodeChallenge(code_verifier);
  const openIdClientConfig = await getClientConfig();
  let parameters: Record<string, string> = {
    redirect_uri: clientConfig.redirect_uri,
    scope: clientConfig.scope!,
    code_challenge,
    code_challenge_method: clientConfig.code_challenge_method,
  };
  let state!: string;
  state = client.randomState();
  parameters.state = state;
  //   console.log(`SERVER_METADATA=${JSON.stringify(openIdClientConfig.serverMetadata(), null, 2)}`)
  //   if (!openIdClientConfig.serverMetadata().supportsPKCE()) {
  //   }
  session.code_verifier = code_verifier;
  session.state = state;
  console.log(`SAVED SESSION DATA1=${JSON.stringify(await getSession())}`);
  await session.save();
  console.log(`SAVED SESSION DATA2=${JSON.stringify(await getSession())}`);
  let redirectTo = client.buildAuthorizationUrl(openIdClientConfig, parameters);
  console.log(`redirectTo.href=${redirectTo.href}`);
  return Response.redirect(redirectTo.href);
}
