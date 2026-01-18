# MIT Technique Website - Project Documentation

**Last Updated:** January 17, 2026
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
export const locales = ['en', 'es', 'zh'];
export const defaultLocale = 'en';

export const localeNames = {
  en: 'English',
  es: 'Español',
  zh: '中文'
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

| File | Language | Direction | Size | Characters |
|------|----------|-----------|------|------------|
| `en.json` | English | LTR | ~19 KB | ~1,200 words |
| `es.json` | Spanish | LTR | ~21 KB | ~1,200 words |
| `zh.json` | Chinese (Simplified) | LTR | ~18 KB | ~1,200 words |

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
    "home": { /* homepage translations */ },
    "about": { /* about page translations */ },
    "yearbook": { /* yearbook page translations */ },
    "contact": { /* contact page translations */ },
    "hire": { /* hire page translations */ },
    "invoice": { /* invoice page translations */ },
    "login": { /* login page translations */ },
    "portfolio": { /* portfolio page translations */ },
    "seniors": { /* seniors page translations */ },
    "bio": { /* bio page translations */ },
    "archives": { /* archives page translations */ }
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
t('photoCredit', { photographer: 'Michelle Xiang' })
```

---

## Page Routes

All pages are located in `/src/app/[locale]/` and support 9 languages.

### Primary Pages (11 total)

| Route | File | Description | Key Features |
|-------|------|-------------|--------------|
| `/` | `page.js` | Homepage | Hero image, tagline, photo carousel |
| `/about` | `about/page.jsx` | About Us | Organization history, H.R.H. Grogo, weekly meetings |
| `/archives` | `archives/page.jsx` | Yearbook Archive | 130+ yearbook covers (1885-present) |
| `/yearbook` | `yearbook/page.jsx` | Yearbook Info | Ordering, preorder, senior info |
| `/seniors` | `seniors/page.jsx` | Senior Portraits | Portrait sessions, dress code, discount |
| `/bio` | `bio/page.jsx` | Senior Bio Form | Form to update yearbook bio (requires login) |
| `/login` | `login/page.jsx` | MIT SSO Login | Authentication for senior bio access |
| `/portfolio` | `portfolio/page.jsx` | Photography Portfolio | Showcase of photographer work |
| `/contact` | `contact/page.jsx` | Contact Info | Office address, mailing address, email |
| `/hire` | `hire/page.jsx` | Event Photography | Services for MIT organizations |
| `/invoice` | `invoice/page.jsx` | Invoice Submission | Form for photographer payment |

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

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/login` | GET | Initiates MIT SSO login flow |
| `/api/logout` | GET | Destroys session and redirects |
| `/api/session` | GET | Checks current session status |
| `/api/userSignIn` | GET | Handles SSO callback, creates session |

### Data Operations

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/getUserData` | GET | Fetches user data from MongoDB (requires auth) |
| `/api/updateBio` | POST | Updates senior bio in database (requires auth) |
| `/api/sendInvoice` | POST | Sends photographer invoice email |

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
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.js');

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
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)' // Exclude API, Next.js internals, static files
  ]
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
   import { useTranslations } from 'next-intl';

   export default function NewPage() {
     const t = useTranslations('pages.newPage');
     return <h1>{t('title')}</h1>;
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
<Link href={`/${locale}/about`}>About</Link>
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
- **Mailing:** MIT Technique, 32 Vassar Street, Cambridge, MA 02139

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
8. **Button hover styling** - Black bordered buttons (`btn-secondary`) should always have red hover. Use `hover:!bg-accent hover:!border-accent` to override the default black hover

### Common Issues

- **MODULE_NOT_FOUND errors:** Clean `.next`, `node_modules`, reinstall
- **404 on locale routes:** Check middleware matcher configuration
- **Missing translations:** Verify key exists in all 3 JSON files
- **Image 404s:** Verify file exists in `/public/images/` and path is correct

---

**Generated:** January 17, 2026
**Version:** 1.1
**Last Build:** 33 static pages successfully generated
