# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Adulting 101 (`artifacts/adulting-app`)
- **Type**: Expo mobile app
- **Preview path**: `/`
- **Description**: Life skills app for young adults (18-25)
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
  - `app/onboarding.tsx` — onboarding flow
  - `app/(tabs)/index.tsx` — home dashboard
  - `app/(tabs)/learn.tsx` — track browser
  - `app/(tabs)/tools.tsx` — Budget Builder, Lease Checklist, Tax Doc Tracker
  - `app/(tabs)/progress.tsx` — progress & milestones
  - `app/track/[id].tsx` — track detail with lesson list
  - `app/lesson/[trackId]/[lessonId].tsx` — interactive lesson player

### API Server (`artifacts/api-server`)
- **Type**: Express API
- **Preview path**: `/api`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
