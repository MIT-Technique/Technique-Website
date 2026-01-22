import { IronSession, SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";
import * as openid from "openid-client";
import Cryptr from "cryptr";

export const clientConfig: Partial<openid.ClientMetadata> = {
  url: process.env.AUTH_OIDC_ISSUER,
  audience: process.env.NEXT_PUBLIC_APP_URL,
  client_id: process.env.OIDC_CLIENT_ID,
  client_secret: process.env.OIDC_CLIENT_SECRET,
  scope: process.env.NEXT_PUBLIC_SCOPE,
  redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/userSignIn`,
  post_logout_redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}`,
  response_type: "code",
  grant_type: "authorization_code",
  post_login_route: `${process.env.NEXT_PUBLIC_APP_URL}/en/bio`,
  code_challenge_method: "S256",
  token_endpoint: process.env.NEXT_PUBLIC_API_URL + "/oidc/token",
  token_endpoint_auth_method: "client_secret_basic",
};

export interface SessionData {
  isLoggedIn: boolean;
  access_token?: string;
  code_verifier?: string;
  state?: string;
  userInfo?: {
    sub: string;
    name: string;
    email: string;
    email_verified: boolean;
  };
  cookieVariable?: string;
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
  access_token: undefined,
  code_verifier: undefined,
  state: undefined,
  userInfo: undefined,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD,
  cookieName: "next_js_session",
  cookieOptions: {
    // secure only works in `https` environments
    // if your localhost is not on `https`, then use: `secure: process.env.NODE_ENV === "production"`
    secure: process.env.NODE_ENV === "production",
  },
  ttl: 60 * 60 * 24 * 7, // 1 week
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookiesList = cookies();
  // console.log(`COOKIE HEADERS1=${cookiesList}`);
  // console.log(`COOKIE HEADERS2=${JSON.stringify(cookiesList)}`);
  let session = await getIronSession<SessionData>(cookiesList, sessionOptions);
  if (!session.isLoggedIn) {
    session.access_token = defaultSession.access_token;
    session.userInfo = defaultSession.userInfo;
  }
  return session;
}

// export async function getSession(req: Request, res: Response) {
//   const session = getIronSession<SessionData>(req, res, sessionOptions);
//   return session;
// }

export async function getClientConfig() {
  const client = await openid.discovery(
    new URL(process.env.AUTH_OIDC_ISSUER)!,
    `${process.env.OIDC_CLIENT_ID}`!,
    clientConfig!,
    openid.ClientSecretBasic(process.env.OIDC_CLIENT_SECRET),
  );
  console.log(
    `SERVER_METADATA=${JSON.stringify(client.serverMetadata(), null, 2)}`,
  );
  console.log(
    `CLIENT_METADATA=${JSON.stringify(client.clientMetadata(), null, 2)}`,
  );
  return client;
}
const cryptr = new Cryptr(process.env.CRYPTR_SECRET!);

export function getCryptr() {
  return cryptr;
}
