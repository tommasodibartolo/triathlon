#!/usr/bin/env python3
"""Intervals.icu importer skeleton for the triathlon dashboard.

Requires:
  INTERVALS_API_KEY      Intervals.icu API key from settings
  INTERVALS_ATHLETE_ID   Athlete id, e.g. i12345

Usage:
  INTERVALS_API_KEY=... INTERVALS_ATHLETE_ID=i12345 \
    python3 scripts/import_intervals.py --oldest 2025-01-01 --newest 2026-05-08

This writes raw, dashboard-safe JSON snapshots. It does not print secrets.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

BASE = "https://intervals.icu/api/v1"
OUT = Path("data/raw/intervals")


def auth_header(api_key: str) -> str:
    token = base64.b64encode(f"API_KEY:{api_key}".encode()).decode()
    return f"Basic {token}"


def get_json(path: str, params: dict[str, str], api_key: str):
    url = f"{BASE}{path}?{urllib.parse.urlencode(params, doseq=True)}"
    req = urllib.request.Request(url, headers={"Authorization": auth_header(api_key), "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        text = r.read().decode()
        return json.loads(text) if text else None


def save(name: str, data):
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / name
    p.write_text(json.dumps(data, indent=2, sort_keys=True))
    return p


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--oldest", required=True, help="ISO date, e.g. 2025-01-01")
    ap.add_argument("--newest", default=dt.date.today().isoformat())
    ap.add_argument("--include-events", action="store_true")
    args = ap.parse_args()

    api_key = os.environ.get("INTERVALS_API_KEY")
    athlete_id = os.environ.get("INTERVALS_ATHLETE_ID")
    if not api_key or not athlete_id:
        print("Missing INTERVALS_API_KEY or INTERVALS_ATHLETE_ID", file=sys.stderr)
        return 2

    manifest = {"athleteId": athlete_id, "oldest": args.oldest, "newest": args.newest, "files": []}

    activities = get_json(f"/athlete/{athlete_id}/activities", {"oldest": args.oldest, "newest": args.newest, "limit": "1000"}, api_key)
    manifest["files"].append(str(save("activities.json", activities)))

    wellness = get_json(f"/athlete/{athlete_id}/wellness", {"oldest": args.oldest, "newest": args.newest}, api_key)
    manifest["files"].append(str(save("wellness.json", wellness)))

    athlete = get_json(f"/athlete/{athlete_id}", {}, api_key)
    manifest["files"].append(str(save("athlete.json", athlete)))

    if args.include_events:
        events = get_json(f"/athlete/{athlete_id}/events", {"oldest": args.oldest, "newest": args.newest, "limit": "1000"}, api_key)
        manifest["files"].append(str(save("events.json", events)))

    save("manifest.json", manifest)
    print(json.dumps({"ok": True, "files": manifest["files"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
