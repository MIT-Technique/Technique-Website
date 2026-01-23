# Authentication & User Data Flow

## Overview

The application uses a **dual-session system** with two iron-session cookies:

| Cookie | Library | Purpose |
|--------|---------|---------|
| `next_js_session` | `src/lib/lib.ts` | MIT SSO OAuth (students) |
| `technique_session` | `src/lib/auth/session.ts` | Supabase magic links (admin, clubs) |

---

## User Roles

| Role | Auth Method | Dashboard |
|------|-------------|-----------|
| `student` | MIT SSO | `/profile` |
| `admin` | Magic link (`technique@mit.edu` only) | `/dashboard` |
| `club` | Magic link (club email) | `/club` |
| `living_group_leader` | MIT SSO (promoted by admin) | `/living-group` |

---

## Authentication Flows

### 1. MIT SSO (Students)

```
/login → Button → /api/login
           ↓
    MIT Touchstone (OIDC)
           ↓
    /api/userSignIn (callback)
           ↓
    Validates PKCE state/verifier from next_js_session
           ↓
    Upserts user in Supabase (role: student)
           ↓
    Saves session to next_js_session
           ↓
    Redirects by role: /profile, /dashboard, /club, /living-group
```

**Key files:**
- `/api/login/route.ts` - Initiates OIDC flow, stores `state` + `code_verifier`
- `/api/userSignIn/route.ts` - OAuth callback, validates state, creates user

### 2. Admin Magic Link

```
/login/admin → Enter: technique@mit.edu
                      ↓
              POST /api/auth/admin-login
                      ↓
              Supabase sends magic link email
                      ↓
              Click email link
                      ↓
              /api/auth/callback?type=admin&code=...
                      ↓
              Exchanges code, creates/updates admin user
                      ↓
              Saves session to technique_session
                      ↓
              Redirects to /dashboard
```

**Key files:**
- `/api/auth/admin-login/route.ts` - Validates email, sends OTP
- `/api/auth/callback/route.ts` - Handles magic link callback

### 3. Club Signup (New Club)

```
/login/club (signup mode) → Enter: email + club name
                                    ↓
                            POST /api/auth/club-signup
                                    ↓
                            Validates email not already registered
                                    ↓
                            Supabase sends magic link with clubName param
                                    ↓
                            Click email link
                                    ↓
                            /api/auth/callback?type=club&clubName=...&code=...
                                    ↓
                            Creates user (role: club) + clubs table entry
                                    ↓
                            Saves session to technique_session
                                    ↓
                            Redirects to /club (with leader onboarding gate)
```

**Key files:**
- `/api/auth/club-signup/route.ts` - Checks email availability, sends OTP
- `/api/auth/callback/route.ts` - Creates user + club entry

### 4. Club Login (Existing Club)

```
/login/club (signin mode) → Enter: email
                                   ↓
                           POST /api/auth/club-login
                                   ↓
                           Validates user exists with role=club
                                   ↓
                           Supabase sends magic link
                                   ↓
                           Click email link
                                   ↓
                           /api/auth/callback?type=club&code=...
                                   ↓
                           Saves session to technique_session
                                   ↓
                           Redirects to /club
```

**Key files:**
- `/api/auth/club-login/route.ts` - Validates club account exists

---

## Session Management

### Session Check (`/api/auth/session`)

```
Client (useUser hook) → GET /api/auth/session
                               ↓
                        Checks technique_session first
                               ↓
                        Falls back to next_js_session
                               ↓
                        Queries Supabase for full user data
                               ↓
                        Returns: { isLoggedIn, user, club, livingGroup, frozenForms }
```

### Logout (`/api/auth/logout`)

```
1. Clears technique_session (admin/club)
2. Clears next_js_session (MIT SSO)
3. Signs out from Supabase Auth
4. Redirects to /en
```

---

## Client-Side Usage

### useUser Hook

```tsx
import { useUser } from '@/hooks/useUser';

function MyComponent() {
  const {
    isLoggedIn,    // boolean
    user,          // User object (from Supabase)
    club,          // Club object (if role=club)
    livingGroup,   // LivingGroup object (if role=living_group_leader)
    frozenForms,   // FormSetting[] (admin form freeze status)
    loading,       // boolean
    logout,        // () => void
    refetch,       // () => void
  } = useUser();
}
```

---

## Database Tables

### users

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `email` | varchar | Unique identifier |
| `role` | varchar | `admin`, `club`, `living_group_leader`, `student` |
| `auth_provider` | varchar | `mit_sso` or `supabase_auth` |
| `supabase_auth_id` | uuid | Links to Supabase auth.users (for magic links) |
| `first_name`, `last_name` | varchar | User name |
| `major`, `quote`, etc. | text | Student bio fields |

### clubs

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to users (club account owner) |
| `club_id` | varchar | Unique identifier (e.g., `CLUB-1737500000000`) |
| `name` | varchar | Club display name |
| `has_leader` | boolean | Whether club has added MIT student leader |
| `approval_status` | varchar | `pending`, `approved`, `denied` |

---

## API Route Reference

### Auth Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/login` | GET | Initiate MIT SSO |
| `/api/userSignIn` | GET | MIT SSO callback |
| `/api/auth/admin-login` | POST | Send admin magic link |
| `/api/auth/club-signup` | POST | Send club signup magic link |
| `/api/auth/club-login` | POST | Send club login magic link |
| `/api/auth/callback` | GET | Handle magic link callbacks |
| `/api/auth/session` | GET | Get current session + user data |
| `/api/auth/logout` | GET/POST | Clear all sessions |

### Legacy Endpoints (MIT SSO only)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/session` | GET | Get next_js_session only |
| `/api/logout` | GET | Clear next_js_session + OIDC logout |

---

## Critical Import Rules

**MIT SSO OAuth callback (`/api/userSignIn`):**
```typescript
// CORRECT - uses next_js_session for PKCE state
import { getSession } from "../../../lib/lib";
```

**Admin/Club magic link callback (`/api/auth/callback`):**
```typescript
// CORRECT - uses technique_session
import { getSession } from "../../../../lib/auth/session";
```

Mixing these up causes OAuth state mismatch errors.

---

## Club Onboarding Flow

1. Club signs up via magic link → `clubs.has_leader = false`
2. Club dashboard shows onboarding gate (other tabs disabled)
3. Club searches MIT students and adds first leader (direct add, no acceptance)
4. `clubs.has_leader = true` → Full dashboard unlocked
5. Club becomes discoverable in student club search
