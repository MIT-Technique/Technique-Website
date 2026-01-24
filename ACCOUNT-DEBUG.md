# ACCOUNT-DEBUG: Staph Role Architecture & Login Loop Fix

**Status:** Implementation Complete

---

## Problem Summary

### Issue 1: Staph Role Replaces Student Role
Previously, when a user was promoted to `staph`, their role changed FROM `student` TO `staph`. This caused them to lose access to all student features:
- Could not join clubs
- Could not join living groups (dorms/FSILGs)
- Could not receive club invitations
- Lost "My Clubs" and "My Living Groups" tabs

### Issue 2: Admin Tools Tab Shows Login Loop
When a user with `staph` role visited their profile, the "Admin Tools" tab showed a login button even though they were already logged in, creating an infinite redirect loop.

---

## Solution: `is_staph` Boolean Flag

Instead of using `staph` as a separate role, we now use a boolean flag `is_staph` on the user record. This allows staph users to retain their `student` role and all associated permissions.

### Database Migration (Run in Supabase SQL Editor)

```sql
-- Add is_staph boolean column to users table
ALTER TABLE public.users ADD COLUMN is_staph boolean DEFAULT false;

-- Migrate existing staph users back to student role
UPDATE public.users SET is_staph = true WHERE role = 'staph';
UPDATE public.users SET role = 'student' WHERE role = 'staph';
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/lib/supabase/types.ts` | Added `is_staph: boolean` to User interface |
| `src/app/[locale]/profile/page.jsx` | Tab logic uses `user?.is_staph`, renamed to "Photographer Tools", uses `PhotographerTimesSection` |
| `src/app/api/admin/toggle-staph/route.ts` | **NEW** - Admin API to toggle is_staph boolean |
| `src/app/[locale]/dashboard/users/page.jsx` | Added staph toggle button, removed 'staph' from role dropdowns |
| `src/messages/en.json` | Updated tab name, added staph toggle translations |
| `src/messages/es.json` | Updated tab name, added staph toggle translations |
| `src/messages/zh.json` | Updated tab name, added staph toggle translations |
| `src/app/api/photographer/times/route.ts` | Updated permission check to recognize `is_staph` users |
| `src/app/api/photographer/proposals/route.ts` | Updated permission check to recognize `is_staph` users |

---

## Key Changes

### Profile Page Tab Logic
```javascript
// OLD: Role-based check (broken)
if (user?.role === 'staph') {
  tabs.push({ id: 'adminTools', label: t('tabs.adminTools') });
}

// NEW: Boolean flag check (working)
if (user?.is_staph) {
  tabs.push({ id: 'photographerTools', label: t('tabs.photographerTools') });
}
```

### Admin Toggle API
Admins can now toggle staph status directly from the Users dashboard page:
- Only works on users with `role === 'student'`
- Toggles the `is_staph` boolean
- No promotion request flow needed

### Photographer API Permission Check
The photographer API routes now check `is_staph` first before falling back to `photographer_permissions`:
```javascript
async function isStaphOrPhotographer(userId, supabase) {
  // Check if user is staph
  const { data: userData } = await supabase
    .from("users")
    .select("is_staph")
    .eq("id", userId)
    .single();

  if (userData?.is_staph) {
    return true;
  }

  // Check photographer_permissions as fallback
  const { data: permData } = await supabase
    .from("photographer_permissions")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();
  return !!permData;
}
```

---

## Verification Checklist

- [x] Database migration adds `is_staph` column
- [x] Staph user retains student role (can join clubs, living groups)
- [x] Staph user sees "Photographer Tools" tab (not "Admin Tools")
- [x] Tab shows photoshoot schedule (no login loop)
- [x] Admin can toggle staph status from Users page
- [x] Student without staph flag does NOT see Photographer Tools tab
- [x] Translations updated in all 3 languages (en, es, zh)
- [x] Staph/photographer request buttons removed from student profile (admin-only assignment)
- [x] "Pending Proposals" renamed to "Proposed Timeslots" in Photographer Tools tab
- [x] Staph users (`is_staph: true`) can add time slots and manage proposals

---

## How Staph Assignment Works Now

1. **Admin opens Dashboard** at `/dashboard`
2. **Navigate to Users tab**
3. **Find the student** to grant staph access
4. **Click the Staph toggle button** (shows "No" initially)
5. **Confirm** the action
6. **User now has staph access** while retaining all student permissions

To revoke staph access, repeat the same process - the button will show "Staph" and clicking it will revoke access.
