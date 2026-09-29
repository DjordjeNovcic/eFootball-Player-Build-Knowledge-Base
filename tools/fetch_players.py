#!/usr/bin/env python3
"""Pull the user's owned cards from efhub.com into data/players.js.

Reads every eFHUB ID listed in USER-SQUAD.md, fetches the public card page, and
extracts the card's max-level (untrained) stats, native skills, player model,
fixed booster (slot 1) and level cap. Also writes the slot-2 booster pool and
skill display names. Re-run whenever USER-SQUAD.md gains new IDs:

    python3 tools/fetch_players.py
    python3 tools/fetch_players.py --add 88040387118554 [more IDs]   # add to USER-SQUAD, then sync
    python3 tools/fetch_players.py --remove 88040387118554            # drop from USER-SQUAD, then sync
    python3 tools/fetch_players.py --friend "Marko" 8804... 8804...   # (re)build a friend's squad

Also writes data/managers.js: every eFHUB manager (team boosters + playstyle proficiency),
enriched from amine250.github.io/efootball-managers with photos, Link-up plays, release
dates and N/A Overload values (eFHUB fills a missing Overload with the lowest other value).

    python3 tools/fetch_players.py --managers   # refresh data/managers.js only
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
    ap.add_argument("--friend", nargs="+", metavar=("NAME", "ID"), help="build a friend's squad: name followed by eFHUB IDs")
    ap.add_argument("--managers", action="store_true", help="only refresh data/managers.js")
    args = ap.parse_args()
    if args.managers:
        write_managers()
        return
    if args.add:
        add_ids([re.sub(r"\D", "", x) for x in args.add])
    if args.remove:
        remove_ids([re.sub(r"\D", "", x) for x in args.remove])

    boosts = json.loads(get("https://efhub.com/data/boosts.json"))
    left = {b["id"]: b for b in boosts["left"] + boosts["right"]}
    strip = lambda b: {"id": b["id"], "name": b["name"],
                       "stats": {k: v for k, v in b["stats"].items() if v}}

    if args.friend:
        write_friend(args.friend[0], [re.sub(r"\D", "", x) for x in args.friend[1:]], left, strip)
        write_managers()
        return

    ids = owned_ids()
    players, names, failed = fetch_cards(ids, left, strip)
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
    write_managers()
    print(f"\n{len(players)} players written, {len(failed)} failed: {failed}")


ABILITY = ["offensiveAwareness", "ballControl", "tightPossession", "dribbling", "lowPass", "loftedPass", "finishing",
           "setPieceTaking", "curl", "heading", "defensiveAwareness", "defensiveEngagement", "ballWinning", "aggression",
           "kickingPower", "speed", "acceleration", "balance", "physicalContact", "jump", "gkAwareness", "gkCatching",
           "gkClearing", "gkReflexes", "gkReach", "stamina"]
TACTIC_KEYS = ["PossessionGame", "QuickCounter", "LongBallCounter", "OutWide", "LongBall", "OverLoad"]


AM_BASE = "https://amine250.github.io/efootball-managers/"
AM_TACTICS = ["possessionGame", "quickCounter", "longBallCounter", "outWide", "longBall", "overload"]
AM_STAT = {"Attacking Awareness": "offensiveAwareness", "Tackling": "ballWinning", "Jumping": "jump"}


def am_stat(label):
    return AM_STAT.get(label) or (lambda t: t[0].lower() + t[1:])(label.title().replace(" ", ""))


def am_managers():
    """amine250's manager database (photos, Link-up plays); [] if it can't be fetched."""
    try:
        raw = json.loads(get(AM_BASE + "data/managers.json"))
    except Exception as err:  # optional enrichment — eFHUB data still works alone
        print(f"amine250 managers unavailable ({err}); writing eFHUB data only")
        return []
    out = []
    for m in raw:
        links = m.get("linkUpPlays", m.get("linkUpPlay"))
        links = [l for l in (links if isinstance(links, list) else [links]) if l]
        role = lambda r: [r["playingStyle"], "/".join(r["positions"])]
        out.append({
            "amId": m["id"], "name": m["name"],
            "boost": [am_stat(e["stat"]) for e in m.get("boosterEffects", [])],
            "prof": [m.get("teamPlaystyleProficiency", {}).get(k) for k in AM_TACTICS],
            "photo": AM_BASE + m["photo"] if m.get("photo") else None,
            "released": m.get("releaseDate"),
            "linkUps": [{"name": l["name"], "centerPiece": role(l["centerPiece"]), "keyMan": role(l["keyMan"])} for l in links],
        })
    return out


def write_managers():
    """Every eFHUB manager card, enriched with amine250's photos and Link-up plays.

    Cards are matched on their first five playstyle proficiencies (unique per card);
    eFHUB keeps the id, name and boosters, amine250 supplies photo, Link-ups, release
    date and the Overload value. Cards only amine250 has are added with an "am-" id.
    """
    raw = json.loads(get("https://efhub.com/data/managers.json"))
    out = [{"id": str(m["id"]), "name": m["name"],
            "boost": [ABILITY[i] for i in m.get("boosts", []) if 0 <= i < len(ABILITY)],
            "prof": [m.get("skills", {}).get(k) or None for k in TACTIC_KEYS]} for m in raw]
    am = am_managers()
    by_prof = {tuple(m["prof"][:5]): m for m in am}
    used = set()
    for m in out:
        a = by_prof.get(tuple(m["prof"][:5]))
        if not a:
            continue
        used.add(a["amId"])
        if sorted(a["boost"]) != sorted(m["boost"]):
            print(f"  booster differs for {m['name']}: eFHUB {m['boost']} vs amine250 {a['boost']} — keeping eFHUB")
        m["prof"][5] = a["prof"][5]
        m.update({"photo": a["photo"], "released": a["released"], "linkUps": a["linkUps"]})
    for a in am:
        if a["amId"] not in used:
            out.append({"id": f"am-{a['amId']}", "name": a["name"], "boost": a["boost"], "prof": a["prof"],
                        "photo": a["photo"], "released": a["released"], "linkUps": a["linkUps"]})
    out.sort(key=lambda m: (m.get("released") or "", m["name"]), reverse=True)
    (ROOT / "data" / "managers.js").write_text(
        "// Generated by tools/fetch_players.py from efhub.com + amine250.github.io/efootball-managers — do not edit by hand.\n"
        "window.EF_MANAGERS = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n", encoding="utf8")
    print(f"{len(out)} managers written")


def write_friend(name, ids, left, strip):
    """Add or replace one friend's squad in data/friends.js."""
    path = ROOT / "data" / "friends.js"
    friends = {}
    if path.exists():
        friends = json.loads(path.read_text(encoding="utf8").split("=", 1)[1].rstrip().rstrip(";"))
    players, names, failed = fetch_cards(ids, left, strip)
    used = {k for p in players for k in p["skills"] + p["comSkills"]}
    for p in players:
        p["labels"] = {k: v for k, v in (names or {}).items() if k in p["skills"] + p["comSkills"] and isinstance(v, str)}
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "friend"
    friends[slug] = {"name": name, "fetched": time.strftime("%Y-%m-%d"), "players": players}
    path.write_text("// Generated by tools/fetch_players.py --friend — do not edit by hand.\n"
                    "window.FRIEND_SQUADS = " + json.dumps(friends, ensure_ascii=False, indent=1) + ";\n", encoding="utf8")
    print(f"\n{name}: {len(players)} players written to data/friends.js, {len(failed)} failed: {failed}")


def fetch_cards(ids, left, strip):
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
    return players, names, failed


if __name__ == "__main__":
    main()
