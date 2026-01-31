import { IronSession, SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { createAdminClient } from "../supabase/admin";
import { User, UserRole } from "../supabase/types";
import { getSession as getMitSsoSession } from "../lib";

export interface SessionData {
  isLoggedIn: boolean;
  access_token?: string;
  code_verifier?: string;
  state?: string;
  userId?: string;
  userInfo?: {
    sub: string;
    name: string;
    email: string;
    email_verified: boolean;
  };
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
  access_token: undefined,
  code_verifier: undefined,
  state: undefined,
  userId: undefined,
  userInfo: undefined,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: "technique_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
  ttl: 60 * 60 * 24 * 7, // 1 week
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookiesList = await cookies();
  let session = await getIronSession<SessionData>(cookiesList, sessionOptions);
  if (!session.isLoggedIn) {
    session.access_token = defaultSession.access_token;
    session.userInfo = defaultSession.userInfo;
    session.userId = defaultSession.userId;
  }
  return session;
}

// Get full user data from Supabase
// Checks both technique_session (admin magic link) and next_js_session (MIT SSO)
export async function getCurrentUser(): Promise<User | null> {
  // First check technique_session (admin magic link logins)
  const techniqueSession = await getSession();
  let email: string | undefined;

  if (techniqueSession.isLoggedIn && techniqueSession.userInfo?.email) {
    email = techniqueSession.userInfo.email;
  } else {
    // Fallback to MIT SSO session (next_js_session)
    const mitSsoSession = await getMitSsoSession();
    if (mitSsoSession.isLoggedIn && mitSsoSession.userInfo?.email) {
      email = mitSsoSession.userInfo.email;
    }
  }

  if (!email) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return null;
  }

  return data as User;
}

// Upsert user after MIT SSO login
export async function upsertMitSsoUser(email: string, firstName: string): Promise<User | null> {
  const supabase = createAdminClient();

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    // Update last login
    const { data, error } = await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('email', email)
      .select()
      .single();

    return data as User;
  }

  // Create new user with default staph role
  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      name: firstName,
      role: 'staph',
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }

  return data as User;
}

// Check if user has specific role
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

// Get user role
export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.role || null;
}

// Clear session
export async function clearSession(): Promise<void> {
  const session = await getSession();
  session.isLoggedIn = false;
  session.access_token = undefined;
  session.code_verifier = undefined;
  session.state = undefined;
  session.userId = undefined;
  session.userInfo = undefined;
  await session.save();
}
