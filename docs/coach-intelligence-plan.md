# Coach Intelligence Plan

## Answers

### Garmin API credentials
Garmin has official developer/health APIs, but access is approval/partner based. The practical path is:
1. Apply/request access through Garmin Developer / Garmin Health API.
2. Create an application and get client credentials/webhook settings if approved.
3. Store secrets only in Vercel/Convex environment variables, never in Git.
4. If approval is slow, use Intervals.icu or Garmin exports as the bridge while keeping Garmin as the logical source for run/swim/outdoor-bike.

### Peloton API
Peloton has a usable community-documented API flow: https://peloton.readthedocs.io/en/latest/api-guide/
Preferred path: use Peloton direct for indoor-bike details because it preserves Peloton-specific metrics like output, cadence, resistance, leaderboard/workout metadata, and power-like fields better than a downstream aggregator.
Credentials/session tokens must be stored as secrets; do not commit them.

### Nutrition intelligence
Daily intake is generated from:
- base metabolic burn / maintenance estimate
- actual training burn from Garmin/Peloton/Intervals
- bulk surplus target
- macro targets
- workout type and duration

Workflow:
1. Athlete finishes morning triathlon/gym block.
2. System reads device burn and calculates target intake.
3. System proposes meals: pre-training, breakfast, lunch, snack, dinner.
4. Athlete taps approve if eaten or edit if changed.
5. Approved/edited meals become manual nutrition records and remain editable/deletable.

Long sessions >60 minutes trigger pre/during-workout nutrition suggestions: banana/rice waffle/jam, electrolytes, and gels roughly every 30 minutes depending on duration/intensity.

### Calendar and shifting plan
The plan is goal-oriented, not static. The dashboard should show today and the week. If Tuesday is missed, the athlete can shift the session to Wednesday; the system records the shift and adjusts fatigue/nutrition/program recommendations.

### Telegram training input
Telegram training thread becomes a manual input channel. Messages/photos/audio from that thread should be parsed into activity records and pushed to the frontend backend store. Telegram records are manual-source and therefore editable/deletable.

## Backend recommendation
Static/localStorage is no longer enough for the target system. Use Convex next because it gives:
- realtime frontend updates from Telegram ingestion
- persistent activity ledger across phone/laptop
- server functions for Garmin/Peloton sync
- locked device records and editable manual records
- easy audit trail for approve/edit/delete

Minimum Convex tables:
- activity_records
- planned_sessions
- meal_prescriptions
- meal_confirmations
- device_connections
- source_sync_runs
- body_images
- coach_decisions

## Current implementation status
- Nutrition tab added with burn-based meal prescription placeholder logic.
- Approve/edit workflow added client-side.
- Calendar/shift workflow added client-side.
- Garmin/Peloton adapters remain scaffolds pending credentials.
- Next production step: move ledger from localStorage to Convex and wire Telegram ingestion.
