# Responses Tab — Implementation Plan

## Summary

Add a **Responses** main tab to the admin dashboard with 5 sub-tabs: **Clubs**, **Living Groups**, **Sports**, **Activities**, **Seniors**. Each sub-tab displays summary stats, a per-org/per-submission data table, image counts (with bucket export), and CSV export buttons for member/bio data.

---

## 1. Layout Update

**File:** `src/app/[locale]/dashboard/layout.jsx`

- Add `responses` to `allTabs` (adminOnly: true), linking to `/${locale}/dashboard/responses/clubs`
- Add `responsesSubTabs` array with 5 entries (clubs, living-groups, sports, activities, seniors)
- Add `isResponsesPage` detection via pathname matching
- Render sub-tab pills when on a responses page (same pattern as org/settings sub-tabs)
- Update active-tab logic so the "Responses" main tab highlights when any responses sub-tab is active

---

## 2. Dashboard Pages (6 files)

All under `src/app/[locale]/dashboard/responses/`. Each is a `'use client'` component following the existing dashboard page pattern (local state, useEffect fetch, Tailwind tables, pagination).

### 2a. `responses/page.jsx` — Redirect
- Redirects to `responses/clubs` on mount (same pattern as staph redirect in layout)

### 2b. `responses/clubs/page.jsx`

**Summary cards:**
- Total clubs
- Clubs with descriptions (count where `description` is non-null/non-empty)
- Clubs that added members (count where member count > 0)
- Total members across all clubs

**Table columns:** Club Name | Description? (✓/✗) | Images (0–3) | Members (count)

**Export section:**
- "Export Club Members CSV" button → `GET /api/admin/responses/export/club-members`
- "Download Club Images" button → `GET /api/admin/responses/export/images?bucket=club-images`
- Display total image count in `club-images` bucket

### 2c. `responses/living-groups/page.jsx`

**Summary cards:**
- Total LGs
- LGs with photoshoot bookings
- Total members across all LGs

**Table columns:** LG Name | Type (dorm/fsilg) | Sections (expandable rows showing per-section: section name, image ✓/✗, member count)

**Export section:**
- "Export LG Members CSV" button → `GET /api/admin/responses/export/lg-members`
- "Download LG Images" button → `GET /api/admin/responses/export/images?bucket=living-group-images`
- Display total image count in `living-group-images` bucket

### 2d. `responses/sports/page.jsx`

**Summary cards:**
- Total sports teams
- Teams with achievements filled
- Teams that added members
- Total members | Total coaches

**Table:** For each sport:
- If `has_gender_teams = false`: Name | Description? | Achievement? | Images (0–3) | Members | Coaches
- If `has_gender_teams = true`: Name | Description? | Men's Achievement? | Women's Achievement? | Men's Images (0–3) | Women's Images (0–3) | Men's Members | Women's Members | Coaches

**Export section:**
- "Export Sport Members CSV" → `GET /api/admin/responses/export/sport-members`
- "Download Sports Images" → `GET /api/admin/responses/export/images?bucket=sports-images`
- Display total image count in `sports-images` bucket

### 2e. `responses/activities/page.jsx`

Two sections: **Community Candids** and **Student Work Submissions**

**Community Candids section:**
- Summary: total submissions, list of unique event names
- Table: Email | Event Name | Event Description | Images (count)

**Student Work section:**
- Summary: total submissions
- Table: Email | Project Title | Members | Images (count)

**Export section:**
- "Download Community Candid Images" → `GET /api/admin/responses/export/images?bucket=community-candids`
- "Download Student Work Images" → `GET /api/admin/responses/export/images?bucket=student-work-images`
- Display total image counts for each bucket

### 2f. `responses/seniors/page.jsx`

**Summary cards:**
- Total senior bio submissions

**Table columns:** Name | Major | Minor | 2nd Major | Quote (truncated) | Achievements (truncated)

**Export:**
- "Export Senior Bios CSV" → `GET /api/admin/responses/export/senior-bios`
  - Format: first row = field headers (first_name, last_name, major, second_major, minor, quote, achievements), subsequent rows = data

---

## 3. API Routes

All under `src/app/api/admin/responses/`. Each route checks `getCurrentUser()` and verifies `role === 'admin'`.

### 3a. Data Endpoints (5 routes)

| File | Method | Returns |
|------|--------|---------|
| `clubs/route.ts` | GET | All clubs with description status, image count (count non-null candid_image_1/2/3), member count (from club_manual_members), plus stats summary |
| `living-groups/route.ts` | GET | All LGs with sections, section_images, member counts per section (from living_group_manual_members), booking status (from photoshoot_times), plus stats |
| `sports/route.ts` | GET | All sports with achievement status, image counts (split by gender if applicable), member counts (from sports_manual_members, split by team), coach counts (from sports_coaches), plus stats |
| `activities/route.ts` | GET | All community_candids rows + all student_work_submissions rows, plus stats (totals, unique event names) |
| `seniors/route.ts` | GET | All senior_bios rows, plus total count |

Each data endpoint also calls `supabase.storage.from(bucket).list()` (with recursive prefix listing for nested buckets) to return total image file counts.

### 3b. CSV Export Endpoints (4 routes)

All return `Content-Type: text/csv` with `Content-Disposition: attachment`.

| File | Format |
|------|--------|
| `export/club-members/route.ts` | Row 1: club names as columns. Rows 2+: member names (first last) under each club, padded with empty cells for uneven lengths |
| `export/lg-members/route.ts` | Same format — LG names as column headers, members below |
| `export/sport-members/route.ts` | Column headers = sport names (with "(Men's)"/"(Women's)" suffix for gender teams). Members below each |
| `export/senior-bios/route.ts` | Row 1: field headers. Rows 2+: one bio per row |

### 3c. Image Export Endpoint (1 route)

| File | Method | Behavior |
|------|--------|----------|
| `export/images/route.ts` | GET | Accepts `?bucket=` param. Lists all files in bucket (recursively), generates signed URLs (1hr expiry), returns JSON array. Client uses JSZip to bundle and download as zip |

Allowed bucket values: `club-images`, `living-group-images`, `sports-images`, `community-candids`, `student-work-images`

---

## 4. Translations

Add keys to `src/messages/en.json`, `es.json`, `zh.json`:

- `dashboard.tabs.responses`, `dashboard.tabs.respClubs`, `dashboard.tabs.respLivingGroups`, `dashboard.tabs.respSports`, `dashboard.tabs.respActivities`, `dashboard.tabs.respSeniors`
- `dashboard.responses.clubs.*` — stat labels, table headers, export button labels
- `dashboard.responses.livingGroups.*` — same
- `dashboard.responses.sports.*` — same
- `dashboard.responses.activities.*` — same
- `dashboard.responses.seniors.*` — same
- Common keys: `exportCSV`, `downloadImages`, `totalSubmissions`, `noData`, etc.

---

## 5. Client-Side Image Download (JSZip)

Install `jszip` (and `file-saver` for convenience):
```bash
npm install jszip file-saver
```

Create a shared utility function used by all "Download Images" buttons:
1. Fetch signed URLs from `/api/admin/responses/export/images?bucket=X`
2. Fetch each image blob in parallel (with concurrency limit)
3. Add to JSZip archive
4. Trigger browser download of the zip

---

## 6. Implementation Order

1. Translations (en.json, es.json, zh.json)
2. API data endpoints (5 routes)
3. API CSV export endpoints (4 routes)
4. API image export endpoint (1 route)
5. Dashboard pages (6 files) + JSZip utility
6. Layout update (wire in tab + sub-tabs)
7. Test end-to-end

---

## 7. Verification

- Navigate to `/en/dashboard` as admin → "Responses" tab visible
- Click each sub-tab → data loads, stats display correctly
- Click "Export CSV" buttons → CSV downloads with correct format
- Click "Download Images" buttons → zip file downloads with images from correct bucket
- Non-admin users should not see the Responses tab
- All 3 locales (en/es/zh) render translated labels

---

## Files to Create

```
src/app/[locale]/dashboard/responses/page.jsx
src/app/[locale]/dashboard/responses/clubs/page.jsx
src/app/[locale]/dashboard/responses/living-groups/page.jsx
src/app/[locale]/dashboard/responses/sports/page.jsx
src/app/[locale]/dashboard/responses/activities/page.jsx
src/app/[locale]/dashboard/responses/seniors/page.jsx
src/app/api/admin/responses/clubs/route.ts
src/app/api/admin/responses/living-groups/route.ts
src/app/api/admin/responses/sports/route.ts
src/app/api/admin/responses/activities/route.ts
src/app/api/admin/responses/seniors/route.ts
src/app/api/admin/responses/export/club-members/route.ts
src/app/api/admin/responses/export/lg-members/route.ts
src/app/api/admin/responses/export/sport-members/route.ts
src/app/api/admin/responses/export/senior-bios/route.ts
src/app/api/admin/responses/export/images/route.ts
```

## Files to Modify

```
src/app/[locale]/dashboard/layout.jsx
src/messages/en.json
src/messages/es.json
src/messages/zh.json
```
