# CLAUDE.md — Shift Scheduler Platform

## Project Summary

A static single-page application (SPA) for managing work schedules for a team of ~60 users. Users view their monthly schedule, select bonus shifts within admin-defined limits, and request cancellations with manager approval. The app uses Google OAuth for login and is invite-only.

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Auth:** Supabase Auth (Google OAuth)
- **Database:** Supabase (PostgreSQL)
- **Hosting:** GitHub Pages (fully static — no SSR, no server API routes)
- **State:** React Context + useState/useEffect

All Supabase calls happen directly from the browser. Data access is enforced via Row Level Security (RLS) policies.

## Roles

- `pending` — unauthenticated/blocked (default for new signups without valid invite)
- `user` — view own schedule, select/cancel bonus shifts
- `manager` — all user capabilities + approve/reject cancellation requests
- `admin` — all manager capabilities + manage shift types, default schedules, bonus limits, override any user's schedule

## Key Architecture Decisions

- No backend server; all logic is client-side with Supabase RLS as the security layer.
- Invite-only access: first user is auto-admin; all others need a valid invite token.
- Bonus shift slots are capacity-limited per day; remaining slots are calculated in real-time.
- Cancelling a bonus shift requires manager approval via a request/review workflow.
- GitHub Pages deployment with SPA routing via 404.html redirect trick.

## Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### GitHub Pages Deployment Setup (Manual Steps Required)

1. **Set GitHub repository secrets** (Settings → Secrets and variables → Actions → New repository secret):
   - `VITE_SUPABASE_URL` — your Supabase project URL (e.g. `https://xxxxx.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key

   Without these secrets, the deployed app will show a "Configuration Required" error instead of a blank page.

2. **Enable GitHub Pages** (Settings → Pages):
   - Source: **GitHub Actions** (not "Deploy from a branch")

3. **Configure Supabase Auth redirect URLs** (Supabase Dashboard → Authentication → URL Configuration):
   - Add `https://<username>.github.io/schedule-management/**` to the Redirect URLs list

4. **Configure Google OAuth** in Supabase Dashboard (Authentication → Providers → Google):
   - Set up Google OAuth credentials in Google Cloud Console
   - Add the authorized redirect URI from Supabase to Google Cloud Console

## Project Structure

```
src/
├── main.jsx
├── App.jsx
├── supabaseClient.js
├── contexts/
│   └── AuthContext.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── InvitePage.jsx
│   ├── PendingPage.jsx
│   ├── CalendarPage.jsx
│   └── AdminPage.jsx
├── components/
│   ├── Header.jsx
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
│       ├── InviteGenerator.jsx
│       └── InviteTable.jsx
```

## Database Tables

- `profiles` — user identity and role
- `invite_links` — invite tokens with expiry and usage tracking
- `shift_types` — shift definitions (name, color, bonus flag)
- `default_schedules` — admin-set monthly schedules per user per day
- `bonus_limits` — max bonus slots per shift type per day
- `shift_selections` — user overrides/selections with status tracking
- `cancellation_requests` — manager approval workflow for bonus cancellations

## Build & Deploy

- `npm run dev` — local development server
- `npm run build` — production build to `dist/`
- Deploy to GitHub Pages via GitHub Actions on push to `main`
- Vite `base` must be set to the repo name

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build locally
```

## Coding Conventions

- Use functional React components with hooks
- Use Tailwind CSS utility classes for styling (no separate CSS files)
- Use Supabase JS client for all data access
- Keep components small and focused; one file per component
- Use React Context for auth state; local state for everything else
- Handle loading and error states in every data-fetching component
- All date/time handling uses the user's local timezone
- **Before each commit**: update CLAUDE.md and any feature specification files to reflect the current state of the project (new components, changed architecture, updated build steps, etc.)

## RLS Policy Notes

- All tables require authentication except single-row invite token lookups
- `pending` role is treated as unauthenticated everywhere
- Users can only access their own data unless they are admin/manager
- Admins have full read/write on all tables
- Managers can read all cancellation requests and update their status

---

## Build Plan

### Phase 1: Project Setup & Infrastructure
1. Initialize Vite + React project with Tailwind CSS
2. Configure Supabase client (`supabaseClient.js`)
3. Set up environment variables
4. Configure Vite for GitHub Pages (`base` path, 404.html trick)
5. Set up GitHub Actions deployment workflow

### Phase 2: Database & Auth Foundation
6. Create all Supabase tables (`profiles`, `invite_links`, `shift_types`, `default_schedules`, `bonus_limits`, `shift_selections`, `cancellation_requests`)
7. Write RLS policies for every table
8. Create the first-user bootstrap trigger (auto-admin on empty `profiles`)
9. Configure Google OAuth provider in Supabase
10. Build `AuthContext.jsx` — session management, role checking, signout

### Phase 3: Authentication Pages
11. Build `LoginPage.jsx` — Google OAuth sign-in card
12. Build `InvitePage.jsx` — token validation, sessionStorage, OAuth redirect, post-auth activation
13. Build `PendingPage.jsx` — blocked user screen with auto-signout

### Phase 4: Core Calendar
14. Build `Header.jsx` — month selector, user selector (admin/manager), logout, invite/requests buttons
15. Build `CalendarGrid.jsx` — monthly grid layout (Mon–Sun columns, week rows)
16. Build `DayCell.jsx` — day number, shift badge (color-coded), today highlight, pending indicator
17. Build `CalendarPage.jsx` — fetch default schedules + shift selections, merge into calendar view
18. Implement month navigation and data re-fetching

### Phase 5: Shift Selection & Bonus Logic
19. Build `ShiftDropdown.jsx` — list all shift types, show remaining bonus slots
20. Implement regular shift selection (upsert to `shift_selections`)
21. Implement bonus shift selection with real-time slot checking
22. Add toast notifications for success/error states

### Phase 6: Cancellation Request Flow
23. Build cancellation confirmation modal
24. Implement cancellation request submission (insert `cancellation_requests`, update `shift_selections.status`)
25. Add pending-cancellation visual indicator on day cells
26. Block shift changes on days with pending cancellation

### Phase 7: Manager Panel
27. Build `CancellationRequests.jsx` — list pending requests with user/date/shift details
28. Implement approve action (update both `cancellation_requests` and `shift_selections`)
29. Implement reject action (revert `shift_selections.status` to active)
30. Add pending request count badge in header

### Phase 8: Admin Panel
31. Build `AdminPage.jsx` — tabbed layout
32. Build `ShiftTypeManager.jsx` — CRUD for shift types with color picker
33. Build `DefaultScheduleEditor.jsx` — per-user monthly schedule editor with bulk actions
34. Build `BonusLimitEditor.jsx` — day × shift-type matrix for max slots
35. Implement admin override mode on calendar (bypass cancellation flow, banner display)

### Phase 9: Invite Link Management
36. Build `InviteGenerator.jsx` — expiry picker, label input, link generation with copy button
37. Build `InviteTable.jsx` — list links with status, usage count, revoke action
38. Wire invite button into header for admin/manager roles

### Phase 10: Polish & Deploy
39. Add skeleton loaders for all data-fetching views
40. Add responsive layout (horizontal scroll on calendar, stacked tables on mobile)
41. Add empty states ("Not set" badges, no-data messages)
42. End-to-end testing of all flows
43. Final GitHub Pages deployment and OAuth redirect URL configuration
