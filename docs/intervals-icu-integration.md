# Intervals.icu Integration Plan

## Finding

Intervals.icu has a real OpenAPI-described API at:

- Docs: `https://intervals.icu/api-docs.html`
- OpenAPI JSON: `https://intervals.icu/api/v1/docs`

Authentication supports:

- **Basic API key auth**: username is literally `API_KEY`, password is the API key from Intervals settings.
- **OAuth bearer token**: useful later if this becomes a multi-user app.

For Tommaso's personal dashboard, use Basic API key auth first. OAuth is unnecessary complexity unless other athletes/coaches need to connect their accounts.

## Key endpoints to ingest

Use athlete id `i<id>` or the athlete id shown by Intervals.icu. Browser history confirms Tommaso's athlete route as `https://intervals.icu/athlete/i483662`, so the current athlete id is likely `i483662`. We still need an API-key read test to confirm access.

### Activities

`GET /api/v1/athlete/{id}/activities`

Query params:

- `oldest`: required ISO date/datetime
- `newest`: optional ISO date/datetime
- `limit`: optional
- `fields`: optional include/exclude projection

Also available:

- `GET /api/v1/athlete/{id}/activities.csv`
- `GET /api/v1/athlete/{id}/activities/search`
- `GET /api/v1/athlete/{id}/activities/search-full`

Use for:

- swim/bike/run volume
- duration
- distance
- power/pace/HR
- elevation
- intervals
- tags
- activity dates
- sport split

### Wellness

`GET /api/v1/athlete/{id}/wellness{ext}`

Use `.csv` for easier import/export.

Query params:

- `oldest`
- `newest`
- `cols` for CSV subset
- `fields` for JSON subset

Use for:

- weight
- sleep
- HRV
- resting HR
- fatigue/soreness/mood where available
- readiness-style metrics

### Planned training / events

`GET /api/v1/athlete/{id}/events{format}`

Use for:

- planned workouts
- notes
- calendar-level intent vs actual completion
- compliance/adherence KPI

### Athlete profile + settings

`GET /api/v1/athlete/{id}`

Use for:

- sport settings
- zones
- FTP/thresholds if stored
- custom items

### Curves / benchmarks

- `GET /api/v1/athlete/{id}/power-curves{ext}`
- `GET /api/v1/athlete/{id}/pace-curves{ext}`
- `GET /api/v1/athlete/{id}/hr-curves{ext}`

Use for:

- best efforts
- threshold trend
- power/pace evolution
- goal delta charts

## Data model impact

The current SQLite schema is sufficient for stage v0.1, but we need add import-tracking tables:

- `source_connections`
- `sync_runs`
- `raw_import_objects`
- `activity_stream_samples` if we ingest second-by-second streams later

Do not overbuild a second DB yet.

## Recommended ingestion path

### Stage 1 — API-key local importer

Create a local script:

```bash
INTERVALS_ATHLETE_ID=iXXXX \
INTERVALS_API_KEY=... \
python3 scripts/import_intervals.py --oldest 2025-01-01 --newest today
```

Outputs:

- raw JSON files under `data/raw/intervals/`
- normalized SQLite rows once DB is active
- dashboard-friendly JSON snapshots for the static frontend

### Stage 2 — scheduled sync

Run via:

- local cron/Hermes cron for private dashboard, or
- Vercel Cron + serverless function if hosted with encrypted env vars.

### Stage 3 — OAuth only if needed

Use OAuth if other athletes/coaches/users connect their own Intervals accounts.

## Missing from user

Required:

1. Intervals.icu API key from settings.
2. Athlete ID / confirm whether API accepts `i0` for self with API key.
3. Historical date range to import.
4. Whether to include planned workouts/events or only completed activities.
5. Whether wellness has weight/sleep/HRV data in Intervals or lives elsewhere.

Optional but valuable:

1. Target race/date/course.
2. FTP, threshold run pace, CSS swim pace if not in Intervals.
3. Weight/body composition source.
4. Nutrition source/API/export.
