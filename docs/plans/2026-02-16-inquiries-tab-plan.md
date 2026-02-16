# Inquiries Tab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an admin-only "Inquiries" tab to the dashboard with Hire Requests and Yearbook Requests subtabs.

**Architecture:** New main tab in dashboard layout between Responses and Settings, admin-only. Two subtabs: Hire Requests (reads existing `hire_requests` table) and Yearbook Requests (new `yearbook_requests` table populated by parent/alumni forms). Three new API routes + modification to sendContactForm.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL), next-intl for translations.

---

### Task 1: Create the `yearbook_requests` database table

**Files:**
- Create: `scripts/create-yearbook-requests-table.sql`

**Step 1: Write the SQL migration script**

```sql
CREATE TABLE public.yearbook_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source character varying NOT NULL CHECK (source::text = ANY (ARRAY['parent'::text, 'alumni'::text])),
  name text NOT NULL,
  email character varying NOT NULL,
  student_name text,
  graduation_year text,
  year_requested integer NOT NULL,
  shipping_address text,
  shipping_city text,
  shipping_state text,
  shipping_zip text,
  message text,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::text, 'fulfilled'::text, 'cancelled'::text])),
  status_updated_by uuid,
  status_updated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT yearbook_requests_pkey PRIMARY KEY (id),
  CONSTRAINT yearbook_requests_status_updated_by_fkey FOREIGN KEY (status_updated_by) REFERENCES public.users(id)
);
```

**Step 2: Run in Supabase SQL editor**

Execute the script via the Supabase dashboard SQL editor.

**Step 3: Commit**

```bash
git add scripts/create-yearbook-requests-table.sql
git commit -m "feat: add yearbook_requests table migration"
```

---

### Task 2: Add translation keys for the Inquiries tab

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/es.json`
- Modify: `src/messages/zh.json`

**Step 1: Add translations to en.json**

In the `dashboard.tabs` object, add:

```json
"inquiries": "Inquiries",
"inqHireRequests": "Hire Requests",
"inqYearbookRequests": "Yearbook Requests"
```

Add a new `dashboard.inquiries` sibling object (after `dashboard.responses`):

```json
"inquiries": {
  "hireRequests": {
    "title": "Hire Requests",
    "eventName": "Event",
    "requester": "Requester",
    "date": "Date",
    "time": "Time",
    "status": "Status",
    "cost": "Cost",
    "location": "Location",
    "description": "Description",
    "claimedBy": "Claimed By",
    "confirmationCode": "Code",
    "type": "Type",
    "noRequests": "No hire requests found",
    "statusPending": "Pending",
    "statusClaimed": "Claimed",
    "statusCompleted": "Completed",
    "statusCancelled": "Cancelled"
  },
  "yearbookRequests": {
    "title": "Yearbook Requests",
    "name": "Name",
    "email": "Email",
    "source": "Source",
    "sourceParent": "Parent",
    "sourceAlumni": "Alumni",
    "yearRequested": "Year",
    "status": "Status",
    "date": "Submitted",
    "statusPending": "Pending",
    "statusFulfilled": "Fulfilled",
    "statusCancelled": "Cancelled",
    "shippingAddress": "Shipping Address",
    "studentName": "Student Name",
    "graduationYear": "Graduation Year",
    "message": "Message",
    "noRequests": "No yearbook requests found",
    "total": "Total",
    "pending": "Pending",
    "fulfilled": "Fulfilled",
    "updateStatus": "Update Status",
    "statusUpdated": "Status updated",
    "statusUpdateError": "Failed to update status"
  },
  "common": {
    "loading": "Loading...",
    "noData": "No data found"
  }
}
```

**Step 2: Add equivalent keys to es.json and zh.json**

Translate the same keys into Spanish and Chinese. Follow existing patterns in those files.

**Step 3: Commit**

```bash
git add src/messages/en.json src/messages/es.json src/messages/zh.json
git commit -m "feat: add Inquiries tab translation keys"
```

---

### Task 3: Create the API routes

**Files:**
- Create: `src/app/api/admin/inquiries/hire-requests/route.ts`
- Create: `src/app/api/admin/inquiries/yearbook-requests/route.ts`

**Step 1: Create the hire-requests API route**

`src/app/api/admin/inquiries/hire-requests/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: requests, error } = await supabase
      .from('hire_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching hire requests:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const stats = {
      total: requests?.length || 0,
      pending: requests?.filter(r => r.status === 'pending').length || 0,
      claimed: requests?.filter(r => r.status === 'claimed').length || 0,
      completed: requests?.filter(r => r.status === 'completed').length || 0,
      cancelled: requests?.filter(r => r.status === 'cancelled').length || 0,
    };

    return NextResponse.json({ requests: requests || [], stats });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Step 2: Create the yearbook-requests API route (GET + PUT)**

`src/app/api/admin/inquiries/yearbook-requests/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: requests, error } = await supabase
      .from('yearbook_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching yearbook requests:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const stats = {
      total: requests?.length || 0,
      pending: requests?.filter(r => r.status === 'pending').length || 0,
      fulfilled: requests?.filter(r => r.status === 'fulfilled').length || 0,
      cancelled: requests?.filter(r => r.status === 'cancelled').length || 0,
    };

    return NextResponse.json({ requests: requests || [], stats });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await request.json();

    if (!id || !['pending', 'fulfilled', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('yearbook_requests')
      .update({
        status,
        status_updated_by: user.id,
        status_updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error("Error updating yearbook request:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/admin/inquiries/
git commit -m "feat: add admin inquiries API routes (hire + yearbook)"
```

---

### Task 4: Modify sendContactForm to save yearbook requests

**Files:**
- Modify: `src/app/api/sendContactForm/route.ts`

**Step 1: Add Supabase import and insert logic**

At the top of `route.ts`, add:

```typescript
import { createAdminClient } from "../../../lib/supabase/admin";
```

After the existing `await transporter.sendMail(...)` call (line 52) and before the `return NextResponse.json({ success: true })`, add yearbook request saving logic:

```typescript
    // Save yearbook purchase requests to database
    const isYearbookRequest =
      (formType === "parent" && data.category === "Purchase Old Yearbook") ||
      (formType === "alumni" && data.category === "Old Yearbooks");

    if (isYearbookRequest) {
      try {
        const supabase = createAdminClient();
        await supabase.from("yearbook_requests").insert({
          source: formType,
          name: data.name,
          email: data.email,
          student_name: data.studentName || null,
          graduation_year: data.graduationYear || null,
          year_requested: parseInt(data.yearRequested) || null,
          shipping_address: data.shippingAddress || null,
          shipping_city: data.shippingCity || null,
          shipping_state: data.shippingState || null,
          shipping_zip: data.shippingZip || null,
          message: data.message || null,
        });
      } catch (dbError) {
        console.error("Failed to save yearbook request to database:", dbError);
        // Don't fail the email — DB save is best-effort
      }
    }
```

**Step 2: Verify existing email behavior is unchanged**

The email sending happens before the DB insert. If the DB insert fails, the email was still sent and the user gets a success response. This is intentional — the email is the primary action.

**Step 3: Commit**

```bash
git add src/app/api/sendContactForm/route.ts
git commit -m "feat: save yearbook purchase inquiries to database"
```

---

### Task 5: Add the Inquiries tab to the dashboard layout

**Files:**
- Modify: `src/app/[locale]/dashboard/layout.jsx`

**Step 1: Add inquiries subtab definitions**

After the `settingsSubTabs` array (line 68), add:

```javascript
  const inquiriesSubTabs = [
    { id: 'inq-hire-requests', label: t('tabs.inqHireRequests'), href: `/${locale}/dashboard/inquiries/hire-requests` },
    { id: 'inq-yearbook-requests', label: t('tabs.inqYearbookRequests'), href: `/${locale}/dashboard/inquiries/yearbook-requests` },
  ];
```

**Step 2: Add isInquiriesPage detection**

After the `isSettingsPage` line (line 71), add:

```javascript
  const isInquiriesPage = inquiriesSubTabs.some(tab => pathname === tab.href);
```

**Step 3: Add the Inquiries tab to allTabs array**

Insert between the `responses` and `settings` entries in `allTabs` (line 78):

```javascript
    { id: 'inquiries', label: t('tabs.inquiries'), href: `/${locale}/dashboard/inquiries/hire-requests`, adminOnly: true },
```

**Step 4: Update the isActive logic for the inquiries tab**

In the tab rendering section (~line 107), extend the ternary to handle inquiries:

```javascript
const isActive = tab.id === 'responses'
  ? isResponsesPage
  : tab.id === 'settings'
  ? isSettingsPage
  : tab.id === 'inquiries'
  ? isInquiriesPage
  : pathname === tab.href;
```

**Step 5: Render inquiries subtabs**

Update the subtab rendering condition (~line 130) from:

```javascript
{(isResponsesPage || isSettingsPage) && (
```

to:

```javascript
{(isResponsesPage || isSettingsPage || isInquiriesPage) && (
```

And update the inner content from:

```javascript
{(isResponsesPage ? responsesSubTabs : settingsSubTabs).map((tab) => (
```

to:

```javascript
{(isResponsesPage ? responsesSubTabs : isInquiriesPage ? inquiriesSubTabs : settingsSubTabs).map((tab) => (
```

**Step 6: Commit**

```bash
git add src/app/[locale]/dashboard/layout.jsx
git commit -m "feat: add Inquiries tab to dashboard layout"
```

---

### Task 6: Create the Hire Requests subtab page

**Files:**
- Create: `src/app/[locale]/dashboard/inquiries/hire-requests/page.jsx`

**Step 1: Create the page component**

```jsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';

const PAGE_SIZE = 10;

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  claimed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function InquiriesHireRequestsPage() {
  const t = useTranslations('dashboard.inquiries.hireRequests');
  const tc = useTranslations('dashboard.inquiries.common');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/inquiries/hire-requests');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching hire requests:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!data?.requests) return [];
    if (!search) return data.requests;
    const q = search.toLowerCase();
    return data.requests.filter(r =>
      r.event_name?.toLowerCase().includes(q) ||
      r.requester_name?.toLowerCase().includes(q) ||
      r.requester_email?.toLowerCase().includes(q)
    );
  }, [data, search]);

  useEffect(() => { setPage(0); }, [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York',
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };

  if (loading) return <p className="text-text-secondary">{tc('loading')}</p>;
  if (!data) return <p className="text-text-secondary">{tc('noData')}</p>;

  const { stats } = data;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-medium">{t('title')}</h2>
        <span className="text-sm text-text-secondary">({stats.total} total)</span>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-4">
        {['pending', 'claimed', 'completed', 'cancelled'].map((s) => (
          <div key={s} className="px-3 py-2 rounded-lg border border-border bg-bg-secondary">
            <p className="text-xs text-text-secondary">{t(`status${s.charAt(0).toUpperCase() + s.slice(1)}`)}</p>
            <p className="text-lg font-medium">{stats[s]}</p>
          </div>
        ))}
      </div>

      {/* Search + Pagination */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by event or requester..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg w-full max-w-sm text-sm"
        />
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary">←</button>
          <span className="text-sm text-text-muted px-2 whitespace-nowrap">{page + 1} / {totalPages || 1}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary">→</button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left p-2 pl-3 font-medium w-8"></th>
              <th className="text-left p-2 font-medium">{t('eventName')}</th>
              <th className="text-left p-2 font-medium">{t('requester')}</th>
              <th className="text-left p-2 font-medium">{t('date')}</th>
              <th className="text-left p-2 font-medium">{t('time')}</th>
              <th className="text-left p-2 font-medium">{t('status')}</th>
              <th className="text-left p-2 pr-3 font-medium">{t('cost')}</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r) => {
              const isExpanded = expandedId === r.id;
              return (
                <>
                  <tr key={r.id}
                    className="border-b border-border last:border-0 cursor-pointer hover:bg-bg-secondary/50"
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                    <td className="p-2 pl-3 text-text-secondary text-xs select-none">{isExpanded ? '▼' : '▶'}</td>
                    <td className="p-2">{r.event_name || '—'}</td>
                    <td className="p-2 whitespace-nowrap">{r.requester_name}</td>
                    <td className="p-2 whitespace-nowrap">{formatDate(r.event_date)}</td>
                    <td className="p-2 whitespace-nowrap">{formatTime(r.start_time)} – {formatTime(r.end_time)}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || ''}`}>
                        {t(`status${r.status.charAt(0).toUpperCase() + r.status.slice(1)}`)}
                      </span>
                    </td>
                    <td className="p-2 pr-3">${r.total_cost?.toFixed(2) || '—'}</td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${r.id}-details`} className="border-b border-border last:border-0 bg-bg-secondary/30">
                      <td></td>
                      <td colSpan={6} className="p-3">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm max-w-lg">
                          <div><span className="text-text-secondary">{t('type')}:</span> <span className="capitalize">{r.event_type}</span></div>
                          <div><span className="text-text-secondary">{t('confirmationCode')}:</span> {r.confirmation_code}</div>
                          {r.location && <div className="col-span-2"><span className="text-text-secondary">{t('location')}:</span> {r.location}</div>}
                          {r.description && <div className="col-span-2"><span className="text-text-secondary">{t('description')}:</span> {r.description}</div>}
                          {r.claimed_by && <div className="col-span-2"><span className="text-text-secondary">{t('claimedBy')}:</span> {r.claimed_by}</div>}
                          <div><span className="text-text-secondary">Rate:</span> ${r.hourly_rate}/hr</div>
                          <div><span className="text-text-secondary">Duration:</span> {r.duration_hours}h</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {paginated.length === 0 && (
              <tr><td colSpan={7} className="p-3 text-center text-text-secondary">{t('noRequests')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/[locale]/dashboard/inquiries/hire-requests/page.jsx
git commit -m "feat: add Hire Requests subtab page"
```

---

### Task 7: Create the Yearbook Requests subtab page

**Files:**
- Create: `src/app/[locale]/dashboard/inquiries/yearbook-requests/page.jsx`

**Step 1: Create the page component**

```jsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';

const PAGE_SIZE = 10;

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  fulfilled: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function InquiriesYearbookRequestsPage() {
  const t = useTranslations('dashboard.inquiries.yearbookRequests');
  const tc = useTranslations('dashboard.inquiries.common');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/inquiries/yearbook-requests');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching yearbook requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    if (!data?.requests) return [];
    if (!search) return data.requests;
    const q = search.toLowerCase();
    return data.requests.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q)
    );
  }, [data, search]);

  useEffect(() => { setPage(0); }, [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/inquiries/yearbook-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Status update error:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York',
    });
  };

  if (loading) return <p className="text-text-secondary">{tc('loading')}</p>;
  if (!data) return <p className="text-text-secondary">{tc('noData')}</p>;

  const { stats } = data;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-medium">{t('title')}</h2>
        <span className="text-sm text-text-secondary">({stats.total} total)</span>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-4">
        {[
          { key: 'pending', label: t('pending'), count: stats.pending },
          { key: 'fulfilled', label: t('fulfilled'), count: stats.fulfilled },
        ].map(({ key, label, count }) => (
          <div key={key} className="px-3 py-2 rounded-lg border border-border bg-bg-secondary">
            <p className="text-xs text-text-secondary">{label}</p>
            <p className="text-lg font-medium">{count}</p>
          </div>
        ))}
      </div>

      {/* Search + Pagination */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg w-full max-w-sm text-sm"
        />
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary">←</button>
          <span className="text-sm text-text-muted px-2 whitespace-nowrap">{page + 1} / {totalPages || 1}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary">→</button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left p-2 pl-3 font-medium w-8"></th>
              <th className="text-left p-2 font-medium">{t('name')}</th>
              <th className="text-left p-2 font-medium">{t('email')}</th>
              <th className="text-left p-2 font-medium">{t('source')}</th>
              <th className="text-left p-2 font-medium">{t('yearRequested')}</th>
              <th className="text-left p-2 font-medium">{t('status')}</th>
              <th className="text-left p-2 pr-3 font-medium">{t('date')}</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r) => {
              const isExpanded = expandedId === r.id;
              return (
                <>
                  <tr key={r.id}
                    className="border-b border-border last:border-0 cursor-pointer hover:bg-bg-secondary/50"
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                    <td className="p-2 pl-3 text-text-secondary text-xs select-none">{isExpanded ? '▼' : '▶'}</td>
                    <td className="p-2 whitespace-nowrap">{r.name}</td>
                    <td className="p-2">{r.email}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.source === 'parent' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'}`}>
                        {r.source === 'parent' ? t('sourceParent') : t('sourceAlumni')}
                      </span>
                    </td>
                    <td className="p-2">{r.year_requested}</td>
                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={r.status}
                        disabled={updatingId === r.id}
                        onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        className={`px-2 py-0.5 rounded text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[r.status] || ''} ${updatingId === r.id ? 'opacity-50' : ''}`}
                      >
                        <option value="pending">{t('statusPending')}</option>
                        <option value="fulfilled">{t('statusFulfilled')}</option>
                        <option value="cancelled">{t('statusCancelled')}</option>
                      </select>
                    </td>
                    <td className="p-2 pr-3 whitespace-nowrap">{formatDate(r.created_at)}</td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${r.id}-details`} className="border-b border-border last:border-0 bg-bg-secondary/30">
                      <td></td>
                      <td colSpan={6} className="p-3">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm max-w-lg">
                          {r.student_name && <div><span className="text-text-secondary">{t('studentName')}:</span> {r.student_name}</div>}
                          {r.graduation_year && <div><span className="text-text-secondary">{t('graduationYear')}:</span> {r.graduation_year}</div>}
                          {r.shipping_address && (
                            <div className="col-span-2">
                              <span className="text-text-secondary">{t('shippingAddress')}:</span>{' '}
                              {[r.shipping_address, r.shipping_city, r.shipping_state, r.shipping_zip].filter(Boolean).join(', ')}
                            </div>
                          )}
                          {r.message && <div className="col-span-2"><span className="text-text-secondary">{t('message')}:</span> {r.message}</div>}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {paginated.length === 0 && (
              <tr><td colSpan={7} className="p-3 text-center text-text-secondary">{t('noRequests')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/[locale]/dashboard/inquiries/yearbook-requests/page.jsx
git commit -m "feat: add Yearbook Requests subtab page"
```

---

### Task 8: Build and verify

**Step 1: Run the build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Manual verification checklist**

- Navigate to `/en/dashboard` as admin → Inquiries tab visible between Responses and Settings
- Click Inquiries → lands on Hire Requests subtab
- Hire Requests shows table with status badges, expandable rows
- Click Yearbook Requests subtab → shows table with status dropdowns
- Submit a parent inquiry with "Purchase Old Yearbook" category → appears in Yearbook Requests
- Submit an alumni inquiry with "Old Yearbooks" category → appears in Yearbook Requests
- Change status dropdown on a yearbook request → status updates
- Non-admin users should NOT see the Inquiries tab

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Inquiries tab with hire requests and yearbook requests"
```
