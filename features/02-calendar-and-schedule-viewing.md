# Feature 02: Calendar & Schedule Viewing

## Overview

The main calendar view displays a user's monthly work schedule in a grid format. Users see their assigned shifts (from default schedules or their own selections) with color-coded badges. Admins and managers can view other users' calendars.

## User Stories

### US-2.1: View Monthly Calendar
**As** a user,
**I want** to see my monthly schedule in a calendar grid,
**So that** I know my assigned shifts for each day.

**Acceptance Criteria:**
- Calendar renders as a standard Mon–Sun grid with weeks as rows.
- Defaults to the current month and year.
- Each day cell shows the day number and a colored badge for the active shift.
- Active shift = `shift_selections` override if present, otherwise `default_schedules` entry.
- Days without any schedule show a grey "Not set" badge.

### US-2.2: Navigate Between Months
**As** a user,
**I want** to switch between months,
**So that** I can view past and future schedules.

**Acceptance Criteria:**
- A `<select>` dropdown in the header lists all 12 months + year.
- Changing the selection re-fetches data for the selected month/year.
- Calendar grid adjusts for the correct number of days and starting weekday.

### US-2.3: Today Highlight
**As** a user,
**I want** today's date to be visually highlighted,
**So that** I can quickly identify the current day.

**Acceptance Criteria:**
- The current date cell has a distinct border or background color.
- Highlight only appears when viewing the current month.

### US-2.4: View Other User's Calendar (Admin/Manager)
**As** an admin or manager,
**I want** to view any user's calendar,
**So that** I can review their schedule.

**Acceptance Criteria:**
- A second `<select>` dropdown lists all users (from `profiles`).
- Only visible to admin and manager roles.
- Selecting a user loads that user's schedule in read-only mode (for managers).
- For admins, the calendar is editable (see admin override in Feature 05).

### US-2.5: Loading States
**As** a user,
**I want** to see loading indicators while data is fetching,
**So that** I know the app is working.

**Acceptance Criteria:**
- Skeleton loaders appear on the calendar grid while fetching schedule data.
- Loaders appear on month change and user change.

## Components

| Component | File | Description |
|---|---|---|
| CalendarPage | `src/pages/CalendarPage.jsx` | Page wrapper, data fetching, month/user selectors |
| CalendarGrid | `src/components/Calendar/CalendarGrid.jsx` | Monthly grid layout |
| DayCell | `src/components/Calendar/DayCell.jsx` | Individual day display with shift badge |
| Header | `src/components/Header.jsx` | Month selector, user selector, nav controls |

## Data Flow

1. On mount / month change: fetch `default_schedules` for user + month/year.
2. Fetch `shift_selections` for user + month/year.
3. Merge: for each day, `shift_selections` overrides `default_schedules`.
4. Fetch `shift_types` to map IDs to names/colors.
5. Render the grid with the merged data.

## Database Dependencies

- `default_schedules` — base schedule per user/day
- `shift_selections` — user overrides
- `shift_types` — shift names and colors
- `profiles` — user list for admin/manager dropdown

## Technical Notes

- Calendar grid calculation: determine first weekday of the month and total days.
- Responsive: calendar scrolls horizontally on small screens.
- Data is re-fetched on month/year change — no client-side caching required for v1.
