# Next Steps — Mobile

Expo app that merges our branching-scenario engine (Taxes, Lease, Offer) with the Replit visual design.

## Run on iOS with Expo Go

1. **Install Expo Go** on your iPhone (App Store).
2. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```
3. **Start the dev server:**
   ```bash
   npm start
   ```
4. Open the Expo Go app on your phone and scan the QR code printed in the terminal. The app hot-reloads as you edit.

## What's in here

- `App.tsx` — root navigation, all screens, and the More dropdown fix
- `src/colors.ts` — light + dark palette (coral + teal, matching the Replit reference)
- `src/types.ts` — shared type definitions
- `src/modifiers.ts` — 8 modifier categories, starting stat adjustments, passive drains, law-heat multipliers
- `src/engine.ts` — game state, effects, scene/ending resolution, scheduled events
- `src/scenarios/` — Taxes, Lease, Job scenarios
- `src/education.ts` — per-scenario lessons and outcome analysis
- `src/levelStore.ts` — AsyncStorage-backed custom level persistence

## Features wired up

- **Home** — hero card, scenario tracks
- **Learn** — lessons per scenario, key takeaways
- **Play** — segmented Campaign / Freeplay / Level Design selector:
  - Campaign runs presets directly
  - Freeplay routes through the 8-group character creator
  - Level Design lists custom levels + opens the editor
- **Game** — stats bar, law meter, scene card, shuffled choices, feedback banner
- **Outcome** — ending title + narrative + Why You Got This + Key Takeaways
- **Tools / Progress / Settings / Characters** — accessible from the **More** dropdown (fixed: opens a Modal overlay with all four items; no more blank page)
- **Level Editor** — create, edit, save, delete custom scenarios. Supports scenes, choices (label/kind/feedback/effects/flags), endings, ending rules, lessons, and analysis rules
- **Theme** — Light / Dark / Match System, stored via AsyncStorage

## Known limitations in this MVP

- No animations (FadeInDown etc. from reanimated are omitted for a lighter dep tree)
- No XP / streak / coin system
- No onboarding flow
- No backend / AI context panel

These can be added incrementally without touching the engine.
