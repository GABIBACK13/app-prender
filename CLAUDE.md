# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Math learning PWA aimed at children aged **5–12 years**. The core loop is: child answers math questions → earns points → redeems points for rewards configured by parents. Parents manage rewards via a password-gated screen (`/main/loja/gerenciar`); the child sees and redeems them at `/main/loja`.

UI/UX must always stay child-friendly: large tap targets, playful fonts (Fredoka), bright colors, audio feedback for correct/wrong answers and streak milestones. Sound files live under `public/audio/`.

## Commands

```bash
npm run dev       # Start dev server (Vite, typically port 5173–5177)
npm run build     # Type-check + production build (tsc -b && vite build)
npm run lint      # ESLint
npm run preview   # Preview production build
```

There is no test suite configured.

## Architecture Overview

**app-prender** is a gamified math learning PWA for children built with React 19 + Vite + TypeScript + MUI v9, using Firebase (Auth + Firestore) as the backend.

### Data Flow: localStorage-first with deferred Firebase sync

The localStorage-first strategy is intentional to minimize Firestore reads/writes and avoid cloud billing costs. Every mutation hits localStorage immediately; Firebase is only touched at defined sync points:

- `patchUser(updates)` — updates React state + localStorage only; **no Firestore call**.
- `syncUserToFirebase(userId, data)` — explicit write to Firestore; called at round completion in PlayPage and on reconnect/beforeunload in App.tsx.
- `AuthContext` re-fetches from Firestore only if `shouldSync()` returns true (threshold: 20 min since last sync).
- `performFullSync` flushes all pending localStorage data (user, shop items, purchases) to Firebase in one pass.

When adding new persistent fields: always write to localStorage first via `patchUser` or `saveToLocalStorage`, then let the existing sync points carry the data to Firestore.

### Auth & User model (`src/models/auth.ts`, `src/contexts/AuthContext.tsx`)

`User` shape: `{ id, name, nickname, age, email, points, rating, level, onboarded?, parentPassword?, offensive?, last_day?, offensive_guards? }`

- New users start with `rating: 150`, `level: 1`, `onboarded: false`.
- `onboarded: false` forces redirect to `/onboarding` (placement quiz sets `age` and initial `rating`).
- `parentPassword` gates the shop management screen (`/main/loja/gerenciar`); master key `"APRENDER"` always works as override.

### Question generation system (`src/models/questions.ts`)

Questions are generated from a **bracket system** based on `score = user.age × user.rating`:

1. `generateRoundQueue(user)` — builds a shuffled array of `QuestionType` entries weighted by the current bracket's pool. When the queue empties a new round starts.
2. `generateQuestion(user, forcedType)` — picks `maxStr` and `modifier` by weighted random, builds the question, and filters to rating window `[user.rating − 100, user.rating + 200]` (up to 30 attempts, then uses last result as fallback).
3. Question rating: `(TYPE_RATING[type] + MAX_RATING[maxStr] + MODIFIER_RATING[modifier]) / user.age`
4. `updateUserAfterAnswer` — calculates `rating`/`level`/`points` delta. Acertos earn `ratingGain`, erros cost `ratingLoss`, both scaled by difficulty diff normalized to ±150. Timer multiplier (0–1) scales gains in PlayPage before calling this.
5. Streak bonus: `multiplier = 1 + offensive × 0.01` applied to points and XP via `applyStreakBonus`.

### Routing (`src/routes/index.tsx`)

All protected pages live under `/main` rendered inside `MainLayout` (Header + BottomNavigation + `<Outlet>`):

| Path | Component |
|---|---|
| `/main` | MainPage (dashboard) |
| `/main/jogar` | PlayPage |
| `/main/loja` | ShopPage |
| `/main/loja/gerenciar` | ShopManagePage (parent-gated) |
| `/main/perfil` | ProfilePage |

Route guards: `ProtectedRoute` (requires auth + onboarded), `PublicOnlyRoute`, `OnboardingRoute`.

### Streak system (`src/models/streak.ts`)

Daily goal: 15 questions answered **or** 7 correct answers triggers `updateStreak`. Streak milestones are defined in `src/data/streakMilestones.json` and award points, guards, XP, or badges. Guards (`offensive_guards`) absorb missed days before breaking the streak.

### Theme & Fonts (`src/theme/index.ts`)

- Primary: `#1565C0` (blue), Secondary: `#00ACC1` (teal), Background: `#E3F2FD`.
- Headings/game UI: **Fredoka**; body text: **Nunito**.
- `MuiButton` default: `borderRadius: 50` (pill shape), elevation shadow, hover lift.

### Firebase collections

- `users/{uid}` — user profile document
- `shopItems/{userId}_{itemId}` — reward items created by parents
- `purchases/{userId}_{purchaseId}` — purchase history

Firestore security rules are in `firestore.rules`.
