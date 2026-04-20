# Next Step — Mobile

Expo app that teaches adulting through branching scenarios, interactive quizzes, real budgeting/checklist tools, a custom level editor, and a shared leaderboard.

## Run on iOS with Expo Go

1. **Install Expo Go** on your iPhone (App Store).
2. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```
3. **(Optional, but recommended) Configure Supabase** — see *Leaderboard setup* below. Without it, the Leaderboards tab still loads but remote upload is disabled.
4. **Start the dev server:**
   ```bash
   npm start            # LAN mode (same wifi required)
   # or
   npx expo start --tunnel   # Tunnel mode (slower, works across networks)
   ```
5. Open the Expo Go app and scan the QR code. Hot reload is on.

## Leaderboard setup (Supabase)

1. In your Supabase project, run this SQL in the SQL editor:

   ```sql
   -- Fresh schema — if you already have a leaderboard table from earlier versions,
   -- drop and recreate (existing scores will be lost; this is a hackathon project).
   drop table if exists public.leaderboard cascade;

   create table public.leaderboard (
     user_id text primary key,
     username text not null,
     points integer not null default 0,
     avatar_id integer,
     friends text[] default '{}'::text[],
     friend_requests text[] default '{}'::text[],
     updated_at timestamptz default now()
   );

   create index leaderboard_points_idx on public.leaderboard (points desc);

   alter table public.leaderboard enable row level security;

   create policy "Anyone can read"
     on public.leaderboard for select using (true);

   create policy "Anyone can insert"
     on public.leaderboard for insert with check (true);

   create policy "Anyone can update"
     on public.leaderboard for update using (true) with check (true);
   ```

2. Copy your Project URL and anon public key from *Project Settings → API*.

3. Create `mobile/.env`:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

4. Stop Metro and restart — `EXPO_PUBLIC_*` vars are inlined at bundle time, not read at runtime.

The Leaderboards tab will detect the credentials and enable the **Upload my score** button.

## Project layout

- `App.tsx` — root navigation, all screens, More dropdown, tab bar
- `src/colors.ts` — light + dark palettes
- `src/types.ts` — shared types
- `src/engine.ts` — game state, effects, scheduled events
- `src/modifiers.ts` — 8 modifier categories + starting-stat / passive-drain / law-heat math
- `src/scenarios/` — Taxes, Lease, Job, Dealership, Hospital scene graphs
- `src/education.ts` — lessons + interactive quizzes (readings + MCQ)
- `src/progressStore.ts` — quiz + campaign score persistence and overall %
- `src/leaderboardStore.ts` — aggregated point totals including customs
- `src/supabase.ts` — Supabase client + leaderboard upload / fetch
- `src/profileStore.ts` — local account (username) persistence
- `src/levelStore.ts` — AsyncStorage-backed custom level CRUD + finale rule evaluation
- `src/characterStore.ts` — saved character profiles with modifier presets
- `src/toolsStore.ts` — Budget Builder, Lease Checklist, Tax Doc Tracker state + export/reset helpers
- `src/config.ts` — Supabase env-var resolution

## Features

### Bottom tab bar (5 items)
Home | Learn | **Play** (center) | Boards | More. The More button opens a modal overlay with Tools, Progress, Characters, Settings.

### Splash + Account
First launch prompts for a local username. The profile lives in AsyncStorage only — it's not uploaded until you tap *Upload my score* on the Leaderboards tab. Resetting all data from Settings clears the profile too, prompting a fresh account on next launch.

### Home
Hero card with overall-completion %, lessons-done count, scenarios-played count, and a progress bar. Completion % is computed over **built-in campaigns + lessons only** — custom levels don't dilute the percentage.

### Learn
Each track shows quiz count + completion fill. Tapping opens the lesson list where each quiz has a reading and 3+ multiple-choice questions, graded out of 100. Best score per quiz is persisted.

### Play
Segmented control with Campaign and Level Design. Selecting a scenario routes to a character-pick screen (default character or one you've saved in *More → Characters*).

### Characters (More)
User-created profiles. Four preset templates (First-Gen Student, F-1 International, Working Parent, Returning Adult) + Custom — Custom opens the full 8-category modifier selector with a name input.

### Leaderboards
- Hero card with your total points (campaign + lesson + custom) and per-category breakdown
- **Upload my score** pushes `{username, points}` to Supabase via upsert
- Top 50 list with podium coloring (gold / silver / bronze) and your row highlighted
- Pull-to-refresh via the refresh icon
- Graceful empty state when Supabase isn't configured

### Level Design (More → in Play)
- **New Level** scaffolds a working template
- **Import** pastes a JSON file you were sent; assigns a fresh ID so it won't overwrite your own levels
- **Export** per level shows the full JSON to copy/share
- Editor covers metadata, scenes (with nested choice/effects/nextId editor), ending rules, lessons, and analysis rules
- `targetScore` field caps the maximum score the level can grant toward leaderboard points

### Tools (More)
Three real utilities, all persisted:
- **Budget Builder** — monthly take-home input, categorized expenses (Needs/Wants/Savings), live 50/30/20 targets with progress bars, unallocated / over-budget indicator
- **Lease Checklist** — 20 items across 4 phases (Before showing / During / In the lease / Before signing), with per-item notes and progress bar
- **Tax Doc Tracker** — 11 forms grouped by issuer deadline (Jan 31 / Feb 15 / May 31), with full form name, who sends it, plain-English description, and personal notes

### Progress (More)
- Overall ring + counters
- Campaign best scores with play counts
- Custom levels and their best scores
- Per-track quiz scores with fill bar and per-quiz breakdown

### Settings (More)
- Appearance: Light / Dark / Match System
- Data & Privacy: **Export** all local data as JSON, **Import** from JSON, **Reset all** (confirm modal)
- About + legal disclaimer

## Keyboard shortcuts in Metro

- `r` reload
- `m` open native menu
- `j` open debugger
- `?` full shortcut list

## Troubleshooting

- **"Cannot find module 'babel-preset-expo'"** — run `npm install` in `mobile/`
- **Connection timeout on phone** — try `npm start` (LAN) first; only fall back to `--tunnel` if you're on segregated networks. Make sure `node.exe` is allowed through Windows Firewall (Private + Public)
- **Leaderboard uploads fail with a permissions error** — check that RLS policies from the SQL above are applied and the `leaderboard` table is in the `public` schema
- **Custom levels don't show after import** — verify the JSON has `scenes` array and `startSceneId` string at minimum
