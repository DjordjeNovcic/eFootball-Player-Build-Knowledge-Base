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
  - **CoinPlayTV Builds** — builds the owner publishes for any card (Trainer → *Publish as
    CoinPlayTV build*, with an optional note). They're public — anyone can read them, even
    signed out — while *Save build · private* keeps your own copy just for you (My Builds marks
    which ones are also public). Signed-in users can use one as their own build, or add the
    card to their squad together with the build. Each published
    build carries its own card snapshot, so viewers don't need the card first. Stored in
    Firestore `creatorBuilds/{playerId}`; anyone can read, only the owner can write (`firestore.rules`).
  - **Recommended by AI** — a build for every card, generated from the knowledge base
    (`recommend.js`): role from position + styles → §7 priorities and §3 thresholds →
    player-model and native-skill adjustments → every point spent → slot-2 booster last →
    5 additional skills → verdict, in the §15 format. Never optimised for OVR.
  - **My Builds** — your builds next to the recommended ones (status, OVR delta); start
    from a recommendation and tweak it in the Trainer.
  - **Additional skills live on the player** (up to 5, as in the game): your picks (★ —
    from USER-SQUAD or edited in the Trainer) first, the rest filled from the knowledge
    base; untouched lists follow rule improvements, edited ones stay as chosen. Shown on
    each My Squad card.
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
    compatible with the slot, two Destroyer CBs, same player twice). **Fluid
    Formation**: give the lineup its own defence formation — each player drops into the
    nearest defensive spot, an Attack / Defence switch shows both shapes with their
    ratings, and dragging one starter onto another in Defence swaps only where they
    defend; warns when a style goes inactive in the defence shape. Markers and bench
    show card images and ratings from the saved build (★) or the AI build; tapping a
    player opens his AI build next to yours (rating at that slot, booster, key stats with
    the differences, skills), with Replace player / Open in Trainer / Use AI build.
  - **Skills**, **Managers**, **Playing Styles** — the knowledge base as searchable
    views, cross-linked to which of my cards have each skill/style/Link-up role.
  - **Sandbox** — the original free-form stat-slider card builder (`app.js`).

**Accounts & cloud sync:** *Sign in* (Google, or email + password with sign-up and
password reset) gives every person their own squad — cards, managers, builds, lineups —
while the knowledge (skills, styles, boosters, recommendations, trainer) is shared.
Signed-out visitors see the owner's squad as a demo (`OWNER_UID` in `firebase-config.js`).
Each account's squad syncs through Firestore (project `efootballbuild-4a791`, rules in
`firestore.rules`). Each squad is one document visible only to its owner.
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

`data/managers.js` (every manager card) is written on each run too — boosters and
proficiency from eFHUB, photos, Link-up plays and release dates from
[amine250's eFootball Managers](https://amine250.github.io/efootball-managers/). Refresh only it with
`python3 tools/fetch_players.py --managers`.

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
