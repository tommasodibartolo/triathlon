-- Triathlon athlete analytics schema v0.1
-- Works as SQLite; can migrate to Postgres with minor type adjustments.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS athletes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  height_cm REAL,
  birthdate TEXT,
  sex TEXT,
  timezone TEXT DEFAULT 'Europe/Rome',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  athlete_id TEXT NOT NULL REFERENCES athletes(id),
  domain TEXT NOT NULL, -- race, body, strength, nutrition, recovery
  metric TEXT NOT NULL,
  current_value REAL,
  target_value REAL NOT NULL,
  unit TEXT NOT NULL,
  deadline TEXT,
  priority INTEGER DEFAULT 1,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  athlete_id TEXT NOT NULL REFERENCES athletes(id),
  source TEXT NOT NULL DEFAULT 'manual',
  source_ref TEXT,
  started_at TEXT NOT NULL,
  discipline TEXT NOT NULL CHECK (discipline IN ('swim','bike','run','strength','mobility','brick','other')),
  title TEXT,
  duration_sec INTEGER,
  distance_m REAL,
  calories REAL,
  avg_hr_bpm REAL,
  max_hr_bpm REAL,
  avg_power_w REAL,
  normalized_power_w REAL,
  max_power_w REAL,
  cadence_rpm REAL,
  avg_pace_sec_per_km REAL,
  speed_mps REAL,
  rpe REAL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workout_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  zone_type TEXT NOT NULL, -- hr, power, pace
  zone_name TEXT NOT NULL,
  seconds INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS strength_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id TEXT REFERENCES workouts(id) ON DELETE CASCADE,
  athlete_id TEXT NOT NULL REFERENCES athletes(id),
  performed_at TEXT NOT NULL,
  exercise TEXT NOT NULL,
  muscle_group TEXT,
  set_index INTEGER,
  reps INTEGER,
  weight_kg REAL,
  weight_lb REAL,
  rpe REAL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS daily_body (
  athlete_id TEXT NOT NULL REFERENCES athletes(id),
  date TEXT NOT NULL,
  weight_kg REAL,
  body_fat_pct REAL,
  lean_mass_kg REAL,
  waist_cm REAL,
  photo_ref TEXT,
  notes TEXT,
  PRIMARY KEY (athlete_id, date)
);

CREATE TABLE IF NOT EXISTS daily_nutrition (
  athlete_id TEXT NOT NULL REFERENCES athletes(id),
  date TEXT NOT NULL,
  kcal REAL,
  protein_g REAL,
  carbs_g REAL,
  fat_g REAL,
  fiber_g REAL,
  water_l REAL,
  alcohol_units REAL,
  notes TEXT,
  PRIMARY KEY (athlete_id, date)
);

CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY,
  athlete_id TEXT NOT NULL REFERENCES athletes(id),
  consumed_at TEXT NOT NULL,
  name TEXT,
  kcal REAL,
  protein_g REAL,
  carbs_g REAL,
  fat_g REAL,
  timing_tag TEXT, -- pre-workout, post-workout, correction, normal
  source TEXT DEFAULT 'manual',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS daily_recovery (
  athlete_id TEXT NOT NULL REFERENCES athletes(id),
  date TEXT NOT NULL,
  sleep_hours REAL,
  sleep_efficiency_pct REAL,
  hrv_rmssd_ms REAL,
  resting_hr_bpm REAL,
  readiness_1_10 REAL,
  soreness_1_10 REAL,
  illness_flag INTEGER DEFAULT 0,
  injury_notes TEXT,
  PRIMARY KEY (athlete_id, date)
);

CREATE TABLE IF NOT EXISTS thresholds (
  athlete_id TEXT NOT NULL REFERENCES athletes(id),
  effective_date TEXT NOT NULL,
  ftp_w REAL,
  run_threshold_pace_sec_per_km REAL,
  swim_threshold_pace_sec_per_100m REAL,
  max_hr_bpm REAL,
  notes TEXT,
  PRIMARY KEY (athlete_id, effective_date)
);

CREATE TABLE IF NOT EXISTS derived_daily_metrics (
  athlete_id TEXT NOT NULL REFERENCES athletes(id),
  date TEXT NOT NULL,
  daily_tss REAL,
  weekly_tss REAL,
  ctl_42d REAL,
  atl_7d REAL,
  tsb REAL,
  weekly_minutes REAL,
  protein_g_per_kg REAL,
  calorie_balance REAL,
  recovery_score REAL,
  data_quality_score REAL,
  PRIMARY KEY (athlete_id, date)
);
