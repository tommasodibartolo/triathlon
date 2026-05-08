#!/usr/bin/env python3
"""Garmin import skeleton for Athlete OS.

Official Garmin Health API access requires approved credentials/partner access.
This script is intentionally a placeholder adapter so the dashboard schema and
source-locking policy are ready before credentials are available.

Expected normalized output row:
{
  "source": "garmin",
  "source_id": "garmin_activity_id",
  "locked": true,
  "deletable": false,
  "sport": "run|swim|bike",
  "type": "activity",
  "day": "YYYY-MM-DD",
  "metrics": {"distance_m": 0, "duration_s": 0, "avg_hr": 0}
}
"""
import argparse, json, os, sys


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--from-date", required=True)
    p.add_argument("--to-date", required=True)
    p.add_argument("--out", default="data/imports/garmin-activities.json")
    args = p.parse_args()
    token = os.getenv("GARMIN_ACCESS_TOKEN")
    if not token:
        print("GARMIN_ACCESS_TOKEN missing. Official Garmin API credentials are required.", file=sys.stderr)
        return 2
    # TODO: call approved Garmin Health API endpoint once app credentials exist.
    rows = []
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w") as f:
        json.dump(rows, f, indent=2)
    print(json.dumps({"source":"garmin","rows":len(rows),"out":args.out}))

if __name__ == "__main__":
    raise SystemExit(main())
