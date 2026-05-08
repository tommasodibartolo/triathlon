# Triathlon Analytics Dashboard

Personal athlete analytics stage for tracking Tommaso's triathlon + gym + nutrition evolution over time.

## Stage v0.1.0

Open `index.html` locally or serve statically. No build step and no dependencies by design because this repo is currently a lightweight staged dashboard.

Core goals:
- visualize evolution over time across swim, bike, run, gym, nutrition, recovery, and body composition
- show deltas to goals, not just raw logs
- capture screenshot-derived data as source of truth
- maintain a database schema ready for future integrations

## Files

- `index.html` — staged dashboard UI
- `styles.css` — visual system
- `app.js` — analytics, chart rendering, local data store
- `data/seed.json` — current baseline extracted from handover PDF
- `db/schema.sql` — relational database schema for future SQLite/Postgres/Supabase migration
- `docs/kpi-research.md` — KPI framework and missing data map

## Current baseline from handover

- Goal: strong 70.3 performance around 5:00–5:15 while staying lean and muscular
- Training structure: endurance + hypertrophy split
- Source of truth: screenshots and exact logs
- Known sessions: long ride, brick run, Wednesday run, neuromuscular ride, Sofia ride
- Known strength progressions: DB shoulder press, lat pulldown, hammer curl, DB curl, rear delt fly, leg curl

## Next data needed

See the dashboard's "Missing data" section and `docs/kpi-research.md`.
