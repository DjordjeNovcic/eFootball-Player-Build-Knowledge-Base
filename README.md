# eFootball Player Build Knowledge Base

Two parts:

- **[`KNOWLEDGE-BASE.md`](./KNOWLEDGE-BASE.md)** — the actual build doctrine: stat
  thresholds and diminishing returns, player-model physics, role-based priorities,
  skill/booster synergy, and anti-patterns to avoid. The goal is never the highest
  overall rating — it's the strongest player for the exact role he'll be used in.
- **[`USER-SQUAD.md`](./USER-SQUAD.md)** — the user-specific registry: owned eFHUB IDs,
  known player mappings, manager inventory, tactical context and dated build snapshots.
- **The Build Lab** (`index.html`) — a dependency-free web UI with tabs:
  - **My Squad** — every owned card from `USER-SQUAD.md`, with eFHUB stats, styles,
    boosters, level cap and role notes. **+ Add player** imports a card from its eFHUB
    page via a "Copy to Build Lab" bookmarklet (eFHUB pages can't be fetched cross-site);
    ✕ removes a card (restorable). Both are stored in the browser.
  - **Recommended** — a build for every card, generated from the knowledge base
    (`recommend.js`): role from position + styles → §7 priorities and §3 thresholds →
    player-model and native-skill adjustments → every point spent → slot-2 booster last →
    5 additional skills → verdict, in the §15 format. Never optimised for OVR.
  - **My Builds** — your builds next to the recommended ones (status, OVR delta); start
    from a recommendation and tweak it in the Trainer.
  - **Trainer** — spend progression points per category (level 0–20, tiered cost from
    KNOWLEDGE-BASE §12), pick the slot-2 booster, manager and up to 5 additional skills,
    and see final stats, KB thresholds and the per-position OVR. The stat pipeline matches
    eFHUB: training (99 cap) → manager team-playstyle proficiency multiplier → manager
    +1/+1 → boosters.
    Saved dated snapshots from `USER-SQUAD.md` load with one click. Position proficiency
    (None / Intermediate / High) starts from the card and can be edited for positions
    trained in-game; the Lineup picker offers players by it.
  - **Lineup** — pick a formation, manager and team playstyle, place players on the
    pitch and bench (drag & drop with mouse or touch), move position markers — the role
    follows the pitch zone or can be set by hand (e.g. DMF vs CMF on the same spot) —
    and plan substitutions. Shows each player's OVR at his slot (using his
    saved Trainer build), Link-up status, and KB warnings (out of position, style not
    compatible with the slot, two Destroyer CBs, same player twice).
  - **Skills**, **Managers**, **Playing Styles** — the knowledge base as searchable
    views, cross-linked to which of my cards have each skill/style/Link-up role.
  - **Sandbox** — the original free-form stat-slider card builder (`app.js`).

**Friend squads:** the *Squad* picker above the tabs switches between my squad and any
number of friends' squads. Each has its own cards, builds, lineups, position edits,
managers (picked from all eFHUB manager cards) and playstyle; my USER-SQUAD notes only
apply to my squad. Add a friend's cards with the bookmarklet (several pasted at once is
fine), or generate them into the repo with
`python3 tools/fetch_players.py --friend "Name" <eFHUB IDs…>` (`data/friends.js`).

**Cloud sync (optional):** with an `apiKey` in `firebase-config.js`, *Sign in with Google*
syncs every squad through Firestore (project `efootballbuild-4a791`, rules in
`firestore.rules`). Each squad is one document visible only to its members; the owner
of a friend squad can copy an **Invite link** so the friend signs in and edits it too.
The browser copy stays as an offline cache; the first sign-in merges it into the cloud.

No backend, no build step — plain HTML/CSS/JS, everything persists to the browser's
`localStorage`. Not affiliated with KONAMI; this is just a fan-made companion tool.

## Run it locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Refresh card data

`data/players.js` is generated from the public eFHUB card pages of every ID in
`USER-SQUAD.md`. After adding IDs there, re-run:

```bash
python3 tools/fetch_players.py
python3 tools/fetch_players.py --add <eFHUB ID> [...]     # add cards to USER-SQUAD, then sync
python3 tools/fetch_players.py --remove <eFHUB ID> [...]  # remove cards from USER-SQUAD, then sync
```

`data/knowledge.js` is a hand-maintained extract of `KNOWLEDGE-BASE.md` / `USER-SQUAD.md`
for the UI — update it when those documents change.

## Deploy

Serve `index.html` from any static host. For GitHub Pages: Settings → Pages →
Deploy from a branch → `main` / `/ (root)`.


## Knowledge layout

- Put **general eFootball mechanics** in `KNOWLEDGE-BASE.md`.
- Put **Djolo-Djolo's cards, builds, managers and squad context** in `USER-SQUAD.md`.
- `CLAUDE.md` instructs an AI assistant to read both and to prefer current screenshots over
  stale snapshots or same-name card substitutions.
