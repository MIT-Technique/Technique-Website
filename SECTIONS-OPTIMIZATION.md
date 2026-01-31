# Section Assignment Feature - Implementation Plan

**Generated:** 2026-01-27
**Target Branch:** Current (simplified living groups schema)
**Purpose:** Implement time slot assignment feature for living group sections

---

## Executive Summary

This document provides a complete implementation plan for adding **section-to-timeslot assignment** functionality to the current branch. The feature allows dorm/living group leaders to assign different sections to 30-minute time slots within their booked photoshoot times.

### Current State of Branch
- ✅ `living_groups.dorm_sections` exists (text array, user-managed)
- ✅ `/api/living-groups/sections` exists (GET/POST/DELETE)
- ✅ `living_group_manual_members.section_name` exists
- ❌ **NO** `living_group_time_assignments` table (needs to be created)
- ❌ **NO** time assignment API routes (needs to be implemented)
- ❌ **NO** section assignment UI (needs to be built)

---

## Table of Contents
1. [Database Changes](#database-changes)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Testing Strategy](#testing-strategy)
5. [Implementation Checklist](#implementation-checklist)

---

## Database Changes

### New Table: `living_group_time_assignments`

**Create this table in Supabase:**

```sql
-- ============================================================
-- Section Assignment Feature - Database Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS public.living_group_time_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  photoshoot_time_id uuid NOT NULL,
  living_group_id uuid NOT NULL,
  section_name text, -- Can be NULL for unassigned slots
  slot_start time without time zone NOT NULL, -- Must be XX:00 or XX:30
  slot_end time without time zone NOT NULL, -- Must be XX:00 or XX:30
  assigned_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),

  CONSTRAINT living_group_time_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT living_group_time_assignments_photoshoot_fkey
    FOREIGN KEY (photoshoot_time_id) REFERENCES public.photoshoot_times(id) ON DELETE CASCADE,
  CONSTRAINT living_group_time_assignments_living_group_fkey
    FOREIGN KEY (living_group_id) REFERENCES public.living_groups(id) ON DELETE CASCADE,
  CONSTRAINT living_group_time_assignments_assigned_by_fkey
    FOREIGN KEY (assigned_by) REFERENCES public.users(id),

  -- Unique constraint: only one assignment per slot per photoshoot
  CONSTRAINT living_group_time_assignments_unique
    UNIQUE (photoshoot_time_id, slot_start, slot_end)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lgta_photoshoot
  ON public.living_group_time_assignments(photoshoot_time_id);
CREATE INDEX IF NOT EXISTS idx_lgta_living_group
  ON public.living_group_time_assignments(living_group_id);
CREATE INDEX IF NOT EXISTS idx_lgta_section
  ON public.living_group_time_assignments(section_name);

-- Enable RLS
ALTER TABLE public.living_group_time_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view assignments for their living group
CREATE POLICY "Users can view their LG time assignments"
ON public.living_group_time_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.living_groups lg
    JOIN public.users u ON u.id = lg.user_id
    WHERE lg.id = living_group_time_assignments.living_group_id
    AND u.supabase_auth_id = auth.uid()
  )
);

-- RLS Policy: Admins can view all assignments
CREATE POLICY "Admins can view all time assignments"
ON public.living_group_time_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.supabase_auth_id = auth.uid()
    AND (u.role = 'admin' OR u.is_staph = true)
  )
);
```

**Key Design Decisions:**
1. **`section_name` as text** - References `living_groups.dorm_sections` array (no foreign key needed)
2. **`ON DELETE CASCADE`** - If photoshoot is deleted, assignments are auto-deleted
3. **30-minute slots** - `slot_start` and `slot_end` validated by API (must be XX:00 or XX:30)
4. **Unique constraint** - Prevents duplicate assignments for the same slot
5. **Nullable `section_name`** - Allows explicit "unassigned" slots

---

## Backend Implementation

### Utility Functions

**File:** `src/lib/utils/time.ts` (may already exist, enhance if needed)

```typescript
/**
 * Validate that a time string is on a 30-minute boundary (XX:00 or XX:30)
 */
export function isValidTimeSlot(time: string): boolean {
  const parts = time.split(':');
  if (parts.length < 2) return false;
  const minutes = parseInt(parts[1], 10);
  return minutes === 0 || minutes === 30;
}

/**
 * Convert time string to minutes for comparison
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Generate 30-minute time slots between start and end
 */
export function generateTimeSlots(
  start: string,
  end: string
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];

  let [h, m] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  // Round to 30-min boundary
  if (m !== 0 && m !== 30) {
    m = m < 30 ? 30 : 0;
    if (m === 0) h++;
  }

  while (h < endH || (h === endH && m < endM)) {
    const slotStart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    m += 30;
    if (m >= 60) { m = 0; h++; }
    const slotEnd = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    slots.push({ start: slotStart, end: slotEnd });
  }

  return slots;
}

/**
 * Format time for display (14:30 -> 2:30 PM)
 */
export function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
}
```

---

### API Route 1: GET Time Assignments

**File:** `src/app/api/living-groups/time-assignments/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const photoshootTimeId = searchParams.get("photoshootTimeId");
    const livingGroupId = searchParams.get("livingGroupId");

    if (!photoshootTimeId && !livingGroupId) {
      return NextResponse.json(
        { error: "Either photoshootTimeId or livingGroupId is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Build query
    let query = supabase
      .from("living_group_time_assignments")
      .select(`
        id,
        photoshoot_time_id,
        living_group_id,
        section_name,
        slot_start,
        slot_end,
        assigned_by,
        created_at,
        photoshoot_time:photoshoot_times!living_group_time_assignments_photoshoot_time_id_fkey(
          id,
          date,
          start_time,
          end_time,
          location
        )
      `);

    if (photoshootTimeId) {
      query = query.eq("photoshoot_time_id", photoshootTimeId);
    }
    if (livingGroupId) {
      query = query.eq("living_group_id", livingGroupId);
    }

    const { data: assignments, error } = await query.order("slot_start", { ascending: true });

    if (error) {
      console.error("Get time assignments error:", error);
      return NextResponse.json(
        { error: "Failed to get time assignments" },
        { status: 500 }
      );
    }

    // Format response
    const formatted = (assignments || []).map(a => {
      const photoshoot = Array.isArray(a.photoshoot_time) ? a.photoshoot_time[0] : a.photoshoot_time;
      return {
        id: a.id,
        photoshootTimeId: a.photoshoot_time_id,
        livingGroupId: a.living_group_id,
        sectionName: a.section_name,
        slotStart: a.slot_start,
        slotEnd: a.slot_end,
        photoshootDate: photoshoot?.date,
        photoshootStartTime: photoshoot?.start_time,
        photoshootEndTime: photoshoot?.end_time,
        photoshootLocation: photoshoot?.location,
        createdAt: a.created_at,
      };
    });

    return NextResponse.json({ assignments: formatted });
  } catch (error) {
    console.error("Get time assignments error:", error);
    return NextResponse.json(
      { error: "Failed to get time assignments" },
      { status: 500 }
    );
  }
}
```

---

### API Route 2: POST/UPDATE Assignment

**Add to same file** (`src/app/api/living-groups/time-assignments/route.ts`)

```typescript
import { isValidTimeSlot, timeToMinutes } from "../../../../lib/utils/time";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { photoshootTimeId, livingGroupId, sectionName, slotStart, slotEnd } = body;

    // Validation: Required fields
    if (!photoshootTimeId || !livingGroupId || !slotStart || !slotEnd) {
      return NextResponse.json(
        { error: "photoshootTimeId, livingGroupId, slotStart, and slotEnd are required" },
        { status: 400 }
      );
    }

    // Validation: Time slots on 30-min boundaries
    if (!isValidTimeSlot(slotStart) || !isValidTimeSlot(slotEnd)) {
      return NextResponse.json(
        { error: "Time slots must be on 30-minute boundaries (XX:00 or XX:30)" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get living group and verify access
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id, user_id, name, dorm_sections")
      .eq("id", livingGroupId)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json({ error: "Living group not found" }, { status: 404 });
    }

    // Authorization check
    const isOwner = livingGroup.user_id === user.id;
    const isAdmin = user.role === "admin" || user.is_staph;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate section name if provided
    if (sectionName) {
      const dormSections = livingGroup.dorm_sections || [];
      if (!dormSections.includes(sectionName)) {
        return NextResponse.json(
          { error: "Invalid section for this living group" },
          { status: 400 }
        );
      }
    }

    // Verify photoshoot time exists and belongs to this living group
    const { data: photoshootTime, error: ptError } = await supabase
      .from("photoshoot_times")
      .select("id, living_group_id, start_time, end_time, date")
      .eq("id", photoshootTimeId)
      .single();

    if (ptError || !photoshootTime) {
      return NextResponse.json({ error: "Photoshoot time not found" }, { status: 404 });
    }

    if (photoshootTime.living_group_id !== livingGroupId) {
      return NextResponse.json(
        { error: "Photoshoot time does not belong to this living group" },
        { status: 400 }
      );
    }

    // Verify slot is within photoshoot time range
    const slotStartMins = timeToMinutes(slotStart);
    const slotEndMins = timeToMinutes(slotEnd);
    const photoshootStartMins = timeToMinutes(photoshootTime.start_time);
    const photoshootEndMins = timeToMinutes(photoshootTime.end_time);

    if (slotStartMins < photoshootStartMins || slotEndMins > photoshootEndMins) {
      return NextResponse.json(
        { error: "Time slot must be within the photoshoot time range" },
        { status: 400 }
      );
    }

    // Check if this slot already has an assignment (upsert)
    const { data: existingAssignment } = await supabase
      .from("living_group_time_assignments")
      .select("id")
      .eq("photoshoot_time_id", photoshootTimeId)
      .eq("slot_start", slotStart)
      .eq("slot_end", slotEnd)
      .single();

    if (existingAssignment) {
      // UPDATE existing
      const { error: updateError } = await supabase
        .from("living_group_time_assignments")
        .update({
          section_name: sectionName || null,
          assigned_by: user.id,
        })
        .eq("id", existingAssignment.id);

      if (updateError) {
        console.error("Update assignment error:", updateError);
        return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Assignment updated",
        assignmentId: existingAssignment.id,
      });
    }

    // INSERT new assignment
    const { data: newAssignment, error: insertError } = await supabase
      .from("living_group_time_assignments")
      .insert({
        photoshoot_time_id: photoshootTimeId,
        living_group_id: livingGroupId,
        section_name: sectionName || null,
        slot_start: slotStart,
        slot_end: slotEnd,
        assigned_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Create assignment error:", insertError);
      return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Section assigned to time slot",
      assignmentId: newAssignment.id,
    });
  } catch (error) {
    console.error("Create time assignment error:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}
```

---

### API Route 3: DELETE Assignment

**Add to same file** (`src/app/api/living-groups/time-assignments/route.ts`)

```typescript
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get the assignment
    const { data: assignment, error: assError } = await supabase
      .from("living_group_time_assignments")
      .select("id, living_group_id")
      .eq("id", assignmentId)
      .single();

    if (assError || !assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Verify access
    const { data: livingGroup } = await supabase
      .from("living_groups")
      .select("id, user_id")
      .eq("id", assignment.living_group_id)
      .single();

    if (!livingGroup) {
      return NextResponse.json({ error: "Living group not found" }, { status: 404 });
    }

    const isOwner = livingGroup.user_id === user.id;
    const isAdmin = user.role === "admin" || user.is_staph;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete the assignment
    const { error: deleteError } = await supabase
      .from("living_group_time_assignments")
      .delete()
      .eq("id", assignmentId);

    if (deleteError) {
      console.error("Delete assignment error:", deleteError);
      return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Assignment removed" });
  } catch (error) {
    console.error("Delete time assignment error:", error);
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
```

---

## Frontend Implementation

### Integration Point

**Target File:** Where living groups manage their bookings (likely `/api/living-groups/times` related page)

### State Management

```javascript
// State for section assignments
const [timeAssignments, setTimeAssignments] = useState({});
// Structure: { photoshootTimeId: { 'slotStart-slotEnd': sectionName } }

const [assignmentsLoading, setAssignmentsLoading] = useState(false);
const [savingSlot, setSavingSlot] = useState(null); // 'photoshootId-slotKey'
const [sections, setSections] = useState([]); // From existing /api/living-groups/sections
const [bookedTimes, setBookedTimes] = useState([]);
```

### Fetch Functions

```javascript
// Fetch sections (already exists in codebase)
async function fetchSections() {
  try {
    const res = await fetch('/api/living-groups/sections');
    const data = await res.json();
    setSections(data.sections || []);
  } catch (error) {
    console.error('Error fetching sections:', error);
  }
}

// Fetch time assignments
async function fetchTimeAssignments(livingGroupId) {
  try {
    setAssignmentsLoading(true);
    const res = await fetch(`/api/living-groups/time-assignments?livingGroupId=${livingGroupId}`);
    const data = await res.json();

    // Transform array to map
    const assignmentsMap = {};
    (data.assignments || []).forEach(a => {
      if (!assignmentsMap[a.photoshootTimeId]) {
        assignmentsMap[a.photoshootTimeId] = {};
      }
      const slotKey = `${a.slotStart}-${a.slotEnd}`;
      assignmentsMap[a.photoshootTimeId][slotKey] = a.sectionName || '';
    });
    setTimeAssignments(assignmentsMap);
  } catch (error) {
    console.error('Error fetching assignments:', error);
  } finally {
    setAssignmentsLoading(false);
  }
}

// Generate 30-min slots
function generateSlots(startTime, endTime) {
  const slots = [];
  let [h, m] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  // Round to 30-min boundary
  if (m !== 0 && m !== 30) {
    m = m < 30 ? 30 : 0;
    if (m === 0) h++;
  }

  while (h < endH || (h === endH && m < endM)) {
    const slotStart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    m += 30;
    if (m >= 60) { m = 0; h++; }
    const slotEnd = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    slots.push({ start: slotStart, end: slotEnd });
  }
  return slots;
}

// Handle assignment change (auto-saves)
async function handleAssignSection(photoshootTimeId, slotStart, slotEnd, sectionName, livingGroupId) {
  const slotKey = `${slotStart}-${slotEnd}`;
  setSavingSlot(`${photoshootTimeId}-${slotKey}`);

  try {
    const res = await fetch('/api/living-groups/time-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoshootTimeId,
        livingGroupId,
        sectionName: sectionName || null,
        slotStart,
        slotEnd,
      }),
    });

    if (res.ok) {
      // Optimistic update
      setTimeAssignments(prev => ({
        ...prev,
        [photoshootTimeId]: {
          ...(prev[photoshootTimeId] || {}),
          [slotKey]: sectionName || '',
        },
      }));
      setMessage({ type: 'success', text: 'Assignment saved' });
    } else {
      const data = await res.json();
      setMessage({ type: 'error', text: data.error || 'Failed to save' });
    }
  } catch (error) {
    setMessage({ type: 'error', text: 'Failed to save assignment' });
  } finally {
    setSavingSlot(null);
  }
}
```

### UI Component

```jsx
{/* Section Assignment Interface */}
{/* Only show if sections.length > 1 (multiple sections to assign) */}
{sections.length > 1 && bookedTimes.length > 0 && (
  <div className="mt-8">
    <h3 className="text-lg font-medium mb-4">Assign Sections to Time Slots</h3>
    <p className="text-text-secondary text-sm mb-4">
      Assign each section to a 30-minute time slot during your photoshoot.
    </p>

    {/* Unassigned sections warning */}
    {(() => {
      const allAssignedSections = new Set();
      bookedTimes.forEach(bt => {
        const assignments = timeAssignments[bt.id] || {};
        Object.values(assignments).forEach(sectionName => {
          if (sectionName) allAssignedSections.add(sectionName);
        });
      });
      const unassigned = sections.filter(s => !allAssignedSections.has(s));

      if (unassigned.length > 0) {
        return (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Sections not yet assigned:</span>{' '}
              {unassigned.join(', ')}
            </p>
          </div>
        );
      }
      return (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm font-medium text-green-800">All sections assigned!</p>
        </div>
      );
    })()}

    {/* Assignment grid for each booked time */}
    <div className="space-y-4">
      {bookedTimes.map((bookedTime) => (
        <div key={bookedTime.id} className="bg-white border border-border rounded-lg p-6">
          {/* Date/Time header */}
          <div className="mb-4">
            <p className="font-medium">{formatDate(bookedTime.date)}</p>
            <p className="text-text-secondary text-sm">
              {formatTime(bookedTime.start_time)} - {formatTime(bookedTime.end_time)} EST
            </p>
          </div>

          {/* Slot grid */}
          {assignmentsLoading ? (
            <p className="text-text-muted text-sm">Loading...</p>
          ) : (
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-[100px_1fr] gap-2 text-xs font-medium text-text-muted uppercase mb-2">
                <span>Slot</span>
                <span>Section</span>
              </div>

              {/* Slot rows */}
              {generateSlots(bookedTime.start_time, bookedTime.end_time).map((slot) => {
                const slotKey = `${slot.start}-${slot.end}`;
                const currentAssignment = timeAssignments[bookedTime.id]?.[slotKey] || '';
                const isSaving = savingSlot === `${bookedTime.id}-${slotKey}`;

                return (
                  <div key={slotKey} className="grid grid-cols-[100px_1fr] gap-2 items-center">
                    <span className="text-sm font-medium">
                      {formatTime(slot.start)} - {formatTime(slot.end)}
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={currentAssignment}
                        onChange={(e) => handleAssignSection(
                          bookedTime.id,
                          slot.start,
                          slot.end,
                          e.target.value,
                          livingGroupId
                        )}
                        disabled={isSaving}
                        className="flex-1 px-3 py-1.5 border border-border rounded text-sm disabled:opacity-50"
                      >
                        <option value="">Not assigned</option>
                        {sections.map((section) => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                      {isSaving && <span className="text-xs text-text-muted">Saving...</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}
```

### Format Time Helper

```javascript
function formatTime(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
```

---

## Testing Strategy

### Database Tests
1. ✅ Create `living_group_time_assignments` table
2. ✅ Verify foreign key constraints work
3. ✅ Test unique constraint (prevent duplicate slot assignments)
4. ✅ Test CASCADE delete (delete photoshoot → assignments deleted)
5. ✅ Test RLS policies (users can only see their assignments)

### Backend API Tests
1. **GET /api/living-groups/time-assignments**
   - ✅ Returns empty array when no assignments
   - ✅ Returns assignments for specific photoshoot
   - ✅ Returns assignments for specific living group
   - ✅ Joins photoshoot data correctly
   - ✅ Orders by slot_start ascending

2. **POST /api/living-groups/time-assignments**
   - ✅ Creates new assignment successfully
   - ✅ Updates existing assignment (upsert)
   - ✅ Rejects invalid time slots (not XX:00 or XX:30)
   - ✅ Rejects slots outside photoshoot range
   - ✅ Rejects invalid section names
   - ✅ Rejects unauthorized users
   - ✅ Accepts null section_name (unassign)

3. **DELETE /api/living-groups/time-assignments**
   - ✅ Deletes assignment successfully
   - ✅ Returns 404 for non-existent assignment
   - ✅ Rejects unauthorized users

### Frontend Tests
1. **Section Management**
   - ✅ Fetches sections from existing API
   - ✅ Hides assignment UI when sections.length <= 1
   - ✅ Shows assignment UI when sections.length > 1

2. **Slot Generation**
   - ✅ Generates correct 30-min slots (2:00-4:00 → 4 slots)
   - ✅ Rounds non-boundary start times (2:15 → starts at 2:30)
   - ✅ Handles edge cases (23:30-00:00)

3. **Assignment UI**
   - ✅ Displays current assignments correctly
   - ✅ Saves changes immediately on dropdown change
   - ✅ Shows "Saving..." indicator during save
   - ✅ Updates local state optimistically
   - ✅ Shows unassigned sections warning (yellow)
   - ✅ Shows all assigned success (green)
   - ✅ Allows unassigning (select "Not assigned")

4. **Error Handling**
   - ✅ Shows error message on API failure
   - ✅ Handles network errors gracefully
   - ✅ Validates section exists before saving

---

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Run SQL migration to create `living_group_time_assignments` table
- [ ] Verify table created with correct columns
- [ ] Verify foreign key constraints work
- [ ] Verify unique constraint works
- [ ] Test RLS policies (users can view their assignments)

### Phase 2: Backend Utilities
- [ ] Create or enhance `src/lib/utils/time.ts`
- [ ] Implement `isValidTimeSlot()` function
- [ ] Implement `timeToMinutes()` function
- [ ] Implement `generateTimeSlots()` function
- [ ] Implement `formatTimeDisplay()` function
- [ ] Write unit tests for time utilities

### Phase 3: Backend API
- [ ] Create `src/app/api/living-groups/time-assignments/route.ts`
- [ ] Implement GET endpoint (fetch assignments)
- [ ] Implement POST endpoint (create/update assignment)
- [ ] Implement DELETE endpoint (remove assignment)
- [ ] Add all 8 validation rules to POST
- [ ] Add authorization checks (owner/admin)
- [ ] Test all endpoints with Postman/curl

### Phase 4: Frontend State Management
- [ ] Add state variables to booking management page/component
- [ ] Implement `fetchTimeAssignments()` function
- [ ] Implement `generateSlots()` function
- [ ] Implement `handleAssignSection()` function
- [ ] Implement helper functions (formatTime, formatDate)
- [ ] Test state transformations

### Phase 5: Frontend UI
- [ ] Add section assignment interface to booking page
- [ ] Implement conditional rendering (only if sections.length > 1)
- [ ] Add unassigned sections warning banner
- [ ] Add all assigned success banner
- [ ] Add slot grid with dropdowns
- [ ] Add "Saving..." indicator
- [ ] Test responsive layout (mobile/desktop)

### Phase 6: Integration Testing
- [ ] Test complete user flow (book time → assign sections)
- [ ] Test with 0 sections (UI should not appear)
- [ ] Test with 1 section (UI should not appear)
- [ ] Test with 2+ sections (UI should appear)
- [ ] Test multiple booked times simultaneously
- [ ] Test re-assigning sections (update existing)
- [ ] Test unassigning sections (set to null)
- [ ] Test authorization (non-owner cannot assign)

### Phase 7: Edge Cases
- [ ] Test photoshoot deleted (assignments auto-deleted)
- [ ] Test section deleted (manual member section_name cleared)
- [ ] Test non-30-min boundary times (API rejects)
- [ ] Test slot outside photoshoot range (API rejects)
- [ ] Test invalid section names (API rejects)
- [ ] Test concurrent edits (last write wins)

### Phase 8: Translation
- [ ] Add translation keys to `src/messages/en.json`
- [ ] Add translation keys to `src/messages/es.json`
- [ ] Add translation keys to `src/messages/zh.json`
- [ ] Test all translated strings render correctly

**Translation Keys Needed:**
```json
{
  "livingGroupPage": {
    "assign": {
      "title": "Assign Sections to Time Slots",
      "description": "Assign each section to a 30-minute time slot during your photoshoot.",
      "slot": "Slot",
      "section": "Section",
      "notAssigned": "Not assigned",
      "saving": "Saving...",
      "saved": "Assignment saved",
      "saveError": "Failed to save assignment",
      "unassignedSections": "Sections not yet assigned:",
      "allAssigned": "All sections assigned!"
    }
  }
}
```

---

## Rollback Plan

If issues arise, rollback steps:

1. **Remove UI** - Comment out section assignment component
2. **Disable API** - Comment out route handlers
3. **Drop table** - `DROP TABLE IF EXISTS public.living_group_time_assignments;`

No impact on existing features since this is purely additive.

---

## Future Enhancements

Once basic feature is stable:

1. **Drag-and-drop assignment** - Visual time slot drag-and-drop
2. **Bulk assignment** - Auto-assign sections to slots
3. **Export to PDF** - Print-friendly assignment schedule
4. **SMS reminders** - Send section-specific reminders
5. **Expected counts** - Track expected members per section
6. **Real-time collaboration** - Multiple leaders editing simultaneously
7. **Assignment history** - Audit log of changes
8. **Conflict detection** - Warn if section double-booked

---

## Key Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `living_group_time_assignments` (table) | Stores assignments | **CREATE** |
| `src/lib/utils/time.ts` | Time validation utilities | **CREATE/ENHANCE** |
| `src/app/api/living-groups/time-assignments/route.ts` | Assignment API (GET/POST/DELETE) | **CREATE** |
| Living group booking page/component | Assignment UI | **ENHANCE** |
| `src/messages/{locale}.json` | Translation keys | **ENHANCE** |

---

## Notes

### Compatibility with Existing Code
- ✅ Uses existing `living_groups.dorm_sections` column
- ✅ Uses existing `/api/living-groups/sections` endpoint
- ✅ Compatible with existing `photoshoot_times` table
- ✅ No changes needed to existing booking flow
- ✅ Purely additive feature (no breaking changes)

### Differences from Original Branch
**Original (Trial) Branch:**
- Had `living_group_leader_permissions` table
- Had pre-seeded sections (80+ MIT dorms)
- Sections were read-only (from seed data)

**Current Branch:**
- NO `living_group_leader_permissions` (simplified auth)
- Sections are user-managed (POST/DELETE)
- Sections are dynamic (no seed data)

**Implementation Adjustments:**
- Remove `living_group_leader_permissions` checks from auth (use `livingGroup.user_id` only)
- Don't rely on pre-seeded sections (users create their own)
- Section validation checks against `living_groups.dorm_sections` array

---

**End of Implementation Plan**
