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

Follow section 14's workflow in order: identify role → inspect player model → inspect
natural skills → identify wasted stats → build around the thresholds in section 3 →
pick the booster last (section 11) → pick additional skills last (section 9).

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
