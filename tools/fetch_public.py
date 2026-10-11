#!/usr/bin/env python3
"""Pull the public card database — every player card in efhub.com's sitemap — into
data/public/cards.json, kept apart from the owner's squad (data/players.js).

The sitemap lists ~1000 cards (the ones people look up: Epic, Legend, Big Time, current
Featured). Only cards that aren't in cards.json yet are fetched, one page every
--delay seconds (efhub.com's robots.txt asks for 5), and the file is written as it goes,
so an interrupted run keeps what it got. Each card records the day it first appeared
("added") for the Build Lab's "new this week" view. Builds are computed separately by
`node tools/build_public.js`.

    python3 tools/fetch_public.py                 # new cards only
    python3 tools/fetch_public.py --all           # re-fetch every card (stats or caps changed)
    python3 tools/fetch_public.py --limit 50      # first 50 missing cards (smoke test)
"""
import argparse
import json
import pathlib
import re
import sys
import time

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from fetch_players import ROOT, get, obj_at, parse_card, rsc_payload  # noqa: E402

OUT = ROOT / "data" / "public" / "cards.json"
SITEMAP = "https://efhub.com/sitemap.xml"


def sitemap_ids():
    xml = get(SITEMAP)
    ids = []
    for m in re.finditer(r"<loc>https://efhub\.com/players/(\d{10,16})</loc>", xml):
        if m.group(1) not in ids:
            ids.append(m.group(1))
    return ids


def load():
    if OUT.exists():
        return json.loads(OUT.read_text(encoding="utf8"))
    return {"fetched": None, "players": [], "labels": {}}


def save(db):
    OUT.parent.mkdir(parents=True, exist_ok=True)
    db["fetched"] = time.strftime("%Y-%m-%d")
    db["players"].sort(key=lambda p: (p.get("added") or "", -(p.get("overall") or 0), p["name"]), reverse=True)
    OUT.write_text(json.dumps(db, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf8")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--all", action="store_true", help="re-fetch cards already in cards.json too")
    ap.add_argument("--limit", type=int, default=0, help="stop after this many fetched cards")
    ap.add_argument("--delay", type=float, default=5.0, help="seconds between page requests (robots.txt: 5)")
    ap.add_argument("--ids", nargs="*", default=[], help="extra eFHUB IDs to include besides the sitemap")
    args = ap.parse_args()

    db = load()
    have = {p["id"]: p for p in db["players"]}
    ids = sitemap_ids() + [re.sub(r"\D", "", x) for x in args.ids]
    todo = [pid for pid in ids if args.all or pid not in have]
    if args.limit:
        todo = todo[: args.limit]
    print(f"sitemap: {len(ids)} cards · in cards.json: {len(have)} · to fetch: {len(todo)}")
    if not todo:
        save(db)
        return

    boosts = json.loads(get("https://efhub.com/data/boosts.json"))
    left = {b["id"]: b for b in boosts["left"] + boosts["right"]}
    strip = lambda b: {"id": b["id"], "name": b["name"], "stats": {k: v for k, v in b["stats"].items() if v}}
    today = time.strftime("%Y-%m-%d")
    failed = []
    for n, pid in enumerate(todo, 1):
        try:
            card, names = parse_card(rsc_payload(get(f"https://efhub.com/players/{pid}")), pid, left, strip)
            card["added"] = have[pid]["added"] if pid in have and have[pid].get("added") else today
            used = set(card["skills"]) | set(card["comSkills"])
            for k, v in names.items():
                if k in used and isinstance(v, str):
                    db["labels"][k] = v
            if pid in have:
                db["players"][db["players"].index(have[pid])] = card
            else:
                db["players"].append(card)
            have[pid] = card
            print(f"[{n}/{len(todo)}] {pid} {card['name']} ({card['position']} {card.get('overall')})")
        except Exception as e:  # keep going; report at the end
            failed.append(pid)
            print(f"[{n}/{len(todo)}] {pid} FAILED: {e}", file=sys.stderr)
        if n % 25 == 0 or n == len(todo):
            save(db)
        if n < len(todo):
            time.sleep(args.delay)
    print(f"\n{len(db['players'])} cards in {OUT.relative_to(ROOT)}, {len(failed)} failed: {failed}")


if __name__ == "__main__":
    main()
