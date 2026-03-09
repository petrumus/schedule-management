# Feature 06: Manager Panel

## Overview

Managers and admins can review and act on pending bonus shift cancellation requests. The panel is accessible from the header and shows a badge with the count of pending requests.

## User Stories

### US-6.1: View Pending Cancellation Requests
**As** a manager,
**I want** to see all pending cancellation requests,
**So that** I can review and act on them.

**Acceptance Criteria:**
- A "Requests" button/badge in the header shows the count of pending `cancellation_requests`.
- Visible only to manager and admin roles.
- Clicking opens a side panel or modal.
- Each request shows: user name, date, shift type being cancelled, and when it was requested.

### US-6.2: Approve Cancellation Request
**As** a manager,
**I want** to approve a cancellation request,
**So that** the user can switch away from their bonus shift.

**Acceptance Criteria:**
- An "Approve" button is shown per request.
- On approve:
  - `cancellation_requests.status` → `approved`
  - `cancellation_requests.reviewed_by` → current user's ID
  - `cancellation_requests.reviewed_at` → now
  - `shift_selections.status` → `cancelled`
- The request is removed from the pending list.
- The user's calendar day becomes re-selectable.

### US-6.3: Reject Cancellation Request
**As** a manager,
**I want** to reject a cancellation request,
**So that** the user keeps their bonus shift.

**Acceptance Criteria:**
- A "Reject" button is shown per request.
- On reject:
  - `cancellation_requests.status` → `rejected`
  - `cancellation_requests.reviewed_by` → current user's ID
  - `cancellation_requests.reviewed_at` → now
  - `shift_selections.status` → `active` (reverted)
- The request is removed from the pending list.
- The user's calendar day shows the bonus shift as active again, with a rejection indicator.

### US-6.4: Badge Count Updates
**As** a manager,
**I want** the pending request count to stay current,
**So that** I don't miss new requests.

**Acceptance Criteria:**
- The badge count updates when the panel is closed and new requests arrive.
- Consider using Supabase real-time subscriptions on `cancellation_requests` for live updates.
- Badge is hidden when count is 0.

## Components

| Component | File | Description |
|---|---|---|
| CancellationRequests | `src/components/Manager/CancellationRequests.jsx` | Request list with approve/reject actions |
| Header | `src/components/Header.jsx` | Hosts the "Requests" badge/button |

## Database Dependencies

- `cancellation_requests` — read all pending, update status
- `shift_selections` — update status on approve/reject
- `profiles` — user names for display

## Technical Notes

- Approve and reject each update two tables (`cancellation_requests` + `shift_selections`). Use an RPC function or ensure both updates succeed (handle partial failures).
- The panel can be a slide-over (side panel) or a modal — keep it lightweight since it's accessed from the header.
- Sort requests by `created_at` ascending (oldest first).
