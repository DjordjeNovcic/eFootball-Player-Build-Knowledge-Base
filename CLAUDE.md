# Project instructions — eFootball Player Build Knowledge Base

This repo has two parts:

- `index.html` / `style.css` / `app.js` — a static player-build creator (stat sliders,
  playing style, skills, live card preview), deployed via GitHub Pages.
- `KNOWLEDGE-BASE.md` — the actual build doctrine: stat thresholds, diminishing returns,
  player-model physics, role priorities, skill/booster synergy, and anti-patterns.

## When the user asks for a player build analysis

If the user pastes a player screenshot, describes a player's stats/skills, or asks
"what build should this player have" / "analyze this player" in this project, read
`KNOWLEDGE-BASE.md` and follow it — do not eyeball stats or optimize for overall rating.

Follow section 14's workflow in order: position → Attacking Playing Style →
Defensive Playing Style (section 18) → inspect player model → inspect natural
skills → identify wasted stats → build around the thresholds in section 3 → pick
the booster last (section 11) → pick additional skills last (section 9).

A card can carry both an Attacking and a Defensive Playing Style at once (section
18) — read both before setting Target Stats, since the same raw stat (e.g. 90 OA)
is not equally valuable across playstyles even at the same position.

Every player has 2 booster slots (section 10): slot 1 is fixed to the card (read it
off the screenshot, never suggest changing it) and slot 2 is the only one to actually
recommend — pick it so it doesn't duplicate stats slot 1 already covers.

If the user names or shows the squad's currently-assigned manager, factor in section
17's Manager Booster (a flat +1/+1 on top of the player's own booster) when setting
Target Stats — it can let a raw progression target sit 1 point lower on whichever of
the manager's two boosted stats is relevant to this player's role.

Section 12 has a complete, verified points-per-category-level cost table and
category→stat mapping for all 10 categories (including GK1/2/3) — use it to give
exact category-point allocations in the Build line, not just target stats.

The Build line's 7 numbers must always sum to the player's exact full point budget —
never leave points unspent. If priority categories don't use every last point, dump
the remainder into Aerial Strength or Defending (section 12's hard rule) rather than
leaving any idle.

Respond using the exact format from section 15 of `KNOWLEDGE-BASE.md`:

```
## Role
## Build
## Booster
## Target Stats
## Additional Skills
## Final Verdict
```

Never recommend a build purely by maximizing overall rating — that contradicts the
project's core principle (section 16): the best build is the one where player model,
playstyle, skills, booster, progression, and role all work together for the specific
role the player will actually play.
