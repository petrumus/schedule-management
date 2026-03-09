# Feature 03: Bonus Shift Selection

## Overview

Users can select bonus shifts on days where admin-defined bonus slots are available. Bonus shifts have a capacity limit per day, and remaining slots are shown in real-time. Selecting a bonus shift consumes a slot; switching away requires a cancellation request.

## User Stories

### US-3.1: View Available Shifts in Dropdown
**As** a user,
**I want** to see all available shifts for a day in a dropdown,
**So that** I can choose or change my shift.

**Acceptance Criteria:**
- Clicking a day cell opens a dropdown listing all shift types.
- Regular (non-bonus) shifts are always selectable.
- Bonus shifts show remaining slots inline, e.g. "Morning Bonus (3 left)".
- Bonus shifts with 0 remaining slots are disabled and greyed out: "Morning Bonus (0 left)".

### US-3.2: Select a Regular Shift
**As** a user,
**I want** to select a regular shift for a day,
**So that** I can override my default schedule.

**Acceptance Criteria:**
- Selecting a non-bonus shift upserts into `shift_selections` with `is_bonus: false`, `status: 'active'`.
- The day cell immediately updates to show the new shift badge.
- A success toast is shown.

### US-3.3: Select a Bonus Shift
**As** a user,
**I want** to select a bonus shift when slots are available,
**So that** I can take on additional work.

**Acceptance Criteria:**
- On selection, the app checks remaining slots in real time.
- Remaining = `bonus_limits.max_slots` minus count of `active` `shift_selections` for that shift/day.
- If slots available: insert into `shift_selections` with `is_bonus: true`, `status: 'active'`. Show success toast.
- If no slots: block the selection and show an error toast — "No bonus slots remaining for this shift."

### US-3.4: Real-time Slot Count
**As** a user,
**I want** to see up-to-date remaining slot counts,
**So that** I make informed decisions.

**Acceptance Criteria:**
- Remaining slots are recalculated each time the dropdown is opened.
- The count query runs against `bonus_limits` and `shift_selections`.

### US-3.5: Prevent Direct Bonus Shift Removal
**As** the system,
**I want** to prevent users from directly switching away from a bonus shift,
**So that** bonus cancellations go through manager approval.

**Acceptance Criteria:**
- If the user tries to change away from an active bonus shift, the dropdown does not directly change the selection.
- Instead, a cancellation confirmation modal is triggered (see Feature 04).
- Changing from a regular (non-bonus) shift override is instant with no approval needed.

## Components

| Component | File | Description |
|---|---|---|
| ShiftDropdown | `src/components/Calendar/ShiftDropdown.jsx` | Shift type list with bonus slot counts |
| DayCell | `src/components/Calendar/DayCell.jsx` | Hosts the dropdown, displays current shift |

## Remaining Slot Query

```sql
SELECT bl.max_slots - COUNT(ss.id) AS remaining
FROM bonus_limits bl
LEFT JOIN shift_selections ss
  ON ss.shift_type_id = bl.shift_type_id
  AND ss.year = bl.year AND ss.month = bl.month AND ss.day = bl.day
  AND ss.is_bonus = true AND ss.status = 'active'
WHERE bl.shift_type_id = $1 AND bl.year = $2 AND bl.month = $3 AND bl.day = $4
GROUP BY bl.max_slots;
```

This is translated to a Supabase JS query or executed as an RPC function.

## Database Dependencies

- `shift_types` — list of all shifts and their bonus flag
- `bonus_limits` — max slots per shift type per day
- `shift_selections` — current selections (for counting active bonus claims)

## Technical Notes

- The slot check and insert should ideally be atomic to avoid race conditions. Consider using a Supabase RPC function that checks and inserts in a single transaction.
- Toast notifications use a shared toast system (e.g. react-hot-toast or a custom context).
