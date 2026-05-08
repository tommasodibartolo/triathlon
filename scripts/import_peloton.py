#!/usr/bin/env python3
"""Peloton import skeleton for Athlete OS.

Uses the community-documented Peloton API flow described at:
https://peloton.readthedocs.io/en/latest/api-guide/

Credentials must be supplied by environment variables and never committed.
Normalized rows are locked because they come from an upstream device/platform.
"""
import argparse, json, os, sys
from urllib import request, parse

BASE = "https://api.onepeloton.com"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--from-date", required=False)
    p.add_argument("--to-date", required=False)
    p.add_argument("--out", default="data/imports/peloton-rides.json")
    args = p.parse_args()
    user = os.getenv("PELOTON_USERNAME")
    password = os.getenv("PELOTON_PASSWORD")
    if not user or not password:
        print("PELOTON_USERNAME and PELOTON_PASSWORD missing.", file=sys.stderr)
        return 2
    payload = json.dumps({"username_or_email": user, "password": password}).encode()
    req = request.Request(f"{BASE}/auth/login", data=payload, headers={"Content-Type":"application/json"})
    # TODO: complete authenticated workout pagination after secure credential flow is approved.
    # Keep network call disabled until user explicitly provides credentials.
    rows = []
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w") as f:
        json.dump(rows, f, indent=2)
    print(json.dumps({"source":"peloton","rows":len(rows),"out":args.out,"status":"adapter scaffold ready"}))

if __name__ == "__main__":
    raise SystemExit(main())
