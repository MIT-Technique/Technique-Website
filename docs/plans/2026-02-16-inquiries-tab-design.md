# Inquiries Tab Design

**Date:** 2026-02-16

## Summary

Add a new "Inquiries" main tab to the admin dashboard (between Responses and Settings) with two subtabs: Hire Requests and Yearbook Requests. Hire Requests reads from the existing `hire_requests` table. Yearbook Requests reads from a new `yearbook_requests` table, populated when parents/alumni submit yearbook purchase inquiries.

## Database

### New table: `yearbook_requests`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, gen_random_uuid() |
| source | varchar | 'parent' or 'alumni' |
| name | text | Requester name |
| email | varchar | Requester email |
| student_name | text | Nullable, parent form only |
| graduation_year | text | Nullable, alumni form only |
| year_requested | integer | Yearbook year |
| shipping_address | text | |
| shipping_city | text | |
| shipping_state | text | |
| shipping_zip | text | |
| message | text | Optional |
| status | varchar | 'pending' / 'fulfilled' / 'cancelled', default 'pending' |
| status_updated_by | uuid FK → users(id) | |
| status_updated_at | timestamptz | |
| created_at | timestamptz | default now() |

## Dashboard Structure

```
Dashboard
├── Overview
├── Photoshoots
├── Responses (existing)
├── Inquiries (NEW) ← admin-only
│   ├── Hire Requests
│   └── Yearbook Requests
└── Settings
```

## Hire Requests Subtab

- Table: Event Name, Requester, Date, Time, Status badge (pending/claimed/completed/cancelled), Cost
- Search by event name or requester
- Expandable rows: location, description, claimed_by, confirmation code
- Read-only display of existing `hire_requests` data

## Yearbook Requests Subtab

- Stats bar: total, pending, fulfilled counts
- Table: Name, Email, Source (parent/alumni), Year Requested, Status, Date
- Status dropdown per row (pending → fulfilled / cancelled) with PUT to update
- Search by name or email
- Expandable rows: shipping address, student name/grad year, message

## API Routes

- `GET /api/admin/inquiries/hire-requests` — list all hire requests (admin only)
- `GET /api/admin/inquiries/yearbook-requests` — list all yearbook requests (admin only)
- `PUT /api/admin/inquiries/yearbook-requests` — update yearbook request status

## Form Modifications

Modify `/api/sendContactForm` to insert into `yearbook_requests` when:
- formType is "parent" and category is "Purchase Old Yearbook"
- formType is "alumni" and category is "Old Yearbooks"

Existing email sending behavior is unchanged.

## Access Control

Admin-only. No staph access array entry needed.
