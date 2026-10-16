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
| Gareth Bale | `88045755861672` | Added via tools/fetch_players.py --add (10 Oct 2026). |
| Riccardo Calafiori | `106788993239598` | Added via tools/fetch_players.py --add (10 Oct 2026). |
| Marcelo | `88045755861084` | Added via tools/fetch_players.py --add (16 Oct 2026). |

---

# 2. Core Role / Playstyle Context

Known role context used repeatedly in Build Lab discussions:

| Player | Typical user role / confirmed playstyle context |
|---|---|
| Ibrahimović | CF — Fox in the Box; used as a central striker/target finisher. |
| Eto'o | CF — Goal Poacher. |
| Hazard | AMF/SS — Hole Player. |
| Gullit | AMF/SS/CMF use depending on shape; Hole Player card context. In the XI at CF since 11 Oct 2026 (test) — built as a CF (`buildAs`), slot 2 Striker's Instinct by user choice (16 Oct). |
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
| Marcelo | LB — Full-back Finisher / Covering Role; bought 16 Oct 2026, built as a Full-back Finisher (§18), the attacking alternative to Maldini. |

---

# 3. Current Manager / Tactical Context

Recent saved context (Sep 2026):

- Primary manager in the latest discussions: **D. Deschamps**.
- Primary style in the latest discussions: **Long Ball Counter**; Possession has also been
  considered/used as a secondary style.
- Deschamps team booster: **Speed +1, Ball Control +1**.
- Link-up/manager proficiency data for all eight owned managers remains in section 22 of
  `KNOWLEDGE-BASE.md` and should be treated as canonical.
- Fluid Formation and sub-tactics have been tested. Do not assume an older static XI is the
  current one if a new formation screenshot is supplied.

## Match plan — agreed 3 Oct 2026

A recommendation the user accepted, not a screenshot of the in-game setup. Builds are the
Build Lab "Recommended by AI" builds for these exact cards at Deschamps / Long Ball Counter.
Fluid Formation and sub-tactic advice is based on community guides, not measured, so
re-check it against results.

- **Manager / style:** D. Deschamps, **Long Ball Counter** (89).
- **Fluid Formation ON:** attack **4-2-2-2**, defence **4-4-2** — the two AMFs drop to
  LMF/RMF, and the central pair is moved back to **DMF** (Edit positions) so Vieira keeps
  Anchor Man (active only at DMF) and Seedorf Box-to-Box. Don't send both full-backs high
  in the attacking shape.
- **Sub-tactic:** **Possession Game** (Deschamps 89) — switch to it against Long Ball
  Counter or deep-block opponents (Possession beats LBC; LBC beats Quick Counter).
- **Link-up active:** Breakthrough Pass A — Sneijder (Creative Playmaker, AMF) →
  Eto'o (Goal Poacher, CF).
- **AMF sides (user decision):** Hazard left (LMF high, no RMF proficiency), Sneijder right
  (LMF/RMF high, weak foot 3/3). Ronaldinho is right-footed with a weak left (weak foot
  1/2), so he isn't used on the left and drops out of the XI.

| Pos | Player | eFHUB ID | Build (Sh-Pa-Dr-Dx-LB-Ae-De[-GK1-GK2-GK3]) | Slot-2 booster |
|---|---|---:|---|---|
| GK | Buffon | `88040387118039` | 0-0-0-0-0-1-0-8-11-12 | Saving +1 |
| LB | Maldini | `88041460993474` | 0-0-0-14-8-6-8 | Agility +1 |
| CB | Varane | `88039850289220` | 0-0-0-12-7-8-10 | Hard Worker +1 |
| CB | Desailly | `89138288270047` | 0-1-0-8-5-9-10 | Aerial Block +1 |
| RB | Thuram | `88039581948640` | 0-2-0-9-9-8-12 | Aerial Block +1 |
| DMF | Vieira | `88044145348029` | 0-0-0-12-8-4-12 | Agility +1 |
| DMF | Seedorf | `88041460859805` | 0-0-8-9-12-2-9 | Fantasista +1 |
| AMF | Sneijder | `88040387121974` | 4-4-10-11-9-2-0 | Fantasista +1 |
| AMF | Hazard | `89137214427270` | 8-4-6-9-11-4-0 | Striker's Instinct +1 |
| CF | Eto'o | `88040387118554` | 8-5-9-8-9-2-0 | Fantasista +1 |
| CF | Ibrahimović (Willpower card) | `89136140651034` | 5-0-8-10-10-8-0 | Agility +1 |

**Individual instructions:** Counter Target — Eto'o; Defensive — Vieira; Tight Marking —
Desailly on the opponent's most dangerous striker (per match).

**Bench (12):** Stam, Cafu, Zanetti, Makélélé, Pirlo, Bellingham (`89138556700485`),
Ronaldinho (`89138288266704`, cover for Sneijder on the right), Messi SS
(`89138556575063`), Kaká (native Super-sub), Gullit, Neymar, Shevchenko. Baresi left out
(user decision) — Stam (Destroyer) is the only CB cover, so a CB change pairs two
Destroyers. No second goalkeeper is owned yet.

**Substitution plan:** ~60' Kaká for a tired Sneijder/Hazard; chasing — Messi SS for
Ibrahimović (Deep-Lying Forward + Goal Poacher pairing, KNOWLEDGE-BASE §18), later
Shevchenko for Eto'o; protecting a lead — Makélélé for Seedorf (Defensive), Stam for a
tired CB.

**Alternative to test:** Capello, Long Ball Counter, 4-2-1-3 with Pirlo + Vieira at DMF —
Over-the-Top Pass A link-up Pirlo (Orchestrator, DMF) → Eto'o (Goal Poacher, CF).

## Game plan — 10 Oct 2026 (proposed, supersedes the 3 Oct XI)

A recommendation, not a screenshot of the in-game setup. Same manager, style and shape as
the 3 Oct plan (Deschamps, Long Ball Counter 89, Fluid Formation 4-2-2-2 / 4-4-2,
Possession sub-tactic); builds stay the Build Lab "Recommended by AI" builds. The Build
Lab's **Game Plan** tab shows it with live builds; the general template is
`KNOWLEDGE-BASE.md` §24.

**XI changes (two):**

- **Messi — Creative Playmaker card (`89136409091415`) for Sneijder at right AMF.**
  AMF is a high-proficiency position on that card (rating 106 vs Sneijder 105), Speed 100
  vs 89, Momentum Dribbling + Blitz Curler, left foot cutting in from the right, and he is
  still the Link-up Center Piece (Creative Playmaker, AMF) → Eto'o. **He can't play RMF**
  (user, 11 Oct 2026 — eFHUB lists RMF as intermediate, the game doesn't), so the defence
  shape is a 4-3-1-2: Makélélé alone at DMF, Hazard LMF, Seedorf RMF (high, Box-to-Box
  active), Messi stays at AMF.
- **Makélélé for Vieira at DMF.** DMF rating 106 vs 104; Speed 96, DA 96, Tackling 98,
  Stamina 99. He takes the Defensive instruction; Vieira is the first sub to protect a lead.
- Messi's Deep-Lying Forward SS card can't be on the same team sheet, so **Sneijder** takes
  his bench place (Creative Playmaker — subbing him for Messi keeps the Link-up on).

| Pos | Player | eFHUB ID |
|---|---|---:|
| GK | Buffon | `88040387118039` |
| LB / CB / CB / RB | Maldini, Varane, Desailly, Thuram | unchanged |
| DMF | Makélélé | `88045755964130` |
| DMF (defends at RMF) | Seedorf | `88041460859805` |
| AMF (L → LMF) | Hazard | `89137214427270` |
| AMF (R, defends at AMF) | Messi (Creative Playmaker card) | `89136409091415` |
| CF | Ibrahimović (Willpower card) | `89136140651034` |
| CF | Eto'o | `88040387118554` |

**Instructions:** Counter Target — Eto'o; Defensive — Makélélé; Tight Marking — Desailly.

**Build update (11 Oct 2026, passing in midfield):** the two DMFs play the first forward
pass after a regain, so their Low Pass target went up to section 3's 87 (KNOWLEDGE-BASE §25):
Seedorf 0-0-8-9-12-2-9 Fantasista +1 → **0-5-8-8-11-2-9 Agility +1** (Low Pass 82 → 87,
Lofted 80 → 85, Speed 95, Stamina 97, DA 90 / Tackling 91 unchanged); Makélélé
0-2-4-8-12-4-10 → **0-4-2-8-12-4-10** Ball Protection +1 (Low Pass 85 → 88, Lofted 82 → 84;
Ball Control 84 → 82; DA 96 / Tackling 98 / Physical Contact 90 unchanged). Everyone else
stays — see §25 for why the forwards, Hazard and Messi get no extra Passing or Physical
Contact.

**Build update (11 Oct 2026, Messi):** a Creative Playmaker no longer buys the 100+ Speed
step (KNOWLEDGE-BASE §3/§7). Messi (`89136409091415`, AMF) 5-8-6-6-13-4-0 Passing +1 →
**8-9-6-7-9-5-0 Offence Creator +1**: Speed 100 → 96, Kicking Power 95 → 91, Stamina 90 → 85
for Attacking Awareness 88 → 90, Finishing 88 → 91, Curl 90 → 92, Low Pass 93 → 94, Ball
Control 96 → 97, Balance 95 → 96; AMF rating 106 → 107. Skills unchanged (Flip Flap, Cut
Behind & Turn, Outside Curler, Weighted Pass, Chip Shot Control). No other card changed.

**Bench (12, updated 11 Oct):** Vieira, Stam, Zanetti, Pirlo, Sneijder, Bellingham
(`89138556700485`), Gullit, Dembélé (`106773692395554`), Puskás (`88040387120260`),
Bale (`88045755861672`), Kaká (`88044145217198`), Adriano (`88045755960841`).
Dembélé replaced Shevchenko on 10 Oct (user: too few useful skills). On 11 Oct Neymar
and Ronaldinho dropped out (no slot in this shape; Sneijder covers right AMF), and the
user asked for one full-back instead of three: Zanetti stays (LB and RB high), Cafu and
Calafiori make room for Kaká (Super-sub) and C. Ronaldo (Goal Poacher CF, Bullet Header —
keeps the Link-up when chasing). Bellingham is the 60' sub for Hazard (AMF 105 vs Kaká
104, high at LMF vs intermediate).
Later on 11 Oct (user: "kako ti kažeš") **Adriano (`88045755960841`) took C. Ronaldo's
bench place**: the same Goal Poacher CF cover that keeps the Link-up, but CF 107 vs 106,
Physical Contact 94 vs 87, Kicking Power 101 (fixed slot-2 Kicking Power +6), Phenomenal
Finishing + Low Screamer + Snap Strike, and a left foot in a right-footed attack; Attack
Outlet keeps him high late on. C. Ronaldo's edge was Bullet Header (Heading 93 vs 87).
AI build 8-0-9-9-8-8-0: OA 91, Finishing 92, Speed 95, Acceleration 93, Jump 94.

**Build update (11 Oct 2026, Speed — user decision): training never takes Speed past
96, and a holding midfielder stops at 92** (KNOWLEDGE-BASE §3). "What does Makélélé need
96 for" — the Lower Body levels that bought Speed 96–101 now buy the role's other stats:

| Player | Was | Now | What moved |
|---|---|---|---|
| Eto'o | 8-0-10-8-10-2-0 Fantasista +1 | **9-1-12-8-5-4-0 Physicality +1** | Speed 100 → 96; Ball Control 94 → 95, Dribbling 94 → 95, Finishing 93, Physical Contact 80 → 83, Jump 79 → 82 |
| Makélélé | 0-4-2-8-12-4-10 Ball Protection +1 | **0-6-4-10-8-4-10 Hard Worker +1** | Speed 96 → 92; Low Pass 88 → 90, Lofted 84 → 87, Acceleration 93 → 96, Balance 93 → 94, Tackling 98 / DA 96 unchanged |
| Messi (CP) | 8-9-6-7-9-5-0 Offence Creator +1 | **8-11-6-7-7-4-1 Shooting +1** | Speed 96 → 94; Low Pass 94 → 95, Lofted 88 → 90, Finishing 91 → 92, Acceleration 97 |
| Ibrahimović | 5-0-8-10-10-8-0 Agility +1 | **5-1-6-10-11-8-0 Fantasista +1** | Speed 93, Finishing 92 → 93, Kicking Power 97 → 98; Ball Control 89 → 88 |
| Puskás (bench) | 7-3-8-9-10-4-0 | **7-3-8-9-8-7-0** | Speed 95 → 93; Heading 78 → 81, Jump 76 → 79, Physical Contact 77 → 80 |

Neymar and Dembélé (bench) lose Speed 100 the same way. Everyone else is unchanged.

**Build update (11 Oct 2026, don't fight the card — user decision): no category goes
past level 12** in a recommended build (KNOWLEDGE-BASE §13 "Fighting the card"); levels
13–20 cost 4–5 points each and mean the card isn't made for that stat. In the XI only
Maldini changes: 0-0-0-14-8-6-8 → **0-0-0-12-8-7-10 Agility +1** — Acceleration 91 → 88
(still the §3 stride threshold), the freed points give Defensive Awareness 94 → 96,
Tackling 95 → 97, Defensive Engagement 96 → 98, Physical Contact 87 → 88. Bench: Gullit
6-3-9-12-7-6-0 Ball-carrying +1 (AMF 105), Bellingham 8-2-8-12-8-0-0 (106), Rivaldo
6-3-6-12-11-0-0 (104), Zanetti 0-9-9-8-8-0-7 Defending +1.

**XI change (11 Oct 2026, later — user decision): Gullit (`88039045074410`) for
Ibrahimović at CF**, a 3–5 match test; only the player changes. Gullit takes the left CF
slot, Eto'o stays right (Messi's deliveries from the right go to the far-post target,
Eto'o runs the right channel onto the ball in behind); the two don't rotate — Eto'o roams
as the Goal Poacher, Gullit is the fixed target. Why: 190 cm, jump height 265 cm vs
Ibrahimović's 252, Bullet Header, Acceleration 95, Physical Contact 93, CF 109 vs 108,
eFHUB's CF number one. The catch: Hole Player is inactive at CF, so he makes few runs of his
own. **Ibrahimović goes to the bench** in Gullit's place and is the ~65' sub (Fox in the
Box + Willpower) — Puskás stays the Plan B option; the Fluid defence shape is unchanged.
If Gullit doesn't score more over the test, Ibrahimović returns.

**Build update (16 Oct 2026, booster = progression points — user insight):** a slot-2 +1
stands in for a category level on that stat (3 points each at levels 9–12), so every
booster is now judged on the build it frees up, not pasted on top of a finished build
(KNOWLEDGE-BASE §11, "Booster = progression points"; `node tools/booster_audit.js`). Audit
of all 50 free-slot cards: 42 keep their booster, 8 change — in the XI only Messi, on the
bench Ibrahimović and Puskás:

| Player | Was | Now | What changes (worth = training points a no-booster build would need) |
|---|---|---|---|
| Messi (CP, `89136409091415`) | 8-11-6-7-7-4-1 Shooting +1 | **9-10-6-7-7-4-1 Offence Creator +1** | Attacking Awareness 89 → 90, Curl 92 → 93, Finishing 92, Ball Control 97, Low Pass 95; Lofted Pass 90 → 89. Worth ~13 — against the no-booster build it frees Passing 11 → 10 (3 pts) for Shooting 8 → 9 |
| Ibrahimović (`89136140651034`, bench) | 5-1-6-10-11-8-0 Fantasista +1 | **5-0-8-10-10-8-0 Agility +1** | Acceleration 90 → 91, Tight Possession 84 → 87, Ball Control / Dribbling 88 → 89; Finishing 93 → 92, Kicking Power 98 → 97. Worth ~9 — frees Lower Body 11 → 10 (3 pts) for Dexterity 9 → 10 |
| Puskás (`88040387120260`, bench) | 7-3-8-9-8-7-0 Agility +1 | **7-2-8-8-10-6-0 Hard Worker +1** | Speed 93 → 94, Kicking Power 92 → 94, Stamina 83 → 85; Attacking Awareness 91 → 90, Balance 90 → 88. Worth ~8 — frees Dexterity 9 → 8, Aerial 7 → 6, Passing 3 → 2 (6 pts) for Lower Body 8 → 10 |

Everyone else in the XI and on the bench keeps booster and build. Worth of the current
booster in training points: Hazard (Striker's Instinct), Eto'o (Physicality), Kaká (Balancer)
— more than any training can buy, their Dexterity / Dribbling sit at the level-12 cap and
the booster is the only +1 left there (Hazard: Acceleration 96 → 97, Ball Control 96 → 97);
Gullit 16, Messi 13, Makélélé 9, Pirlo 9, Dembélé 9, Varane 8, Vieira 8, Buffon 8, Maldini 7, Thuram 6,
Seedorf 6, Sneijder 6, Stam 6, Zanetti 5, Desailly 4. Manager: Deschamps'
Speed +1 / Ball Control +1 is worth ~20 points across the XI (Capello 19, Beckenbauer 15, all LBC 89; Mourinho 15 — LBC 90
but Finishing / Aggression), so the manager stays.

**Build update (16 Oct 2026, eFHUB CF cross-check — first touch over passing, user
decision):** eFHUB's "Top 10 CFs" builds (3 Oct, Mourinho) were compared card by card with
ours (KNOWLEDGE-BASE §25). Direction adopted: forwards buy Tight Possession 88 / Ball Control
90 (turning away from the marker) and never Passing; explosive roles may train Acceleration
to 99; waste counts trained points only, so Agility / Off the Ball are no longer penalised for
landing on Speed 97; and a card is built for the position it plays (`buildAs` — Gullit and
Bale at CF). Builds (Deschamps, LBC):

| Player | Was | Now | What moved |
|---|---|---|---|
| Eto'o | 9-1-12-8-5-4-0 Physicality +1 | **8-0-11-11-5-2-0 Fantasista +1** | OA 92 → 95, Acceleration 97 → 99, Balance 88 → 91; Finishing 93, Ball Control 95, Dribbling 96, Tight Possession 90; Physical Contact 83 → 80 |
| Hazard | 8-4-6-9-11-4-0 Striker's Instinct +1 | **8-0-7-11-10-3-0 Off the Ball +1** | OA 92 → 94, Acceleration 97 → 99, Balance 97 → 99, Dribbling 98, Tight Possession 97; Low Pass 89 → 85, Finishing 94 → 93; AMF 107 → 106 |
| Messi (CP) | 9-10-6-7-7-4-1 Offence Creator +1 | **8-8-10-7-7-4-0 Accuracy +1** | Ball Control 97 → 100, Dribbling 97 → 101, Tight Possession 94 → 98; Low Pass 95 → 93, OA 90 → 89; 108 → 109 |
| Gullit (as CF) | 6-3-9-12-7-6-0 Ball-carrying +1 (AMF 105) | **6-0-8-12-8-8-0 Striker's Instinct +1 (CF 109)** | OA 89, Finishing 91, Acceleration 94, Speed 92, Ball Control 92, Physical Contact 95, Heading 91, Jump 93; Tight Possession 85, Low Pass 79 — eFHUB's 5-1-9-12-8-7 Striker's Instinct within a level |
| Ibrahimović (bench) | 5-0-8-10-10-8-0 Agility +1 | **5-0-9-9-10-8-0 Agility +1** | Ball Control / Dribbling 90, Tight Possession 88; OA 95 → 94, Acceleration 91 → 90 |
| Bale (bench, as CF) | 6-9-8-11-8-0-0 (RWF 107) | **8-0-10-12-8-2-0 (CF 108)** | Ball Control 96, Dribbling 99, Tight Possession 93, Finishing 91, OA 90, Acceleration 97, Physical Contact 90; Low Pass 83 → 74 |
| Adriano (bench) | 8-0-9-9-8-8-0 | **8-0-8-10-8-8-0** | OA 92, Acceleration 94; Tight Possession 87 → 85 |
| Sneijder (bench) | 4-4-10-11-9-2-0 Fantasista +1 | **4-4-11-11-8-2-0 Agility +1** | Tight Possession 98, Acceleration 93; Finishing 88 → 87 |
| Kaká (bench) | 10-0-5-12-9-1-0 Balancer +1 | **9-0-6-12-9-2-0 Balancer +1** | Ball Control 95, Dribbling 97, Tight Possession 92; Finishing 91 → 90 |
| Dembélé (bench) | 7-0-8-12-8-4-0 Offence Creator +1 | **6-0-9-12-8-3-0 Shooting +1** | Ball Control 93, Dribbling 95, Tight Possession 92; OA 91 → 90 |

Buffon, Maldini, Varane, Desailly, Thuram, Makélélé, Seedorf, Vieira, Stam, Zanetti, Pirlo,
Bellingham, Puskás and Marcelo are unchanged. Kept against eFHUB: Speed trained to 96 (they
also set 96 for Dembélé and Haaland), Finishing 90–95 (they stop at 90–91; one Eto'o card
even 84), every point spent (they park leftovers in GK categories).

**Build update (16 Oct 2026, later — Blitz Curler shooters, user question "Ronaldinho has
Blitz and Finishing 85?"):** a Blitz Curler with Long-range Curler / Long-range Shooting is
built as a shooter from range, Finishing 90 and Curl 90 (KNOWLEDGE-BASE §8). Ronaldinho
5-5-8-10-11-1-0 Passing +1 → **8-5-8-9-10-1-0 Accuracy +1** (Finishing 85 → 90, Curl 93,
Kicking Power 91; Ball Control 99, Tight Possession 98, Low Pass 93; Speed 92, Acceleration
96). Sneijder (bench) 4-4-11-11-8-2-0 Agility +1 → **6-3-10-10-9-2-0 Fantasista +1**
(Finishing 87 → 90, Curl 92, Kicking Power 97). Puskás (bench) 7-2-8-8-10-6-0 Hard Worker +1
→ **8-3-8-9-8-6-0 Ball Protection +1** (Finishing 96, OA 91, Balance 90; CF 106). Messi (CP)
on a near-tie swaps Accuracy +1 for **Physicality +1** with 8-9-9-7-7-4-0 (Finishing 91,
Ball Control 99, Tight Possession 97, Balance 97; still 109). Eze and Salah move a level.

**Build update (16 Oct 2026, later — offensive full-backs, user decision):** "they need the
pass, especially with Edged Crossing, pace and the dribble — less defending." Offensive
Wingback: Lofted Pass 92 with Edged / Pinpoint Crossing, Low Pass 87, Dribbling / Ball
Control 88, defending only to a floor (Defensive Awareness 82, Tackling 80); a Full-back
Finisher template for Marcelo (KNOWLEDGE-BASE §18). Zanetti (bench) 0-9-9-8-8-0-7
Defending +1 → **3-9-10-8-8-0-4 Passing +1** (Low Pass 91, Lofted 88, Dribbling 88, Tight
Possession 89; Defensive Awareness 86 → 82, Tackling 90 → 85; 102). Marcelo (bench) →
**5-7-7-9-9-0-6 Agility +1** (§4; 105). Not in the plans but rebuilt the same way: Cafu
2-10-10-8-5-0-6 Crossing +1 (Lofted 92, Low Pass 90, Dribbling 91), van Bronckhorst
2-10-9-9-8-0-5 Crossing +1 (Lofted 92), Calafiori 1-8-10-8-9-0-5 Crossing +1 (Lofted 92),
Timber 1-8-10-8-10-0-3 Crossing +1 (Lofted 84 — base 73, not fought). Maldini and Thuram
(Defensive Full-backs) unchanged.

**Position hints (16 Oct 2026, user request — "say where the ratings recommend him, like
Gullit at CF; don't change roles"):** the Build Lab marks a card whose build rates a point or
more higher at another position it can play ("Good as SS 107", KNOWLEDGE-BASE §14 step 1).
The build stays his; only `buildAs` (Gullit, Bale — user decisions) builds a card for another
position. By this build: Pirlo DMF 102 → **CMF 107** (the Possession sub-tactic's CMF);
Rivaldo AMF 104 → **SS 107**; Stojković AMF 104 → SS 106; Rooney CF 103 → SS 105; Kaká AMF
104 → LWF 108; Hazard AMF 106 → LWF 110; Ronaldinho AMF 106 → LWF 108; Eze AMF 102 → LWF 105;
Vinícius LMF 104 → LWF 107; Marcelo LB 105 → LMF 108; Maldini LB 104 → CB 107; Thuram RB 105
→ CB 108. Wingers and LMF are hints only in the 4-2-2-2; the SS and CMF ones matter for the
Possession sub-tactic and the diamond. The Lineup tab shows each player's rating at the slot
he stands in (user, 16 Oct 2026 — Gullit at CF 109, not his AMF card's 105); the bench shows
the card's position, or `buildAs`.

**XI — 16 Oct 2026, later (the user's, set in the app):** Deschamps, Long Ball Counter,
4-3-1-2 with the second striker's marker set to SS; no Fluid Formation, no sub-tactic (the
user switches to Possession by hand when it gets tight). Buffon; Marcelo, Varane, Desailly,
Thuram; Vieira (Makélélé 106 recommended instead, 104), Seedorf; Messi — the Creative
Playmaker card — at AMF (107, style active; the Deep-Lying Forward SS card played there as
Basic and went off the sheet); Hazard SS (110); **Gullit SS** next to Ibrahimović CF (108):
with the SS role his Hole Player is active — runs from deep, the late arrival he lacked at
CF — at 107 against 109 as a Basic CF; the CF build stays, it rates the same 107 at SS as a
dedicated Hole Player build. Mourinho (LBC 90) was tried and dropped: both Link-ups
inactive, Aggression +1 idle, the XI rates the same. Link-up off with this front pair (no
Goal Poacher CF) — Eto'o for Ibrahimović lights Breakthrough Pass A. Bench: Eto'o, Puskás,
C. Ronaldo, Bale, Ronaldinho, Bellingham, Sneijder, Pirlo, Makélélé, Maldini, Cafu, Stam.

**Substitutions:** ~60' Bellingham for Hazard, or Sneijder for a tired Messi;
chasing — Gullit for Ibrahimović (~68'), Dembélé for Eto'o (~72', Goal Poacher CF keeps
the Link-up; Speed 100 / Acceleration 98, Acceleration Burst, Phenomenal Finishing), Possession sub-tactic with Pirlo for Makélélé against a deep block;
protecting — Vieira for Seedorf (~75'), Stam only for Desailly (Destroyer for Destroyer).

**Card reviews (web, 11 Oct 2026, eFHUB — confirmed by card ID only where stated):**
- **Gullit `88039045074410`** (confirmed) — eFHUB's CF ranking (8 Oct) puts this card first.
  Our model agrees: CF 109, the best CF rating in the squad, against Ibrahimović's 108.
  - Downside: his Hole Player style doesn't apply at CF.
  - Plan: test him at CF instead of Ibrahimović for 3–5 matches each way. **Test started
    11 Oct 2026** — he is in the XI at left CF, Ibrahimović is the first CF off the bench.
- **Bale `88045755861672`** (confirmed) — a "high-speed tank" and the best super-sub.
  - At CF his Prolific Winger style does nothing, so his runs have to be triggered by hand.
- **Makélélé `88045755964130`** (confirmed) — "ridiculously strong in a double pivot".
  Shadow Hunt plus Long-reach Tackle is called the best skill package for a midfielder.
  - Weak attacking AI (he has no attacking style) — matches his holding role here.
- **Stam `88045755964131`** (confirmed) — a "moving wall", best against technical
  centre-forwards.
  - Pairs with a deep Build Up centre-back such as Varane, so he comes on for Desailly.
- **Unconfirmed versions:**
  - Desailly: "best step-up CB", the nightmare of runners and small agile attackers.
  - Varane: "if I could pick only one CB".
  - Seedorf: can't shoot.
  - Pirlo: lacks pace.
  - Ibrahimović: eFHUB thinks v6 weakened heading, which hurts Fox in the Box.
- **No review found:** Buffon, Puskás, Dembélé and this Zanetti card. The reviewed Zanetti
  is the new Inter card.

**Form before the match:** condition is set weekly from the Live Update Rating, and
Legend / Epic / Big Time cards are fixed at B according to the guides (KNOWLEDGE-BASE §25) —
nearly the whole squad. Arrows matter for current-season cards (e.g. Dembélé, Calafiori).
Arrows break ties, they don't pick the XI: swap only like-for-like — Eto'o ↔ Dembélé /
Adriano, Messi ↔ Sneijder (both keep the Link-up), Hazard ↔ Bellingham, Gullit ↔
Ibrahimović / Bale, Makélélé ↔ Vieira, Desailly ↔ Stam, Maldini / Thuram ↔ Zanetti. Never two
Destroyers, Messi on the left or a Link-up switched off for an arrow.

**Plan B — when Long Ball Counter isn't working** (they sit deep, long balls get cleared,
few chances by ~55'): Possession sub-tactic (Deschamps 89), Puskás (Deep-Lying Forward,
CF 105) for Ibrahimović next to Eto'o — the DLF + Goal Poacher pair — and Pirlo
(Orchestrator) for Makélélé. Late with a lead: Bale (Attack Outlet) up front as the
counter outlet.

**Set pieces:** penalties Hazard (Finishing 94); free kicks Hazard (left) / Messi (right);
corners Hazard; aerial targets Gullit (Bullet Header), Desailly, Varane — Ibrahimović once
he's on.

**Alternatives:** Xabi Alonso Quick Counter with the same 4-2-2-2 and the same Link-up pair
(vs Possession sides); Thuram to CB (108) + Zanetti RB when chasing (+1 overall, but he
goes high); Capello 4-2-1-3 with Pirlo — test only.

---

## Sub-tactic for the Game Plan — 11 Oct 2026

In-game **Sub Tactic** (Game Plan → Sub Tactic ON): it only re-arranges the eleven on the
pitch, so the second plan is a shape, not new players. With Deschamps the only strong
alternative playstyle is **Possession (89)** — Quick Counter 68, Out Wide 59, Long Ball 63.

**Possession · 4-3-2-1** (user's idea, 11 Oct: drop Gullit, two behind Eto'o), same eleven:

| Line | Player | Position | Why |
|---|---|---|---|
| DMF | Makélélé | DMF (50, 40) | holds, first pass |
| CMF | Seedorf (L), Gullit (R) | CMF | Gullit is **high** at CMF (intermediate at RMF), Hole Player stays active — carries and arrives late |
| behind the striker | Hazard (L), Messi (R) | LMF wide (14, 64) / AMF right half-space (66, 66) | Hazard's Hole Player is active at LMF; Messi Creative Playmaker at AMF keeps the Breakthrough Pass A Link-up to Eto'o |
| CF | Eto'o | CF | alone on the shoulder: cutback or ball in behind |

Every style active, no intermediate position, Link-up on; model average 105.8. Switch when
they sit deep and compact, long balls get cleared and there are few real chances by ~55′.
If still nothing by ~65′: Pirlo for Makélélé, Puskás for Gullit. In possession: Counter
Target off Eto'o, defensive line a notch higher, Thuram stays home. Earlier variants
(4-3-1-2 diamond; 4-2-3-1 with Gullit at RMF) were dropped: narrow, or Gullit intermediate.
Build Lab: the Game Plan lineup's match card, **Main | Sub-tactic** switch above the pitch.

## Diamond — 11 Oct 2026 (test, alongside the Game Plan)

The user's own shape, rebuilt after a look at it: attack **4-1-2-1-2**, defence **4-3-1-2**
(Fluid), **F. Beckenbauer** (LBC 89) so Breakthrough Pass B — Seedorf (Box-to-Box CMF) →
Eto'o (Goal Poacher CF) — is on. The original diamond had no width (two Defensive
Full-backs, four central attackers) and no passer in build-up (Vieira alone); Ronaldinho sat
on the left against the earlier decision. Build Lab lineup `plan-2026-10-11-diamond`.

| Attack | Defence | Player | Rating |
|---|---|---|---|
| GK | GK | Buffon | 107 |
| LB | LB | Maldini (stays home) | 104 |
| CB / CB | CB / CB | Varane, Desailly | 105 / 107 |
| RB | RB | Cafu (Offensive Wingback — the only width) | 104 |
| CMF (L) | CMF | Pirlo (Orchestrator) | 107 |
| DMF | DMF | Makélélé | 106 |
| CMF (R) | CMF | Seedorf (Box-to-Box) | 105 |
| SS | AMF | Hazard (Hole Player active at SS) | 110 |
| CF / CF | CF / CF | Gullit (L), Eto'o (R) | 109 / 106 |

**Sub-tactic: Long Ball (Beckenbauer 89) · flat 4-4-2**, same eleven — Gullit (190 cm,
Bullet Header) the focal striker with Eto'o off him, Hazard LMF and Seedorf RMF for the
second balls and crosses, Pirlo and Makélélé CMF. The Beckenbauer Link-up is off in it
(Seedorf isn't at CMF); the target man is the point. Ibrahimović for Gullit if they handle
him, Bellingham for Hazard on the second balls.

Average 106.4. Bench: Ibrahimović (65' for Gullit), Thuram (for Cafu when protecting),
Vieira (75' for Pirlo when leading), Ronaldinho, Messi (CP), Stam, Zanetti, Bellingham (60'
for Hazard), Dembélé (72' for Eto'o), Puskás, C. Ronaldo, Sneijder. Instructions: Counter
Target Eto'o, Defensive Makélélé, Tight Marking Desailly. Three matches against the 4-2-2-2
Game Plan, keep whichever creates more.

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

## Gareth Bale (`88045755861672`) — 11 Oct 2026

- Role: **CF — striker off the bench** (user decision; the card is RWF Prolific Winger /
  Attack Outlet — at CF only Attack Outlet stays active).
- Build (Deschamps, LBC, 16 Oct 2026 — built as a CF, `buildAs`): `8 - 0 - 10 - 12 - 8 - 2 - 0`
  (68/68), slot 2 fixed Kicking Power +6. Speed 96, Acceleration 97, Balance 93, Finishing 91,
  OA 90, Ball Control 96, Dribbling 99, Tight Possession 93, Kicking Power 99, Physical Contact
  90 — CF rating 108. (Earlier: 8-1-5-12-12-1-0 on 11 Oct, then 6-9-8-11-8-0-0 with Passing 9 as
  the dump — the Prolific Winger template wanted Lofted Pass 80; as a CF he doesn't.)
- Additional skills: **Super-sub** (user already added), Through Passing, One-touch Pass,
  Fighting Spirit, Chip Shot Control.

## Marcelo (`88045755861084`) — 16 Oct 2026

- Bought 16 Oct 2026 — the Epic LB card from the public database (Madrid Chamartín B,
  174 cm, left foot, Level Cap 33, slot 1 Ball Protection +4). Role: **LB — Full-back
  Finisher / Covering Role**; the Build Lab builds him as a Full-back Finisher (template added
  16 Oct 2026, KNOWLEDGE-BASE §18).
- AI build (Deschamps, LBC, 16 Oct 2026 later): `5 - 7 - 7 - 9 - 9 - 0 - 6` (64/64), **Agility +1**
  — Speed 92, Acceleration 95, Ball Control 94, Tight Possession 94, Dribbling 89, Balance 92,
  Lofted Pass 92, Low Pass 91, Curl 84, Finishing 78, Stamina 94; Defensive Awareness 83,
  Tackling 85, Defensive Engagement 80. LB rating 105 (Maldini 104). The first version of the
  day (0-1-0-5-9-10-12 Shutdown +1, Covering Role, 104) treated him as a defender.
- AI additional skills: Interception, Blocker, Man Marking, Sliding Tackle, One-touch Pass.
- Natural skills worth noting: Double Touch, Flip Flap, Sole Control, Pinpoint Crossing,
  Phenomenal Pass, Edged Crossing, Momentum Dribbling — the attacking full-back package
  Maldini doesn't have. Maldini stays the defensive choice in the 4-2-2-2; Marcelo is the
  option when the left side needs to attack.

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

The user confirmed these seven manager cards from screenshots on 24 Sep 2026, and the
eighth on 16 Oct 2026:

- D. Deschamps
- R. Martínez
- F. Beckenbauer
- Jürgen Klopp
- Xabi Alonso
- Fabio Capello
- Frank Lampard
- José Mourinho — screenshot 16 Oct 2026: Finishing +1 / Aggression +1, Long Ball Counter 90
  (Quick Counter 82, Long Ball 75), Link-ups Shadow Link A (Deep-Lying Forward CF →
  Classic No. 10 AMF) and 1-2 Cut-in C (Prolific Winger LWF/RWF → Deep-Lying Forward CF).
  The eFHUB card released 10 Sep 2026 (manager id 17608560707469, no backticks: fetch_players reads backticked ids as players), not his two older cards. Worth
  ~15 training points across the current XI against Deschamps' 20 and no Link-up fits the
  4-2-2-2 (KNOWLEDGE-BASE §22), so he is not the current manager.

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
