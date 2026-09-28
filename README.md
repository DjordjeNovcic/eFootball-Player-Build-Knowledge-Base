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
    boosters, level cap and role notes.
  - **Trainer** — spend progression points per category (level 0–20, tiered cost from
    KNOWLEDGE-BASE §12), pick the slot-2 booster, manager and up to 5 additional skills,
    and see final stats, KB thresholds and the per-position OVR (same formula as eFHUB).
    Saved dated snapshots from `USER-SQUAD.md` load with one click.
  - **Lineup** — pick a formation, manager and team playstyle, place players on the
    pitch and bench (drag & drop with mouse or touch), move position markers — the role
    follows the pitch zone or can be set by hand (e.g. DMF vs CMF on the same spot) —
    and plan substitutions. Shows each player's OVR at his slot (using his
    saved Trainer build), Link-up status, and KB warnings (out of position, style not
    compatible with the slot, two Destroyer CBs, same player twice).
  - **Skills**, **Managers**, **Playing Styles** — the knowledge base as searchable
    views, cross-linked to which of my cards have each skill/style/Link-up role.
  - **Sandbox** — the original free-form stat-slider card builder (`app.js`).

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
