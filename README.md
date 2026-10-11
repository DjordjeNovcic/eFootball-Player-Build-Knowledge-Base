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
    boosters, level cap and role notes, as card tiles. **A tile opens into the card's
    Recommended by AI build** (`recommend.js`): role from position + styles → §7
    priorities and §3 thresholds → player-model and native-skill adjustments → every point
    spent → slot-2 booster last → 5 additional skills → verdict, in the §15 format, never
    optimised for OVR, rated with your manager and playstyle; plus the **spending order**
    (the build at every 5th level while he trains up) and Open in Trainer / Use as my build.
    Filter by position group, playing style, or **Starting XI** / **Bench** of the active
    lineup. The old `#recommended` link opens this tab. Originally:
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
  - **Public Cards** — every Epic, Big Time and Show Time card in eFHUB's sitemap (other
    series are skipped) with its Recommended by AI build, rated without a manager
    (`data/public/cards.json` + `builds.json`, refreshed weekly by a GitHub Action). Search,
    position / "New this week" filters, sort by AI or card rating or **Best per position**
    (the top six at every position); **+ Compare** on up to three cards opens them side by
    side (AI rating, role, build, booster, every stat with the best highlighted, skills); a
    **New this week** box at the top lists the cards that appeared on eFHUB in the last 14
    days, best first and best per position; a card opens into the §15
    sections plus **With your manager** (the card re-run live with your manager and
    playstyle); **Add to my squad** copies it into your squad and opens the Trainer. Kept
    apart from every profile's squad — nothing here touches your cards until you add one.
  - Every card list (My Squad, CoinPlayTV Builds, Public Cards, Recommended by AI, My Builds)
    has a **playing-style filter** next to the position chips — any attacking or defensive
    style (§18), matched on either of a card's two style slots.
  - **My Builds** — your builds next to the recommended ones (status, OVR delta); start
    from a recommendation and tweak it in the Trainer.
  - **Any card gets a build.** Add one (bookmarklet, or *Add to my squad* in Public Cards)
    and it opens in the Trainer with its
    Recommended by AI build; skills you mark as yours (★) shape that build like native ones
    (Heading + Aerial Superiority → the aerial package, Pinpoint Crossing → Lofted Pass 90…).
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
    **Best XI** fills the eleven with the strongest assignment of the squad to the
    formation's slots (rating at each slot from the builds with the chosen manager and
    playstyle; no one without proficiency, intermediate proficiency and an inactive style
    count against a player, one card per player, never two Destroyer CBs) — displaced
    starters go to the bench. **Best bench** fills the bench with the best cover for every
    position the XI uses (a keeper first), then the strongest cards left.
    The **match card** beside the pitch holds the individual **instructions** (Counter
    Target, Tight Marking, Defensive, Anchoring — two per group, as in the game), the
    **sub-tactic** (the saved second playstyle and shape you switch to mid-match, with
    when to switch and who comes on; *Suggest* fills it from the manager's other playstyles
    in §23 order and the bench players whose styles fit) and the substitutions; *Copy as
    text* includes them. The sub-tactic is its own view of the pitch — **Main | Sub-tactic**
    next to Attack | Defence — with the same eleven laid onto its shape (nearest spot, like
    the defence shape); drag two starters to swap where they stand or Edit positions, and
    the ratings and warnings follow the sub-tactic's playstyle. The owner's plan lineup carries the written **Playbook** (build-up,
    five attack patterns, finishing, defending, game management, form, plan B, don'ts,
    alternatives — `GAME_PLAN` in `data/knowledge.js`, KNOWLEDGE-BASE §24) as a fold below
    the pitch; the old `#plan` link opens it.
    **Manager fit** compares the XI's average rating and Link-ups across your managers,
    and lists the eFHUB managers you don't own that this XI would rate highest at the
    lineup's playstyle (Link-ups that would switch on first);
    **Position training** lists who plays (or comes on) where his proficiency isn't
    high; the **Match helper** takes the opponent's playstyle and suggests what to switch
    to and which instructions to give whom (KNOWLEDGE-BASE §23).
  - **Skills**, **Managers**, **Playing Styles** — the knowledge base as searchable
    views, cross-linked to which of my cards have each skill/style/Link-up role.

**Accounts & cloud sync:** *Sign in* (Google, or email + password with sign-up and
password reset) gives every person their own squad — cards, managers, builds, lineups —
while the knowledge (skills, styles, boosters, recommendations, trainer) is shared.
The repo squad (`data/players.js` + `USER-SQUAD.md` notes) is shown only to the owner
(`OWNER_UID` in `firebase-config.js`). Signed-out visitors can browse everything (Public
Cards, CoinPlayTV builds, Skills, Managers, Playing Styles); My Squad, adding a card, the
Trainer, Lineup and My Builds ask them to sign in or register first (the dialog opens from
the button in each of those places).
Each account's squad syncs through Firestore (project `efootballbuild-4a791`, rules in
`firestore.rules`). Each squad is one document visible only to its owner.
The browser copy stays as an offline cache; the first sign-in merges it into the cloud.

No backend, no build step — plain HTML/CSS/JS, everything persists to the browser's
`localStorage`. Not affiliated with KONAMI; this is just a fan-made companion tool.

## Security notes

- `firebase-config.js` is public by design (every Firebase web app ships it); what anyone
  can read or write is decided by `firestore.rules`: a squad is readable and writable only
  by its members, the owner alone manages members and the invite code, an invite-link
  holder can add only themselves, every write is shape- and size-checked and stamped with
  the writer's uid; CoinPlayTV builds are public to read and writable only by the owner's
  uid. After changing the rules deploy them: `firebase deploy --only firestore:rules`.
- Sign-in and password reset never reveal whether an address has an account; sign-up asks
  for 8+ characters and sends a verification email (Firebase's own rate limits apply;
  enable *Email enumeration protection* and a password policy in the Firebase console too).
- `index.html` carries a Content Security Policy: scripts only from this site and Firebase's
  CDN, no inline handlers, connections only to Firebase, eFHUB and the manager photos. Every
  user-written string is escaped before it reaches the page; the CSP is the second line.
- Signing out clears this browser's copy of the squad.

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

## Public card database — the weekly refresh

Once a week, from anywhere:

```bash
tools/weekly.sh            # new cards → builds → managers → the week's new cards → commit + push
tools/weekly.sh --no-push  # same, but leave the commit for you to push
```

It runs, in order: `tools/fetch_public.py` (every Epic, Big Time and Show Time card listed in
efhub.com's sitemap into `data/public/cards.json` — other series are skipped, new cards only, one page every 5 s as its robots.txt asks, so a
weekly run is a few minutes and only the very first crawl is ~85 min; `--all` re-fetches
everything, `--ids ID…` adds cards the sitemap doesn't list), `tools/fetch_players.py
--managers`, `tools/build_public.js` (the Recommended by AI build for each public card
without a manager → `data/public/builds.json`) and `tools/new_cards.js` (the cards that
appeared in the last 7 days, ranked by AI build rating with their builds, plus the best new
card per position — `node tools/new_cards.js 14` for two weeks, `--all` for the top 40 of
the whole database). Then it commits `data/public` and `data/managers.js` and pushes;
GitHub Pages redeploys from `main`. The owner's squad files are never touched.
`.github/workflows/public-cards.yml` does the same on GitHub every Monday if you'd rather
not run it by hand (needs Settings → Actions → Workflow permissions: read and write).

## Checks on every push

`.github/workflows/ci.yml` runs on every push and pull request: every script parses, and
`tools/check_builds.js` confirms that each Recommended by AI build spends its card's exact
point budget.

## Check the builds

`tools/check_builds.js` runs `recommend.js` headlessly (Node, no browser) the way the Build
Lab wires it and prints every card's role, build, slot-2 booster, rating and the §14 flags
(trained points past the useful range, missed core targets); it fails if a build doesn't
spend the card's exact point budget (§12). Run it after changing build doctrine,
`recommend.js` or `data/`:

```bash
node tools/check_builds.js                        # owner context: D. Deschamps, Long Ball Counter
node tools/check_builds.js "Xabi Alonso" "Quick Counter"
node tools/check_builds.js --json > /tmp/builds.json
```

## Deploy

Serve `index.html` from any static host. For GitHub Pages: Settings → Pages →
Deploy from a branch → `main` / `/ (root)`.


## Knowledge layout

- Put **general eFootball mechanics** in `KNOWLEDGE-BASE.md`.
- Put **Djolo-Djolo's cards, builds, managers and squad context** in `USER-SQUAD.md`.
- `CLAUDE.md` instructs an AI assistant to read both and to prefer current screenshots over
  stale snapshots or same-name card substitutions.
