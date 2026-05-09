#!/usr/bin/env python3
"""Intervals.icu importer for Athlete OS.

Requires for API import:
  INTERVALS_API_KEY      Intervals.icu API key from settings
  INTERVALS_ATHLETE_ID   Athlete id, e.g. i483662

Optional push to Convex planner:
  CONVEX_SITE_URL=https://different-corgi-424.convex.site
  ATHLETE_OS_INGEST_SECRET=...  # only if set in Convex

Examples:
  INTERVALS_API_KEY=... INTERVALS_ATHLETE_ID=i483662 \
    python3 scripts/import_intervals.py --oldest 2026-05-01 --newest 2026-05-31 --include-events --push-planner

  python3 scripts/import_intervals.py --events-file data/raw/intervals/events.json --push-planner
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
from typing import Any

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


def normalize_event(e: dict[str, Any]) -> dict[str, Any]:
    start = e.get("start_date") or e.get("startDate") or e.get("start_time") or e.get("startTime") or e.get("date") or e.get("day") or ""
    day = str(start)[:10]
    title = e.get("name") or e.get("title") or (e.get("workout_doc") or {}).get("name") or e.get("type") or "Planned workout"
    sport = e.get("sport") or e.get("category") or e.get("type") or title
    source_id = e.get("id") or e.get("uid") or e.get("external_id") or f"{day}:{title}"
    return {
        "sourceId": str(source_id),
        "day": day,
        "title": str(title),
        "sport": str(sport),
        "raw": e,
    }


def post_planner(events: list[dict[str, Any]], site_url: str, athlete_slug: str = "tommaso") -> dict[str, Any]:
    sessions = [normalize_event(e) for e in events if isinstance(e, dict) and normalize_event(e).get("day")]
    payload = json.dumps({"athleteSlug": athlete_slug, "source": "intervals", "sessions": sessions}).encode()
    headers = {"Content-Type": "application/json"}
    secret = os.environ.get("ATHLETE_OS_INGEST_SECRET")
    if secret:
        headers["x-athlete-os-secret"] = secret
    req = urllib.request.Request(site_url.rstrip("/") + "/planner/intake", data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--oldest", default=(dt.date.today() - dt.timedelta(days=7)).isoformat(), help="ISO date")
    ap.add_argument("--newest", default=dt.date.today().isoformat(), help="ISO date")
    ap.add_argument("--include-events", action="store_true")
    ap.add_argument("--events-file", help="Use an existing Intervals events JSON file instead of fetching")
    ap.add_argument("--push-planner", action="store_true", help="Push events to Convex /planner/intake")
    ap.add_argument("--convex-site-url", default=os.environ.get("CONVEX_SITE_URL"), help="Convex .site URL")
    ap.add_argument("--athlete-slug", default="tommaso")
    args = ap.parse_args()

    manifest: dict[str, Any] = {"oldest": args.oldest, "newest": args.newest, "files": []}
    events: list[dict[str, Any]] = []

    if args.events_file:
        events = json.loads(Path(args.events_file).read_text())
        if not isinstance(events, list):
            raise SystemExit("events file must contain a JSON array")
    else:
        api_key = os.environ.get("INTERVALS_API_KEY")
        athlete_id = os.environ.get("INTERVALS_ATHLETE_ID")
        if not api_key or not athlete_id:
            print("Missing INTERVALS_API_KEY or INTERVALS_ATHLETE_ID", file=sys.stderr)
            return 2
        manifest["athleteId"] = athlete_id
        activities = get_json(f"/athlete/{athlete_id}/activities", {"oldest": args.oldest, "newest": args.newest, "limit": "1000"}, api_key)
        manifest["files"].append(str(save("activities.json", activities)))
        wellness = get_json(f"/athlete/{athlete_id}/wellness", {"oldest": args.oldest, "newest": args.newest}, api_key)
        manifest["files"].append(str(save("wellness.json", wellness)))
        athlete = get_json(f"/athlete/{athlete_id}", {}, api_key)
        manifest["files"].append(str(save("athlete.json", athlete)))
        if args.include_events or args.push_planner:
            events = get_json(f"/athlete/{athlete_id}/events", {"oldest": args.oldest, "newest": args.newest, "limit": "1000"}, api_key) or []
            manifest["files"].append(str(save("events.json", events)))

    result: dict[str, Any] = {"ok": True, "files": manifest["files"], "events": len(events)}
    if args.push_planner:
        if not args.convex_site_url:
            raise SystemExit("Missing CONVEX_SITE_URL or --convex-site-url")
        result["planner"] = post_planner(events, args.convex_site_url, args.athlete_slug)

    save("manifest.json", manifest)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
