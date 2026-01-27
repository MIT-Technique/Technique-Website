# Smart Name Parsing Implementation Plan

## Overview

Transform the member management system from a single `name` field to separate `first_name` and `last_name` fields with intelligent bulk import capabilities. Support multiple input formats (comma, newline, tab-separated) and display members sorted by last name.

## Key Changes

1. **Database Schema**: Add `first_name` and `last_name` columns to both manual member tables
2. **Smart Parser**: Create reusable utility to parse various name formats
3. **API Updates**: Support both single-add and bulk-import modes
4. **UI Enhancement**: Add two-mode interface (single/bulk) with preview functionality
5. **Sorting**: Display members alphabetically by last name, then first name

---

## Implementation Steps

### Step 1: Database Migration

**Create**: `supabase/migrations/20260127_name_parsing_migration.sql`

```sql
-- Add first_name and last_name columns
ALTER TABLE public.club_manual_members
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

ALTER TABLE public.living_group_manual_members
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Migrate existing data
-- Parse "Last, First" format
UPDATE public.club_manual_members
SET
  first_name = TRIM(SPLIT_PART(name, ',', 2)),
  last_name = TRIM(SPLIT_PART(name, ',', 1))
WHERE name LIKE '%,%' AND first_name IS NULL;

-- Parse "First Last" format
UPDATE public.club_manual_members
SET
  first_name = TRIM(SPLIT_PART(name, ' ', 1)),
  last_name = TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
WHERE name LIKE '% %' AND name NOT LIKE '%,%' AND first_name IS NULL;

-- Single names go to last_name
UPDATE public.club_manual_members
SET first_name = '', last_name = TRIM(name)
WHERE first_name IS NULL AND name IS NOT NULL;

-- Repeat for living_group_manual_members
UPDATE public.living_group_manual_members
SET
  first_name = TRIM(SPLIT_PART(name, ',', 2)),
  last_name = TRIM(SPLIT_PART(name, ',', 1))
WHERE name LIKE '%,%' AND first_name IS NULL;

UPDATE public.living_group_manual_members
SET
  first_name = TRIM(SPLIT_PART(name, ' ', 1)),
  last_name = TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
WHERE name LIKE '% %' AND name NOT LIKE '%,%' AND first_name IS NULL;

UPDATE public.living_group_manual_members
SET first_name = '', last_name = TRIM(name)
WHERE first_name IS NULL AND name IS NOT NULL;

-- Make columns NOT NULL
ALTER TABLE public.club_manual_members
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

ALTER TABLE public.living_group_manual_members
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- Add indexes for sorting
CREATE INDEX idx_club_manual_members_name
ON public.club_manual_members(last_name, first_name);

CREATE INDEX idx_lg_manual_members_name
ON public.living_group_manual_members(last_name, first_name);

-- Keep 'name' column for now as backup (can drop later)
```

**Test**: Verify existing data migrated correctly with sample queries.

---

### Step 2: Create Name Parser Utility

**Create**: `src/lib/utils/nameParser.ts`

**Key Functions**:

1. **`detectDelimiter(text: string)`** - Auto-detect comma, newline, or tab separation
2. **`splitNames(text: string)`** - Split text into individual name strings
3. **`parseIndividualName(nameStr: string)`** - Parse one name into first/last
   - "First Last" → `{firstName: "First", lastName: "Last"}`
   - "Last, First" → `{firstName: "First", lastName: "Last"}`
   - "SingleName" → `{firstName: "", lastName: "SingleName"}`
   - "First Middle Last" → `{firstName: "First Middle", lastName: "Last"}`
4. **`validateName(firstName, lastName)`** - Check 100-char limits, required fields
5. **`parseBulkNames(text: string)`** - Main function, returns:
   ```typescript
   {
     success: ParsedName[];
     errors: { line: number; text: string; error: string }[];
   }
   ```
6. **`formatName(firstName, lastName)`** - Display helper
7. **`sortByName<T>(members: T[])`** - Sort by last name, then first name

**Edge Cases to Handle**:
- Accented characters (José, García)
- Hyphens and apostrophes (Mary-Jane, O'Brien)
- Multi-word last names (van der Berg)
- Extra whitespace
- Empty lines
- Single-word names
- Names exceeding 100 characters

---

### Step 3: Update Club Manual Members API

**Modify**: `src/app/api/clubs/manual-members/route.ts`

**Changes**:

1. **Add GET endpoint** (currently missing):
   ```typescript
   export async function GET(request: NextRequest) {
     // Fetch members sorted by last_name, first_name
     const { data: members } = await supabase
       .from("club_manual_members")
       .select("*")
       .eq("club_id", clubId)
       .order("last_name")
       .order("first_name");

     return NextResponse.json({ members: members || [] });
   }
   ```

2. **Update POST endpoint** to support both modes:
   ```typescript
   const { firstName, lastName, bulkText, clubId: clubIdParam } = body;

   // BULK IMPORT MODE
   if (bulkText) {
     const parseResult = parseBulkNames(bulkText);
     // Check for duplicates against existing members
     // Bulk insert all non-duplicate names
     // Return: { members, count, parseErrors, duplicates }
   }

   // SINGLE ADD MODE
   if (firstName !== undefined && lastName !== undefined) {
     // Validate, check duplicate, insert single member
   }
   ```

3. **Keep DELETE endpoint** as-is (no changes needed)

---

### Step 4: Update Living Group Manual Members API

**Modify**: `src/app/api/living-groups/manual-members/route.ts`

**Changes**:

1. **Update GET endpoint**:
   - Change `.select("id, name, section_name, added_at")` to `.select("id, first_name, last_name, section_name, added_at")`
   - Change `.order("name")` to `.order("last_name").order("first_name")`

2. **Update POST endpoint**:
   - Same dual-mode approach as clubs (single vs bulk)
   - Support section assignment: `{ firstName, lastName, section_name }` or `{ bulkText, section_name }`
   - For bulk: optionally assign all to same section

3. **Update PUT endpoint**: Change `name` references to `first_name`/`last_name` if needed

4. **Keep DELETE endpoint** as-is

---

### Step 5: Update Club Page UI

**Modify**: `src/app/[locale]/club/page.jsx`

**State Changes** (around lines 35-37):
```javascript
// Replace:
const [newManualMember, setNewManualMember] = useState('');

// With:
const [inputMode, setInputMode] = useState('single'); // 'single' or 'bulk'
const [singleMember, setSingleMember] = useState({ firstName: '', lastName: '' });
const [bulkText, setBulkText] = useState('');
const [parsePreview, setParsePreview] = useState(null);
const [showPreview, setShowPreview] = useState(false);
```

**UI Structure** (in Members tab):

1. **Mode Switcher** - Two buttons: "Add Single" | "Bulk Import"

2. **Single Add Mode**:
   ```jsx
   <input placeholder="First name" />
   <input placeholder="Last name (required)" required />
   <button>Add</button>
   ```

3. **Bulk Import Mode**:
   ```jsx
   <textarea
     placeholder="Paste names (comma, newline, or tab separated)"
     className="font-mono min-h-[150px]"
   />
   <button onClick={handlePreviewBulk}>Preview</button>
   <button onClick={handleImportBulk}>Import All</button>

   {/* Preview Modal */}
   {showPreview && (
     <div>
       <p>Successfully parsed: {parsePreview.success.length}</p>
       <div>{/* Show list of names */}</div>
       <p>Errors: {parsePreview.errors.length}</p>
       <div>{/* Show error details */}</div>
     </div>
   )}
   ```

4. **Members List**:
   ```jsx
   {manualMembers.map((member) => (
     <div key={member.id}>
       <p>{member.last_name}, {member.first_name || '(no first name)'}</p>
       <button onClick={() => handleRemoveManualMember(member.id)}>Remove</button>
     </div>
   ))}
   ```

**Handler Functions**:
- `handlePreviewBulk()` - Import parser, show preview
- `handleImportBulk()` - POST with `bulkText` to API
- `handleAddSingleMember()` - POST with `firstName` and `lastName`
- Update `fetchMembers()` to use GET endpoint

---

### Step 6: Update Living Group Page UI

**Modify**: `src/app/[locale]/living-group/page.jsx`

Apply same changes as club page, plus:
- Add section dropdown to single-add mode
- Add "Assign all to section:" option in bulk mode
- Display format: `{last_name}, {first_name} ({section_name})`

**Note**: Living group page already has GET endpoint implemented (fetches members on load).

---

### Step 7: Translation Updates

**Modify**: All 3 translation files (`src/messages/en.json`, `es.json`, `zh.json`)

**Add to `clubPage.members`**:
```json
{
  "addSingle": "Add Single",
  "bulkImport": "Bulk Import",
  "firstNamePlaceholder": "First name",
  "lastNamePlaceholder": "Last name (required)",
  "bulkInputLabel": "Paste member names",
  "bulkInputHint": "Paste names separated by commas, newlines, or tabs. Formats: 'First Last', 'Last, First', or single names.",
  "bulkPlaceholder": "John Smith, Jane Doe...\nor\nJohn Smith\nJane Doe...",
  "preview": "Preview",
  "import": "Import All",
  "importing": "Importing...",
  "previewTitle": "Import Preview",
  "previewCount": "{count} names will be imported",
  "successfulParse": "Successfully parsed",
  "parseErrors": "Could not parse",
  "closePreview": "Close Preview",
  "bulkAddSuccess": "Added {count} members successfully",
  "bulkAddError": "Failed to import members",
  "withErrors": "({count} errors)",
  "withDuplicates": "({count} duplicates skipped)",
  "noMembers": "No members yet"
}
```

**Add to `livingGroupPage.members`** (same keys + section-specific):
```json
{
  // ... all above keys, plus:
  "sectionLabel": "Section (optional)",
  "assignAllToSection": "Assign all to section:",
  "assignLater": "Assign sections later"
}
```

**Translate to Spanish and Chinese** - Use appropriate phrasing for each language.

---

## Critical Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260127_name_parsing_migration.sql` | Schema changes & data migration |
| `src/lib/utils/nameParser.ts` | Parsing logic (all formats) |
| `src/app/api/clubs/manual-members/route.ts` | Club API with GET + bulk support |
| `src/app/api/living-groups/manual-members/route.ts` | Living group API updates |
| `src/app/[locale]/club/page.jsx` | Club UI with two-mode interface |
| `src/app/[locale]/living-group/page.jsx` | Living group UI (same + sections) |
| `src/messages/en.json` | English translations |
| `src/messages/es.json` | Spanish translations |
| `src/messages/zh.json` | Chinese translations |

---

## Testing Strategy

### 1. Parser Unit Tests

Test `nameParser.ts` with:
- ✅ Comma-separated: "John Smith, Jane Doe, Bob Johnson"
- ✅ Newline-separated: "John Smith\nJane Doe\nBob Johnson"
- ✅ Tab-separated: "John Smith\tJane Doe" (Excel paste)
- ✅ "Last, First" format: "Smith, John"
- ✅ Single names: "Madonna"
- ✅ Special characters: "O'Brien, Mary-Jane", "José García"
- ✅ Multi-word last names: "van der Berg, Hans"
- ✅ Extra whitespace and empty lines
- ✅ Duplicates (case-insensitive)
- ✅ Names exceeding 100 characters

### 2. Database Migration Testing

1. Create test data with old `name` field (various formats)
2. Run migration
3. Verify `first_name` and `last_name` populated correctly
4. Test sorting performance with 1000+ members
5. Verify indexes created

### 3. API Testing

- Single add: POST with `firstName` and `lastName`
- Bulk add: POST with `bulkText`
- GET returns sorted members
- Duplicate detection works
- Error handling returns proper status codes

### 4. UI Manual Testing

- [ ] Mode switcher works
- [ ] Single add with first + last name
- [ ] Bulk import (comma, newline, tab formats)
- [ ] Preview shows parsed names and errors
- [ ] Import completes successfully
- [ ] Members display sorted (last name, first name)
- [ ] Duplicate rejection works
- [ ] Error messages in all 3 languages
- [ ] Living group sections work with bulk

---

## Verification Steps

After implementation:

1. **Database Check**:
   ```sql
   SELECT first_name, last_name FROM club_manual_members LIMIT 10;
   SELECT COUNT(*) FROM club_manual_members WHERE first_name IS NULL;
   ```

2. **Parser Test**:
   ```javascript
   import { parseBulkNames } from './nameParser';
   const result = parseBulkNames("Smith, John\nDoe, Jane\nMadonna");
   console.log(result); // Should have 3 success, 0 errors
   ```

3. **API Test**:
   ```bash
   # Bulk import test
   curl -X POST http://localhost:3000/api/clubs/manual-members \
     -H "Content-Type: application/json" \
     -d '{"bulkText": "John Smith, Jane Doe, Bob Johnson"}'
   ```

4. **UI Test**:
   - Navigate to `/en/club`
   - Switch to "Bulk Import" mode
   - Paste: "Smith, John\nDoe, Jane\nJohnson, Bob"
   - Click "Preview" - should show 3 names parsed
   - Click "Import All" - should add successfully
   - Verify list shows sorted by last name

5. **Language Test**:
   - Check `/es/club` - all labels in Spanish
   - Check `/zh/club` - all labels in Chinese

---

## Edge Cases Handled

| Input | Output | Notes |
|-------|--------|-------|
| `"Madonna"` | First: "", Last: "Madonna" | Single word → last name |
| `"José García"` | First: "José", Last: "García" | Accents preserved |
| `"O'Brien"` | Last: "O'Brien" | Apostrophes preserved |
| `"van der Berg, Hans"` | First: "Hans", Last: "van der Berg" | Multi-word last names |
| `" Smith , John "` | First: "John", Last: "Smith" | Extra whitespace trimmed |
| `""` (empty line) | Skipped | Empty entries ignored |
| `"VeryLongName...101chars"` | Error | Exceeds 100-char limit |
| `"john smith"` (duplicate) | Error | Case-insensitive dup check |

---

## Rollback Plan

If critical issues arise:

**Database Rollback**:
```sql
ALTER TABLE public.club_manual_members
DROP COLUMN IF EXISTS first_name,
DROP COLUMN IF EXISTS last_name;
```

**Code Rollback**:
- Revert to previous git commit
- Keep `name` column as backup for 3-6 months

---

## Implementation Timeline

1. **Database Migration** - Create and run migration (1 hour)
2. **Parser Utility** - Build nameParser.ts with tests (2 hours)
3. **Club API** - Update GET/POST endpoints (1 hour)
4. **Living Group API** - Update all endpoints (1 hour)
5. **Club UI** - Two-mode interface + handlers (2 hours)
6. **Living Group UI** - Same + section support (1.5 hours)
7. **Translations** - Add keys for all 3 languages (1 hour)
8. **Testing** - Unit, API, UI, edge cases (2 hours)

**Total Estimate**: ~11-12 hours

---

## Success Criteria

✅ Users can paste comma, newline, or tab-separated names
✅ Parser handles "First Last" and "Last, First" formats
✅ Single-word names supported (stored as last name only)
✅ Members display sorted alphabetically by last name
✅ Bulk import shows preview before submission
✅ Duplicate names rejected with clear error messages
✅ All features work in English, Spanish, and Chinese
✅ Existing data migrated correctly to new schema
✅ Living groups support section assignment in bulk mode
