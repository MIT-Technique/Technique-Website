# Account System Debug Documentation

**Created:** January 22, 2026
**Status:** In Progress

---

## Issues Identified

### Issue 1: Login Page Missing Admin Option
**Status:** Pending
**Severity:** Medium

**Problem:** The login page only shows MIT SSO button. Admin users have no way to access the magic link login.

**Root Cause:** Login page was not updated to include admin authentication section.

**Fix:** Update `src/app/[locale]/login/page.jsx` to include:
- Admin section with email input for magic link
- Visual divider
- MIT SSO section for students/organizations

---

### Issue 2: No Unified Profile Page
**Status:** Pending
**Severity:** High

**Problem:** After MIT SSO login, users are redirected to `/en/bio` (senior form) instead of a profile page. Different user roles need different views.

**Root Cause:**
- `post_login_route` in `src/lib/lib.ts` is set to `/en/bio`
- No unified profile page exists

**Fix:**
1. Create `src/app/[locale]/profile/page.jsx` with role-based tabs
2. Update `post_login_route` to `/en/profile`
3. Update `AccountButton` to link to `/profile`

**Tab Structure:**
| Role | Tabs |
|------|------|
| student | Profile, Senior Bio |
| club | Profile, Club Info |
| living_group_leader | Profile, Scheduling |
| admin | Redirect to /dashboard |

---

### Issue 3: Living Group Location Missing
**Status:** Pending
**Severity:** Medium

**Problem:** Living group leaders cannot specify a location when booking a photoshoot time. Admin needs to see where to send photographers.

**Root Cause:**
- `PhotoshootTime` type has no `location` field
- Booking API doesn't accept location parameter

**Fix:**
1. Add `location` column to `photoshoot_times` table in Supabase
2. Update `src/lib/supabase/types.ts` to include `location: string | null`
3. Update `src/app/api/living-groups/book/route.ts` to accept location
4. Update living group booking UI with location input
5. Display location in admin dashboard

---

### Issue 4: 404 Error on /api/getUserData
**Status:** Pending
**Severity:** Critical

**Problem:** Bio page fails to load user data with 404 error on `/api/getUserData`.

**Root Cause:**
- `/api/getUserData/route.ts` uses MongoDB via `connectToDatabase()`
- MongoDB may not be configured or user data is in Supabase now
- The new account system uses Supabase, but bio page still uses old MongoDB endpoints

**Evidence:**
```
src/app/api/getUserData/route.ts:19
const collection = await connectToDatabase();
```

**Fix:**
1. Create new `src/app/api/bio/route.ts` using Supabase
2. Update `src/app/[locale]/bio/page.jsx` to use `/api/bio`
3. Keep old endpoints for backward compatibility (data migration)

---

## Session System Architecture

The app uses **dual session cookies**:

| Cookie | Purpose | File |
|--------|---------|------|
| `next_js_session` | MIT SSO authentication | `src/lib/lib.ts` |
| `technique_session` | Admin/Club Supabase auth | `src/lib/auth/session.ts` |

**Session Check Flow:**
1. `/api/auth/session` checks both cookies
2. Returns user data from whichever session is active
3. `useUser` hook fetches from this endpoint

---

## Database Schema

### Supabase Tables (New System)
- `users` - Profile data, role, auth_provider
- `clubs` - Club info, approval status
- `living_groups` - LG info, status
- `photoshoot_times` - Booking slots (needs `location` column)
- `promotion_requests` - Role upgrade requests
- `form_settings` - Form freeze status

### MongoDB Collections (Old System)
- `SeniorBio.ProdBios` / `SeniorBio.DevBios` - Senior bio data (encrypted)

---

## Implementation Progress

- [ ] Create `/api/bio` endpoint (Supabase)
- [ ] Update bio page to use new endpoint
- [ ] Create `/profile` page with tabs
- [ ] Update `post_login_route`
- [ ] Update `AccountButton` links
- [ ] Update login page with admin section
- [ ] Add location field to types
- [ ] Update booking API for location
- [ ] Display location in admin dashboard
- [ ] Add all translations (en, es, zh)

---

## Files Changed

| File | Status | Change |
|------|--------|--------|
| `src/app/api/bio/route.ts` | Create | New Supabase bio endpoint |
| `src/app/[locale]/profile/page.jsx` | Create | Unified profile page |
| `src/app/[locale]/bio/page.jsx` | Modify | Use /api/bio |
| `src/app/[locale]/login/page.jsx` | Modify | Add admin section |
| `src/lib/lib.ts` | Modify | post_login_route |
| `src/lib/supabase/types.ts` | Modify | Add location |
| `src/app/api/living-groups/book/route.ts` | Modify | Accept location |
| `src/components/AccountButton/AccountButton.jsx` | Modify | Link to /profile |
| `src/messages/*.json` | Modify | Add translations |
