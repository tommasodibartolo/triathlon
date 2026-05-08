# Athlete OS v0.6 — Convex service architecture

v0.6 moves Athlete OS from a localStorage-only prototype to a modular Convex backend. The frontend can still run offline with localStorage fallback, but Convex becomes the service layer for real data.

## Architecture

- **Frontend:** static Vercel dashboard, mobile-first coach console.
- **API/service layer:** Convex functions grouped by bounded context.
- **Database:** Convex tables for structured operational data.
- **Ingress:** Telegram HTTP endpoint, device connector jobs, manual UI actions.
- **Policy:** device/import records locked; manual/Telegram records editable.

## Convex services

- `convex/ledger.ts`
  - `ensureAthlete`
  - `listActivity`
  - `upsertActivity`
  - `deleteActivity`
  - Owns canonical activity feed and source-lock policy.

- `convex/nutrition.ts`
  - `prescribeDay`
  - `listMeals`
  - `approveMeal`
  - Owns burn/TDEE → meal prescriptions → approve/edit → actual nutrition records.

- `convex/planner.ts`
  - `upsertSession`
  - `shiftSession`
  - `week`
  - Owns planned endurance/gym calendar and missed-session shifting.

- `convex/connectors.ts`
  - `setConnectionStatus`
  - Owns Garmin/Peloton/Intervals/Telegram connection state and secret references.

- `convex/http.ts`
  - `/health`
  - `/telegram/intake`
  - Provides external API ingress without exposing DB details.

## Tables

- `athletes`
- `activityRecords`
- `plannedSessions`
- `mealPrescriptions`
- `deviceConnections`
- `sourceSyncRuns`
- `coachDecisions`

## API boundaries

- Frontend never writes directly to device-source rows as deletable.
- Device connectors call ledger mutations and receive locked rows automatically.
- Telegram is treated as manual user input, so it is editable/deletable.
- Nutrition approval writes both meal status and actual nutrition activity record.
- Planner writes planned sessions; completion should create actual activity records.

## Secret policy

- Garmin: official partner credentials only in Convex env vars if approved.
- Peloton: session credentials/cookies stored as Convex env/secret references, never in Git.
- Intervals: API token/export credential stored as env if used.
- Telegram: bot webhook secret validated in HTTP route before production hardening.

## Deployment

1. `npm install`
2. `npx convex dev` for first-time project binding, or `npx convex deploy` once linked.
3. Set Vercel env/config to point frontend at Convex HTTP/API URL.
4. Deploy Vercel stage.

## Next implementation slice

- Bind Convex project and set deployment URL.
- Add browser API client with localStorage fallback.
- Seed Tommaso athlete and current baseline records.
- Wire Telegram webhook into `/telegram/intake`.
- Move meal approve/edit and gym set logging from localStorage to Convex mutations.
