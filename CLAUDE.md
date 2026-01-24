# MIT Technique Website - Project Documentation

**Last Updated:** January 22, 2026
**Tech Stack:** Next.js 14.2.3 (App Router) + next-intl 4.7.0
**Internationalization:** 3 languages supported

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Internationalization (i18n)](#internationalization-i18n)
4. [Translation Files](#translation-files)
5. [Page Routes](#page-routes)
6. [Components](#components)
7. [API Routes](#api-routes)
8. [Configuration Files](#configuration-files)
9. [Development Workflow](#development-workflow)

---

## Project Overview

The MIT Technique website is a multilingual Next.js application serving as the official platform for MIT's photography and yearbook organization. The site features:

- **3 Language Support:** English, Spanish, Chinese (Simplified)
- **Dynamic Locale Routing:** URL-based language selection (`/en/about`, `/es/about`, etc.)
- **Static Site Generation:** All pages pre-rendered for optimal performance
- **Authentication:** MIT SSO integration for senior bio management

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
├── src/
│   ├── app/
│   │   ├── [locale]/               # Localized pages (dynamic routing)
│   │   │   ├── page.js            # Homepage
│   │   │   ├── layout.js          # Root layout with locale support
│   │   │   ├── about/             # About page
│   │   │   ├── archives/          # Yearbook archives (1885-present)
│   │   │   ├── bio/               # Senior bio form
│   │   │   ├── contact/           # Contact information
│   │   │   ├── hire/              # Event photography services
│   │   │   ├── invoice/           # Photographer invoice submission
│   │   │   ├── login/             # MIT SSO login
│   │   │   ├── portfolio/         # Photography portfolio
│   │   │   ├── seniors/           # Senior portrait information
│   │   │   └── yearbook/          # Yearbook information & ordering
│   │   │
│   │   ├── api/                    # API routes (locale-agnostic)
│   │   │   ├── getUserData/       # Fetch user data from MongoDB
│   │   │   ├── updateBio/         # Update senior bio
│   │   │   ├── sendInvoice/       # Submit photographer invoice
│   │   │   ├── login/             # SSO login handler
│   │   │   ├── logout/            # Logout handler
│   │   │   ├── session/           # Session management
│   │   │   └── userSignIn/        # User authentication
│   │   │
│   │   ├── common/                 # Shared utilities
│   │   └── globals.css            # Global styles
│   │
│   ├── components/
│   │   ├── LanguageSwitcher/      # Language dropdown selector
│   │   ├── Navbar_and_Sidebar/    # Navigation components
│   │   ├── Footer/                # Site footer
│   │   ├── SimpleCarousel/        # Image carousel
│   │   └── CoverCard/             # Yearbook cover card
│   │
│   ├── i18n/
│   │   ├── config.js              # i18n configuration (locales, RTL)
│   │   └── request.js             # Server-side locale handler
│   │
│   ├── messages/                   # Translation files (see below)
│   │   ├── en.json                # English (default)
│   │   ├── es.json                # Spanish
│   │   └── zh.json                # Chinese (Simplified)
│   │
│   ├── hooks/                      # Custom React hooks
│   └── lib/                        # Utility libraries
│
├── middleware.js                   # Next.js middleware for locale routing
├── next.config.mjs                 # Next.js configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── package.json                    # Dependencies
└── .env                           # Environment variables
```

---

## Internationalization (i18n)

### Configuration Files

#### `/src/i18n/config.js`

Centralized i18n configuration:

```javascript
export const locales = ["en", "es", "zh"];
export const defaultLocale = "en";

export const localeNames = {
  en: "English",
  es: "Español",
  zh: "中文",
};

export const localeDirection = {
  // All locales use left-to-right
};
```

#### `/middleware.js`

Handles locale detection and routing:

- Detects locale from URL, cookie, or browser Accept-Language header
- Redirects `/about` → `/en/about` (or user's preferred locale)
- Stores locale preference in cookie
- Excludes API routes and static files

#### `/src/i18n/request.js`

Server-side locale handler for next-intl:

- Validates incoming locale parameter
- Loads appropriate translation file
- Provides fallback to English if invalid locale

### How Locale Routing Works

1. **URL Pattern:** `/{locale}/{page}` (e.g., `/en/about`, `/es/yearbook`)
2. **Dynamic Segment:** `[locale]` directory handles all language variants
3. **Static Generation:** All 33 pages (11 pages × 3 locales) pre-rendered at build time
4. **SEO-Friendly:** Each locale has its own URL for proper indexing

---

## Translation Files

All translation files are located in `/src/messages/` and follow the same JSON structure.

### File List

| File      | Language             | Direction | Size   | Characters   |
| --------- | -------------------- | --------- | ------ | ------------ |
| `en.json` | English              | LTR       | ~19 KB | ~1,200 words |
| `es.json` | Spanish              | LTR       | ~21 KB | ~1,200 words |
| `zh.json` | Chinese (Simplified) | LTR       | ~18 KB | ~1,200 words |

### Translation File Structure

Each JSON file follows this hierarchical structure:

```json
{
  "common": {
    "siteTitle": "...",
    "siteDescription": "...",
    "siteName": "...",
    "tagline": "..."
  },

  "nav": {
    "about": "...",
    "archive": "...",
    "yearbook": "...",
    "dropdown": {
      "ourHistory": "...",
      "portfolio": "...",
      "contact": "..."
    }
  },

  "footer": {
    "copyright": "...",
    "emailLabel": "...",
    "instagramLabel": "..."
  },

  "languageSwitcher": {
    "selectLanguage": "..."
  },

  "carousel": {
    "photoCredit": "Photo Credits: {photographer}"
  },

  "pages": {
    "home": {
      /* homepage translations */
    },
    "about": {
      /* about page translations */
    },
    "yearbook": {
      /* yearbook page translations */
    },
    "contact": {
      /* contact page translations */
    },
    "hire": {
      /* hire page translations */
    },
    "invoice": {
      /* invoice page translations */
    },
    "login": {
      /* login page translations */
    },
    "portfolio": {
      /* portfolio page translations */
    },
    "seniors": {
      /* seniors page translations */
    },
    "bio": {
      /* bio page translations */
    },
    "archives": {
      /* archives page translations */
    }
  }
}
```

### Translation Keys by Namespace

#### Common Keys (8 keys)

- Site metadata, branding, taglines

#### Navigation Keys (12 keys)

- Main nav items, dropdown menus

#### Footer Keys (3 keys)

- Copyright, social media labels

#### Page-Specific Keys (varies by page)

- **Home:** 4 keys (hero, subtitle, tagline, photo credit)
- **About:** ~350 words (hero, sections, cards)
- **Archives:** 3 keys (uses template for 130+ yearbooks)
- **Bio:** ~40 keys + 60 MIT major names
- **Contact:** ~50 words (addresses, headings)
- **Hire:** ~80 words (hero, CTA, descriptions)
- **Invoice:** ~60 words (form labels, notifications)
- **Login:** ~30 words (instructions, buttons)
- **Portfolio:** ~100 words (with photographer credits)
- **Seniors:** ~120 words (dress code, discount info)
- **Yearbook:** ~150 words (hero, info cards)

### Translation Interpolation

Dynamic values use curly brace syntax:

```json
{
  "photoCredit": "Photo: {photographer}",
  "forSeniors": "Email us at {email} if needed"
}
```

Usage in components:

```javascript
t("photoCredit", { photographer: "Michelle Xiang" });
```

---

## Page Routes

All pages are located in `/src/app/[locale]/` and support 9 languages.

### Primary Pages (11 total)

| Route        | File                 | Description           | Key Features                                        |
| ------------ | -------------------- | --------------------- | --------------------------------------------------- |
| `/`          | `page.js`            | Homepage              | Hero image, tagline, photo carousel                 |
| `/about`     | `about/page.jsx`     | About Us              | Organization history, H.R.H. Grogo, weekly meetings |
| `/archives`  | `archives/page.jsx`  | Yearbook Archive      | 130+ yearbook covers (1885-present)                 |
| `/yearbook`  | `yearbook/page.jsx`  | Yearbook Info         | Ordering, preorder, senior info                     |
| `/seniors`   | `seniors/page.jsx`   | Senior Portraits      | Portrait sessions, dress code, discount             |
| `/bio`       | `bio/page.jsx`       | Senior Bio Form       | Form to update yearbook bio (requires login)        |
| `/login`     | `login/page.jsx`     | MIT SSO Login         | Authentication for senior bio access                |
| `/portfolio` | `portfolio/page.jsx` | Photography Portfolio | Showcase of photographer work                       |
| `/contact`   | `contact/page.jsx`   | Contact Info          | Office address, mailing address, email              |
| `/hire`      | `hire/page.jsx`      | Event Photography     | Services for MIT organizations                      |
| `/invoice`   | `invoice/page.jsx`   | Invoice Submission    | Form for photographer payment                       |

### Generated Routes (33 total)

Each of the 11 pages × 3 languages = 33 pre-rendered static pages:

- `/en/about`, `/es/about`, `/zh/about`

---

## Components

### Core Components

#### `/src/components/LanguageSwitcher/LanguageSwitcher.jsx`

- **Purpose:** Dropdown language selector
- **Features:**
  - Displays current locale (e.g., "EN")
  - Lists all 3 available languages with native names
  - Sets locale cookie on selection
  - Navigates to new locale path
- **Usage:** Rendered in Navbar and mobile Sidebar

#### `/src/components/Navbar_and_Sidebar/Navbar_new.jsx`

- **Purpose:** Desktop navigation bar
- **Features:**
  - Logo/site name (links to homepage)
  - Dropdown menus (About, Seniors)
  - Direct links (Archive, Yearbook, Invoice, Hire Us)
  - Language switcher
  - Transparent on homepage, solid on other pages
  - Locale-aware routing (all links include locale prefix)
- **Translation Keys:** Uses `nav` namespace

#### `/src/components/Navbar_and_Sidebar/Sidebar.jsx`

- **Purpose:** Mobile navigation drawer
- **Features:**
  - Hamburger menu icon (uses react-icons/vsc)
  - Slide-out drawer with all navigation items
  - Collapsible dropdowns
  - Language switcher
  - Locale-aware routing
- **Icons:** VscThreeBars, VscClose, VscChevronDown
- **Translation Keys:** Uses `nav` namespace

#### `/src/components/Footer/Footer.jsx`

- **Purpose:** Site footer
- **Features:**
  - Copyright notice (translated)
  - Social media links (email, Instagram)
  - Aria-labels for accessibility (translated)
- **Translation Keys:** Uses `footer` namespace

#### `/src/components/SimpleCarousel/SimpleCarousel.jsx`

- **Purpose:** Image carousel for portfolio/galleries
- **Features:**
  - Photo credit display (translated)
  - Smooth transitions
- **Translation Keys:** Uses `carousel.photoCredit`

#### `/src/components/CoverCard/CoverCard.jsx`

- **Purpose:** Yearbook cover display cards
- **Features:**
  - Image display
  - Hover effects
  - Link to PDF
- **Usage:** Archives page (130+ instances)

---

## API Routes

Located in `/src/app/api/` - **NOT localized** (language-agnostic).

### Authentication & Session

| Route             | Method | Purpose                               |
| ----------------- | ------ | ------------------------------------- |
| `/api/login`      | GET    | Initiates MIT SSO login flow          |
| `/api/logout`     | GET    | Destroys session and redirects        |
| `/api/session`    | GET    | Checks current session status         |
| `/api/userSignIn` | GET    | Handles SSO callback, creates session |

### Data Operations

| Route              | Method | Purpose                                        |
| ------------------ | ------ | ---------------------------------------------- |
| `/api/getUserData` | GET    | Fetches user data from MongoDB (requires auth) |
| `/api/updateBio`   | POST   | Updates senior bio in database (requires auth) |
| `/api/sendInvoice` | POST   | Sends photographer invoice email               |

### Database Schema (MongoDB)

**Collection:** `users`

```javascript
{
  email: String,
  firstName: String,
  lastName: String,
  major: String,
  quote: String,
  // ... other fields
}
```

---

## Configuration Files

### `/next.config.mjs`

```javascript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.js");

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/en",
        permanent: false,
      },
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

### `/middleware.js`

```javascript
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./src/i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)", // Exclude API, Next.js internals, static files
  ],
};
```

### `/package.json` (Key Dependencies)

```json
{
  "dependencies": {
    "next": "14.2.3",
    "next-intl": "^4.7.0",
    "react": "^18",
    "react-dom": "^18",
    "react-icons": "^5.2.1",
    "@mui/material": "^5.x",
    "mongodb": "^6.17.0",
    "openid-client": "^6.5.0"
  }
}
```

---

## Development Workflow

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Server runs on http://localhost:3000 (or 3001 if port busy)

# Build for production
npm run build

# Start production server
npm start
```

### Adding a New Translation

1. **Add text to English file** (`/src/messages/en.json`):

   ```json
   {
     "pages": {
       "newPage": {
         "title": "New Page Title",
         "description": "Page description"
       }
     }
   }
   ```

2. **Translate to other 2 languages** (es, zh)

3. **Use in component**:

   ```javascript
   import { useTranslations } from "next-intl";

   export default function NewPage() {
     const t = useTranslations("pages.newPage");
     return <h1>{t("title")}</h1>;
   }
   ```

### Adding a New Page

1. **Create page in locale directory**:

   ```bash
   mkdir -p src/app/[locale]/new-page
   touch src/app/[locale]/new-page/page.jsx
   ```

2. **Add translations** to all 3 language files

3. **Update navigation** (Navbar, Sidebar)

4. **Test all locales**:
   ```bash
   curl http://localhost:3000/en/new-page
   curl http://localhost:3000/es/new-page
   curl http://localhost:3000/zh/new-page
   ```

### Build Troubleshooting

If you encounter build errors:

1. **Clean build cache**:

   ```bash
   rm -rf .next node_modules package-lock.json
   npm cache clean --force
   npm install
   npm run build
   ```

2. **Check for missing translations**:
   - Ensure all translation keys exist in all 3 language files
   - Use the same structure across all files

3. **Verify image paths**:
   - Images must exist in `/public/` directory
   - Paths are case-sensitive

### Testing Locales

```bash
# Test all language homepages
for lang in en es zh; do
  curl -s -o /dev/null -w "$lang: %{http_code}\n" "http://localhost:3000/$lang"
done

# Test specific page across languages
for lang in en es zh; do
  curl -s "http://localhost:3000/$lang/about" | grep "<h1"
done
```

---

## Key Features & Patterns

### Locale-Aware Routing

All navigation uses locale-aware paths:

```javascript
const locale = useLocale();
<Link href={`/${locale}/about`}>About</Link>;
```

### Locale Direction

All languages use left-to-right layout:

```javascript
const direction = localeDirection[locale] || 'ltr';
<html lang={locale} dir={direction}>
```

### Translation with Variables

```javascript
// Translation file
"photoCredit": "Photo: {photographer}"

// Component usage
t('photoCredit', { photographer: 'Michelle Xiang' })
```

### Static Generation

All pages use `generateStaticParams` to pre-render all locales:

```javascript
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
```

---

## Contact & Support

- **Email:** technique@mit.edu
- **Instagram:** @mit.tnq
- **Office:** Walker Memorial, Room 50-320
- **Meetingse:** Walker Memorial, Room 4-25, Saturday 12-2pm
- **Mailing:** MIT Technique, 32 Vassar Street, Cambridge, MA 02139

---

## Supabase Schema

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.club_invitations (
id uuid NOT NULL DEFAULT gen_random_uuid(),
club_id uuid NOT NULL,
user_id uuid NOT NULL,
invited_by uuid NOT NULL,
status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])),
created_at timestamp with time zone DEFAULT now(),
resolved_at timestamp with time zone,
CONSTRAINT club_invitations_pkey PRIMARY KEY (id),
CONSTRAINT club_invitations_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id),
CONSTRAINT club_invitations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
CONSTRAINT club_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id)
);
CREATE TABLE public.club_join_requests (
id uuid NOT NULL DEFAULT gen_random_uuid(),
club_id uuid NOT NULL,
user_id uuid NOT NULL,
status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text])),
created_at timestamp with time zone DEFAULT now(),
resolved_at timestamp with time zone,
CONSTRAINT club_join_requests_pkey PRIMARY KEY (id),
CONSTRAINT club_join_requests_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id),
CONSTRAINT club_join_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.club_leader_requests (
id uuid NOT NULL DEFAULT gen_random_uuid(),
club_id uuid NOT NULL,
user_id uuid NOT NULL,
requested_by uuid NOT NULL,
status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text])),
created_at timestamp with time zone DEFAULT now(),
resolved_at timestamp with time zone,
resolved_by uuid,
CONSTRAINT club_leader_requests_pkey PRIMARY KEY (id),
CONSTRAINT club_leader_requests_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id),
CONSTRAINT club_leader_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
CONSTRAINT club_leader_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id),
CONSTRAINT club_leader_requests_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id)
);
CREATE TABLE public.club_manual_members (
id uuid NOT NULL DEFAULT gen_random_uuid(),
club_id uuid NOT NULL,
name text NOT NULL,
added_at timestamp with time zone DEFAULT now(),
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
club_id character NOT NULL UNIQUE,
name character varying NOT NULL,
description text,
member_list text,
candid_image_1 text,
candid_image_2 text,
candid_image_3 text,
approval_status character varying DEFAULT 'pending'::character varying CHECK (approval_status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'denied'::character varying]::text[])),
approval_notes text,
approved_by uuid,
approved_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
has_leader boolean DEFAULT false,
document_links text,
document_notes text,
CONSTRAINT clubs_pkey PRIMARY KEY (id),
CONSTRAINT clubs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
CONSTRAINT clubs_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);
CREATE TABLE public.dorm_sections (
id uuid NOT NULL DEFAULT gen_random_uuid(),
dorm_name character varying NOT NULL,
section_name character varying NOT NULL,
display_order integer DEFAULT 0,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT dorm_sections_pkey PRIMARY KEY (id)
);
CREATE TABLE public.export_club_members (
club_name text NOT NULL,
row_index integer NOT NULL,
member_name text
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
CREATE TABLE public.living_group_memberships (
id uuid NOT NULL DEFAULT gen_random_uuid(),
living_group_id uuid NOT NULL,
user_id uuid NOT NULL,
section_id uuid,
membership_type character varying NOT NULL CHECK (membership_type::text = ANY (ARRAY['dorm'::character varying, 'fsilg'::character varying]::text[])),
status character varying NOT NULL DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'active'::character varying, 'removed'::character varying]::text[])),
joined_at timestamp with time zone DEFAULT now(),
approved_by uuid,
approved_at timestamp with time zone,
CONSTRAINT living_group_memberships_pkey PRIMARY KEY (id),
CONSTRAINT living_group_memberships_living_group_fkey FOREIGN KEY (living_group_id) REFERENCES public.living_groups(id),
CONSTRAINT living_group_memberships_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
CONSTRAINT living_group_memberships_section_fkey FOREIGN KEY (section_id) REFERENCES public.dorm_sections(id),
CONSTRAINT living_group_memberships_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);
CREATE TABLE public.living_groups (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
name character varying NOT NULL,
status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'disabled'::character varying, 'pending'::character varying]::text[])),
promoted_by uuid,
promoted_at timestamp with time zone,
disabled_by uuid,
disabled_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
living_group_type character varying DEFAULT 'dorm'::character varying CHECK (living_group_type::text = ANY (ARRAY['dorm'::character varying, 'fsilg'::character varying]::text[])),
CONSTRAINT living_groups_pkey PRIMARY KEY (id),
CONSTRAINT living_groups_disabled_by_fkey FOREIGN KEY (disabled_by) REFERENCES public.users(id),
CONSTRAINT living_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
CONSTRAINT living_groups_promoted_by_fkey FOREIGN KEY (promoted_by) REFERENCES public.users(id)
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
CREATE TABLE public.promotion_requests (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
request_type character varying NOT NULL CHECK (request_type::text = ANY (ARRAY['staph_request'::text, 'photographer_request'::text])),
status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'denied'::character varying]::text[])),
request_reason text,
living_group_name character varying,
reviewed_by uuid,
reviewed_at timestamp with time zone,
review_notes text,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT promotion_requests_pkey PRIMARY KEY (id),
CONSTRAINT promotion_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
CONSTRAINT promotion_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);
CREATE TABLE public.section_expected_counts (
id uuid NOT NULL DEFAULT gen_random_uuid(),
living_group_id uuid NOT NULL,
section_id uuid,
expected_count integer NOT NULL DEFAULT 0,
updated_at timestamp with time zone DEFAULT now(),
updated_by uuid,
CONSTRAINT section_expected_counts_pkey PRIMARY KEY (id),
CONSTRAINT section_expected_counts_lg_fkey FOREIGN KEY (living_group_id) REFERENCES public.living_groups(id),
CONSTRAINT section_expected_counts_section_fkey FOREIGN KEY (section_id) REFERENCES public.dorm_sections(id),
CONSTRAINT section_expected_counts_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id)
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
role character varying NOT NULL DEFAULT 'student'::character varying CHECK (role::text = ANY (ARRAY['admin'::text, 'staph'::text, 'club'::text, 'living_group_leader'::text, 'student'::text])),
first_name character varying,
last_name character varying,
major character varying,
second_major character varying,
quote text,
achievements text,
school_year integer,
auth_provider character varying NOT NULL DEFAULT 'mit_sso'::character varying CHECK (auth_provider::text = ANY (ARRAY['mit_sso'::character varying, 'supabase_auth'::character varying]::text[])),
supabase_auth_id uuid,
is_active boolean DEFAULT true,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
is_staph boolean DEFAULT false,
CONSTRAINT users_pkey PRIMARY KEY (id),
CONSTRAINT users_supabase_auth_id_fkey FOREIGN KEY (supabase_auth_id) REFERENCES auth.users(id)
);

## CRITICAL: Authentication System Rules

⚠️ **DO NOT MODIFY WITHOUT EXTREME CARE** ⚠️

This project uses a **dual session system** with two separate iron-session cookies. Mixing them up will break authentication.

### Dual Session Architecture

| Session             | Cookie Name         | Source File               | Purpose                                         |
| ------------------- | ------------------- | ------------------------- | ----------------------------------------------- |
| `next_js_session`   | `next_js_session`   | `src/lib/lib.ts`          | MIT SSO OAuth (stores `state`, `code_verifier`) |
| `technique_session` | `technique_session` | `src/lib/auth/session.ts` | Admin magic links, club signup, role-based auth |

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

### Login Page Structure

| Route            | Purpose                                | Auth Method                         |
| ---------------- | -------------------------------------- | ----------------------------------- |
| `/login`         | Main login page                        | MIT SSO button + "Admin Login" link |
| `/login/student` | Student-only login (bio form redirect) | MIT SSO only                        |
| `/login/admin`   | Admin-only login                       | Magic link form (technique@mit.edu) |

### User Roles

- `admin` - Full dashboard access
- `club` - Club management
- `living_group_leader` - Living group management
- `student` - Default role, profile/bio access

---

## Notes for AI Assistants

When working on this project:

1. **Always preserve locale structure** - pages must be in `[locale]` directory
2. **Update all 3 translation files** when adding new text
3. **Test all locales** after making changes
4. **Use locale-aware routing** - include `/${locale}/` prefix in all links
5. **Keep API routes separate** - they are NOT localized
6. **Follow existing patterns** - use `useTranslations` hook consistently
7. **Clean build cache** if encountering module errors
8. **NEVER change `getSession` imports in `/api/userSignIn`** - must use `lib/lib.ts`
9. **Understand the dual session system** - see "CRITICAL: Authentication System Rules" above
10. **Update Times Properly** - All posted times should be in EST, and all times shown should explicitly mention EST.

### Common Issues

- **MODULE_NOT_FOUND errors:** Clean `.next`, `node_modules`, reinstall
- **404 on locale routes:** Check middleware matcher configuration
- **Missing translations:** Verify key exists in all 3 JSON files
- **Image 404s:** Verify file exists in `/public/images/` and path is correct

---

**Generated:** January 22, 2026
**Version:** 1.2
**Last Build:** 33 static pages successfully generated
