#!/usr/bin/env python3
"""Pull the public card database — every player card in efhub.com's sitemap — into
data/public/cards.json, kept apart from the owner's squad (data/players.js).

The sitemap lists ~1000 cards (the ones people look up: Epic, Legend, Big Time, current
Featured). Only cards that aren't in cards.json yet are fetched, one page every
--delay seconds (efhub.com's robots.txt asks for 5), and the file is written as it goes,
so an interrupted run keeps what it got. Only Epic, Big Time and Show Time cards are kept (eFHUB's playerType 5 / 7 / 8); a page also
lists the player's other versions with their type, so cards of other series are skipped without
being fetched. A card is "new" ("added" = the day it was
first seen) only when its eFHUB id is higher than every id known before the run — ids grow
with release, while the sitemap rotates its ~1000 entries and brings older cards in each
week; those arrive undated. The cards of the very first crawl carry no date (`--baseline`). Builds are computed separately by
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
from fetch_players import CARD_TYPES, ROOT, get, obj_at, parse_card, rsc_payload  # noqa: E402

OUT = ROOT / "data" / "public" / "cards.json"
SITEMAP = "https://efhub.com/sitemap.xml"
# Only the card series worth a build (user decision, 11 Oct 2026): Epic, Big Time, Show Time.
# Standard, Featured, Trending, Legend and Highlight cards are skipped.
KEEP = {5, 7, 8}
VERSION_RE = re.compile(r'"player":\{"id":"(\d{4,16})"[^{}]*?"playerType":(\d+)')


def page_types(s):
    """id → playerType for every card the page mentions (the player's other versions too)."""
    return {pid: int(tp) for pid, tp in VERSION_RE.findall(s)}


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
    ap.add_argument("--baseline", action="store_true", help="clear every card's 'added' date (after the first crawl) and exit")
    ap.add_argument("--force", action="store_true", help="re-fetch the --ids cards even if cards.json has them")
    args = ap.parse_args()
    if args.baseline:
        db = load()
        for p in db["players"]:
            p["added"] = None
        save(db)
        print(f"{len(db['players'])} cards marked as the baseline (no 'added' date)")
        return

    db = load()
    have = {p["id"]: p for p in db["players"]}
    # Types learnt so far (a page lists the player's other versions with their type), so
    # cards of a series we skip are never fetched.
    types = {p["id"]: p["playerType"] for p in db["players"] if p.get("playerType")}
    types.update({k: int(v) for k, v in db.get("types", {}).items()})
    for pid in [k for k, c in have.items() if types.get(k) and types[k] not in KEEP]:
        db["players"].remove(have.pop(pid))
    # The highest eFHUB id known before this run: anything above it is new on eFHUB.
    max_known = max([int(db.get("maxId") or 0)] + [int(k) for k in have])
    ids = sitemap_ids() + [re.sub(r"\D", "", x) for x in args.ids]
    forced = set(re.sub(r"\D", "", x) for x in args.ids) if args.force else set()
    todo = [pid for pid in ids if (args.all or pid not in have or pid in forced) and (pid not in types or types[pid] in KEEP)]
    if args.limit:
        todo = todo[: args.limit]
    print(f"sitemap: {len(ids)} cards · in cards.json: {len(have)} · known types: {len(types)} · to fetch: {len(todo)}")
    if not todo:
        save(db)
        return

    boosts = json.loads(get("https://efhub.com/data/boosts.json"))
    left = {b["id"]: b for b in boosts["left"] + boosts["right"]}
    strip = lambda b: {"id": b["id"], "name": b["name"], "stats": {k: v for k, v in b["stats"].items() if v}}
    today = time.strftime("%Y-%m-%d")
    failed = []
    for n, pid in enumerate(todo, 1):
        if pid in types and types[pid] not in KEEP:
            continue  # learnt from an earlier page this run
        try:
            s = rsc_payload(get(f"https://efhub.com/players/{pid}"))
            types.update(page_types(s))
            db["types"] = dict(types)
            card, names = parse_card(s, pid, left, strip)
            if card["playerType"] not in KEEP:
                print(f"[{n}/{len(todo)}] {pid} {card['name']} — {card['cardType'] or card['playerType']}, skipped")
                if pid in have:
                    db["players"].remove(have.pop(pid))
                continue
            # "added" = the day we first saw a card whose eFHUB id is higher than every id known
            # before this run — ids grow with release, and the sitemap rotates older cards in,
            # so a first sighting alone doesn't make a card new. Known cards keep their date.
            if pid in have:
                card["added"] = have[pid].get("added")
            else:
                card["added"] = today if int(pid) > max_known else None
            used = set(card["skills"]) | set(card["comSkills"])
            for k, v in names.items():
                if k in used and isinstance(v, str):
                    db["labels"][k] = v
            if pid in have:
                db["players"][db["players"].index(have[pid])] = card
            else:
                db["players"].append(card)
            have[pid] = card
            print(f"[{n}/{len(todo)}] {pid} {card['name']} ({card['position']} {card.get('overall')}, {card['cardType']})")
        except Exception as e:  # keep going; report at the end
            failed.append(pid)
            print(f"[{n}/{len(todo)}] {pid} FAILED: {e}", file=sys.stderr)
        if n % 25 == 0 or n == len(todo):
            save(db)
        if n < len(todo):
            time.sleep(args.delay)
    db["maxId"] = max([int(db.get("maxId") or 0)] + [int(p["id"]) for p in db["players"]])
    save(db)
    print(f"\n{len(db['players'])} cards in {OUT.relative_to(ROOT)}, {len(failed)} failed: {failed}")


if __name__ == "__main__":
    main()
