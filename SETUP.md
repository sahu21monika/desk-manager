# Desk Manager – Setup & Hosting Guide

## What this app does
- Visual grid of all 93 desks — green (free), yellow (partial), red (full)
- Assign any desk to a student: pick time slot, start date, number of days
- Automatic conflict detection (no double-booking the same time slot)
- Search and filter all assignments by name, desk, or status
- Edit or remove assignments at any time

---

## Step 1 — Set up the database (Supabase — free)

1. Go to **https://supabase.com** → Sign up / Log in
2. Click **New project**, give it a name (e.g. "desk-manager"), set a password, and for region select **South Asia (Mumbai)** — this keeps all data inside India and gives the fastest speed
3. Wait ~1 minute for the project to be ready
4. Go to **SQL Editor** (left sidebar) → click **New query**
5. Paste the contents of `supabase_schema.sql` and click **Run**
6. Go to **Project Settings → API**
   - Copy **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon / public key** → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2 — Run locally (optional, for testing)

```bash
cd desk-manager
cp .env.local.example .env.local
# Edit .env.local and paste your Supabase URL and key
npm install
npm run dev
# Open http://localhost:3000
```

---

## Step 3 — Deploy to Vercel (free hosting)

1. Go to **https://vercel.com** → Sign up with GitHub
2. Push this project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # Create a repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/desk-manager.git
   git push -u origin main
   ```
3. On Vercel: **New Project** → Import your GitHub repo → click **Deploy**
4. After first deploy fails (missing env vars), go to:
   **Project Settings → Environment Variables** → add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
5. Go to **Deployments** → click the three dots on the latest → **Redeploy**
6. Your site is now live at `https://your-project.vercel.app`

---

## Time Slots Reference

| Slot             | Hours       | Duration |
|------------------|-------------|----------|
| Full Day         | 7am – 10pm  | 15 hrs   |
| Morning          | 7am – 12pm  | 5 hrs    |
| Afternoon+Evening| 12pm – 10pm | 10 hrs   |
| Day              | 7am – 5pm   | 10 hrs   |
| Evening          | 5pm – 10pm  | 5 hrs    |

A single desk can be shared between non-overlapping slots (e.g., Morning + Evening).
