# Athlete OS Source of Truth + Device Integrations

## Source scenarios

### Scenario A — device-driven endurance
- **Run:** Garmin Fenix 8 Pro + Garmin HRM chest strap -> Garmin platform -> Athlete OS.
- **Swim:** Garmin Fenix 8 Pro -> Garmin platform -> Athlete OS.
- **Outdoor bike:** Garmin Fenix 8 Pro / bike sensors / HRM -> Garmin platform -> Athlete OS.
- **Indoor bike:** Peloton Bike + power/cadence metrics -> Peloton API -> Athlete OS.

### Scenario B — Intervals.icu as aggregator
- Garmin + Peloton can also flow into Intervals.icu.
- Intervals is useful for training-load analytics, calendar, CTL/ATL/TSB-style views, and export fallback.
- But it should not be the only source of truth if native Garmin/Peloton access is available.

## Recommended source of truth

Use **Athlete OS as the canonical activity ledger**.

Each row stores:
- `source`: manual, garmin, peloton, intervals, telegram, image
- `source_id`: immutable upstream ID when available
- `locked`: true for device/API imports
- `deletable`: false for device/API imports; true for manual/image/telegram inputs
- `correction_of`: optional pointer to corrected manual record

Policy:
- Device/API records are **locked** and cannot be deleted from the UI.
- Manual records can be deleted because gym input errors are expected.
- Future: device records can be hidden/ignored or resynced, but not destructively deleted.

## Garmin API reality

Garmin has official health/activity APIs, but access generally requires developer approval / partner registration. For this project, implement in this order:
1. Official Garmin Health API if credentials are granted.
2. Garmin export or Intervals bridge as fallback.
3. Do not depend on browser scraping for Garmin unless explicitly approved.

Needed from user:
- Garmin developer app/API credentials if approved.
- Confirmation whether Fenix 8 Pro syncs all activities to Garmin Connect.
- Chest strap exact model is likely Garmin HRM-Pro/HRM-Pro Plus, not “600g”; confirm later only if needed.

## Peloton API

Peloton has an accessible community-documented API. Docs provided by user:
https://peloton.readthedocs.io/en/latest/api-guide/

Use for:
- ride history
- duration
- output/power
- cadence/resistance if available
- instructor/class metadata
- HR if Peloton captured it

Needed from user:
- Peloton username/email.
- Password or session cookie/token handled securely, not committed.
- Date range to import.

## Telegram training input

Telegram is an input source for live coaching logs.

Future pipeline:
1. User sends training update in Telegram training thread.
2. Hermes parses it into structured activity rows.
3. Server writes row to Athlete OS backend.
4. Frontend refreshes or receives realtime update.

For now, UI labels `telegram` as a source and treats it as user-editable/deletable unless it is reconciled to a locked device record.

## Backend requirement

LocalStorage is acceptable for UI prototyping only. To show Telegram/device updates on the frontend immediately, add a backend:
- Recommended: Convex for realtime app state + simple mutations.
- Alternative: Supabase/Postgres + realtime subscriptions.
- Minimal: Vercel KV/blob JSON with polling.

Next implementation milestone:
- `activities` table/collection with locked source policy.
- import jobs for Garmin/Peloton.
- Telegram parser webhook mutation.
- mobile-first gym plan/session entry.
