#!/usr/bin/env python3
"""Pull the user's owned cards from efhub.com into data/players.js.

Reads every eFHUB ID listed in USER-SQUAD.md, fetches the public card page, and
extracts the card's max-level (untrained) stats, native skills, player model,
fixed booster (slot 1) and level cap. Also writes the slot-2 booster pool and
skill display names. Re-run whenever USER-SQUAD.md gains new IDs:

    python3 tools/fetch_players.py
    python3 tools/fetch_players.py --add 88040387118554 [more IDs]   # add to USER-SQUAD, then sync
    python3 tools/fetch_players.py --remove 88040387118554            # drop from USER-SQUAD, then sync
"""
import argparse
import json
import pathlib
import re
import sys
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
UA = {"User-Agent": "Mozilla/5.0 (player-build-base personal squad sync)"}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read().decode("utf8")


def rsc_payload(html):
    """Concatenate the Next.js flight chunks embedded as JS string literals."""
    parts = re.findall(r'self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)', html)
    return "".join(json.loads(p) for p in parts)


def obj_at(s, key):
    i = s.find(key)
    if i < 0:
        return None
    start = min(j for j in (key.find("{"), key.find("[")) if j >= 0)
    return json.JSONDecoder().raw_decode(s, i + start)[0]


def owned_ids():
    text = (ROOT / "USER-SQUAD.md").read_text(encoding="utf8")
    seen = []
    for m in re.finditer(r"`(\d{13,16})`", text):
        if m.group(1) not in seen:
            seen.append(m.group(1))
    return seen


ADDED_TABLE_HEADER = "| Player | Exact eFHUB ID | Note |"


def add_ids(new_ids):
    """Append cards to USER-SQUAD's 'Additional confirmed cards' table (name from eFHUB)."""
    path = ROOT / "USER-SQUAD.md"
    lines = path.read_text(encoding="utf8").split("\n")
    known = set(owned_ids())
    start = lines.index(ADDED_TABLE_HEADER)
    end = start + 2
    while end < len(lines) and lines[end].startswith("|"):
        end += 1
    rows = []
    for pid in new_ids:
        if pid in known:
            print(f"{pid} is already in USER-SQUAD.md — skipped")
            continue
        p = obj_at(rsc_payload(get(f"https://efhub.com/players/{pid}")), f'"player":{{"id":"{pid}"')
        rows.append(f"| {p['name']} | `{pid}` | Added via tools/fetch_players.py --add ({time.strftime('%d %b %Y')}). |")
        print(f"added {pid} {p['name']} ({p['position']} {p.get('overallRating')})")
    lines[end:end] = rows
    path.write_text("\n".join(lines), encoding="utf8")


def remove_ids(ids):
    """Delete every USER-SQUAD table row that carries one of these IDs."""
    path = ROOT / "USER-SQUAD.md"
    lines = path.read_text(encoding="utf8").split("\n")
    keep = []
    for line in lines:
        if line.startswith("|") and any(f"`{pid}`" in line for pid in ids):
            print(f"removed: {line}")
            continue
        keep.append(line)
    path.write_text("\n".join(keep), encoding="utf8")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--add", nargs="+", metavar="ID", help="eFHUB IDs to add to USER-SQUAD.md first")
    ap.add_argument("--remove", nargs="+", metavar="ID", help="eFHUB IDs to remove from USER-SQUAD.md first")
    args = ap.parse_args()
    if args.add:
        add_ids([re.sub(r"\D", "", x) for x in args.add])
    if args.remove:
        remove_ids([re.sub(r"\D", "", x) for x in args.remove])

    boosts = json.loads(get("https://efhub.com/data/boosts.json"))
    left = {b["id"]: b for b in boosts["left"] + boosts["right"]}
    strip = lambda b: {"id": b["id"], "name": b["name"],
                       "stats": {k: v for k, v in b["stats"].items() if v}}

    ids = owned_ids()
    players, names, failed = [], {}, []
    for n, pid in enumerate(ids, 1):
        try:
            s = rsc_payload(get(f"https://efhub.com/players/{pid}"))
            p = obj_at(s, f'"player":{{"id":"{pid}"')
            if not names:
                names = obj_at(s, '"messages":{')
            skills = obj_at(s, '"playerSkills":[') or []
            add_pos = obj_at(s, '"additionalPositions":[') or []
            stats = obj_at(s, '"baseStats":{')
            b1 = left.get(p.get("boostId"))
            b2 = left.get(p.get("boostId2") or 0)
            undef = lambda v: None if v == "$undefined" else v
            players.append({
                "id": pid, "name": p["name"], "team": p.get("team"),
                "position": p["position"], "additionalPositions": add_pos,
                "playingStyle": undef(p.get("playingStyle")),
                "playingStyleDefensive": undef(p.get("playingStyleDefensive")),
                "overall": p.get("overallRating"), "age": p.get("age"),
                "height": p.get("height"), "weight": p.get("weight"),
                "foot": p.get("preferredFoot"),
                "weakFootUsage": p.get("weakFootUsage"),
                "weakFootAccuracy": p.get("weakFootAccuracy"),
                "form": p.get("form"), "injuryResistance": p.get("injuryResistance"),
                "skills": skills, "comSkills": p.get("comSkills") or [],
                "stats": stats, "model": p.get("playerModel"),
                "image": p.get("imageUrl"), "levelCap": p.get("levelCap"),
                "booster1": strip(b1) if b1 else None,
                # Some cards ship with slot 2 pre-assigned; otherwise slot 2 is free to pick.
                "booster2Fixed": strip(b2) if b2 else None,
            })
            print(f"[{n}/{len(ids)}] {pid} {p['name']}")
        except Exception as e:  # keep going; report at the end
            failed.append(pid)
            print(f"[{n}/{len(ids)}] {pid} FAILED: {e}", file=sys.stderr)
        time.sleep(1.0)

    used = {k for p in players for k in p["skills"] + p["comSkills"] + list(p["stats"])}
    out = {
        "fetched": time.strftime("%Y-%m-%d"),
        "players": players,
        "boosterPool": [strip(b) for b in boosts["right"]],
        "labels": {k: v for k, v in (names or {}).items() if k in used and isinstance(v, str)},
    }
    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data" / "players.js").write_text(
        "// Generated by tools/fetch_players.py from efhub.com — do not edit by hand.\n"
        "window.SQUAD_DATA = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf8")
    print(f"\n{len(players)} players written, {len(failed)} failed: {failed}")


if __name__ == "__main__":
    main()
