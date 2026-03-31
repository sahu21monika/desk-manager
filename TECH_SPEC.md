# Desk Manager — Technical Specification

## Overview
A web-based desk assignment management system for a 93-seat study space. The owner can assign desks to students by time slot and duration, view real-time availability, and manage all assignments from a single interface.

---

## Stack

| Layer       | Technology         | Reason                                      |
|-------------|--------------------|---------------------------------------------|
| Frontend    | Next.js 16 (App Router) | React framework, easy to later build mobile app on same API |
| Styling     | Tailwind CSS v4    | Utility-first, fast to build and maintain   |
| Database    | Supabase (PostgreSQL) | Hosted in Mumbai (India), free tier, real-time capable |
| ORM / SDK   | Supabase JS Client | Thin wrapper over Postgres, no extra ORM needed |
| Hosting     | Vercel             | Native Next.js support, free tier, edge CDN in India |
| Date utils  | date-fns           | Lightweight date manipulation               |

---

## Architecture

```
Browser (Next.js Client Components)
        │
        ▼
Next.js API Routes (/app/api/*)        ← Server-side, credentials never exposed
        │
        ▼
Supabase (PostgreSQL — Mumbai)
```

All database access goes through Next.js API routes on the server. The Supabase anon key is used client-side only for the JS SDK; sensitive operations are kept server-side.

---

## Database Schema

### Table: `assignments`

| Column       | Type        | Constraints                                      |
|--------------|-------------|--------------------------------------------------|
| `id`         | uuid        | Primary key, auto-generated                      |
| `desk_number`| integer     | 1–93, not null                                   |
| `person_name`| text        | not null                                         |
| `time_slot`  | text        | Enum check (see below), not null                 |
| `start_date` | date        | not null                                         |
| `end_date`   | date        | not null                                         |
| `notes`      | text        | nullable (phone, payment info, etc.)             |
| `created_at` | timestamptz | auto, default now()                              |

**Indexes:** `desk_number`, `(start_date, end_date)`

---

## Time Slots

| Key                 | Label              | Hours       | Duration |
|---------------------|--------------------|-------------|----------|
| `full_day`          | Full Day           | 7am – 10pm  | 15 hrs   |
| `morning`           | Morning            | 7am – 12pm  | 5 hrs    |
| `afternoon_evening` | Afternoon+Evening  | 12pm – 10pm | 10 hrs   |
| `day`               | Day                | 7am – 5pm   | 10 hrs   |
| `evening`           | Evening            | 5pm – 10pm  | 5 hrs    |

### Non-overlapping combinations (can share one desk)
- Morning + Afternoon+Evening
- Morning + Evening
- Day + Evening

---

## API Endpoints

### `GET /api/assignments`
Returns all assignments. Optional query params:
- `?date=YYYY-MM-DD` — only assignments active on that date
- `?desk=1` — only assignments for that desk
- `?active=true` — only current/future assignments

### `POST /api/assignments`
Create a new assignment. Validates:
- Desk number in range 1–93
- No overlapping time slot on the same desk in the same date range

**Body:**
```json
{
  "desk_number": 42,
  "person_name": "Ravi Kumar",
  "time_slot": "morning",
  "start_date": "2025-04-01",
  "end_date": "2025-04-30",
  "notes": "9876543210"
}
```

### `PATCH /api/assignments/[id]`
Update `end_date`, `notes`, or `person_name` on an existing assignment.

### `DELETE /api/assignments/[id]`
Remove an assignment permanently.

---

## Pages

| Route          | Description                                                   |
|----------------|---------------------------------------------------------------|
| `/`            | Dashboard — 93-desk grid, color-coded availability, stat cards, slot filter |
| `/assign`      | Form to create a new assignment (pre-fills desk if `?desk=N` in URL) |
| `/assignments` | Full list — search by name/desk, filter active/expired, edit/remove |

### Desk status logic (Dashboard)
- **Free** (green) — no active assignments today
- **Partial** (yellow) — some slots taken, at least one non-overlapping slot still free
- **Full** (red) — full_day taken, or (day + evening), or (morning + afternoon_evening)

---

## File Structure

```
desk-manager/
├── app/
│   ├── layout.js                    # Root layout with Navbar
│   ├── page.js                      # Dashboard
│   ├── globals.css
│   ├── assign/page.js               # Assign desk form
│   ├── assignments/page.js          # All assignments list
│   └── api/
│       ├── assignments/route.js     # GET, POST
│       └── assignments/[id]/route.js # PATCH, DELETE
├── components/
│   └── Navbar.jsx
├── lib/
│   ├── supabase.js                  # Supabase client singleton
│   └── timeSlots.js                 # Slot definitions, overlap logic, colors
├── supabase_schema.sql              # Run once in Supabase SQL editor
├── SETUP.md                         # Deployment guide
└── .env.local                       # Supabase credentials (not in git)
```

---

## Environment Variables

| Variable                       | Description                  |
|--------------------------------|------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`     | Supabase project URL         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Supabase anon/public API key |

---

## Future — Mobile App
The Next.js API routes (`/api/*`) serve as a REST API. A React Native (Expo) mobile app can consume the same endpoints with no backend changes needed.

Planned mobile features:
- Same desk grid and assignment flow
- Push notifications for expiring assignments
- Offline-capable with local cache
