# MIT Technique Website - Project Documentation

**Last Updated:** February 1, 2026
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
- **Supabase Auth:** Organization password login + admin/staph password login
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
│   ├── create-admin-account.js     # Create admin accounts
│   ├── create-club-accounts-2026.js # 2026 club account creation
│   ├── create-dorm-accounts.js     # Create dorm LG accounts
│   ├── create-fsilg-accounts.js    # Create FSILG accounts
│   ├── create-org-accounts.js      # Create club/LG accounts
│   ├── create-sports-accounts.js   # Create sports team accounts
│   ├── create-staph-accounts.js    # Create staph accounts in bulk
│   ├── create-test-accounts.js     # Test account creation
│   ├── create-yearbook-inventory.sql # Yearbook inventory seed data
│   ├── decrypt-senior-bios.js      # Senior bio decryption utility
│   └── download-images.js          # Image downloader
│
├── src/
│   ├── app/
│   │   ├── [locale]/               # Localized pages (28 pages)
│   │   │   ├── page.js            # Homepage
│   │   │   ├── layout.js          # Root layout with locale support
│   │   │   ├── about/             # About page
│   │   │   ├── alumni/            # Alumni information
│   │   │   ├── alumni-inquiry/    # Alumni inquiry form
│   │   │   ├── archives/          # Yearbook archives (1885-present)
│   │   │   ├── bio/               # Senior bio form (requires login)
│   │   │   ├── candids/           # Community candids submission (public)
│   │   │   ├── club/              # Club dashboard (role: club)
│   │   │   ├── clubs/             # Clubs listing (public)
│   │   │   ├── contact/           # Contact information
│   │   │   ├── dashboard/         # Admin/staph dashboard (nested tabs)
│   │   │   │   ├── clubs/         # Club management tab
│   │   │   │   ├── living-groups/ # LG management tab
│   │   │   │   ├── sports/        # Sports management tab
│   │   │   │   ├── photoshoots/   # Photoshoot scheduling tab
│   │   │   │   ├── responses/     # Form responses tabs
│   │   │   │   │   ├── clubs/
│   │   │   │   │   ├── living-groups/
│   │   │   │   │   ├── sports/
│   │   │   │   │   ├── activities/  # Candids + student work responses
│   │   │   │   │   └── seniors/
│   │   │   │   ├── users/         # User management
│   │   │   │   ├── logs/          # Admin action logs
│   │   │   │   └── settings/      # Form settings, yearbook inventory, reset
│   │   │   ├── hire/              # Event photography services
│   │   │   ├── invoice/           # Photographer invoice submission
│   │   │   ├── join/              # Join/signup page
│   │   │   ├── living-group/      # Living group dashboard (role: living_group)
│   │   │   ├── login/             # Login pages (main, student, admin, club)
│   │   │   ├── parent-inquiry/    # Parent inquiry form
│   │   │   ├── parents/           # Parent information
│   │   │   ├── portfolio/         # Photography portfolio
│   │   │   ├── privacy/           # Privacy policy
│   │   │   ├── profile/           # User profile
│   │   │   ├── resources/         # Resources page
│   │   │   ├── seniors/           # Senior portrait information
│   │   │   ├── sports/            # Sports team dashboard (role: sports)
│   │   │   ├── student-work-feature/ # Student work submission
│   │   │   └── yearbook/          # Yearbook information & ordering
│   │   │
│   │   ├── api/                    # API routes (see API Routes section)
│   │   ├── common/                 # Shared utilities
│   │   └── globals.css            # Global styles
│   │
│   ├── components/
│   │   ├── AccountButton/          # Account/user button
│   │   ├── CalendarView/           # Photoshoot scheduling calendar system
│   │   │   ├── CalendarView.jsx   # Main container (month/week/day views)
│   │   │   ├── MonthView.jsx      # Month calendar grid
│   │   │   ├── WeekView.jsx       # Week timeline view
│   │   │   ├── DayView.jsx        # Day detail view
│   │   │   ├── DaySidePanel.jsx   # Side panel for booking/proposals
│   │   │   ├── TimelineSlot.jsx   # Time slot display
│   │   │   └── CreateSlotForm.jsx # New time slot form
│   │   ├── ConfirmationModal/      # MUI confirmation dialog (isDangerous mode)
│   │   ├── CookieConsent/          # Cookie consent banner
│   │   ├── CoverCard/              # Yearbook cover card
│   │   ├── Footer/                 # Site footer
│   │   ├── ImageUpload/            # Drag-and-drop image upload (20MB, JPEG/PNG/WebP/GIF)
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
│   │   ├── lib.ts                  # General utilities (Cryptr encryption)
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
│   └── __tests__/                   # Test files (vitest)
│       ├── setup.ts                # Test setup
│       ├── auth/                   # Auth tests (logout, org-signin, session)
│       └── components/             # Component tests (OrganizationAuthModal)
│
├── middleware.js                   # Next.js middleware for locale routing
├── next.config.mjs                 # Next.js configuration
├── vitest.config.ts               # Vitest test configuration
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
- `pages.*` - Page-specific translations (home, about, yearbook, contact, hire, invoice, login, portfolio, seniors, bio, archives, candids, studentWorkFeature)
- `clubPage` - Club dashboard translations
- `livingGroupPage` - Living group dashboard translations
- `sportsPage` - Sports dashboard translations (profile, coaches, members, achievements, photos, documents tabs)
- `organizationAuth` - Organization login modal translations
- `profilePage` - User profile translations
- `dashboardPage` - Admin dashboard translations (overview, organizations, photoshoots, responses, settings, yearbook inventory, reset)
- `calendarView` - Calendar scheduling component translations

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
| `/candids`              | Community candids submission    |
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
| `/student-work-feature` | Student work/project submission |
| `/yearbook`             | Yearbook information & ordering |

### Auth Pages

| Route            | Description                            |
| ---------------- | -------------------------------------- |
| `/login`         | Main login (organization login modal)  |
| `/login/admin`   | Admin/staph login (email + password)   |
| `/login/club`    | Club login (legacy)                    |
| `/logout`        | Logout page                            |

### Role-Protected Pages

| Route           | Required Role   | Description                                                  |
| --------------- | --------------- | ------------------------------------------------------------ |
| `/bio`          | `staph`         | Senior bio form                                              |
| `/profile`      | any logged-in   | User profile                                                 |
| `/club`         | `club`          | Club management dashboard                                    |
| `/living-group` | `living_group`  | Living group management dashboard                            |
| `/sports`       | `sports`        | Sports team management dashboard                             |
| `/dashboard`    | `admin`/`staph` | Dashboard (overview, orgs, photoshoots, responses, settings) |
| `/invoice`      | any logged-in   | Photographer invoice submission                              |

---

## Components

| Component                  | Purpose                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| `AccountButton`            | Account/user button in navbar                                             |
| `CalendarView`             | Photoshoot scheduling calendar (month/week/day views, booking, proposals) |
| `ConfirmationModal`        | MUI Dialog with `isDangerous` mode (red title)                            |
| `CookieConsent`            | Cookie consent banner                                                     |
| `CoverCard`                | Yearbook cover display card (archives page)                               |
| `Footer`                   | Site footer with copyright, email, Instagram                              |
| `ImageUpload`              | Drag-and-drop image upload (20MB max, JPEG/PNG/WebP/GIF)                  |
| `LanguageSwitcher`         | Dropdown language selector                                                |
| `Navbar_and_Sidebar`       | Desktop navbar (`Navbar_new.jsx`) + mobile sidebar (`Sidebar.jsx`)        |
| `OrganizationAuthModal`    | Login modal for clubs, living groups, and sports teams                    |
| `PhotographerTimesSection` | Photographer booking/scheduling section                                   |

---

## API Routes

Located in `/src/app/api/` - **NOT localized** (language-agnostic).

### Legacy / Standalone

| Route                  | Method | Purpose                          |
| ---------------------- | ------ | -------------------------------- |
| `/api/bio`             | GET    | Fetch senior bio data            |
| `/api/getUserData`     | GET    | Fetch user data from MongoDB     |
| `/api/sendContactForm` | POST   | Send contact form email          |
| `/api/sendInvoice`     | POST   | Sends photographer invoice email |
| `/api/updateBio`       | POST   | Updates senior bio in database   |

### Auth (`/api/auth/`)

| Route                 | Method | Purpose                                           |
| --------------------- | ------ | ------------------------------------------------- |
| `admin-login`         | POST   | Admin/staph password login                        |
| `callback`            | GET    | Supabase OAuth callback (club signup)             |
| `change-password`     | POST   | Organization password change                      |
| `club-login`          | POST   | Club login (legacy)                               |
| `club-signup`         | POST   | Club signup (legacy)                              |
| `logout`              | POST   | Technique session logout                          |
| `org-forgot-password` | POST   | Organization password reset                       |
| `org-signin`          | POST   | Unified organization login (club, LG, sports)     |
| `org-signup`          | POST   | Organization signup                               |
| `session`             | GET    | Technique session check (returns user + org data) |

### Admin (`/api/admin/`)

| Route                            | Method              | Purpose                            |
| -------------------------------- | ------------------- | ---------------------------------- |
| `clubs`                          | GET/PUT             | Manage clubs (approve/deny)        |
| `create-staph`                   | POST                | Create staph accounts              |
| `designate-admin`                | POST                | Promote user to admin              |
| `form-settings`                  | GET/PUT             | Freeze/unfreeze organization forms |
| `living-groups`                  | GET/PUT             | Manage living groups               |
| `logs`                           | GET                 | View admin action logs             |
| `overview-stats`                 | GET                 | Dashboard statistics               |
| `photoshoot-times`               | GET/POST/PUT/DELETE | Manage photoshoot time slots       |
| `promotion-requests`             | GET/PUT             | Review staph/photographer requests |
| `reset`                          | POST                | Database reset operations          |
| `responses/activities`           | GET                 | Candids + student work responses   |
| `responses/clubs`                | GET                 | Club form responses                |
| `responses/living-groups`        | GET                 | LG form responses                  |
| `responses/living-groups/book`   | POST                | Book on behalf of LG               |
| `responses/seniors`              | GET                 | Senior bio responses               |
| `responses/sports`               | GET                 | Sports form responses              |
| `responses/export/images`        | GET                 | Export all org images              |
| `responses/export/club-members`  | GET                 | Export club members                |
| `responses/export/lg-members`    | GET                 | Export LG members                  |
| `responses/export/sport-members` | GET                 | Export sport members               |
| `responses/export/senior-bios`   | GET                 | Export senior bios                 |
| `toggle-staph`                   | POST                | Toggle user staph status           |
| `update-access`                  | POST                | Update staph access permissions    |
| `users`                          | GET/PUT             | View and manage users              |
| `yearbook-inventory`             | GET/PUT/POST        | Manage yearbook stock by year      |

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

### Candids & Student Work

| Route                              | Method   | Purpose                                 |
| ---------------------------------- | -------- | --------------------------------------- |
| `/api/candids/upload`              | GET/POST | Community candids submission            |
| `/api/student-work-feature/submit` | GET/POST | Student work/project submission         |
| `/api/form-status`                 | GET      | Check if a form is frozen (query: form) |
| `/api/yearbook-inventory`          | GET      | Public yearbook availability            |

### Other

| Route                         | Method   | Purpose                                            |
| ----------------------------- | -------- | -------------------------------------------------- |
| `/api/organizations/list`     | GET      | List all orgs (clubs, LGs, sports) for login modal |
| `/api/photographer/proposals` | GET/POST | Photographer time proposals                        |
| `/api/photographer/status`    | GET      | Photographer permission status                     |
| `/api/photographer/times`     | GET      | Photographer available times                       |
| `/api/user/lookup`            | GET      | Lookup user by email (autofill)                    |
| `/api/user/profile`           | GET/PUT  | User profile management                            |
| `/api/user/request-promotion` | POST     | Request staph/photographer promotion               |

---

## Hooks & Utilities

### Hooks

- **`useSession`** - Returns session data from `/api/auth/session`
- **`useUser`** - Returns `{ isLoggedIn, user, club, sports, livingGroup, frozenForms, loading, logout, refetch }`

### Utility Libraries

- **`/src/lib/lib.ts`** - General utilities (Cryptr encryption)
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
type UserRole = "admin" | "staph" | "club" | "living_group" | "sports";
```

- `admin` - Full dashboard access, user management, org approval
- `staph` - Staff role with dashboard access based on `user.access` array permissions
- `club` - Club management dashboard
- `living_group` - Living group management dashboard
- `sports` - Sports team management dashboard

### Core Entities (Supabase/PostgreSQL)

| Table                           | Purpose                                                    |
| ------------------------------- | ---------------------------------------------------------- |
| `users`                         | All users (org + admin/staph accounts)                     |
| `sessions`                      | Session storage                                            |
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
| `community_candids`             | Community event candid submissions                         |
| `student_work_submissions`      | Student work/project submissions                           |
| `yearbook_inventory`            | Yearbook stock tracking by year                            |

### Storage Buckets

| Bucket                | Purpose                             | Path Pattern                                              |
| --------------------- | ----------------------------------- | --------------------------------------------------------- |
| `club-images`         | Club candid photos (3 slots)        | `clubs/{safeName}_Candid{suffix}.{ext}`                   |
| `living-group-images` | LG section photos                   | `{dorms\|fsilgs}/{safeName}_{section}_Candid.{ext}`       |
| `sports-images`       | Sports team photos (3 slots × team) | `sports/{safeName}/{mens\|womens\|}/Candid{suffix}.{ext}` |
| `community-candids`   | Community event candid photos       | `{safeName}_{timestamp}.{ext}`                            |
| `student-work-images` | Student work project images         | `{safeName}_{timestamp}.{ext}`                            |

### Sports-Specific Schema

The `sports` table supports optional gender teams via `has_gender_teams` boolean:

- When `false`: uses `candid_image_1-3`, `achievement_summary`, members with `team = NULL`
- When `true`: uses `mens_candid_image_1-3`, `womens_candid_image_1-3`, `mens_achievement_summary`, `womens_achievement_summary`, members with `team = 'mens'` or `'womens'`
- Coaches are always shared (not team-specific)

---

## Authentication System

### Session System

All authentication uses a single iron-session cookie:

| Session             | Cookie Name         | Source File               | TTL   | Purpose                          |
| ------------------- | ------------------- | ------------------------- | ----- | -------------------------------- |
| `technique_session` | `technique_session` | `src/lib/auth/session.ts` | 7 days | All auth (orgs, admin, staph)   |

**Session data:** `{ isLoggedIn, access_token, userId, userInfo: { sub, name, email, email_verified } }`

**Import rule for all auth routes:**

```typescript
import { getSession } from "../../../lib/auth/session";
```

### Organization Login Flow

1. User clicks "Organization Login" on login page → opens `OrganizationAuthModal`
2. Modal fetches org list from `/api/organizations/list` (clubs, living groups, sports)
3. User selects org by name (searchable dropdown), enters password
4. POST to `/api/auth/org-signin` → authenticates via Supabase Auth
5. On success, creates `technique_session` and redirects to org dashboard (`/club`, `/living-group`, or `/sports`)

### Admin/Staph Login Flow

1. User navigates to `/login/admin`
2. Enters email and password → POST to `/api/auth/admin-login`
3. Authenticates via Supabase Auth, requires `admin` or `staph` role
4. Redirects to `/en/dashboard`

### Login Page Structure

| Route            | Purpose                      | Auth Method                 |
| ---------------- | ---------------------------- | --------------------------- |
| `/login`         | Main login page              | Organization login modal    |
| `/login/admin`   | Admin/staph login            | Email + password form       |
| `/login/club`    | Club login (legacy)          | Club-specific login         |

### Staph Access Permissions

Staph users have a `user.access` text[] array that grants access to specific dashboard tabs:

- `clubs` - View/manage club responses
- `living_groups` - View/manage LG responses, book photoshoots
- `sports` - View/manage sports responses
- `activities` - View/manage candids + student work
- `seniors` - View/manage senior bio responses

| Dashboard Tab | Admin | Staph (with access) | Staph (without) |
| ------------- | ----- | ------------------- | --------------- |
| Overview      | ✓     | ✗                   | ✗               |
| Organizations | ✓     | ✗                   | ✗               |
| Photoshoots   | ✓     | ✓                   | ✓               |
| Responses     | ✓     | ✓ (filtered)        | ✗               |
| Settings      | ✓     | ✗                   | ✗               |

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
      {
        source: "/:locale/purchase",
        destination: "https://engage.mit.edu/technique/rsvp_boot?id=916938",
        permanent: false,
      },
      {
        source: "/purchase",
        destination: "https://engage.mit.edu/technique/rsvp_boot?id=916938",
        permanent: false,
      },
      { source: "/bio", destination: "/en/bio", permanent: false },
      { source: "/admin", destination: "/en/login/admin", permanent: false },
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
| `nodemailer`            | Email sending                    |
| `pdf-lib`               | PDF generation                   |
| `zod`                   | Schema validation                |
| `@mui/material`         | UI components (dialogs, etc.)    |
| `framer-motion`         | Animations                       |
| `react-icons`           | Icon library                     |
| `vitest`                | Test framework                   |

---

## Development Workflow

### Setup

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # Production build
npm start         # Production server
npm test          # Run vitest tests
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

## Edge Cases & Page Optimization

### Data Fetching

- **`cache: "no-store"`** is used on bio page fetches and in the Supabase admin client (`src/lib/supabase/admin.ts`) to prevent stale data causing data erasure
- **Client-side fetching** with loading states is the dominant pattern (bio, candids, dashboard, org pages)
- **`useCallback`** wraps fetch functions (e.g. `fetchBioByEmail`, `fetchCandidsByEmail`) to prevent unnecessary re-renders
- **`useMemo`** used in OrganizationAuthModal for filtering large org lists

### Email Validation

All forms enforce `@mit.edu` emails. The normalization pattern auto-appends `@mit.edu` if no `@` is present:

```javascript
const normalized = trimmed.includes("@") ? trimmed : `${trimmed}@mit.edu`;
if (!normalized.endsWith("@mit.edu")) return;
```

This validation happens both client-side (immediate feedback) and server-side (API routes return 400).

### Duplicate Submission Prevention

All public forms use **upsert with email as unique key**: bio, candids, student work. Submitting again with the same email updates the existing record rather than creating a duplicate.

### Bio Page Protections

- **Auto-clear fields on email change** before fetching — prevents showing stale data from a previous email
- **Required field validation** — first name, last name, and major are required
- **Quote length limit** — 300 characters max (server-enforced)
- **Prevents non-senior submissions** via email validation

### Form Freeze System

Dual-layer protection:
1. **Client-side**: `useFormFrozen(formName)` hook or direct `/api/form-status` fetch; shows red banner and disables form
2. **Server-side**: API routes check `form_settings.is_frozen` and return 403 if frozen

Protected forms: `candids_form`, `student_work_form`, club/sports profile forms.

### Auto-Dismiss Messages

Success messages auto-fade after 4 seconds using the `FadeMessage` component pattern (used on living group page). Error messages persist until manually dismissed.

### Image Upload

- Max size: **20MB** (not 5MB)
- Allowed types: JPEG, PNG, WebP, GIF
- Client-side validation before upload with local preview
- Candids: max 3 images; Student work: max 5 images; Clubs/sports: 3 slots per team

---

## Notes for AI Assistants

1. **Always preserve locale structure** - pages must be in `[locale]` directory
2. **Update all 3 active translation files** (en.json, es.json, zh.json) when adding new text
3. **Use locale-aware routing** - include `/${locale}/` prefix in all links
4. **Keep API routes separate** - they are NOT localized
5. **Follow existing patterns** - use `useTranslations` hook consistently
6. **Single session system** - all auth uses `technique_session` via `src/lib/auth/session.ts`
8. **Update Times Properly** - All posted times should be in EST, and all times shown should explicitly mention EST
9. **Organization pattern** - clubs, living groups, and sports all follow similar patterns: profile, email, documents, images, manual-members API routes + a dashboard page
10. **Sports gender teams** - the `has_gender_teams` toggle affects members, photos, and achievements (coaches are always shared)
11. **"Achievements" → "Extracurriculars"** - The UI displays "extracurriculars" but the database field is still `achievements` in `senior_bios`. Do not rename the DB column.
12. **Staph access permissions** - Staph users access dashboard tabs via `user.access` array. Use `/api/admin/update-access` to modify.
13. **Form freeze system** - Forms can be frozen/unfrozen via admin settings. Check freeze status with `/api/form-status?form=<form_name>`. Frozen forms show a red banner and disable submission.

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
manually_booked boolean DEFAULT false,
manually_booked_by uuid,
CONSTRAINT living_groups_pkey PRIMARY KEY (id),
CONSTRAINT living_groups_disabled_by_fkey FOREIGN KEY (disabled_by) REFERENCES public.users(id),
CONSTRAINT living_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
CONSTRAINT living_groups_manually_booked_by_fkey FOREIGN KEY (manually_booked_by) REFERENCES public.users(id)
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
first_name text,
last_name text,
major_backup text,
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
role character varying NOT NULL DEFAULT 'student'::character varying CHECK (role::text = ANY (ARRAY['admin'::text, 'staph'::text, 'club'::text, 'living_group'::text, 'student'::text, 'sports'::text])),
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

## Contact & Support

- **Email:** technique@mit.edu
- **Instagram:** @mit.tnq
- **Office:** Walker Memorial, Room 50-320
- **Meetings:** Walker Memorial, Room 4-25, Saturday 12-2pm
- **Mailing:** MIT Technique, 32 Vassar Street, Cambridge, MA 02139
