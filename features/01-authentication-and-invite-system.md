# Feature 01: Authentication & Invite System

## Overview

Invite-only authentication using Google OAuth via Supabase Auth. The platform is closed by default — users must have a valid invite link or be the bootstrapped first admin.

## User Stories

### US-1.1: First Admin Bootstrap
**As** the first person to sign in,
**I want** to be automatically assigned the admin role,
**So that** I can configure the platform and invite other users.

**Acceptance Criteria:**
- When the `profiles` table is empty, the first Google OAuth sign-in creates a profile with `role = 'admin'`.
- This is enforced by a Supabase database trigger on `profiles` insert.
- Subsequent sign-ups without a valid invite get `role = 'pending'`.

### US-1.2: Invite-based Sign Up
**As** a new user with an invite link,
**I want** to sign in via Google and be granted access,
**So that** I can view my schedule.

**Acceptance Criteria:**
- User arrives at `/invite?token=<uuid>`.
- Token is saved to `sessionStorage`.
- Token is pre-validated against `invite_links` (exists, `is_active = true`, `expires_at > now()`).
- If invalid: full-screen error — "This invite link is invalid or has expired." No OAuth button shown.
- If valid: welcome screen with Google OAuth button.
- After OAuth: token re-validated, `profiles.role` updated from `pending` → `user`, `invite_links.use_count` incremented, token cleared from `sessionStorage`, redirect to `/calendar`.

### US-1.3: Returning User Sign In
**As** a returning user with an active role,
**I want** to sign in with Google without needing an invite,
**So that** I can quickly access my schedule.

**Acceptance Criteria:**
- Users with `role != 'pending'` can sign in at any time via the login page.
- After sign-in, redirect to `/calendar`.

### US-1.4: Pending User Blocking
**As** the system,
**I want** to block users with `role = 'pending'`,
**So that** unapproved users cannot access any data.

**Acceptance Criteria:**
- On app load, if `profiles.role = 'pending'`, show a full-screen error page.
- Call `supabase.auth.signOut()` immediately to clear the session.
- Display: "Your account is not yet activated. Please use a valid invite link to gain access."
- Offer a "Try again" link back to the login page.
- All RLS policies treat `pending` as unauthenticated.

### US-1.5: Logout
**As** any authenticated user,
**I want** to log out,
**So that** I can end my session securely.

**Acceptance Criteria:**
- A logout button is always visible in the header.
- Clicking it calls `supabase.auth.signOut()` and redirects to the login page.

## Components

| Component | File | Description |
|---|---|---|
| AuthContext | `src/contexts/AuthContext.jsx` | Session management, role state, sign-out helper |
| LoginPage | `src/pages/LoginPage.jsx` | Google OAuth sign-in card |
| InvitePage | `src/pages/InvitePage.jsx` | Token validation + OAuth redirect |
| PendingPage | `src/pages/PendingPage.jsx` | Blocked user screen |

## Database Dependencies

- `profiles` table (role column)
- `invite_links` table (token validation)
- Supabase Auth (Google OAuth provider)
- Database trigger: auto-admin on empty `profiles`

## RLS Policies

- `profiles`: users read own row; admins read all.
- `invite_links`: anyone can read a single row by `id` (for token validation).

## Technical Notes

- All auth state is managed via `AuthContext` using `supabase.auth.onAuthStateChange()`.
- The invite token flow uses `sessionStorage` (not `localStorage`) so it doesn't persist across tabs.
- The `pending` role acts as a soft-block — the auth session exists briefly but is immediately cleared.
