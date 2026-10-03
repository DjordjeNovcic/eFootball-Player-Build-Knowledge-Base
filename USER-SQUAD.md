# User Squad Registry — Djolo-Djolo

This file is the canonical **user-specific** companion to `KNOWLEDGE-BASE.md`.
It stores ownership, exact card IDs, manager inventory, current role context and dated
build snapshots. General game mechanics and skill definitions stay in `KNOWLEDGE-BASE.md`.

## Source / confidence rules

1. **Current screenshot wins.** If a new screenshot conflicts with an older build or mapping,
   update this file rather than trying to reconcile both as current.
2. **Do not substitute card versions.** Same player name with a different eFHUB ID can have
   different progression points, native skills, boosters and playstyles.
3. **Do not guess unmapped IDs.** Keep them as `Unmapped` until the user or a reliable card
   page/screenshot confirms the name.
4. **Dated builds are snapshots.** A saved build is useful historical context, but it is not
   automatically the user's current build after later screenshots/tactical changes.
5. For skill effects, stat thresholds, booster logic and progression-cost rules, use
   `KNOWLEDGE-BASE.md` as the source of truth.

---

# 1. Owned Card Pool Snapshot

The user explicitly saved the following **49 eFHUB IDs** as the owned-player pool on
7 Sep 2026. The ID list itself is authoritative for that snapshot. On 28 Sep 2026 every
ID was resolved against its public eFHUB card page (`tools/fetch_players.py`), which named
all previously unmapped IDs and corrected #13 (Gerd Müller, not Thomas Müller).

| # | eFHUB ID | Player | Mapping status |
|---:|---:|---|---|
| 1 | `89136140651034` | Zlatan Ibrahimović (AC Milan) | eFHUB card page (28 Sep 2026) |
| 2 | `88040387119642` | Zlatan Ibrahimović | Confirmed mapping |
| 3 | `88040387118554` | Samuel Eto'o | Confirmed mapping |
| 4 | `89137214427270` | Eden Hazard | Confirmed mapping |
| 5 | `88039045074410` | Ruud Gullit | Confirmed mapping |
| 6 | `88045755964130` | Claude Makélélé | Confirmed via eFHUB card page (28 Sep 2026) |
| 7 | `88044145348029` | Patrick Vieira | Confirmed via eFHUB card page (28 Sep 2026) |
| 8 | `88041460993474` | Paolo Maldini | Confirmed via eFHUB card page (28 Sep 2026) |
| 9 | `88039850289220` | Raphaël Varane | Confirmed via eFHUB card page (28 Sep 2026) |
| 10 | `89138288270047` | Marcel Desailly | Confirmed mapping |
| 11 | `88039581948640` | Lilian Thuram | Confirmed via eFHUB card page (28 Sep 2026) |
| 12 | `89135066911146` | Cristiano Ronaldo | Confirmed mapping |
| 13 | `88040655554922` | Gerd Müller | eFHUB card page (28 Sep 2026) — corrects earlier “Thomas Müller” working mapping |
| 14 | `88045755960841` | Adriano | Confirmed via eFHUB card page (28 Sep 2026) |
| 15 | `88040387121974` | Wesley Sneijder | Confirmed mapping |
| 16 | `89138288266704` | Ronaldinho | Confirmed via eFHUB card page (28 Sep 2026) |
| 17 | `88039581945312` | Andrea Pirlo | Confirmed via eFHUB card page (28 Sep 2026) |
| 18 | `89136409091415` | Lionel Messi | Confirmed via eFHUB card page (28 Sep 2026) |
| 19 | `88040387251676` | Frank Lampard | eFHUB card page (28 Sep 2026) |
| 20 | `88041460859805` | Clarence Seedorf | Confirmed via eFHUB card page (28 Sep 2026) |
| 21 | `88044145348045` | Cafu | eFHUB card page (28 Sep 2026) |
| 22 | `88040387180670` | Giovanni van Bronckhorst | eFHUB card page (28 Sep 2026) |
| 23 | `88045755964131` | Jaap Stam | Confirmed mapping |
| 24 | `88039581926569` | Alessandro Nesta (S.S. Lazio) | User-confirmed as the only Nesta card owned (3 Oct 2026) |
| 25 | `88039581945329` | Franco Baresi | eFHUB card page (28 Sep 2026) |
| 26 | `88040387126189` | Pepe | eFHUB card page (28 Sep 2026) |
| 27 | `88033139494357` | Javier Zanetti | eFHUB card page (28 Sep 2026) |
| 28 | `106765907789861` | Pedri | eFHUB card page (28 Sep 2026) |
| 29 | `106749533210935` | Vinícius Júnior | eFHUB card page (28 Sep 2026) |
| 30 | `89138556700485` | Jude Bellingham | Confirmed via eFHUB card page (28 Sep 2026) |
| 31 | `88040387117286` | Dragan Stojković | eFHUB card page (28 Sep 2026) |
| 32 | `88044145348046` | Rivaldo | eFHUB card page (28 Sep 2026) |
| 33 | `106765907771610` | Eberechi Eze | eFHUB card page (28 Sep 2026) |
| 34 | `88044145217198` | Kaká | Confirmed via eFHUB card page (28 Sep 2026) |
| 35 | `89133993205152` | Neymar | Confirmed mapping |
| 36 | `106768055197475` | Mohamed Salah | eFHUB card page (28 Sep 2026) |
| 37 | `88041460993461` | Luís Figo | eFHUB card page (28 Sep 2026) |
| 38 | `89138556575063` | Lionel Messi | Confirmed via eFHUB card page (28 Sep 2026) |
| 39 | `88041460993546` | Jan Koller | Confirmed via eFHUB card page (28 Sep 2026) |
| 40 | `88040387251683` | Javier Saviola | eFHUB card page (28 Sep 2026) |
| 41 | `88041460860895` | Roy Makaay | eFHUB card page (28 Sep 2026) |
| 42 | `88040387120260` | Ferenc Puskás | Confirmed via eFHUB card page (28 Sep 2026) |
| 43 | `106773692395554` | Ousmane Dembélé | eFHUB card page (28 Sep 2026) |
| 44 | `88039581945358` | Alessandro Del Piero | Confirmed via eFHUB card page (28 Sep 2026) |
| 45 | `88045755964138` | Andriy Shevchenko | Confirmed via eFHUB card page (28 Sep 2026) |
| 46 | `88040387251721` | Adriano | eFHUB card page (28 Sep 2026) |
| 47 | `88045755861057` | Luis Suárez | eFHUB card page (28 Sep 2026) |
| 48 | `88045218959416` | Wayne Rooney | eFHUB card page (28 Sep 2026) |
| 49 | `88044682118054` | Sergio Agüero | eFHUB card page (28 Sep 2026) |

## Additional confirmed cards outside the 49-ID snapshot

These exact cards were also explicitly supplied/confirmed in other Build Lab conversations.
They may represent cards added later, older variants, or cards that were not part of the
7 Sep snapshot.

| Player | Exact eFHUB ID | Note |
|---|---:|---|
| Gianluigi Buffon | `88040387118039` | Explicitly confirmed and used as the squad GK. |
| Jurriën Timber | `106769665885243` | Explicit user-confirmed mapping. |
| Luka Modrić | `106788187833650` | Explicit user-confirmed mapping. |
| Jude Bellingham | `56166629640005` | Older exact card URL previously supplied; do not confuse with `89138556700485`. |

---

# 2. Core Role / Playstyle Context

Known role context used repeatedly in Build Lab discussions:

| Player | Typical user role / confirmed playstyle context |
|---|---|
| Ibrahimović | CF — Fox in the Box; used as a central striker/target finisher. |
| Eto'o | CF — Goal Poacher. |
| Hazard | AMF/SS — Hole Player. |
| Gullit | AMF/SS/CMF use depending on shape; Hole Player card context. |
| Sneijder | AMF — Creative Playmaker card context. |
| Seedorf | CMF/DMF — Box-to-Box. |
| Vieira | DMF — Anchor Man; may drop into CB in defensive structure/sub-tactic. |
| Makélélé | CMF/DMF defensive role; often used to reinforce DMF in the defensive phase. |
| Varane | CB — Build Up. |
| Desailly | CB — Destroyer. |
| Maldini | LB/defensive line — Defensive Full-back. |
| Thuram | RB/defensive line — Defensive Full-back. |
| Stam | CB — Destroyer; rotation/bench until desired additional skills are set. |
| Puskás | SS/CF — Deep-Lying Forward; left-footed; Blitz Curler/Low Screamer card context. |
| Pirlo | CMF/DMF — Orchestrator. |
| Del Piero | Goal Poacher card context. |
| Buffon | GK; exact current progression/additional skills require a current screenshot. |

---

# 3. Current Manager / Tactical Context

Recent saved context (Sep 2026):

- Primary manager in the latest discussions: **D. Deschamps**.
- Primary style in the latest discussions: **Long Ball Counter**; Possession has also been
  considered/used as a secondary style.
- Deschamps team booster: **Speed +1, Ball Control +1**.
- Link-up/manager proficiency data for all seven owned managers remains in section 22 of
  `KNOWLEDGE-BASE.md` and should be treated as canonical.
- Fluid Formation and sub-tactics have been tested. Do not assume an older static XI is the
  current one if a new formation screenshot is supplied.

## Match plan — agreed 3 Oct 2026

A recommendation the user accepted, not a screenshot of the in-game setup. Builds are the
Build Lab "Recommended by AI" builds for these exact cards at Deschamps / Long Ball Counter.
Fluid Formation and sub-tactic advice is based on community guides, not measured, so
re-check it against results.

- **Manager / style:** D. Deschamps, **Long Ball Counter** (89).
- **Fluid Formation ON:** attack **4-2-2-2**, defence **4-4-2** (the two AMFs drop to
  LMF/RMF). Don't send both full-backs high in the attacking shape.
- **Sub-tactic:** **Possession Game** (Deschamps 89) — switch to it against Long Ball
  Counter or deep-block opponents (Possession beats LBC; LBC beats Quick Counter).
- **Link-up active:** Breakthrough Pass A — Ronaldinho (Creative Playmaker, AMF) →
  Eto'o (Goal Poacher, CF).

| Pos | Player | eFHUB ID | Build (Sh-Pa-Dr-Dx-LB-Ae-De[-GK1-GK2-GK3]) | Slot-2 booster |
|---|---|---:|---|---|
| GK | Buffon | `88040387118039` | 0-0-0-0-0-1-0-8-11-12 | Saving +1 |
| LB | Maldini | `88041460993474` | 0-0-0-14-8-6-8 | Agility +1 |
| CB | Varane | `88039850289220` | 0-0-0-12-7-8-10 | Defending +1 |
| CB | Desailly | `89138288270047` | 0-1-0-8-5-9-10 | Aerial Block +1 |
| RB | Thuram | `88039581948640` | 0-2-0-9-9-8-12 | Aerial Block +1 |
| DMF | Vieira | `88044145348029` | 0-0-0-12-8-4-12 | Agility +1 |
| DMF | Seedorf | `88041460859805` | 0-0-8-9-12-2-9 | Fantasista +1 |
| AMF | Ronaldinho | `89138288266704` | 6-6-6-10-11-1-0 | Breakthrough +1 |
| AMF | Hazard | `89137214427270` | 8-4-6-9-11-4-0 | Striker's Instinct +1 |
| CF | Eto'o | `88040387118554` | 8-5-9-8-9-2-0 | Fantasista +1 |
| CF | Ibrahimović (Willpower card) | `89136140651034` | 5-0-8-10-8-10-0 | Agility +1 |

**Individual instructions:** Counter Target — Eto'o; Defensive — Vieira; Tight Marking —
Desailly on the opponent's most dangerous striker (per match).

**Bench (12):** Stam, Baresi, Cafu, Zanetti, Makélélé, Pirlo, Bellingham
(`89138556700485`), Messi SS (`89138556575063`), Kaká (native Super-sub), Gullit, Neymar,
Shevchenko. No second goalkeeper is owned yet.

**Substitution plan:** ~60' Kaká for a tired Ronaldinho/Hazard; chasing — Messi SS for
Ibrahimović (Deep-Lying Forward + Goal Poacher pairing, KNOWLEDGE-BASE §18), later
Shevchenko for Eto'o; protecting a lead — Makélélé for Seedorf (Defensive), Stam for a
tired CB.

**Alternative to test:** Capello, Long Ball Counter, 4-2-1-3 with Pirlo + Vieira at DMF —
Over-the-Top Pass A link-up Pirlo (Orchestrator, DMF) → Eto'o (Goal Poacher, CF).

---

# 4. Dated Build Snapshots

These are the most useful saved build states from prior Build Lab work. They are **dated
snapshots**, not permanent locks. A newer screenshot always overrides them.

## Zlatan Ibrahimović — 24 Sep 2026

- Role: **CF — Fox in the Box**
- Progression snapshot: `5 - 0 - 6 - 11 - 9 - 8 - 0`
- Screenshot-confirmed special skills in that discussion: **Bullet Header**,
  **Phenomenal Finishing**.
- `Willpower` had appeared in older discussion/context but was **not visible/confirmed on the
  24 Sep screenshot**, so do not assume it on this exact current card without seeing it.
- Saved additional-skill direction at that point: Double Touch, One-touch Pass,
  Outside Curler, Through Passing, Heel Trick.

## Samuel Eto'o — 24 Sep 2026

- Role: **CF — Goal Poacher**
- Progression snapshot: `8 - 0 - 8 - 10 - 8 - 6 - 0`
- Natural/special-skill context from that discussion: **Phenomenal Finishing + Low Screamer**.
- Through Passing was preferred over Cut Behind & Turn for the remaining utility slot in the
  discussed setup.

## Clarence Seedorf — current saved Build Lab context

- Role: **Box-to-Box CMF/DMF**
- Saved progression: `4 - 5 - 8 - 10 - 8 - 4 - 8` (68/68)
- Approximate in-squad target/result context previously saved: Ball Control ~92,
  Dribbling ~91, Tight Possession 90+, Defensive Awareness 86+, Tackling 86+,
  Physical Contact 80+, Kicking Power 90+, Finishing 83+, Low Pass 89+,
  Balance 88+, Stamina 90+.
- One-touch Pass and Through Passing were already valued; Sole Control is only justified
  when the turning/ball-roll use case matters, not as an automatic addition.

## Hazard — saved target profile

- Role: **AMF/SS — Hole Player**
- Ball Carrying booster context was used in prior analysis.
- Saved target profile included roughly: Physical Contact 80+, Acceleration 96,
  Attacking Awareness 93, Balance 87.
- Recalculate exact progression whenever a current card screenshot is supplied.

---

# 5. Additional-Skill Preference Rules Specific to This User

These preferences came from repeated Build Lab discussions and should be applied alongside
section 9 and section 19 of `KNOWLEDGE-BASE.md`:

- **Sole Control is not universal.** Prioritize it when the player benefits from the
  Double Touch + Flip Flap + Sole Control ball-roll package or has a demonstrated tight-turn
  use case. Do not add it by default to every CMF/CB/GK.
- Do not automatically add **Acrobatic Finishing**. Prefer it only when the player's role and
  finishing profile actually benefit from the added animations.
- **Aerial Superiority** is role-dependent; do not give it to a CMF just because the player
  has decent Jump/Physical Contact.
- For tall/physical forwards, balance Heading/Jump/Physical Contact against Finishing rather
  than blindly maximizing Finishing.
- For creators with strong passing skills (Through Passing, Phenomenal Pass, Visionary Pass,
  One-touch Pass), do not overspend on raw Passing just to chase green numbers.

---

# 6. Owned Managers

The user confirmed these seven manager cards from screenshots on 24 Sep 2026:

- D. Deschamps
- R. Martínez
- F. Beckenbauer
- Jürgen Klopp
- Xabi Alonso
- Fabio Capello
- Frank Lampard

Do **not** duplicate their full booster/proficiency/link-up matrix here. The canonical matrix
is section 22 of `KNOWLEDGE-BASE.md` so there is only one place to update it.

---

# 7. Maintenance Rule

Whenever the user sends a new player/manager screenshot and says the information should be
remembered/updated:

1. Update `USER-SQUAD.md` for ownership, exact card identity, current build, role or squad use.
2. Update `KNOWLEDGE-BASE.md` only when the screenshot changes **general game knowledge**
   (skill mechanics, official descriptions, progression rules, playstyle behavior, booster logic,
   stat meaning, etc.).
3. Preserve the screenshot-derived wording/evidence separately from empirical/community tests.
4. Never silently replace an exact card with a different release of the same player.
