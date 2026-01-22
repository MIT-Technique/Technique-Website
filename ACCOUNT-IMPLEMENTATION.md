# Account System Implementation Plan

**Project:** MIT Technique Website
**Migration:** MongoDB/iron-session → Supabase
**Date:** January 22, 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Database Schema](#2-database-schema)
3. [SQL Setup Scripts](#3-sql-setup-scripts)
4. [Authentication Flow](#4-authentication-flow)
5. [API Routes](#5-api-routes)
6. [UI Components](#6-ui-components)
7. [File Changes](#7-file-changes)
8. [Translation Keys](#8-translation-keys)
9. [Migration Strategy](#9-migration-strategy)
10. [Verification](#10-verification)

---

## 1. Overview

### Authentication Strategy
- **Students**: MIT Petrock SSO (existing OpenID Connect flow)
- **Admin** (technique@mit.edu): Supabase Auth magic link
- **Clubs**: Supabase Auth email signup + promotion request

### User Roles

| Role | Description | Auth Method |
|------|-------------|-------------|
| `admin` | Full dashboard access, approve requests, manage times | Magic link |
| `club` | Organization profile, candid uploads | Email signup |
| `living_group_leader` | Book photoshoot times | MIT SSO (promoted) |
| `student` | Default role, senior bio form | MIT SSO |

### Key Features
- Account button to right of "Get Started" with thin border
- Admin dashboard replaces nav with profile dropdown
- Photoshoot time booking with conflict resolution
- Form freeze capability with grayed-out navigation
- Club 4-digit ID generation
- Living group leader view-only mode when disabled

---

## 2. Database Schema

### Table: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'student'
    CHECK (role IN ('admin', 'club', 'living_group_leader', 'student')),

  -- Profile fields
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  major VARCHAR(50),
  second_major VARCHAR(50),
  quote TEXT,
  achievements TEXT,
  school_year INTEGER,

  -- Auth
  auth_provider VARCHAR(50) NOT NULL DEFAULT 'mit_sso'
    CHECK (auth_provider IN ('mit_sso', 'supabase_auth')),
  supabase_auth_id UUID REFERENCES auth.users(id),

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_school_year ON users(school_year);
```

### Table: `clubs`
```sql
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  club_id CHAR(4) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  member_list TEXT,

  candid_image_1 TEXT,
  candid_image_2 TEXT,
  candid_image_3 TEXT,

  approval_status VARCHAR(50) DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'denied')),
  approval_notes TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clubs_user_id ON clubs(user_id);
CREATE INDEX idx_clubs_approval_status ON clubs(approval_status);
```

### Table: `living_groups`
```sql
CREATE TABLE living_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('active', 'disabled', 'pending')),

  promoted_by UUID REFERENCES users(id),
  promoted_at TIMESTAMPTZ,
  disabled_by UUID REFERENCES users(id),
  disabled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_living_groups_user_id ON living_groups(user_id);
CREATE INDEX idx_living_groups_status ON living_groups(status);
```

### Table: `photoshoot_times`
```sql
CREATE TABLE photoshoot_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  living_group_id UUID REFERENCES living_groups(id),
  booked_at TIMESTAMPTZ,
  booked_by UUID REFERENCES users(id),

  cancellation_requested BOOLEAN DEFAULT false,
  cancellation_request_reason TEXT,
  cancellation_approved BOOLEAN,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id),

  created_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_time_slot UNIQUE (date, start_time, end_time)
);

CREATE INDEX idx_photoshoot_times_date ON photoshoot_times(date);
CREATE INDEX idx_photoshoot_times_living_group ON photoshoot_times(living_group_id);
```

### Table: `promotion_requests`
```sql
CREATE TABLE promotion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  request_type VARCHAR(50) NOT NULL
    CHECK (request_type IN ('club_promotion', 'living_group_leader')),
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied')),

  request_reason TEXT,
  living_group_name VARCHAR(255),

  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promotion_requests_user_id ON promotion_requests(user_id);
CREATE INDEX idx_promotion_requests_status ON promotion_requests(status);
```

### Table: `form_settings`
```sql
CREATE TABLE form_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_name VARCHAR(100) NOT NULL UNIQUE,
  is_frozen BOOLEAN DEFAULT false,

  frozen_by UUID REFERENCES users(id),
  frozen_at TIMESTAMPTZ,
  unfrozen_by UUID REFERENCES users(id),
  unfrozen_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `sessions`
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  access_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  code_verifier TEXT,
  state TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

---

## 3. SQL Setup Scripts

### 3.1 Complete Schema Setup
```sql
-- Run all CREATE TABLE statements from Section 2 above

-- Initialize form settings
INSERT INTO form_settings (form_name) VALUES
  ('senior_bio'),
  ('club_submission'),
  ('student_work_feature'),
  ('living_group_photoshoot');
```

### 3.2 Helper Functions
```sql
-- Generate 4-digit club ID
CREATE OR REPLACE FUNCTION generate_club_id() RETURNS CHAR(4) AS $$
DECLARE
  new_id CHAR(4);
  id_exists BOOLEAN;
BEGIN
  LOOP
    new_id := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM clubs WHERE club_id = new_id) INTO id_exists;
    EXIT WHEN NOT id_exists;
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate club_id on insert
CREATE OR REPLACE FUNCTION set_club_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.club_id IS NULL THEN
    NEW.club_id := generate_club_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_club_id
  BEFORE INSERT ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION set_club_id();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_living_groups_updated_at BEFORE UPDATE ON living_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_photoshoot_times_updated_at BEFORE UPDATE ON photoshoot_times
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_promotion_requests_updated_at BEFORE UPDATE ON promotion_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_form_settings_updated_at BEFORE UPDATE ON form_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3.3 Sample User Data
```sql
-- 1. Admin User (technique@mit.edu)
-- NOTE: First trigger Supabase Auth magic link for technique@mit.edu,
-- then update the user record with the supabase_auth_id

INSERT INTO users (
  email, role, first_name, last_name, auth_provider, is_active
) VALUES (
  'technique@mit.edu',
  'admin',
  'Technique',
  'Admin',
  'supabase_auth',
  true
);

-- 2. Sample Club User
INSERT INTO users (
  email, role, first_name, last_name, auth_provider, is_active
) VALUES (
  'photoclub@mit.edu',
  'club',
  'MIT Photography',
  'Club',
  'supabase_auth',
  true
);

INSERT INTO clubs (
  user_id, name, description, member_list, approval_status
) VALUES (
  (SELECT id FROM users WHERE email = 'photoclub@mit.edu'),
  'MIT Photography Club',
  'A student organization dedicated to photography and visual arts at MIT.',
  'Alice Chen, Bob Smith, Carol Johnson, David Lee',
  'approved'
);

-- 3. Sample Living Group Leader
INSERT INTO users (
  email, role, first_name, last_name, major, school_year, auth_provider, is_active
) VALUES (
  'lgleader@mit.edu',
  'living_group_leader',
  'Jordan',
  'Taylor',
  '6-3',
  2026,
  'mit_sso',
  true
);

INSERT INTO living_groups (
  user_id, name, status, promoted_by, promoted_at
) VALUES (
  (SELECT id FROM users WHERE email = 'lgleader@mit.edu'),
  'Random Hall',
  'active',
  (SELECT id FROM users WHERE email = 'technique@mit.edu'),
  NOW()
);

-- 4. Sample Student User
INSERT INTO users (
  email, role, first_name, last_name, major, second_major,
  quote, achievements, school_year, auth_provider, is_active
) VALUES (
  'student@mit.edu',
  'student',
  'Alex',
  'Rivera',
  '6-3',
  '18',
  'Per aspera ad astra',
  'UROP in CSAIL, Technique Staff Photographer',
  2026,
  'mit_sso',
  true
);

-- 5. Sample Photoshoot Times
INSERT INTO photoshoot_times (date, start_time, end_time, created_by) VALUES
  ('2026-03-01', '10:00', '11:00', (SELECT id FROM users WHERE email = 'technique@mit.edu')),
  ('2026-03-01', '11:00', '12:00', (SELECT id FROM users WHERE email = 'technique@mit.edu')),
  ('2026-03-01', '14:00', '15:00', (SELECT id FROM users WHERE email = 'technique@mit.edu')),
  ('2026-03-02', '10:00', '11:00', (SELECT id FROM users WHERE email = 'technique@mit.edu')),
  ('2026-03-02', '11:00', '12:00', (SELECT id FROM users WHERE email = 'technique@mit.edu')),
  ('2026-03-02', '14:00', '15:00', (SELECT id FROM users WHERE email = 'technique@mit.edu'));

-- Book one slot for the sample living group
UPDATE photoshoot_times
SET
  living_group_id = (SELECT lg.id FROM living_groups lg
                     JOIN users u ON lg.user_id = u.id
                     WHERE u.email = 'lgleader@mit.edu'),
  booked_at = NOW(),
  booked_by = (SELECT id FROM users WHERE email = 'lgleader@mit.edu')
WHERE date = '2026-03-01' AND start_time = '10:00';

-- 6. Pending Promotion Requests
INSERT INTO promotion_requests (
  user_id, request_type, status, request_reason
) VALUES (
  (SELECT id FROM users WHERE email = 'student@mit.edu'),
  'living_group_leader',
  'pending',
  'I am the social chair for Burton Conner and would like to schedule our living group photo.'
);
```

### 3.4 Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE living_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE photoshoot_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (for API routes)
-- Anon key has no access by default
-- Policies will be enforced via API routes using service role
```

---

## 4. Authentication Flow

### 4.1 MIT SSO Flow (Students)
```
1. User clicks "Account" → "Sign In"
2. Redirect to /api/auth/login
3. Generate PKCE code_verifier, code_challenge, state
4. Store in Supabase sessions table (pending)
5. Redirect to MIT Petrock OIDC authorize endpoint
6. User authenticates at MIT
7. Petrock redirects to /api/auth/callback
8. Exchange auth code for tokens
9. Extract email from JWT claims
10. Upsert user in Supabase users table
11. Create session record
12. Set HTTP-only session cookie
13. Redirect based on role:
    - admin → /dashboard
    - club → /club
    - living_group_leader → /living-group
    - student → /account
```

### 4.2 Admin Magic Link Flow
```
1. Admin visits /admin-login
2. Enters technique@mit.edu
3. API calls Supabase Auth signInWithOtp
4. Admin receives magic link email
5. Clicks link → Supabase verifies
6. Callback updates user record with supabase_auth_id
7. Create session, redirect to /dashboard
```

### 4.3 Club Email Signup Flow
```
1. Club rep visits /club/signup
2. Enters club email (NOT student email - warning shown)
3. API creates pending user + sends magic link
4. User verifies email
5. User can now request promotion from account page
6. Admin approves → role changes to 'club'
```

---

## 5. API Routes

### Authentication
| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | GET | Initiate MIT SSO flow |
| `/api/auth/callback` | GET | Handle MIT SSO callback |
| `/api/auth/admin-login` | POST | Send admin magic link |
| `/api/auth/club-signup` | POST | Club email registration |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/logout` | GET | Clear session |

### User
| Route | Method | Description |
|-------|--------|-------------|
| `/api/user/profile` | GET | Get user profile |
| `/api/user/profile` | PUT | Update profile |
| `/api/user/request-promotion` | POST | Request role promotion |

### Club
| Route | Method | Description |
|-------|--------|-------------|
| `/api/clubs/profile` | GET | Get club profile |
| `/api/clubs/profile` | PUT | Update club info |
| `/api/clubs/images` | POST | Upload candid image |
| `/api/clubs/images/[slot]` | DELETE | Remove image |

### Living Group
| Route | Method | Description |
|-------|--------|-------------|
| `/api/living-groups/times` | GET | Get available times |
| `/api/living-groups/book` | POST | Book a time slot |
| `/api/living-groups/cancel-request` | POST | Request cancellation |

### Admin
| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/users` | GET | List all users |
| `/api/admin/users/[id]` | GET/PUT | Get/update user |
| `/api/admin/clubs` | GET | List all clubs |
| `/api/admin/clubs/[id]/approve` | POST | Approve club |
| `/api/admin/clubs/[id]/deny` | POST | Deny club |
| `/api/admin/living-groups` | GET | List all LGLs |
| `/api/admin/living-groups/[id]/promote` | POST | Promote to LGL |
| `/api/admin/living-groups/[id]/demote` | POST | Demote LGL |
| `/api/admin/living-groups/[id]/disable` | POST | Disable LGL |
| `/api/admin/living-groups/[id]/enable` | POST | Re-enable LGL |
| `/api/admin/photoshoot-times` | GET/POST | List/create times |
| `/api/admin/photoshoot-times/[id]` | PUT/DELETE | Update/cancel time |
| `/api/admin/photoshoot-times/[id]/approve-cancel` | POST | Approve cancellation |
| `/api/admin/form-settings` | GET/PUT | Get/update frozen forms |
| `/api/admin/promotion-requests` | GET | List pending requests |

---

## 6. UI Components

### 6.1 Directory Structure
```
src/
├── components/
│   ├── Account/
│   │   ├── AccountButton.jsx       # Right of Get Started
│   │   ├── ProfileDropdown.jsx     # Logged-in dropdown
│   │   └── LoginButton.jsx         # Thin border login
│   │
│   ├── Dashboard/
│   │   ├── AdminDashboard.jsx
│   │   ├── PhotoshootManager.jsx
│   │   ├── ClubsManager.jsx
│   │   ├── LGLManager.jsx
│   │   ├── FormFreezeManager.jsx
│   │   └── PromotionRequests.jsx
│   │
│   ├── Club/
│   │   ├── ClubProfileForm.jsx
│   │   ├── CandidImageUploader.jsx
│   │   └── PromotionRequest.jsx
│   │
│   ├── LivingGroup/
│   │   ├── TimeSlotPicker.jsx
│   │   └── CancellationRequest.jsx
│   │
│   └── Forms/
│       ├── FormWrapper.jsx         # Checks frozen status
│       └── FrozenFormOverlay.jsx   # Gray overlay
│
├── app/[locale]/
│   ├── account/page.jsx            # Account settings
│   ├── admin-login/page.jsx        # Admin magic link
│   ├── dashboard/
│   │   ├── page.jsx                # Admin dashboard
│   │   ├── users/page.jsx
│   │   ├── clubs/page.jsx
│   │   ├── living-groups/page.jsx
│   │   ├── photoshoots/page.jsx
│   │   └── settings/page.jsx
│   ├── club/
│   │   ├── page.jsx                # Club profile
│   │   └── signup/page.jsx         # Club registration
│   └── living-group/page.jsx       # LGL dashboard
│
├── hooks/
│   ├── useSession.ts               # Refactor for Supabase
│   ├── useUser.ts                  # Get user with role
│   ├── useAdmin.ts                 # Admin-specific
│   └── useFormFrozen.ts            # Check frozen status
│
└── lib/
    └── supabase/
        ├── client.ts               # Browser client
        ├── server.ts               # Server client
        └── admin.ts                # Service role client
```

### 6.2 Navbar Modification

**File:** `src/components/Navbar_and_Sidebar/Navbar_new.jsx`

Add after "Get Started" dropdown:
```jsx
{/* Account Button - After Get Started */}
<AccountButton isHomePage={isHomePage} />
```

**AccountButton Component:**
```jsx
function AccountButton({ isHomePage }) {
  const { user, isLoading } = useUser();
  const locale = useLocale();
  const t = useTranslations('nav');

  if (isLoading) return null;

  // Not logged in - show login button with border
  if (!user) {
    return (
      <Link
        href={`/${locale}/login`}
        className={`nav-item text-xs uppercase tracking-widest font-medium
          transition-colors border rounded px-3 py-1.5 ${
          isHomePage
            ? "border-white/50 text-white/70 hover:text-white hover:border-white"
            : "border-text-secondary text-text-secondary hover:text-text-primary hover:border-text-primary"
        }`}
      >
        {t('account')}
      </Link>
    );
  }

  // Admin - show profile dropdown
  if (user.role === 'admin') {
    return <AdminProfileDropdown user={user} isHomePage={isHomePage} />;
  }

  // Other users - show regular dropdown
  return <ProfileDropdown user={user} isHomePage={isHomePage} />;
}
```

### 6.3 Admin Navbar Behavior

When admin is logged in, the navbar right section shows only:
- Profile dropdown with:
  - Dashboard link
  - Sign Out button

```jsx
function AdminProfileDropdown({ user, isHomePage }) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations('nav');

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-2 text-xs uppercase tracking-widest">
        <span>{user.first_name || 'Admin'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white border rounded shadow-lg min-w-[160px]">
          <Link href={`/${locale}/dashboard`} className="block px-4 py-2 hover:bg-gray-50">
            {t('dashboard')}
          </Link>
          <a href="/api/auth/logout" className="block px-4 py-2 hover:bg-gray-50">
            {t('signOut')}
          </a>
        </div>
      )}
    </div>
  );
}
```

### 6.4 Form Freeze UI

**FormWrapper Component:**
```jsx
function FormWrapper({ formName, children }) {
  const { isFrozen, isLoading } = useFormFrozen(formName);
  const t = useTranslations('forms.frozen');

  if (isLoading) return <LoadingSpinner />;

  if (isFrozen) {
    return (
      <div className="relative">
        <div className="opacity-40 pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
          <div className="text-center p-8">
            <h3 className="text-xl font-medium mb-2">{t('title')}</h3>
            <p className="text-text-secondary">{t('message')}</p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
```

**Navigation Graying:**
```jsx
// In nav link rendering, check frozen status
const { frozenForms } = useFormSettings();

const isFormFrozen = (href) => {
  if (href.includes('/bio') && frozenForms.includes('senior_bio')) return true;
  if (href.includes('/clubs') && frozenForms.includes('club_submission')) return true;
  // etc.
  return false;
};

// Apply grayed-out styling
className={`${isFormFrozen(item.href) ? 'opacity-40 pointer-events-none' : ''}`}
```

---

## 7. File Changes

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/Navbar_and_Sidebar/Navbar_new.jsx` | Add AccountButton after Get Started |
| `src/components/Navbar_and_Sidebar/Sidebar.jsx` | Add mobile account section |
| `src/hooks/useSession.ts` | Refactor for Supabase |
| `src/app/[locale]/bio/page.jsx` | Wrap with FormWrapper, add school_year |
| `src/app/[locale]/login/page.jsx` | Update for new auth flow |
| `src/middleware.js` | Add role-based route protection |
| `.env` | Add Supabase credentials |

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server Supabase client |
| `src/lib/supabase/admin.ts` | Service role client |
| `src/components/Account/AccountButton.jsx` | Account nav button |
| `src/components/Account/ProfileDropdown.jsx` | User dropdown |
| `src/components/Dashboard/*.jsx` | Admin dashboard components |
| `src/components/Forms/FormWrapper.jsx` | Frozen form wrapper |
| `src/app/[locale]/account/page.jsx` | Account page |
| `src/app/[locale]/dashboard/page.jsx` | Admin dashboard |
| `src/app/[locale]/club/page.jsx` | Club profile |
| `src/app/[locale]/living-group/page.jsx` | LGL dashboard |
| `src/app/api/auth/*.ts` | New auth routes |
| `src/app/api/admin/*.ts` | Admin routes |
| `src/hooks/useUser.ts` | User hook with role |
| `src/hooks/useFormFrozen.ts` | Form freeze hook |

### Files to Remove (after migration)

| File | Reason |
|------|--------|
| `src/lib/db.ts` | MongoDB connection |
| `src/app/api/getUserData/route.ts` | Replaced by /api/user/profile |
| `src/app/api/updateBio/route.ts` | Replaced by /api/user/profile |

---

## 8. Translation Keys

Add to `src/messages/en.json` (and es.json, zh.json):

```json
{
  "nav": {
    "account": "ACCOUNT",
    "dashboard": "DASHBOARD",
    "signOut": "SIGN OUT",
    "profile": "PROFILE"
  },

  "pages": {
    "account": {
      "title": "Account",
      "settings": "Settings",
      "requestPromotion": "Request Promotion",
      "promotionPending": "Your promotion request is pending review",
      "promotionDenied": "Your promotion request was not approved"
    },

    "adminLogin": {
      "title": "Admin Login",
      "description": "Enter your admin email to receive a login link.",
      "emailLabel": "Admin Email",
      "sendLink": "Send Login Link",
      "linkSent": "Check your email for the login link"
    },

    "dashboard": {
      "title": "Admin Dashboard",
      "welcome": "Welcome back",
      "photoshoots": "Photoshoot Times",
      "clubs": "Clubs",
      "livingGroups": "Living Group Leaders",
      "users": "Users",
      "formSettings": "Form Settings",
      "pendingRequests": "Pending Requests",
      "freezeForms": "Freeze Forms",
      "freezeWarning": "Freezing forms will prevent all submissions. Are you sure?",
      "cancelWarning": "This time slot is booked. Cancelling will notify the living group."
    },

    "club": {
      "title": "Club Profile",
      "signup": "Club Registration",
      "signupDescription": "Register your organization for the yearbook.",
      "signupWarning": "Please use your club's official email, not a personal student email.",
      "nameLabel": "Organization Name",
      "descriptionLabel": "Description",
      "memberListLabel": "Member List",
      "memberListHint": "Enter member names separated by commas",
      "imagesLabel": "Candid Images",
      "imagesHint": "Upload up to 3 images",
      "requestFeature": "Request Yearbook Feature",
      "pendingApproval": "Pending Approval",
      "approved": "Approved",
      "clubId": "Club ID"
    },

    "livingGroup": {
      "title": "Living Group Photoshoot",
      "selectTime": "Select a Time Slot",
      "noTimes": "No available time slots",
      "bookedTime": "Your Booked Time",
      "requestCancellation": "Request Cancellation",
      "cancellationPending": "Cancellation request pending",
      "viewOnlyMode": "Your account is in view-only mode. Contact the admin for changes.",
      "bookSuccess": "Time slot booked successfully",
      "cancelReason": "Reason for cancellation"
    }
  },

  "forms": {
    "frozen": {
      "title": "Form Unavailable",
      "message": "This form has been temporarily disabled. Please check back later."
    }
  }
}
```

---

## 9. Migration Strategy

### Phase 1: Setup (Days 1-2)
1. Install dependencies:
   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   ```
2. Add environment variables to `.env`
3. Run schema SQL in Supabase dashboard
4. Create Supabase Storage bucket for club images

### Phase 2: Supabase Clients (Days 2-3)
1. Create `src/lib/supabase/client.ts`
2. Create `src/lib/supabase/server.ts`
3. Create `src/lib/supabase/admin.ts`

### Phase 3: Auth Routes (Days 3-5)
1. Create new `/api/auth/*` routes
2. Keep MIT SSO flow, change session storage to Supabase
3. Implement admin magic link
4. Update `useSession` hook

### Phase 4: Data Migration (Days 5-6)
1. Export MongoDB data
2. Decrypt firstName/lastName
3. Transform and import to Supabase
4. Verify data integrity

### Phase 5: API Routes (Days 6-8)
1. Create user profile routes
2. Create club routes
3. Create living group routes
4. Create admin routes

### Phase 6: UI Components (Days 8-12)
1. Create AccountButton
2. Modify Navbar
3. Build admin dashboard
4. Build club pages
5. Build LGL pages
6. Implement form freeze

### Phase 7: Testing (Days 12-14)
1. Test all auth flows
2. Test role-based access
3. Test form freeze
4. Test booking conflicts
5. Test all CRUD operations

### Phase 8: Deployment (Day 14+)
1. Final data sync
2. Switch production to Supabase
3. Monitor for issues
4. Decommission MongoDB after 2 weeks

---

## 10. Verification

### Test Cases

#### Authentication
- [ ] MIT SSO login creates/updates user
- [ ] Admin magic link works for technique@mit.edu
- [ ] Club email signup sends verification
- [ ] Session persists across page refreshes
- [ ] Logout clears session

#### Roles & Permissions
- [ ] Students can only access bio form (if Class of 2026)
- [ ] Non-2026 students see disabled bio form
- [ ] Clubs can edit their profile
- [ ] LGLs can book available times
- [ ] Disabled LGLs see view-only mode
- [ ] Admins can access all dashboard features

#### Photoshoot Booking
- [ ] Available times show correctly
- [ ] Booking marks time as taken
- [ ] Double-booking is prevented
- [ ] Cancellation request flows to admin
- [ ] Admin can directly cancel (with warning)

#### Form Freeze
- [ ] Frozen forms show overlay
- [ ] Navigation to frozen forms is grayed
- [ ] Admin can toggle freeze
- [ ] Warning shown before freezing

#### UI
- [ ] Account button appears right of Get Started
- [ ] Login button has thin border
- [ ] Admin sees profile dropdown instead of full nav
- [ ] Mobile sidebar has account section

### Manual Verification Steps
1. Visit site as anonymous user → see login button
2. Click login → redirects to MIT SSO
3. Complete SSO → returns to account page
4. As student, try to access /dashboard → denied
5. As admin, login via magic link → access dashboard
6. Create photoshoot times → visible to LGLs
7. As LGL, book a time → appears in admin view
8. Freeze senior_bio form → students see overlay
9. As club, upload images → stored in Supabase Storage

---

## Environment Variables

```env
# Supabase (add to existing .env)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Keep existing MIT SSO config
AUTH_OIDC_ISSUER=https://petrock.mit.edu
OIDC_CLIENT_ID=...
OIDC_CLIENT_SECRET=...
```

---

## Summary

This implementation plan covers:
- Complete Supabase schema with 7 tables
- SQL scripts for setup and sample data
- Dual authentication (MIT SSO + Supabase Auth)
- 4 user roles with distinct permissions
- 30+ API routes
- Admin dashboard with full management capabilities
- Form freeze with visual feedback
- Living group photoshoot booking with conflict resolution
- Club registration with approval workflow
- UI modifications for account button placement

The migration preserves the existing MIT SSO flow while adding Supabase for data storage and additional authentication methods.
