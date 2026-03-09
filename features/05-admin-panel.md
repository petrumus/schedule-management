# Feature 05: Admin Panel

## Overview

The admin panel (`/admin`) provides administrators with tools to manage shift types, set default schedules for users, configure bonus limits, and override any user's schedule directly from the calendar view.

## User Stories

### US-5.1: Manage Shift Types
**As** an admin,
**I want** to create, edit, and delete shift types,
**So that** the schedule reflects the correct shift options.

**Acceptance Criteria:**
- Tab 1 of admin panel shows a table of all shift types: name, color swatch, bonus flag.
- "Add shift type" button opens a form with: name input, color picker, bonus toggle.
- Each row has Edit and Delete buttons.
- Editing opens the same form pre-filled with current values.
- Deleting a shift type that is referenced by `default_schedules`, `shift_selections`, or `bonus_limits` is blocked with an error: "Cannot delete — this shift type is in use."
- Changes are persisted to the `shift_types` table immediately.

### US-5.2: Set Default Schedules
**As** an admin,
**I want** to set default monthly schedules for each user,
**So that** users see their baseline shifts before making selections.

**Acceptance Criteria:**
- Tab 2 of admin panel has a user selector dropdown (all users from `profiles`).
- A month/year selector.
- A compact table: rows = days of the month, each with a shift type dropdown.
- A "Save all" button batch-upserts all rows into `default_schedules`.
- An "Apply to all days" shortcut sets every day to the same shift type.
- Existing data is loaded on user/month selection.

### US-5.3: Configure Bonus Limits
**As** an admin,
**I want** to set the maximum bonus slots per shift type per day,
**So that** bonus selections are capacity-controlled.

**Acceptance Criteria:**
- Tab 3 of admin panel has a month/year selector.
- A table with rows = days of the month, columns = bonus shift types.
- Each cell is a number input for `max_slots` (0 = no bonus slots that day).
- A "Save" button batch-upserts into `bonus_limits`.
- Existing data is loaded on month selection.

### US-5.4: Admin Override on Calendar
**As** an admin viewing another user's calendar,
**I want** to directly change their shifts without the cancellation flow,
**So that** I can make corrections or adjustments immediately.

**Acceptance Criteria:**
- When an admin selects another user in the calendar page's user dropdown, a special mode activates.
- A banner reads: "Viewing as [User Name] — Admin override mode".
- Shift dropdowns are enabled (not read-only).
- Selecting a shift directly upserts to `shift_selections` for that user — no cancellation request required even for bonus shifts.
- Changes are attributed to the admin in any applicable logs.

### US-5.5: Access Control
**As** the system,
**I want** to restrict the admin panel to admin users only,
**So that** non-admins cannot modify system configuration.

**Acceptance Criteria:**
- The `/admin` route checks `profiles.role = 'admin'` before rendering.
- Non-admins navigating to `/admin` are redirected to `/calendar`.
- Admin panel link is only visible in the header for admins.

## Components

| Component | File | Description |
|---|---|---|
| AdminPage | `src/pages/AdminPage.jsx` | Tabbed layout container |
| ShiftTypeManager | `src/components/Admin/ShiftTypeManager.jsx` | CRUD table for shift types |
| DefaultScheduleEditor | `src/components/Admin/DefaultScheduleEditor.jsx` | Per-user monthly schedule editor |
| BonusLimitEditor | `src/components/Admin/BonusLimitEditor.jsx` | Day × shift-type slot matrix |

## Database Dependencies

- `shift_types` — admin full CRUD
- `default_schedules` — admin full CRUD
- `bonus_limits` — admin full CRUD
- `shift_selections` — admin can write for any user (override mode)
- `profiles` — user list for dropdowns

## Technical Notes

- Batch upserts for default schedules and bonus limits should use Supabase's `.upsert()` with the appropriate conflict columns.
- The "in use" check for shift type deletion requires querying `default_schedules`, `shift_selections`, and `bonus_limits` for references.
- Color picker can be a simple hex input or a lightweight color-picker component.
