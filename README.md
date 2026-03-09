# Shift Scheduler Platform — Product Specification for Claude Code

## Overview

A static single-page application (SPA) built with **Vite + React**, hosted on **GitHub Pages**, backed by **Supabase** (PostgreSQL + Auth). The platform allows a team of ~60 users to view their monthly work schedule, select bonus shifts within defined limits, and request cancellations — all through a Google OAuth login.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (Google OAuth provider) |
| Database | Supabase (PostgreSQL) |
| Hosting | GitHub Pages (static, no SSR) |
| State management | React Context + `useState` / `useEffect` |

> **Important:** Because GitHub Pages is fully static, all Supabase calls happen directly from the browser using the Supabase JS client. There are no server-side API routes. Row Level Security (RLS) policies on Supabase enforce data access control.

---

## Roles

Three roles exist, stored in a `profiles` table in Supabase:

| Role | Capabilities |
|---|---|
| `user` | View own monthly schedule, select/request-cancel bonus shifts |
| `manager` | All user capabilities + approve/reject bonus shift cancellation requests |
| `admin` | All manager capabilities + manage shift types, set default schedules, set bonus limits, view/override any user's schedule |

Roles are stored as a `role` column (`user`, `manager`, `admin`) in the `profiles` table and enforced via Supabase RLS policies.

---

## Authentication & Access Control

### Invite-only access model

The platform is **closed by default** — no one can sign in unless they arrive via a valid invite link or are the bootstrapped first admin.

**First-user bootstrap:**
- The very first Google account to complete OAuth and land on the app is automatically assigned `role = 'admin'`.
- This is handled by a Supabase database trigger on `profiles` insert: if the `profiles` table is empty at insert time, the new row gets `role = 'admin'`; otherwise it gets `role = 'pending'` (blocked until an invite is validated).

**Normal sign-in flow:**
1. User receives a link in the format `https://yourapp.github.io/invite?token=<uuid>`.
2. Clicking the link stores the token in `sessionStorage` and redirects to the Google OAuth flow.
3. After OAuth callback, the app reads the token from `sessionStorage` and calls a Supabase function (or direct DB query with RLS) to validate it:
   - Token exists in `invite_links`.
   - Token is not revoked (`is_active = true`).
   - Token has not expired (`expires_at > now()`).
4. If valid: the new `profiles` row is updated from `pending` to `user`, and the invite token's `use_count` is incremented.
5. If invalid or missing: the user is shown a "This invite link is invalid or has expired" error screen and is **not** granted access. Their `profiles` row (if created) stays `pending` and the app treats `pending` as unauthenticated everywhere.

**Returning users:**
- Users who already have `role != 'pending'` can sign in with Google at any time without needing a new invite token.

**Blocking pending users:**
- On app load, after session is confirmed, the app checks `profiles.role`. If `pending`, it renders a full-screen error page and calls `supabase.auth.signOut()` to clear the session.
- All RLS policies treat `pending` as having no access (same as unauthenticated).

### Invite link generation

Admins and Managers can generate invite links from a dedicated **"Invite Users"** section in the header or admin panel.

The generation form has:
- **Expiry date picker** — required; sets `expires_at` on the invite record.
- **Label / note** — optional free-text to identify the invite (e.g. "March 2025 onboarding batch").
- A "Generate link" button that inserts a new row into `invite_links` and displays the full shareable URL with a one-click copy button.

The invite management table shows all links created by the current user (admins see all), with columns: label, created at, expires at, use count, status (active/expired/revoked), and a "Revoke" button that sets `is_active = false`.

- Login via **Google OAuth** using `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- The app checks the user's role on load and renders the appropriate UI.
- A logout button is always visible in the header.

---

## Database Schema

### `invite_links`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, used as the token in the URL |
| `created_by` | `uuid` | FK → `profiles.id` (admin or manager) |
| `label` | `text` | Optional note (e.g. "March onboarding") |
| `expires_at` | `timestamptz` | Set by the inviter |
| `is_active` | `boolean` | False = manually revoked |
| `use_count` | `int` | Incremented on each successful new-user activation |
| `created_at` | `timestamptz` | |

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | FK → `auth.users.id` |
| `full_name` | `text` | From Google profile |
| `email` | `text` | From Google profile |
| `role` | `text` | `pending`, `user`, `manager`, `admin` |
| `avatar_url` | `text` | From Google profile |

### `shift_types`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `text` | E.g. "Morning", "Evening", "Night", "Off" |
| `color` | `text` | Hex color for calendar display |
| `is_bonus` | `boolean` | Whether this shift type can be selected as a bonus |
| `created_by` | `uuid` | FK → `profiles.id` |

### `default_schedules`
Stores the monthly default schedule per user.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `year` | `int` | E.g. 2025 |
| `month` | `int` | 1–12 |
| `day` | `int` | 1–31 |
| `shift_type_id` | `uuid` | FK → `shift_types.id` |

### `bonus_limits`
Admin-defined caps for bonus shifts per day.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `shift_type_id` | `uuid` | FK → `shift_types.id` |
| `year` | `int` | |
| `month` | `int` | |
| `day` | `int` | |
| `max_slots` | `int` | Total slots available for this shift on this day |

### `shift_selections`
Tracks actual user selections (overrides to the default schedule).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `year` | `int` | |
| `month` | `int` | |
| `day` | `int` | |
| `shift_type_id` | `uuid` | FK → `shift_types.id` |
| `is_bonus` | `boolean` | True if this was a bonus shift selection |
| `status` | `text` | `active`, `cancellation_requested`, `cancelled` |
| `requested_at` | `timestamptz` | When the selection was made |

### `cancellation_requests`
Tracks manager approval flow for bonus shift cancellations.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `shift_selection_id` | `uuid` | FK → `shift_selections.id` |
| `requested_by` | `uuid` | FK → `profiles.id` |
| `reviewed_by` | `uuid` | FK → `profiles.id`, nullable |
| `status` | `text` | `pending`, `approved`, `rejected` |
| `created_at` | `timestamptz` | |
| `reviewed_at` | `timestamptz` | nullable |

---

## Application Structure

```
src/
├── main.jsx
├── App.jsx
├── supabaseClient.js          # Supabase client init
├── contexts/
│   └── AuthContext.jsx        # User session + role
├── pages/
│   ├── LoginPage.jsx
│   ├── InvitePage.jsx         # Validates token, then redirects to Google OAuth
│   ├── PendingPage.jsx        # Shown to users with role=pending (access denied)
│   ├── CalendarPage.jsx       # Main view for all roles
│   └── AdminPage.jsx          # Admin-only management panel
├── components/
│   ├── Header.jsx             # Includes Invite Users button for admin/manager
│   ├── Calendar/
│   │   ├── CalendarGrid.jsx
│   │   ├── DayCell.jsx
│   │   └── ShiftDropdown.jsx
│   ├── Admin/
│   │   ├── ShiftTypeManager.jsx
│   │   ├── DefaultScheduleEditor.jsx
│   │   └── BonusLimitEditor.jsx
│   ├── Manager/
│   │   └── CancellationRequests.jsx
│   └── Invite/
│       ├── InviteGenerator.jsx    # Form to create invite links
│       └── InviteTable.jsx        # List/revoke existing links
```

---

## Pages & Features

### Login Page (`/`)
- Centered card with app name and a "Sign in with Google" button.
- Calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`.
- After login, redirect to `/calendar`.

---

### Calendar Page (`/calendar`)

**Header controls:**
- Month selector: a `<select>` dropdown listing all 12 months + year. Defaults to current month.
- For `admin` and `manager` roles: a second `<select>` dropdown listing all users (fetched from `profiles`). Selecting a user shows that user's calendar in read-only mode (admins can also override).

**Calendar grid:**
- Standard monthly grid (Mon–Sun columns, weeks as rows).
- Each day cell shows:
  - The day number.
  - A colored badge for the currently active shift (from `shift_selections` if overridden, else from `default_schedules`).
  - A dropdown to change the shift.

**Per-day shift dropdown (`ShiftDropdown`):**

The dropdown lists all shift types. For each option:
- **Regular shifts** (non-bonus): always selectable.
- **Bonus shifts**: show remaining slots inline, e.g. `"Morning Bonus (3 left)"`. When 0 slots remain, the option is rendered as disabled and greyed out with the label `"Morning Bonus (0 left)"`.

Selection logic:
1. If user selects a non-bonus shift → upsert into `shift_selections` with `is_bonus: false`.
2. If user selects a bonus shift → check remaining slots in real time (count of `active` `shift_selections` for that shift/day vs. `bonus_limits.max_slots`). If slots available, insert; if not, block and show a toast error.
3. If user changes away from a currently active **bonus** shift → they must first request cancellation (see below). Changing from a regular shift override is instant.

**Remaining slot calculation:**
```sql
-- Remaining slots for a bonus shift on a given day
SELECT bl.max_slots - COUNT(ss.id) AS remaining
FROM bonus_limits bl
LEFT JOIN shift_selections ss
  ON ss.shift_type_id = bl.shift_type_id
  AND ss.year = bl.year AND ss.month = bl.month AND ss.day = bl.day
  AND ss.is_bonus = true AND ss.status = 'active'
WHERE bl.shift_type_id = $1 AND bl.year = $2 AND bl.month = $3 AND bl.day = $4
GROUP BY bl.max_slots;
```

This query (or equivalent Supabase JS query) is run on dropdown open for each day that has bonus-type shifts.

**Cancellation request flow:**
- When a user tries to switch away from an active bonus shift, show a confirmation modal: *"Switching away from a bonus shift requires manager approval. Submit a cancellation request?"*
- On confirm → insert into `cancellation_requests` with `status: 'pending'` and update `shift_selections.status` to `'cancellation_requested'`.
- The day cell shows a visual indicator (e.g. a clock icon or orange border) that a cancellation is pending.
- The user cannot change that day's shift again until the request is resolved.

---


### Invite Page (`/invite`)

- Loaded when user arrives via `?token=<uuid>`.
- Reads the token from the URL query string and saves it to `sessionStorage`.
- Queries `invite_links` by `id` to pre-validate (exists, active, not expired).
- If invalid: shows a full-screen error — *"This invite link is invalid or has expired."* No Google OAuth button shown.
- If valid: shows a brief welcome screen — *"You've been invited. Sign in with Google to continue."* — with the Google OAuth button.
- After OAuth callback, the app re-reads the token from `sessionStorage`, validates again, updates the `profiles.role` from `pending` → `user`, increments `invite_links.use_count`, clears the token from `sessionStorage`, and redirects to `/calendar`.

### Pending / Blocked Page

- Shown automatically if an authenticated user's `profiles.role` is `pending`.
- Displays: *"Your account is not yet activated. Please use a valid invite link to gain access."*
- Signs the user out of Supabase Auth immediately to prevent any data access.
- Offers a "Try again" link back to the login page.

---

### Admin Page (`/admin`)

Accessible only to users with `role = 'admin'`. Tab-based layout with three sections:

**Tab 1 — Shift Types**
- Table listing all shift types with name, color swatch, and bonus flag.
- "Add shift type" button opens a form: name input, color picker, bonus toggle.
- Edit and delete buttons per row. Deleting a shift type that is in use should be blocked with an error message.

**Tab 2 — Default Schedules**
- User selector dropdown (all 60 users).
- Month/year selector.
- A compact table showing each day of the month with a shift type dropdown per day.
- A "Save all" button that batch-upserts all rows into `default_schedules`.
- An "Apply to all days" shortcut to set the same shift for every day in the month.

**Tab 3 — Bonus Limits**
- Month/year selector.
- A table with rows = days of the month, columns = bonus shift types.
- Each cell is a number input for `max_slots` (0 means no bonus slots on that day for that type).
- Save button to batch-upsert into `bonus_limits`.

**Admin override (on Calendar Page):**
When an admin is viewing another user's calendar, a special mode is active:
- Dropdowns are enabled (not read-only).
- Selecting a shift directly upserts to `shift_selections` for that user, bypassing the cancellation flow.
- A banner at the top of the calendar reads: *"Viewing as [User Name] — Admin override mode"*.

---

### Manager Panel

Accessible in the header for `manager` and `admin` roles via a "Requests" badge/button showing pending count.

Opens a side panel or modal listing all pending `cancellation_requests` with:
- User name, date, shift type being cancelled.
- "Approve" and "Reject" buttons.

On **Approve**: update `cancellation_requests.status` to `approved`, set `shift_selections.status` to `cancelled`, and allow the user to re-select a shift on that day.

On **Reject**: update `cancellation_requests.status` to `rejected`, revert `shift_selections.status` to `active`, and notify the user (via UI — a visible status badge on the day cell).

---

## Row Level Security (RLS) Policies

| Table | Policy |
|---|---|
| `invite_links` | Admins and Managers can insert and read all. Anyone (including unauthenticated) can read a single row by `id` (for token validation). Only the creator or admin can update `is_active`. |
| `profiles` | Users can read their own row. Admins can read all rows. |
| `shift_types` | All authenticated users can read. Only admins can insert/update/delete. |
| `default_schedules` | Users can read their own rows. Admins can read/write all. |
| `bonus_limits` | All authenticated users can read. Only admins can insert/update/delete. |
| `shift_selections` | Users can read/insert/update their own rows. Admins can read/write all. |
| `cancellation_requests` | Users can read/insert their own. Managers and admins can read all and update `status`. |

---

## UI / UX Details

- **Color coding:** each shift type has a hex color displayed as a pill/badge on the day cell.
- **Today highlight:** current date cell has a distinct border or background.
- **Loading states:** skeleton loaders on the calendar grid while fetching data.
- **Toast notifications:** for successful saves, errors (e.g. "No bonus slots remaining"), and cancellation submission confirmations.
- **Responsive layout:** calendar scrolls horizontally on small screens; admin tables stack on mobile.
- **Empty state:** if no default schedule has been set for a user/month, days show a grey "Not set" badge.

---

## GitHub Pages Deployment

- Build command: `vite build` → outputs to `dist/`.
- Deploy via GitHub Actions to `gh-pages` branch on every push to `main`.
- The Vite config must set `base` to the repo name: `base: '/repo-name/'`.
- A `404.html` redirect trick is needed for SPA routing on GitHub Pages (copy `index.html` as `404.html` in the build).
- All Supabase credentials stored as GitHub Actions secrets and injected as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables at build time.
- The Supabase Google OAuth redirect URL must be set to the GitHub Pages URL in the Supabase dashboard (`https://username.github.io/repo-name`).

---

## Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

These are public-safe values (anon key is safe to expose in a static SPA as long as RLS is properly configured).

---

## Out of Scope (for this version)

- Email/push notifications (cancellation requests are visible in-app only).
- Audit log UI (Supabase logs cover this server-side).
- Recurring schedule templates beyond monthly.
- Mobile native app.
