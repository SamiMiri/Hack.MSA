# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Three artifacts for young adults (18-25) learning life skills.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle)

## Artifacts

### Adulting 101 (`artifacts/adulting-app`)
- **Type**: Expo mobile app
- **Preview path**: `/`
- **Description**: Life skills education app for young adults (18-25)
- **Features**:
  - Onboarding flow (3-step assessment)
  - 2 skill tracks: Money & Budgeting, Taxes & Filing (4 lessons each)
  - Interactive lessons with quizzes, scenarios, and checklists
  - 3 practical tools: Budget Builder, Lease Checklist, Tax Doc Tracker
  - Progress tracking with milestones
  - Deadlines/reminders panel
- **State**: AsyncStorage (no backend)
- **Key files**:
  - `data/tracks.ts` — all lesson content and data structures
  - `data/onboarding.ts` — onboarding questions
  - `context/AppContext.tsx` — global state (progress, budget, checklists)
  - `app/(tabs)/index.tsx` — home dashboard
  - `app/(tabs)/learn.tsx` — track browser
  - `app/(tabs)/tools.tsx` — Budget Builder, Lease Checklist, Tax Doc Tracker

### Adulting Simulator (`artifacts/adulting-simulator`)
- **Type**: React + Vite web app
- **Preview path**: `/adulting-simulator`
- **Port**: 19699
- **Description**: Branching scenario game where real adulting choices have real consequences
- **Features**:
  - Scene-graph engine with flags, pending events, and resume stack for delayed consequences
  - 3 full scenarios: Tax Season (Joe Walker), The Lease (Maya Chen), The Offer (Dmitri Park)
  - Character selection: Broke Student, First-Gen Adult, Young Professional (each with different starting stats)
  - Stats: Cash, Stress, Knowledge, Score — each with visual progress bars
  - AI-powered "Real World Context" panel after every choice (via api-server + OpenAI)
  - Multiple branching endings per scenario based on score thresholds and bad flags
  - Delayed consequence scenes (IRS letters, FBI visits, mold returns)
  - Flags system: irs_risk, fugitive, felony_record, eviction_record, etc.
- **State**: localStorage (best scores)
- **Key files**:
  - `src/data/scenarios.ts` — all 3 scenarios with full scene graphs (~568 lines)
  - `src/data/characters.ts` — character options and stat modifiers
  - `src/hooks/useGameState.ts` — scene-graph engine
  - `src/App.tsx` — all UI screens (Menu, CharacterSelect, Game, Outcome)
  - `vite.config.ts` — proxies `/api/*` to api-server on port 8080

### LifeLevel (`artifacts/lifelevel`)
- **Type**: React + Vite web app
- **Preview path**: `/lifelevel`
- **Port**: 24665
- **Description**: Duolingo-style gamified life skills platform
- **Features**:
  - 5-lesson campaign with streaks, XP, and leaderboard
  - Lesson types: multiple choice, fill-in-the-blank, matching, scenario
  - Hearts system (lives), streak tracking, weekly XP leaderboard
- **State**: localStorage

### API Server (`artifacts/api-server`)
- **Type**: Express API
- **Port**: 8080
- **Preview path**: `/api`
- **Routes**:
  - `GET /api/health` — health check
  - `POST /api/explain` — AI-powered real-world explanation of adulting choices
    - Body: `{ choice, feedback, scene, character, scenarioName }`
    - Response: `{ explanation, followUpQuestions[] }`
    - Uses OpenAI gpt-5-mini via Replit AI Integrations proxy
- **Key files**:
  - `src/routes/explain.ts` — AI explanation endpoint
  - `src/routes/health.ts` — health check
- **Integration**: `@workspace/integrations-openai-ai-server` (lib/integrations-openai-ai-server)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## AI Integration Notes

- OpenAI integration uses Replit AI Integrations proxy (no user API key needed)
- Env vars: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`
- Model: `gpt-5-mini` (do NOT set max_completion_tokens — causes empty responses via proxy)
- Client setup: `lib/integrations-openai-ai-server/src/client.ts`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
