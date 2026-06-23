
# VYROL CRM — Cloud migration + auth + multi-user stats

## 1. Enable Lovable Cloud
Provisions the backend (Supabase under the hood). Required before any auth/database work.

## 2. Database schema (migration)
Four tables in `public`, all with RLS, GRANTs, and `user_id uuid references auth.users(id) on delete cascade`:

- **leads** — mirrors current `Lead` interface (business_name, phone, address, website_url, google_maps_url, category, rating, review_count, website_quality, lead_quality, pipeline_status, notes, next_call_date, next_call_time, last_contacted_at, archived, archived_at, created_at, updated_at) + `user_id`. RLS: owner-only CRUD.
- **call_logs** — id, user_id, lead_id (nullable, fk leads on delete set null), call_result, call_notes, call_date, created_at. RLS: owner CRUD + **all authenticated users can SELECT** (needed for teammate counts & leaderboard).
- **daily_goals** — id, user_id, date, goal_amount, calls_made; UNIQUE(user_id, date). RLS: owner CRUD + authenticated SELECT (for leaderboard if needed; otherwise owner-only — using call_logs for counts instead, so owner-only).
- **user_settings** — user_id PK, default_goal int default 50, theme text default 'dark', google_places_api_key text default '', updated_at. RLS: owner CRUD. Auto-created via trigger on `auth.users` insert.
- **profiles** — id (auth.users fk), email text. Auto-populated via trigger. RLS: all authenticated users can SELECT (so we can show teammate display name). Owner can UPDATE.

Trigger `handle_new_user()` inserts a profile row + a user_settings row on signup.

## 3. Auth
- Use the integration-managed `_authenticated/route.tsx` gate. All app routes (dashboard, pipeline, calendar, archive, settings, save-lead) move under `src/routes/_authenticated/`.
- New public `/auth` route with email + password sign-in only (no signup UI — accounts created in dashboard).
- Logout button in the AppLayout header.
- `useAuth()` hook exposes `user` (id, email).

## 4. Data layer rewrite
Rewrite `src/lib/crm-store.tsx` to back state with Supabase:
- On mount (when user present): load leads, today's call_logs, today's goal, settings → into local React state for snappy UI.
- All mutations (saveLead, updateLead, archive, restore, delete, logCall, setGoal, setDefaultGoal, setTheme, setApiKey) write to Supabase, then update local cache.
- Subscribe to realtime changes on `call_logs` so teammate counts update live (best-effort; fallback: refetch every 60s).
- Settings load on login fixes the daily-goal reset bug.

Keep the existing Context API surface (`useCrm`) so consumer components don't need rewrites beyond minor signature tweaks (mutations become async — toast on error).

## 5. Overdue bug fix
Dashboard overdue list: each row gets a phone icon "Log Call" button. Clicking opens `CallCompletedModal` with `leadId` prop pre-bound. The modal:
- Logs the call against that `lead_id`.
- Updates lead's `last_contacted_at = now()` and **clears `next_call_date = null`** so it leaves the overdue list.
- Adds an optional "Next follow-up date" field; if set, writes `next_call_date` instead of clearing.

Also pass `leadId` from LeadDetail's existing "log call" affordance for consistency.

## 6. Per-user stats + leaderboard
Dashboard stats section becomes:
- **My calls today** — `count(call_logs where user_id = me and date = today)`
- **{teammate username} calls today** — for each other profile, show their count
- **Combined total today** — sum

New **Team leaderboard** card: `count(call_logs) group by user_id` all-time, sorted desc, displayed as `email.split('@')[0]`.

Powered by a small server function or direct queries using authenticated client (RLS allows authenticated SELECT on call_logs).

## 7. Files
- New migration creating tables, RLS, GRANTs, triggers.
- New `src/routes/auth.tsx` (login page).
- Move existing routes into `src/routes/_authenticated/` (index, pipeline, calendar, archive, settings, save-lead). Update each `createFileRoute` path.
- `src/routes/_authenticated/route.tsx` — managed gate.
- Rewrite `src/lib/crm-store.tsx` (Supabase-backed; same hook API, async mutations).
- New `src/hooks/use-auth.tsx` — wraps Supabase session + exposes user.
- Update `AppLayout.tsx` — add logout button + user email display.
- Update `src/routes/index.tsx` (dashboard) — add Log Call button on overdue items, new stats rows, leaderboard card.
- Update `CallCompletedModal.tsx` — accept `leadId` prop + optional next-follow-up date field; clear/set `next_call_date` on save.
- Keep pipeline, calendar, archive, save-lead, lead-detail behavior unchanged (only adapt to async store).

## Notes
- localStorage is dropped entirely. No migration of existing local data (per request — fresh start with cloud).
- Theme still applied client-side from loaded settings.
- No realtime is required by the spec; will poll teammate counts on dashboard mount + after each logged call.
