# MIT Technique Website - Project Documentation

**Last Updated:** January 29, 2026
**Tech Stack:** Next.js 14.2.3 (App Router) + next-intl 4.7.0 + Supabase
**Internationalization:** 3 active languages (en, es, zh)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Internationalization (i18n)](#internationalization-i18n)
4. [Page Routes](#page-routes)
5. [Components](#components)
6. [API Routes](#api-routes)
7. [Hooks & Utilities](#hooks--utilities)
8. [Database & Types](#database--types)
9. [Authentication System](#authentication-system)
10. [Configuration Files](#configuration-files)
11. [Development Workflow](#development-workflow)
12. [Notes for AI Assistants](#notes-for-ai-assistants)

---

## Project Overview

The MIT Technique website is a multilingual Next.js application serving as the official platform for MIT's photography and yearbook organization. The site features:

- **3 Language Support:** English, Spanish, Chinese (Simplified)
- **Dynamic Locale Routing:** URL-based language selection (`/en/about`, `/es/about`, etc.)
- **Dual Auth:** MIT SSO for students + Supabase Auth for organizations (clubs, living groups, sports)
- **Organization Dashboards:** Clubs, living groups, and sports teams each have management pages
- **Admin Dashboard:** Full admin panel for managing users, organizations, photoshoots, and settings
- **Supabase Backend:** PostgreSQL database with storage buckets for images

---

## Directory Structure

```
Technique-Website/
├── public/                          # Static assets
│   ├── images/
│   │   ├── covers/                 # Yearbook cover images (1885-present)
│   │   ├── club_photo/             # Organization photos
│   │   ├── other_images/           # Event & portfolio photography
│   │   └── Senior_Pictures/        # Senior portrait photos
│   ├── pdfs/                       # PDF documents
│   └── fonts/                      # Custom fonts
│
├── scripts/                         # Utility scripts
│   ├── create-org-accounts.js      # Create club/LG accounts
│   ├── create-living-group-accounts.js
│   ├── create-sports-accounts.js   # Create sports team accounts
│   └── download-images.js          # Image downloader
│
├── src/
│   ├── app/
│   │   ├── [locale]/               # Localized pages (27 pages)
│   │   │   ├── page.js            # Homepage
│   │   │   ├── layout.js          # Root layout with locale support
│   │   │   ├── about/             # About page
│   │   │   ├── alumni/            # Alumni information
│   │   │   ├── alumni-inquiry/    # Alumni inquiry form
│   │   │   ├── archives/          # Yearbook archives (1885-present)
│   │   │   ├── bio/               # Senior bio form (requires login)
│   │   │   ├── club/              # Club dashboard (role: club)
│   │   │   ├── clubs/             # Clubs listing (public)
│   │   │   ├── contact/           # Contact information
│   │   │   ├── dashboard/         # Admin dashboard (role: admin)
│   │   │   ├── hire/              # Event photography services
│   │   │   ├── invoice/           # Photographer invoice submission
│   │   │   ├── join/              # Join/signup page
│   │   │   ├── living-group/      # Living group dashboard (role: living_group)
│   │   │   ├── login/             # Login pages (main, student, admin)
│   │   │   ├── logout/            # Logout page
│   │   │   ├── parent-inquiry/    # Parent inquiry form
│   │   │   ├── parents/           # Parent information
│   │   │   ├── portfolio/         # Photography portfolio
│   │   │   ├── privacy/           # Privacy policy
│   │   │   ├── profile/           # User profile
│   │   │   ├── resources/         # Resources page
│   │   │   ├── seniors/           # Senior portrait information
│   │   │   ├── sports/            # Sports team dashboard (role: sports)
│   │   │   ├── student-work-feature/ # Student work showcase
│   │   │   └── yearbook/          # Yearbook information & ordering
│   │   │
│   │   ├── api/                    # API routes (see API Routes section)
│   │   ├── common/                 # Shared utilities
│   │   └── globals.css            # Global styles
│   │
│   ├── components/
│   │   ├── AccountButton/          # Account/user button
│   │   ├── ConfirmationModal/      # MUI confirmation dialog (isDangerous mode)
│   │   ├── CookieConsent/          # Cookie consent banner
│   │   ├── CoverCard/              # Yearbook cover card
│   │   ├── Footer/                 # Site footer
│   │   ├── ImageUpload/            # Drag-and-drop image upload (5MB, JPEG/PNG/WebP/GIF)
│   │   ├── LanguageSwitcher/       # Language dropdown selector
│   │   ├── Navbar_and_Sidebar/     # Navigation (Navbar_new.jsx, Sidebar.jsx)
│   │   ├── OrganizationAuthModal/  # Organization login modal (clubs, LGs, sports)
│   │   └── PhotographerTimesSection/ # Photographer booking section
│   │
│   ├── hooks/
│   │   ├── useSession.ts           # Session management hook
│   │   └── useUser.ts              # User data hook (returns isLoggedIn, user, club, sports, livingGroup, frozenForms)
│   │
│   ├── i18n/
│   │   ├── config.js               # i18n configuration (locales: en, es, zh)
│   │   └── request.js              # Server-side locale handler
│   │
│   ├── lib/
│   │   ├── admin-logs.ts           # Admin action logging
│   │   ├── db.ts                   # Database utilities
│   │   ├── lib.ts                  # General utilities + next_js_session config
│   │   ├── studentSchema.ts        # Zod validation for student data
│   │   ├── auth/
│   │   │   └── session.ts          # technique_session config
│   │   ├── supabase/
│   │   │   ├── admin.ts            # Supabase admin client (service role)
│   │   │   ├── client.ts           # Supabase browser client
│   │   │   ├── server.ts           # Supabase server client
│   │   │   └── types.ts            # TypeScript types for all entities
│   │   └── utils/
│   │       ├── nameParser.ts       # Bulk name parsing (parseBulkNames)
│   │       └── time.ts             # Time/date utilities (EST formatting)
│   │
│   └── messages/                    # Translation files
│       ├── en.json                 # English (default, active)
│       ├── es.json                 # Spanish (active)
│       ├── zh.json                 # Chinese Simplified (active)
│       ├── ar.json                 # Arabic (inactive)
│       ├── fr.json                 # French (inactive)
│       ├── hi.json                 # Hindi (inactive)
│       ├── ja.json                 # Japanese (inactive)
│       ├── ko.json                 # Korean (inactive)
│       └── pt.json                 # Portuguese (inactive)
│
├── middleware.js                   # Next.js middleware for locale routing
├── next.config.mjs                 # Next.js configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── package.json                    # Dependencies
└── .env                           # Environment variables
```

---

## Internationalization (i18n)

### Active Locales

Only 3 locales are active (configured in `/src/i18n/config.js`):

- `en` - English (default)
- `es` - Spanish
- `zh` - Chinese (Simplified)

6 additional translation files exist (`ar`, `fr`, `hi`, `ja`, `ko`, `pt`) but are not in the active locale list.

### How Locale Routing Works

1. **URL Pattern:** `/{locale}/{page}` (e.g., `/en/about`, `/es/yearbook`)
2. **Dynamic Segment:** `[locale]` directory handles all language variants
3. **Middleware:** Detects locale from URL/cookie/Accept-Language, redirects to add locale prefix
4. **SEO-Friendly:** Each locale has its own URL

### Translation File Structure

Top-level namespaces in each JSON file:

- `common` - Site metadata, branding
- `nav` - Navigation items, dropdown menus
- `footer` - Copyright, social links
- `languageSwitcher` - Language selector label
- `carousel` - Photo credits
- `pages.*` - Page-specific translations (home, about, yearbook, contact, hire, invoice, login, portfolio, seniors, bio, archives)
- `clubPage` - Club dashboard translations
- `livingGroupPage` - Living group dashboard translations
- `sportsPage` - Sports dashboard translations (profile, coaches, members, achievements, photos, documents tabs)
- `organizationAuth` - Organization login modal translations
- `profilePage` - User profile translations
- `dashboardPage` - Admin dashboard translations

### Translation Interpolation

```javascript
// Translation file: "photoCredit": "Photo: {photographer}"
t("photoCredit", { photographer: "Michelle Xiang" });
```

---

## Page Routes

### Public Pages

| Route                   | Description                     |
| ----------------------- | ------------------------------- |
| `/`                     | Homepage                        |
| `/about`                | About Us / organization history |
| `/alumni`               | Alumni information              |
| `/alumni-inquiry`       | Alumni inquiry form             |
| `/archives`             | Yearbook archive (1885-present) |
| `/clubs`                | Public clubs listing            |
| `/contact`              | Contact information             |
| `/hire`                 | Event photography services      |
| `/join`                 | Join/signup page                |
| `/parent-inquiry`       | Parent inquiry form             |
| `/parents`              | Parent information              |
| `/portfolio`            | Photography portfolio           |
| `/privacy`              | Privacy policy                  |
| `/resources`            | Resources page                  |
| `/seniors`              | Senior portrait information     |
| `/student-work-feature` | Student work showcase           |
| `/yearbook`             | Yearbook information & ordering |

### Auth Pages

| Route            | Description                            |
| ---------------- | -------------------------------------- |
| `/login`         | Main login (MIT SSO + org login modal) |
| `/login/student` | Student-only login (bio form redirect) |
| `/login/admin`   | Admin-only login (magic link)          |
| `/logout`        | Logout page                            |

### Role-Protected Pages

| Route           | Required Role  | Description                                          |
| --------------- | -------------- | ---------------------------------------------------- |
| `/bio`          | `staph`        | Senior bio form                                      |
| `/profile`      | any logged-in  | User profile                                         |
| `/club`         | `club`         | Club management dashboard                            |
| `/living-group` | `living_group` | Living group management dashboard                    |
| `/sports`       | `sports`       | Sports team management dashboard                     |
| `/dashboard`    | `admin`        | Admin dashboard (users, orgs, photoshoots, settings) |
| `/invoice`      | any logged-in  | Photographer invoice submission                      |

---

## Components

| Component                  | Purpose                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| `AccountButton`            | Account/user button in navbar                                      |
| `ConfirmationModal`        | MUI Dialog with `isDangerous` mode (red title)                     |
| `CookieConsent`            | Cookie consent banner                                              |
| `CoverCard`                | Yearbook cover display card (archives page)                        |
| `Footer`                   | Site footer with copyright, email, Instagram                       |
| `ImageUpload`              | Drag-and-drop image upload (5MB max, JPEG/PNG/WebP/GIF)            |
| `LanguageSwitcher`         | Dropdown language selector                                         |
| `Navbar_and_Sidebar`       | Desktop navbar (`Navbar_new.jsx`) + mobile sidebar (`Sidebar.jsx`) |
| `OrganizationAuthModal`    | Login modal for clubs, living groups, and sports teams             |
| `PhotographerTimesSection` | Photographer booking/scheduling section                            |

---

## API Routes

Located in `/src/app/api/` - **NOT localized** (language-agnostic).

### Legacy / Standalone

| Route                  | Method | Purpose                          |
| ---------------------- | ------ | -------------------------------- |
| `/api/bio`             | GET    | Fetch senior bio data            |
| `/api/getUserData`     | GET    | Fetch user data from MongoDB     |
| `/api/login`           | GET    | Initiates MIT SSO login flow     |
| `/api/logout`          | GET    | Destroys session and redirects   |
| `/api/sendContactForm` | POST   | Send contact form email          |
| `/api/sendInvoice`     | POST   | Sends photographer invoice email |
| `/api/session`         | GET    | Checks current session status    |
| `/api/updateBio`       | POST   | Updates senior bio in database   |
| `/api/userSignIn`      | GET    | Handles MIT SSO callback         |

### Auth (`/api/auth/`)

| Route                 | Method | Purpose                                           |
| --------------------- | ------ | ------------------------------------------------- |
| `admin-login`         | POST   | Admin magic link login                            |
| `callback`            | GET    | OAuth callback handler                            |
| `change-password`     | POST   | Organization password change                      |
| `club-login`          | POST   | Club login (legacy)                               |
| `club-signup`         | POST   | Club signup (legacy)                              |
| `logout`              | POST   | Technique session logout                          |
| `org-forgot-password` | POST   | Organization password reset                       |
| `org-signin`          | POST   | Unified organization login (club, LG, sports)     |
| `org-signup`          | POST   | Organization signup                               |
| `session`             | GET    | Technique session check (returns user + org data) |

### Admin (`/api/admin/`)

| Route                | Method              | Purpose                            |
| -------------------- | ------------------- | ---------------------------------- |
| `clubs`              | GET/PUT             | Manage clubs (approve/deny)        |
| `designate-admin`    | POST                | Promote user to admin              |
| `form-settings`      | GET/PUT             | Freeze/unfreeze organization forms |
| `living-groups`      | GET/PUT             | Manage living groups               |
| `logs`               | GET                 | View admin action logs             |
| `photoshoot-times`   | GET/POST/PUT/DELETE | Manage photoshoot time slots       |
| `promotion-requests` | GET/PUT             | Review staph/photographer requests |
| `toggle-staph`       | POST                | Toggle user staph status           |
| `users`              | GET/PUT             | View and manage users              |

### Clubs (`/api/clubs/`)

| Route            | Method          | Purpose                          |
| ---------------- | --------------- | -------------------------------- |
| `demote-leader`  | POST            | Demote club leader               |
| `documents`      | GET/PUT         | Internal document links/notes    |
| `email`          | GET/POST        | Contact email management         |
| `export-members` | GET             | Export member list               |
| `images`         | POST/DELETE     | Image upload/delete (3 slots)    |
| `manual-members` | GET/POST/DELETE | Manual member management         |
| `profile`        | GET/PUT         | Club profile (name, description) |
| `search`         | GET             | Search clubs                     |

### Living Groups (`/api/living-groups/`)

| Route                | Method              | Purpose                         |
| -------------------- | ------------------- | ------------------------------- |
| `book`               | POST                | Book a photoshoot time          |
| `cancel-request`     | POST                | Request photoshoot cancellation |
| `check-availability` | GET                 | Check time slot availability    |
| `documents`          | GET/PUT             | Internal document links/notes   |
| `email`              | GET/POST            | Contact email management        |
| `images`             | POST/DELETE         | Section image upload/delete     |
| `manual-members`     | GET/POST/DELETE     | Manual member management        |
| `propose-time`       | POST                | Propose photoshoot time         |
| `search`             | GET                 | Search living groups            |
| `sections`           | GET/POST/PUT/DELETE | Manage dorm sections            |
| `time-assignments`   | GET/POST/DELETE     | Manage time slot assignments    |
| `times`              | GET                 | View available times            |

### Sports (`/api/sports/`)

| Route            | Method              | Purpose                                                         |
| ---------------- | ------------------- | --------------------------------------------------------------- |
| `coaches`        | GET/POST/PUT/DELETE | Coach management (name, role, order)                            |
| `documents`      | GET/PUT             | Internal document links/notes                                   |
| `email`          | GET/POST            | Contact email management                                        |
| `images`         | POST/DELETE         | Image upload/delete (3 slots × team)                            |
| `manual-members` | GET/POST/DELETE     | Manual member management (with team filter)                     |
| `profile`        | GET/PUT             | Sports profile (description, gender teams toggle, achievements) |

### Other

| Route                         | Method   | Purpose                                            |
| ----------------------------- | -------- | -------------------------------------------------- |
| `/api/organizations/list`     | GET      | List all orgs (clubs, LGs, sports) for login modal |
| `/api/photographer/proposals` | GET/POST | Photographer time proposals                        |
| `/api/photographer/status`    | GET      | Photographer permission status                     |
| `/api/photographer/times`     | GET      | Photographer available times                       |
| `/api/user/profile`           | GET/PUT  | User profile management                            |
| `/api/user/request-promotion` | POST     | Request staph/photographer promotion               |

---

## Hooks & Utilities

### Hooks

- **`useSession`** - Returns session data from `/api/auth/session`
- **`useUser`** - Returns `{ isLoggedIn, user, club, sports, livingGroup, frozenForms, loading, logout, refetch }`

### Utility Libraries

- **`/src/lib/lib.ts`** - `next_js_session` iron-session config, MIT SSO client config
- **`/src/lib/auth/session.ts`** - `technique_session` iron-session config
- **`/src/lib/db.ts`** - MongoDB connection
- **`/src/lib/admin-logs.ts`** - Admin action logging helper
- **`/src/lib/studentSchema.ts`** - Zod schema for student bio validation
- **`/src/lib/supabase/admin.ts`** - Supabase admin client (service role key)
- **`/src/lib/supabase/client.ts`** - Supabase browser client
- **`/src/lib/supabase/server.ts`** - Supabase server client
- **`/src/lib/supabase/types.ts`** - TypeScript types for all entities
- **`/src/lib/utils/nameParser.ts`** - `parseBulkNames()` for bulk member import
- **`/src/lib/utils/time.ts`** - Time/date formatting (EST)

---

## Database & Types

### User Roles

```typescript
type UserRole =
  | "admin"
  | "staph"
  | "club"
  | "living_group"
  | "sports";
```

- `admin` - Full dashboard access, user management, org approval
- `staph` - Default role for individual users (MIT SSO), profile/bio access, dashboard access with permissions
- `club` - Club management dashboard
- `living_group` - Living group management dashboard
- `sports` - Sports team management dashboard

### Core Entities (Supabase/PostgreSQL)

| Table                           | Purpose                                                    |
| ------------------------------- | ---------------------------------------------------------- |
| `users`                         | All users (MIT SSO + org accounts)                         |
| `sessions`                      | OAuth session storage                                      |
| `clubs`                         | Club profiles (name, description, images, documents)       |
| `club_manual_members`           | Manual member entries for clubs                            |
| `living_groups`                 | Living group profiles (dorm/FSILG)                         |
| `living_group_manual_members`   | Manual member entries for LGs                              |
| `sports`                        | Sports team profiles (with gender team support)            |
| `sports_coaches`                | Coach entries (name, role, display_order)                  |
| `sports_manual_members`         | Manual member entries (with team filter: mens/womens/null) |
| `photoshoot_times`              | Photoshoot time slots                                      |
| `time_proposals`                | Bidirectional scheduling proposals                         |
| `living_group_time_assignments` | Time slot assignments for LG sections                      |
| `form_settings`                 | Form freeze/unfreeze settings                              |
| `promotion_requests`            | Staph/photographer promotion requests                      |
| `photographer_permissions`      | Photographer access permissions                            |
| `admin_logs`                    | Admin action audit trail                                   |

### Storage Buckets

| Bucket                | Purpose                             | Path Pattern                                              |
| --------------------- | ----------------------------------- | --------------------------------------------------------- |
| `club-images`         | Club candid photos (3 slots)        | `clubs/{safeName}_Candid{suffix}.{ext}`                   |
| `living-group-images` | LG section photos                   | `{dorms\|fsilgs}/{safeName}_{section}_Candid.{ext}`       |
| `sports-images`       | Sports team photos (3 slots × team) | `sports/{safeName}/{mens\|womens\|}/Candid{suffix}.{ext}` |

### Sports-Specific Schema

The `sports` table supports optional gender teams via `has_gender_teams` boolean:

- When `false`: uses `candid_image_1-3`, `achievement_summary`, members with `team = NULL`
- When `true`: uses `mens_candid_image_1-3`, `womens_candid_image_1-3`, `mens_achievement_summary`, `womens_achievement_summary`, members with `team = 'mens'` or `'womens'`
- Coaches are always shared (not team-specific)

---

## Authentication System

### CRITICAL: Dual Session System

⚠️ **DO NOT MODIFY WITHOUT EXTREME CARE** ⚠️

This project uses **two separate iron-session cookies**. Mixing them up will break authentication.

| Session             | Cookie Name         | Source File               | Purpose                                                |
| ------------------- | ------------------- | ------------------------- | ------------------------------------------------------ |
| `next_js_session`   | `next_js_session`   | `src/lib/lib.ts`          | MIT SSO OAuth (stores `state`, `code_verifier`)        |
| `technique_session` | `technique_session` | `src/lib/auth/session.ts` | Organization login, admin magic links, role-based auth |

### Critical Import Rules

**For MIT SSO OAuth callback (`/api/userSignIn`):**

```typescript
// ✅ CORRECT - MIT SSO uses next_js_session
import { getClientConfig, getSession } from "../../../lib/lib";

// ❌ WRONG - This will cause OAuth state mismatch errors
import { getSession } from "../../../lib/auth/session";
```

**For admin/role-based auth (`/api/auth/*`):**

```typescript
// ✅ CORRECT - Admin magic links use technique_session
import { getSession } from "../../../lib/auth/session";
```

### MIT SSO OAuth Flow

1. `/api/login` stores `state` and `code_verifier` in `next_js_session` (via `lib/lib.ts`)
2. User authenticates with MIT SSO
3. `/api/userSignIn` reads `state` and `code_verifier` from `next_js_session` to validate OAuth response
4. If step 3 uses wrong `getSession`, you get: `OperationProcessingError: unexpected "state" response parameter`

### Organization Login Flow

1. User clicks "Organization Login" on login page → opens `OrganizationAuthModal`
2. Modal fetches org list from `/api/organizations/list` (clubs, living groups, sports)
3. User selects org, enters password → POST to `/api/auth/org-signin`
4. On success, redirects to org dashboard (`/club`, `/living-group`, or `/sports`)
5. "Unexpected issues?" link opens mailto to `tnq-exec@mit.edu`

### Login Page Structure

| Route            | Purpose                                | Auth Method                               |
| ---------------- | -------------------------------------- | ----------------------------------------- |
| `/login`         | Main login page                        | MIT SSO button + Organization login modal |
| `/login/student` | Student-only login (bio form redirect) | MIT SSO only                              |
| `/login/admin`   | Admin-only login                       | Magic link form (technique@mit.edu)       |

---

## Configuration Files

### `/next.config.mjs`

```javascript
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./src/i18n/request.js");
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      { source: "/", destination: "/en", permanent: false },
      {
        source: "/portrait",
        destination: "https://seniors.legacystudios.com/...",
        permanent: false,
      },
    ];
  },
};
export default withNextIntl(nextConfig);
```

### Key Dependencies

| Package                 | Purpose                          |
| ----------------------- | -------------------------------- |
| `next` 14.2.3           | App framework                    |
| `next-intl` ^4.7.0      | Internationalization             |
| `@supabase/supabase-js` | Supabase client                  |
| `@supabase/ssr`         | Supabase SSR helpers             |
| `iron-session`          | Encrypted session cookies        |
| `mongodb`               | MongoDB driver (legacy bio data) |
| `openid-client`         | MIT SSO OIDC integration         |
| `nodemailer`            | Email sending                    |
| `pdf-lib`               | PDF generation                   |
| `zod`                   | Schema validation                |
| `@mui/material`         | UI components (dialogs, etc.)    |
| `framer-motion`         | Animations                       |
| `react-icons`           | Icon library                     |

---

## Development Workflow

### Setup

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # Production build
npm start         # Production server
```

### Adding a New Translation

1. Add keys to `/src/messages/en.json`
2. Add translated keys to `es.json` and `zh.json`
3. Use in component: `const t = useTranslations('namespace'); t('key')`

### Adding a New Page

1. Create `src/app/[locale]/new-page/page.jsx`
2. Add translations to all 3 active language files
3. Update navigation (Navbar, Sidebar) if needed

### Build Troubleshooting

- **MODULE_NOT_FOUND:** `rm -rf .next node_modules package-lock.json && npm install && npm run build`
- **404 on locale routes:** Check middleware matcher configuration
- **Missing translations:** Verify key exists in all 3 JSON files (en, es, zh)
- **Image 404s:** Verify file exists in `/public/images/` (case-sensitive)

---

## Notes for AI Assistants

1. **Always preserve locale structure** - pages must be in `[locale]` directory
2. **Update all 3 active translation files** (en.json, es.json, zh.json) when adding new text
3. **Use locale-aware routing** - include `/${locale}/` prefix in all links
4. **Keep API routes separate** - they are NOT localized
5. **Follow existing patterns** - use `useTranslations` hook consistently
6. **NEVER change `getSession` imports in `/api/userSignIn`** - must use `lib/lib.ts`
7. **Understand the dual session system** - see Authentication System section
8. **Update Times Properly** - All posted times should be in EST, and all times shown should explicitly mention EST
9. **Organization pattern** - clubs, living groups, and sports all follow similar patterns: profile, email, documents, images, manual-members API routes + a dashboard page
10. **Sports gender teams** - the `has_gender_teams` toggle affects members, photos, and achievements (coaches are always shared)

---

## Supabase Schema

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_logs (
id uuid NOT NULL DEFAULT gen_random_uuid(),
actor_id uuid NOT NULL,
action_type character varying NOT NULL,
target_type character varying NOT NULL,
target_id uuid,
details jsonb DEFAULT '{}'::jsonb,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT admin_logs_pkey PRIMARY KEY (id),
CONSTRAINT admin_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id)
);
CREATE TABLE public.club_manual_members (
id uuid NOT NULL DEFAULT gen_random_uuid(),
club_id uuid NOT NULL,
name text NOT NULL,
added_at timestamp with time zone DEFAULT now(),
section_name text,
CONSTRAINT club_manual_members_pkey PRIMARY KEY (id),
CONSTRAINT club_manual_members_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id)
);
CREATE TABLE public.club_memberships (
id uuid NOT NULL DEFAULT gen_random_uuid(),
club_id uuid NOT NULL,
user_id uuid NOT NULL,
role text NOT NULL DEFAULT 'member'::text CHECK (role = ANY (ARRAY['member'::text, 'leader'::text])),
joined_at timestamp with time zone DEFAULT now(),
CONSTRAINT club_memberships_pkey PRIMARY KEY (id),
CONSTRAINT club_memberships_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id),
CONSTRAINT club_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.clubs (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
name character varying NOT NULL,
description text,
candid_image_1 text,
candid_image_2 text,
candid_image_3 text,
approval_status character varying DEFAULT 'pending'::character varying CHECK (approval_status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'denied'::character varying]::text[])),
approval_notes text,
approved_by uuid,
approved_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
document_links text,
document_notes text,
CONSTRAINT clubs_pkey PRIMARY KEY (id),
CONSTRAINT clubs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
CONSTRAINT clubs_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);
CREATE TABLE public.community_candids (
id uuid NOT NULL DEFAULT gen_random_uuid(),
email character varying NOT NULL UNIQUE,
event_name text,
event_type text,
image_urls ARRAY,
created_at timestamp with time zone DEFAULT now(),
event_description text,
CONSTRAINT community_candids_pkey PRIMARY KEY (id)
);
CREATE TABLE public.form_settings (
id uuid NOT NULL DEFAULT gen_random_uuid(),
form_name character varying NOT NULL UNIQUE,
is_frozen boolean DEFAULT false,
frozen_by uuid,
frozen_at timestamp with time zone,
unfrozen_by uuid,
unfrozen_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT form_settings_pkey PRIMARY KEY (id),
CONSTRAINT form_settings_frozen_by_fkey FOREIGN KEY (frozen_by) REFERENCES public.users(id),
CONSTRAINT form_settings_unfrozen_by_fkey FOREIGN KEY (unfrozen_by) REFERENCES public.users(id)
);
CREATE TABLE public.living_group_manual_members (
id uuid NOT NULL DEFAULT gen_random_uuid(),
living_group_id uuid NOT NULL,
name text NOT NULL,
section_name text,
added_at timestamp with time zone DEFAULT now(),
CONSTRAINT living_group_manual_members_pkey PRIMARY KEY (id),
CONSTRAINT living_group_manual_members_living_group_id_fkey FOREIGN KEY (living_group_id) REFERENCES public.living_groups(id)
);
CREATE TABLE public.living_group_memberships (
id uuid NOT NULL DEFAULT gen_random_uuid(),
living_group_id uuid NOT NULL,
user_id uuid NOT NULL,
membership_type character varying NOT NULL CHECK (membership_type::text = ANY (ARRAY['dorm'::character varying, 'fsilg'::character varying]::text[])),
status character varying NOT NULL DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'active'::character varying, 'removed'::character varying]::text[])),
joined_at timestamp with time zone DEFAULT now(),
approved_by uuid,
approved_at timestamp with time zone,
section_name text,
CONSTRAINT living_group_memberships_pkey PRIMARY KEY (id),
CONSTRAINT living_group_memberships_living_group_fkey FOREIGN KEY (living_group_id) REFERENCES public.living_groups(id),
CONSTRAINT living_group_memberships_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
CONSTRAINT living_group_memberships_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);
CREATE TABLE public.living_group_time_assignments (
id uuid NOT NULL DEFAULT gen_random_uuid(),
photoshoot_time_id uuid NOT NULL,
living_group_id uuid NOT NULL,
section_name text,
slot_start time without time zone NOT NULL,
slot_end time without time zone NOT NULL,
assigned_by uuid NOT NULL,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT living_group_time_assignments_pkey PRIMARY KEY (id),
CONSTRAINT living_group_time_assignments_photoshoot_fkey FOREIGN KEY (photoshoot_time_id) REFERENCES public.photoshoot_times(id),
CONSTRAINT living_group_time_assignments_living_group_fkey FOREIGN KEY (living_group_id) REFERENCES public.living_groups(id),
CONSTRAINT living_group_time_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id)
);
CREATE TABLE public.living_groups (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL UNIQUE,
name character varying NOT NULL,
status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'disabled'::character varying, 'pending'::character varying]::text[])),
disabled_by uuid,
disabled_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
living_group_type character varying DEFAULT 'dorm'::character varying CHECK (living_group_type::text = ANY (ARRAY['dorm'::character varying, 'fsilg'::character varying]::text[])),
affiliation text,
document_links text,
document_notes text,
dorm_sections ARRAY DEFAULT '{}'::text[],
section_images jsonb DEFAULT '{}'::jsonb,
CONSTRAINT living_groups_pkey PRIMARY KEY (id),
CONSTRAINT living_groups_disabled_by_fkey FOREIGN KEY (disabled_by) REFERENCES public.users(id),
CONSTRAINT living_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.photographer_permissions (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL UNIQUE,
approved_by uuid,
approved_at timestamp with time zone,
is_active boolean DEFAULT false,
revoked_by uuid,
revoked_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT photographer_permissions_pkey PRIMARY KEY (id),
CONSTRAINT photographer_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
CONSTRAINT photographer_permissions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id),
CONSTRAINT photographer_permissions_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES public.users(id)
);
CREATE TABLE public.photoshoot_times (
id uuid NOT NULL DEFAULT gen_random_uuid(),
date date NOT NULL,
start_time time without time zone NOT NULL,
end_time time without time zone NOT NULL,
living_group_id uuid,
booked_at timestamp with time zone,
booked_by uuid,
cancellation_requested boolean DEFAULT false,
cancellation_request_reason text,
cancellation_approved boolean,
cancelled_at timestamp with time zone,
cancelled_by uuid,
created_by uuid NOT NULL,
notes text,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
location text,
CONSTRAINT photoshoot_times_pkey PRIMARY KEY (id),
CONSTRAINT photoshoot_times_living_group_id_fkey FOREIGN KEY (living_group_id) REFERENCES public.living_groups(id),
CONSTRAINT photoshoot_times_booked_by_fkey FOREIGN KEY (booked_by) REFERENCES public.users(id),
CONSTRAINT photoshoot_times_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(id),
CONSTRAINT photoshoot_times_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.senior_bios (
id uuid NOT NULL DEFAULT gen_random_uuid(),
email character varying NOT NULL UNIQUE,
major character varying,
second_major character varying,
quote text,
achievements text,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
minor text,
name text,
CONSTRAINT senior_bios_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sessions (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
access_token text,
expires_at timestamp with time zone NOT NULL,
code_verifier text,
state text,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT sessions_pkey PRIMARY KEY (id),
CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.sports (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
name character varying NOT NULL UNIQUE,
description text,
has_gender_teams boolean DEFAULT false,
achievement_summary text,
candid_image_1 text,
candid_image_2 text,
candid_image_3 text,
mens_achievement_summary text,
mens_candid_image_1 text,
mens_candid_image_2 text,
mens_candid_image_3 text,
womens_achievement_summary text,
womens_candid_image_1 text,
womens_candid_image_2 text,
womens_candid_image_3 text,
document_links text,
document_notes text,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT sports_pkey PRIMARY KEY (id),
CONSTRAINT sports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.sports_coaches (
id uuid NOT NULL DEFAULT gen_random_uuid(),
sports_id uuid NOT NULL,
name text NOT NULL,
role text NOT NULL,
display_order integer DEFAULT 0,
added_at timestamp with time zone DEFAULT now(),
CONSTRAINT sports_coaches_pkey PRIMARY KEY (id),
CONSTRAINT sports_coaches_sports_id_fkey FOREIGN KEY (sports_id) REFERENCES public.sports(id)
);
CREATE TABLE public.sports_manual_members (
id uuid NOT NULL DEFAULT gen_random_uuid(),
sports_id uuid NOT NULL,
name text NOT NULL,
team text CHECK (team IS NULL OR (team = ANY (ARRAY['mens'::text, 'womens'::text]))),
added_at timestamp with time zone DEFAULT now(),
CONSTRAINT sports_manual_members_pkey PRIMARY KEY (id),
CONSTRAINT sports_manual_members_sports_id_fkey FOREIGN KEY (sports_id) REFERENCES public.sports(id)
);
CREATE TABLE public.student_work_submissions (
id uuid NOT NULL DEFAULT gen_random_uuid(),
email character varying NOT NULL UNIQUE,
members ARRAY NOT NULL,
additional_credits text,
project_title text NOT NULL,
project_description text NOT NULL,
links text,
image_urls ARRAY,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT student_work_submissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.time_proposals (
id uuid NOT NULL DEFAULT gen_random_uuid(),
living_group_id uuid NOT NULL,
proposed_by uuid NOT NULL,
date date NOT NULL,
start_time time without time zone NOT NULL,
end_time time without time zone NOT NULL,
location text,
notes text,
status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying, 'cancelled'::character varying]::text[])),
accepted_by uuid,
accepted_at timestamp with time zone,
declined_by uuid,
declined_at timestamp with time zone,
decline_reason text,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT time_proposals_pkey PRIMARY KEY (id),
CONSTRAINT time_proposals_living_group_id_fkey FOREIGN KEY (living_group_id) REFERENCES public.living_groups(id),
CONSTRAINT time_proposals_proposed_by_fkey FOREIGN KEY (proposed_by) REFERENCES public.users(id),
CONSTRAINT time_proposals_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES public.users(id),
CONSTRAINT time_proposals_declined_by_fkey FOREIGN KEY (declined_by) REFERENCES public.users(id)
);
CREATE TABLE public.users (
id uuid NOT NULL DEFAULT gen_random_uuid(),
email character varying NOT NULL UNIQUE,
role character varying NOT NULL DEFAULT 'staph'::character varying CHECK (role::text = ANY (ARRAY['admin'::text, 'staph'::text, 'club'::text, 'living_group'::text, 'sports'::text])),
supabase_auth_id uuid,
is_active boolean DEFAULT true,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
is_staph boolean DEFAULT false,
access ARRAY DEFAULT '{}'::text[],
name text,
CONSTRAINT users_pkey PRIMARY KEY (id),
CONSTRAINT users_supabase_auth_id_fkey FOREIGN KEY (supabase_auth_id) REFERENCES auth.users(id)
);
CREATE TABLE public.yearbook_inventory (
id uuid NOT NULL DEFAULT gen_random_uuid(),
year integer NOT NULL UNIQUE,
quantity integer NOT NULL DEFAULT 0,
updated_at timestamp with time zone DEFAULT now(),
updated_by uuid,
CONSTRAINT yearbook_inventory_pkey PRIMARY KEY (id),
CONSTRAINT yearbook_inventory_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id)
);

---

## Contact & Support

- **Email:** technique@mit.edu
- **Instagram:** @mit.tnq
- **Office:** Walker Memorial, Room 50-320
- **Meetings:** Walker Memorial, Room 4-25, Saturday 12-2pm
- **Mailing:** MIT Technique, 32 Vassar Street, Cambridge, MA 02139
