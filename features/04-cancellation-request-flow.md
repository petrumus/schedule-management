# Feature 04: Cancellation Request Flow

## Overview

When a user wants to switch away from an active bonus shift, they must submit a cancellation request that a manager or admin reviews. The day remains locked until the request is resolved.

## User Stories

### US-4.1: Submit Cancellation Request
**As** a user,
**I want** to request cancellation of a bonus shift,
**So that** I can switch to a different shift after manager approval.

**Acceptance Criteria:**
- When the user tries to change away from an active bonus shift, a confirmation modal appears.
- Modal text: "Switching away from a bonus shift requires manager approval. Submit a cancellation request?"
- On confirm: insert into `cancellation_requests` with `status: 'pending'`, update `shift_selections.status` to `'cancellation_requested'`.
- Show a success toast: "Cancellation request submitted."

### US-4.2: Pending Cancellation Visual Indicator
**As** a user,
**I want** to see which days have pending cancellation requests,
**So that** I know where I'm waiting for approval.

**Acceptance Criteria:**
- Day cells with `shift_selections.status = 'cancellation_requested'` show a visual indicator (clock icon or orange border).
- The shift badge remains showing the current (bonus) shift.

### US-4.3: Block Changes on Pending Days
**As** the system,
**I want** to prevent shift changes on days with pending cancellation requests,
**So that** the approval flow is respected.

**Acceptance Criteria:**
- If a day has a pending cancellation request, the shift dropdown is disabled.
- Clicking the day cell shows a tooltip or message: "Cancellation pending — awaiting manager approval."

### US-4.4: Cancellation Approved
**As** a user,
**I want** to know when my cancellation is approved,
**So that** I can select a new shift.

**Acceptance Criteria:**
- When `cancellation_requests.status` is updated to `approved`, `shift_selections.status` becomes `cancelled`.
- The day cell reverts to showing the default schedule shift (or "Not set").
- The dropdown becomes enabled again so the user can make a new selection.

### US-4.5: Cancellation Rejected
**As** a user,
**I want** to know when my cancellation is rejected,
**So that** I understand I must keep the bonus shift.

**Acceptance Criteria:**
- When `cancellation_requests.status` is updated to `rejected`, `shift_selections.status` reverts to `active`.
- The day cell shows a visual status indicator (e.g. red badge or border) that the request was rejected.
- The dropdown re-enables but the bonus shift remains selected.

## Components

| Component | File | Description |
|---|---|---|
| DayCell | `src/components/Calendar/DayCell.jsx` | Pending indicator, disabled state |
| ShiftDropdown | `src/components/Calendar/ShiftDropdown.jsx` | Triggers modal on bonus shift change |
| Confirmation Modal | (inline or shared component) | "Submit cancellation request?" dialog |

## State Transitions

```
shift_selections.status:
  active → cancellation_requested  (user submits request)
  cancellation_requested → cancelled  (manager approves)
  cancellation_requested → active     (manager rejects)

cancellation_requests.status:
  pending → approved  (manager action)
  pending → rejected  (manager action)
```

## Database Dependencies

- `shift_selections` — status field tracks cancellation state
- `cancellation_requests` — the approval record

## Technical Notes

- The UI should poll or subscribe to `cancellation_requests` status changes so the user sees updates without refreshing. Supabase real-time subscriptions can be used here.
- Both the `cancellation_requests` insert and `shift_selections` status update should happen atomically (consider an RPC function).
