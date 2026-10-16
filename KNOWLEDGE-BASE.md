# eFootball Player Build Knowledge Base

## Purpose

This project is used to create optimized eFootball player builds based on:

- player role and playstyle
- intended position
- progression-point efficiency
- stat thresholds and diminishing returns
- player model and physical dimensions
- special player skills
- booster effects
- actual in-game role
- synergy between stats, skills and physical model

The user-specific roster/card registry, owned-manager state, saved build snapshots and tactical context live in **[`USER-SQUAD.md`](./USER-SQUAD.md)**. Read that file alongside this knowledge base whenever ownership, exact card identity, current build, manager choice or squad fit matters.

The goal is NOT to maximize overall rating.

The goal is to create the strongest possible player for the exact role in which he will be used.

---

# 1. Core Build Philosophy

Never optimize a player by looking only at raw stats.

Always consider:

1. Intended position
2. Playstyle
3. Player model
4. Height and weight
5. Leg coverage / body dimensions
6. Existing skills
7. Additional skills
8. Booster effects
9. Stat thresholds
10. Progression-point cost
11. Diminishing returns
12. What the player actually needs to do in matches

A stat being higher does not automatically mean the build is better.

Example:

- 100 Defensive Awareness + 82 Acceleration
may be worse than
- 96 Defensive Awareness + 90 Acceleration

depending on the role.

Similarly:

- 99 Finishing
may be wasteful if the player already has Phenomenal Finishing or Will Power and other important stats are lacking.

---

# 2. Acceleration vs Speed

Off-ball running is divided into two stages.

## Acceleration stage

The first approximately:

- 3 grass blocks
- around 16-18 metres

depends primarily on:

**Acceleration**

Speed is effectively ignored during this initial stage.

Acceleration therefore does NOT simply mean:

> how quickly the player reaches his Speed stat

Instead, it represents how fast the player moves during the first ~16-18 metres.

### Other things that change a player's acceleration (official patch notes, v5.x)

- **Stamina:** Acceleration drops as stamina is lost during a match (Konami reduced
  how much, but it still happens) — Stamina matters for anyone who has to sprint late.
- **Attacking Awareness** affects acceleration on attacking runs; **Defensive Awareness**
  affects acceleration when marking an opponent (see the DA 70 note in §12).
- Konami also raised the minimum speed of low Speed/Acceleration players, narrowing the
  gap between slow and fast cards somewhat.

## Full-speed stage

After the acceleration phase:

**Speed** becomes the dominant stat.

### Practical consequence

A player with:

- 95 Speed
- 80 Acceleration

can lose the initial race badly against:

- 90 Speed
- 94 Acceleration

This is especially important for:

- Goal Poachers
- Hole Players
- Destroyers
- Full-backs
- pressing midfielders
- defenders recovering toward goal

---

# 3. Important Stat Thresholds

Thresholds are NOT hard caps.

They are generally ideal minimums or points after which additional investment becomes less efficient.

## Offensive Awareness

Target:

**90+**

Reason:

The acceleration-related benefit from Offensive Awareness appears to reach its useful maximum around 90.

For attacking roles:

- 90 = minimum target
- 92-95 = excellent
- 96+ = only when progression cost is low or role heavily depends on movement

---

## Speed

Important point:

**90**

Returns beyond 90 are significantly smaller.

This does NOT mean 91-95 Speed is useless.

It means:

Do not sacrifice several more important attributes just to push Speed excessively above 90.

Typical targets:

- CB: 88-92
- DMF: 88-92
- AMF: 89-95
- CF/SS: 90-96
- Wingback: 90-95

### Speed bands from community testing (added 29 Sep 2026)

Reported from Amadeusz's tests via community posts (the original test wasn't
directly reviewed here — treat as strong working knowledge, re-check after patches):

- 80 → 90 is worth far more than 90 → 99; **90 is the most important threshold**.
- **96 Speed is already top speed. 96 → 99 gives no improvement** — the worst
  place to spend progression.
- **100+ gives a noticeable step again** (relevant for strong boosters).

Practical rule: aim for ~90; above that stop at **96**. **Training never goes past 96
(user decision, 11 Oct 2026):** the 100+ "step" is not bought with progression points —
it only happens where boosters and the manager land there on their own. Points that would
have taken Speed to 97–101 go to the role's other stats (`recommend.js` values Speed as
capped at 96 and treats anything trained past it as waste).

**Conflicting relay (11 Oct 2026, section 25):** a second repost of the same kind of test
says 96 → 99 gives a very small but non-zero gain (still far less than 99 → 102) and that
eFootball 2027 changed the speed thresholds again. Not confirmed either way — keep the
rule above until a v6 test is available.

### Build targets actually used (user decision, 3 Oct 2026)

The user judged builds sitting at the bottom of the ranges above (CB 88, winger 90)
as too slow, so recommended builds aim at the **upper part** of each range, paid for
mostly with defensive/attacking overshoot (DA 96 → 95, OA 95 → 94) rather than core
thresholds:

- CB 91 (Covering Role 92), DMF / Box-to-Box 90, Orchestrator 88
- Goal Poacher, Dummy Runner, Hole Player, wingers, full-backs: 92
- Fox in the Box, Target Man and pure creators stay lower (section 7: Fox in the Box
  does not need extreme Speed)
- **Nobody buys the 100+ Speed step** (user decision, 11 Oct 2026 — first for the Creative
  Playmaker, then for every role): 96 is already top speed, and the Lower Body levels it
  takes to reach 100 do more as the role's other stats (Messi's Creative Playmaker card:
  28 points for Speed 100 became Ball Control, Dribbling, Attacking Awareness, Finishing
  and Balance).

---

## Acceleration

Important values:

**88 minimum**
**91 ideal baseline**

Around 88 appears to unlock an improved running stride.

Around 91 is a strong efficiency point before larger diminishing returns.

Community testing (Amadeusz, via community posts, 29 Sep 2026) puts the benefit per point
at roughly **3 : 2 : 1** for the ranges **below 88 : 88–91 : above 91** — so points below 88
are the most valuable, and 91 is where each further point is worth a third of the first ones.

For explosive roles:

- 92-95 = excellent
- 96-99 = strong but check progression efficiency
- 100+ = usually overkill unless other important stats remain strong

For Goal Poachers / Hole Players / Destroyers, Acceleration is especially important.

---

## Finishing

General target:

**90**

Around 90 Finishing is sufficient for most attackers.

Higher values are useful, but progression cost must be justified.

When the player has:

- Phenomenal Finishing
- Will Power
- First Time Shot
- strong Kicking Power

do NOT blindly chase 97-99 Finishing.

Typical good range:

**90-95**

---

## Passing

### Low Pass minimum

**82**

Especially if the player has:

**Through Passing**

### General ideal range

**87+**

For creators:

- 88-93 = strong
- 94-97 = luxury depending on skills

Players with:

- Phenomenal Pass
- Visionary Pass
- Through Passing
- One Touch Pass
- Weighted Pass

do not always need 95+ raw Low Pass.

---

## Lofted Pass

Important target:

**90**

Especially relevant for:

- Pinpoint Crossing
- Edged Crossing
- wingbacks
- crossing specialists

Do not overspend above 90 unless crossing is the player's main identity.

---

## Heading

Important value:

**89**

Around this level, a stronger heading animation may become available.

Very relevant for:

- tall CFs
- Bullet Header players
- aerial CBs

---

## Defensive Awareness

Important target:

**90+**

Defensive Awareness affects defensive reactions and effective acceleration in defensive scenarios.

Low Defensive Awareness can make a player behave slower defensively even if raw Acceleration is high.

For important defenders:

- 90 = minimum strong baseline
- 94-98 = elite
- 99-102 = often unnecessary if Speed/Acceleration suffer badly

---

# 4. Stats Without Useful Hard Thresholds

These increase more linearly.

Do not search for arbitrary magic numbers.

Examples:

- Kicking Power
- Jump
- Stamina

Every extra point can still matter.

**Stamina floor (user decision, 3 Oct 2026):** every outfield build aims for at least
**Stamina 85** — Acceleration drops as stamina is lost during a match (section 2), and the
user's Long Ball Counter needs runs in behind late in games. Roles with their own higher
Stamina target (Box-to-Box, Orchestrator, Anchor Man, full-backs, …) keep it. A card whose
base Stamina is far below (e.g. 70) isn't forced all the way (section 7's weak-base rule).

---

# 5. Player Model and Physics

Player model is extremely important.

Do NOT analyze two players with identical stats as identical players.

Important model parameters include:

- Height
- Weight
- Leg Length
- Leg Coverage
- Arm Coverage
- Shoulder Width
- Torso Collision
- Jump Height

---

## Leg Coverage

Represents how far the player can extend his legs.

Extremely important for:

- interceptions
- standing tackles
- Long Reach Tackle
- blocking passing lanes
- reaching loose balls

Tall defenders with long legs can outperform smaller defenders even with slightly lower defensive stats.

Also useful for tall CFs reaching loose balls in the box.

---

## Arm Coverage

Very important for goalkeepers.

Also helps defenders physically interact with opponents.

---

## Torso Collision

Represents effective body volume during physical contact.

Helps with:

- shielding
- shoulder-to-shoulder contact
- protecting the ball

Weight and shoulder width contribute strongly.

---

## Height and Dribbling

Height affects touch frequency and smoothness.

Approximate sweet spot:

**166-173 cm**

Players in this range can feel extremely smooth.

From around 174 cm upward, players generally become progressively less agile regardless of raw dribbling stats.

Therefore:

Do not waste excessive progression trying to make a 195 cm CF dribble like Messi.

Example:

Ibrahimovic does NOT need 90+ Dribbling if those points can improve:

- Offensive Awareness
- Acceleration
- Heading
- Jump
- Physical Contact
- Finishing

---

# 6. Jump Logic

Jump depends on both:

- player height
- Jump stat

A shorter player with 95 Jump may still lose aerial battles against a 195 cm player with 88 Jump.

Therefore always evaluate:

- Jump stat
- actual player height
- leg-based height
- Aerial Superiority
- Bullet Header
- Aerial Forte
- Physical Contact

together.

---

# 7. Role-Based Build Priorities

## Goal Poacher CF

Primary:

1. Offensive Awareness
2. Acceleration
3. Finishing
4. Speed
5. Ball Control
6. Balance
7. Kicking Power

Secondary:

- Dribbling
- Tight Possession
- Passing

For tall aerial CF:

also prioritize:

- Heading
- Jump
- Physical Contact

---

## Fox in the Box

Prioritize:

- Offensive Awareness
- Finishing
- Physical Contact
- ball reception
- Heading/Jump if player model supports it
- enough Acceleration to react inside the box

Do NOT automatically prioritize extreme Speed.

---

## Hole Player AMF / SS

Very important:

- Offensive Awareness
- Acceleration
- Balance
- Finishing
- Ball Control
- Tight Possession
- enough Passing

This role makes repeated late runs.

A typical ideal profile:

- OA 90+
- Acceleration 92+
- Speed ~92 (user decision, 3 Oct 2026 — see below)
- Finishing 88-93+
- Balance 90+
- good Ball Control

Speed is not optional for this role: the Hole Player's runs from deep into the space
behind the line go past the 16-18 m acceleration stage (section 2), and with Long Ball
Counter those runs are long. The user judged Speed 88-90 on a Hole Player (Gullit) too
slow, so the build target is ~92 (inside section 3's SS 90-96 range), still never
trained into the 97-99 dead zone. For a tall Bullet Header Hole Player, keep Heading at
the 89 threshold while chasing it.

---

## Creative Playmaker AMF

Prioritize:

- Ball Control
- Dribbling
- Tight Possession
- Low Pass
- Balance
- Acceleration
- Kicking Power
- enough Finishing

Do NOT overspend on Offensive Awareness if the player is primarily a creator.

Do NOT chase Speed 100 either (user decision, 11 Oct 2026 — section 3): a Creative
Playmaker lives on the ball, so Speed stops at 96. Messi (Creative Playmaker card, AMF):
5-8-6-6-13-4-0 Passing +1 → **8-9-6-7-9-5-0 Offence Creator +1** — Speed 100 → 96 and
Kicking Power 95 → 91 bought Attacking Awareness 88 → 90, Finishing 88 → 91, Curl 90 → 92,
Low Pass 93 → 94, Ball Control 96 → 97, Balance 95 → 96 (AMF rating 106 → 107).

---

## Deep-Lying Forward SS / CF

Prioritize:

- Ball Control
- Tight Possession
- Dribbling
- Passing
- Finishing
- Offensive Awareness
- Acceleration
- Balance

The player must:

1. drop between lines
2. receive the ball
3. turn
4. combine
5. attack space again

---

## Dummy Runner SS

Prioritize:

- Offensive Awareness
- Acceleration
- Speed
- Finishing
- Balance
- Ball Control

Especially strong when combined with:

- Super-sub
- Acceleration Burst
- Momentum Dribbling

---

## Box-to-Box CMF

Prioritize balance across:

- Speed
- Acceleration
- Stamina
- Passing
- Ball Control
- Defensive Awareness
- Tackling
- Balance

Do NOT force every Box-to-Box player into a scorer.

Example:

Lampard can justify more Shooting.

Seedorf may be better optimized as:

- transition player
- carrier
- passer
- defender
- long-range shooter

rather than forcing high Finishing from a weak base.

---

## Orchestrator CMF / DMF

Prioritize:

- Low Pass
- Tight Possession
- Ball Control
- Balance
- Acceleration
- Stamina
- enough defensive stats

If paired with a true Anchor Man, the Orchestrator does not need elite defensive stats.

Example role split:

Vieira:
- wins ball

Pirlo:
- receives and distributes

---

## Anchor Man DMF

Prioritize:

1. Defensive Awareness
2. Defensive Engagement
3. Tackling
4. Speed
5. Acceleration
6. Physical Contact
7. Stamina

Passing only needs to be strong enough for safe distribution.

A giant DMF with:

- long legs
- Long Reach Tackle
- Interception
- Blocker

does not always need 95+ raw defensive stats.

---

## Build Up CB

Prioritize:

- Defensive Awareness
- Speed
- Acceleration
- Tackling
- Defensive Engagement
- Physical Contact
- player model/reach

Build Up defenders usually need slightly less explosive Acceleration than Destroyers, but very low Acceleration is still dangerous.

---

## Destroyer CB

Acceleration is especially important.

Destroyers step aggressively out of the defensive line.

Therefore:

**96 DA + 90 Acceleration**

can be preferable to:

**100 DA + 82 Acceleration**

because the Destroyer must close space quickly after leaving his line.

---

## Defensive Full-back

Prioritize:

- Defensive Awareness
- Tackling
- Speed
- Acceleration
- Physical Contact
- Stamina

Do not overinvest in passing unless needed.

---

## Offensive Wingback

Needs balance between:

- Speed
- Acceleration
- Stamina
- Passing
- crossing
- Ball Control
- defensive ability

Typical targets:

- Speed 90+
- Acceleration 92+
- Lofted Pass around 90
- decent defensive stats

Do NOT build an offensive wingback with almost zero defending unless intentionally used as an attacking weapon.

---

# 8. Skill Logic

Skills must be evaluated together with stats and player model.

---

## Phenomenal Finishing

Reduces the penalty from awkward shooting body positions.

Because of this:

A player does not always need 97-99 Finishing.

90-95 can often be enough.

---

## Will Power

Can improve finishing-related effectiveness as the match progresses.

Do not automatically overspend on starting Finishing/Kicking Power when Will Power already provides extra value.

---

## Bullet Header

Extremely valuable when combined with:

- tall player model
- Heading
- Jump
- Aerial Superiority
- Physical Contact

A 195 cm CF with Bullet Header should usually be built differently from a 170 cm striker.

---

## Blitz Curler

If a player has Blitz Curler, budget for it — but only up to a point.

The skill itself already modifies the shot path (does not change stats), so the raw
stat requirement is lower than for a player without it. Stat importance order for a
Blitz Curler build: **Kicking Power > Curl > Finishing**.

Do not max all three — push Kicking Power and Curl first, and treat Finishing as the
stat you're most willing to leave a few points short on.

---

## Aerial Superiority

Useful only when the player model and aerial stats support it.

Do NOT waste an additional skill slot on Aerial Superiority for a short player with:

- low Heading
- low Jump
- poor physicality

---

## Momentum Dribbling

Makes high dribbling quality even more valuable.

Players with Momentum Dribbling should generally receive enough:

- Dribbling
- Tight Possession
- Balance

to exploit it.

---

## Magnetic Feet

Strong for technical AMF/SS players.

Reduces the need to chase absurdly high raw Ball Control when progression cost becomes inefficient.

---

## Acceleration Burst

Very strong with:

- high Acceleration
- high Balance
- Goal Poacher
- Dummy Runner
- Hole Player

Do not waste progression pushing Acceleration far beyond usefulness if already around 97-99.

---

## Through Passing

Important interaction:

Low Pass around **82+** can already be functional.

Players with Through Passing do not always require 95+ Low Pass.

---

## Phenomenal Pass / Visionary Pass

These reduce the need to maximize raw Passing.

Prioritize more complete builds.

---

## Double Touch Combo

For the strongest Double Touch setup:

- Double Touch
- Sole Control
- Flip Flap

Together these three enable a "trap cancel" — genuinely elite close dribbling, not
just three separate feints stacked on top of each other.

This combination is especially valuable for:

- Messi
- Neymar-style players
- Saviola
- Dembele
- Hazard
- Del Piero
- technical AMFs

Less important for:

- huge target men
- pure CBs

---

## Cut Behind & Turn

Strong for beating a marker who is goal-side or tight on the ball — the skill helps
the player spin away behind the defender's back rather than just turning in place.

Worth prioritizing for dribblers who regularly get closed down 1v1 (wingers, AMFs,
SS), less relevant for target men who rarely try to spin away from a marker.

---

# 9. Additional Skill Selection

Never add skills blindly.

First inspect what the player already has.

Avoid duplicates or skills that provide little value for the role.

---

## Common attacking additions

Useful options:

- One Touch Pass
- Sole Control
- Flip Flap
- Acrobatic Finishing
- Fighting Spirit
- Heel Trick
- Outside Curler
- Super-sub
- Weighted Pass
- Long Range Shooting

---

## Common midfielder additions

Useful:

- One Touch Pass
- Weighted Pass
- Sole Control
- Flip Flap
- Fighting Spirit
- Heel Trick
- Blocker
- Interception
- Track Back (primarily when the role involves pressing from the front line; not an automatic Box-to-Box DMF pick)

---

## Common CB additions

Once defensive skill coverage is already complete, consider distribution skills:

- One Touch Pass
- Weighted Pass
- Low Lofted Pass
- Outside Curler
- Sole Control (only for a demonstrated on-ball turning role)

Do not force unnecessary attacking skills. In particular, Sole Control needs a role-specific turning/feint use case; it is not a default CB addition.

---

## Through Passing — a priority addition for every outfield player (user decision, 3 Oct 2026)

Through Passing adds roughly **+20% to both passing stats on low *and lofted* through
balls** (section 19) — the ball in behind that the user's Long Ball Counter is built on.
It lifts a weak passer the most (a CB with Low Pass 72 plays through balls at ≈86), so it
is not reserved for creators or for Low Pass 82+ (section 3's 82 is where a Through
Passing holder's raw passing is already functional, not a gate for the skill). Low Lofted
Pass does **not** fire on lofted through balls, so Through Passing comes first among
distribution skills, including for centre-backs once their defensive coverage is complete.

## Additional Skill slot limit

A player can have a maximum of **5 Additional Skills** added via the Skill Training
Program, on top of native skills. Random Skill Tokens select from their available
pool; Advanced Skill Tokens select from their category pool. Duplicates have no
effect; added skills can be overwritten/deleted; Trending players cannot receive
Skill Training. The in-game help confirms these rules (IMG_1260).

Do not plan a build around more than 5 additional skills — it is a hard cap.

---

## Addable skills vs Show Time skills

Do NOT assume every skill that exists in the game can be added manually.

eFootball splits skills into two pools:

1. **Regular skills** — addable via Skill Training, subject to GP cost and Player
   Type eligibility. The list below was directly confirmed by scrolling
   through the live in-game Additional Skills picker.
2. **Show Time skills** — exclusive to specific Epic / Show Time / Big Time player
   cards. These CANNOT be added through Skill Training, no matter the GP spent.

A card's natural (pre-installed) skills are NOT necessarily all exclusive skills —
a player typically has around 10 natural skills, and that native set is usually a mix
of ordinary skills (e.g. Heading, which is also in the addable pool below) and, on
special cards, one or more Show Time skills. Only the exclusive ones are irreplaceable
identity of that specific card; the ordinary ones a card lacks can be added through Skill Training when eligible.
The newly photographed Tap Trick, Power Tackle, Shadow Hunt, Attacking Surge and Snap Strike
are documented in section 20 but their availability in the training picker is **not
established by the supplied images**. Verify the picker before treating any as addable.

### Card-exclusive skills (previously observed as not addable)

- **Phenomenal Finishing** — massively boosts a player's ability to finish with all shot types
- **Phenomenal Pass** — boosts power/accuracy of passes from unorthodox body positions
- **Blitz Curler** — adds more accuracy and an ever-sharper curve to Controlled Shots (50%+ power)
- **Visionary Pass** — temporarily boosts the receiver's first-time ball control and one-touch shots/passes after a pass
- **Bullet Header** — boosts the accuracy and power of headers
- **Momentum Dribbling** — keeps tight control of the ball when dribbling, translating into faster ball speed and quicker transitions between moves
- **Edged Crossing** — boosts the accuracy of crosses
- **Fortress** — improves defensive abilities after halftime whenever the team leads
- **Game-changing Pass** — boosts the accuracy of passes if losing at halftime
- **Aerial Fort** — further boosts aerial prowess
- **Acceleration Burst** — enables quick Sharp Touch from stationary/slow movement and special motions
- **Long-reach Tackle** — massively improves range and success rate on standing tackles
- **GK Directing Defence** — improves defensive abilities of defenders deep in your own territory
- **Low Screamer** — speeds up a Stunning Shot under 50% power and suppresses Dipping Shot
- **GK Spirit Roar** — boosts the physicality of your defenders
- **Willpower** — continuously boosts shooting ability the more shots taken
- **Magnetic Feet** — boosts ball retention as nearby opponents within 5 m increase (up to four)
- **Attack Trigger** — increases other teammates’ Attacking Awareness while the holder controls the ball
- **Shadow Hunt** — recovery speed-related abilities when a pass goes behind a DMF/LB/RB/CB
- **Attacking Surge** — speed-related abilities in the attacking half while a teammate has the ball
- **Power Tackle** — standing tackle using body contact, with increased chance of disrupting balance
- **Snap Strike** — reduces Stunning Shot wind-up; magnitude untested

If a player already has one of these natively, treat it as a fixed asset of that
specific card — it is never something you can add to a different player, and it is
never something you should plan to add later.

### Addable skills (regular pool — previously verified in Additional Skills picker)

Dribbling:

- Double Touch
- Scissors Feint
- Flip Flap
- Marseille Turn
- Sombrero
- Chop Turn
- Cut Behind & Turn
- Scotch Move
- Sole Control

Shooting:

- Heading
- Long-range Curler
- Chip Shot Control
- Knuckle Shot
- Dipping Shot
- Rising Shot
- Long-range Shooting
- Acrobatic Finishing
- Heel Trick
- First-time Shot

Passing:

- One-touch Pass
- Through Passing
- Weighted Pass
- Pinpoint Crossing
- Outside Curler
- Rabona
- No Look Pass
- Low Lofted Pass

GK & Others:

- GK Low Punt
- GK High Punt
- Long Throw
- GK Long Throw
- Penalty Specialist
- GK Penalty Saver
- Gamesmanship

Defending:

- Man Marking
- Track Back
- Interception
- Blocker
- Aerial Superiority
- Sliding Tackle
- Acrobatic Clearance

Miscellaneous:

- Captaincy
- Super-sub
- Fighting Spirit

Being addable does not mean worth adding — check the list below before spending GP.

### Addable but generally not worth adding

- **Sombrero** — unpredictable
- **Scotch Move** — considered the weakest skill move
- **Rising Shot** — actually reduces scoring chance; the ball often rises above the crossbar
- **Rabona** — no gameplay benefit, animation only
- **No Look Pass** — same as above, animation only
- **Long Throw** — not worth spending GP via Player Fusion for this alone
- **Penalty Specialist** — same as above
- **Captaincy** — supposed stamina boost was not observed in testing

---

# 10. Booster Knowledge Base

All 29 boosters below (including the 2 GK ones) were cross-checked directly against
the live in-game "Select Booster" screen on 26 Aug 2026 — every entry matched except
Goalkeeping +1 and Saving +1, which the original source spreadsheet omitted entirely.

## Every player has 2 booster slots

1. **Slot 1 — natural booster.** Fixed to that specific card. It is not chosen and
   cannot be changed, and its magnitude is not necessarily +1 — confirmed example:
   Ronaldinho Gaucho's natural booster is **Technique +4** (Ball Control +4,
   Dribbling +4, Tight Possession +4, Low Pass +4), not the standard +1. Treat this
   as a fixed property of the card, not a decision to make.
2. **Slot 2 — assignable booster.** Chosen by the player from the full list below,
   always a flat +1 to its four stats. This is the only slot section 11's "choose by
   exact stats" guidance actually applies to.

Both slots apply simultaneously and stack with the manager's Booster (section 17)
and the player's own trained stats. Only one confirmed example of a natural-booster
magnitude exists so far (+4) — do not assume every card's natural booster is also +4
until more examples are checked.

## Accuracy +1

- Low Pass +1
- Lofted Pass +1
- Finishing +1
- Kicking Power +1

---

## Aerial +1

- Finishing +1
- Heading +1
- Jump +1
- Physical Contact +1

---

## Aerial Block +1

- Heading +1
- Jump +1
- Physical Contact +1
- Defensive Awareness +1

---

## Agility +1

- Speed +1
- Acceleration +1
- Balance +1
- Stamina +1

---

## Balancer +1

- Offensive Awareness +1
- Acceleration +1
- Stamina +1
- Defensive Awareness +1

---

## Ball Protection +1

- Ball Control +1
- Tight Possession +1
- Physical Contact +1
- Balance +1

---

## Ball-carrying +1

- Dribbling +1
- Tight Possession +1
- Speed +1
- Balance +1

---

## Breakthrough +1

- Dribbling +1
- Speed +1
- Kicking Power +1
- Physical Contact +1

---

## Counter +1

- Low Pass +1
- Physical Contact +1
- Tackling +1
- Defensive Engagement +1

---

## Crossing +1

- Lofted Pass +1
- Curl +1
- Speed +1
- Stamina +1

---

## Defending +1

- Acceleration +1
- Jump +1
- Defensive Awareness +1
- Tackling +1

---

## Duelling +1

- Speed +1
- Stamina +1
- Defensive Awareness +1
- Tackling +1

---

## Fantasista +1

- Ball Control +1
- Dribbling +1
- Finishing +1
- Balance +1

---

## Free-kick Taking +1

- Finishing +1
- Place Kicking +1
- Curl +1
- Kicking Power +1

---

## Goalkeeping +1

- Goalkeeping (GK Awareness) +1
- GK Catching +1
- GK Parrying +1
- GK Reflexes +1

---

## Hard Worker +1

- Acceleration +1
- Physical Contact +1
- Stamina +1
- Aggression +1

---

## Off the ball +1

- Offensive Awareness +1
- Speed +1
- Acceleration +1
- Stamina +1

Excellent for:

- Goal Poacher
- Hole Player
- Dummy Runner

when Speed/Acceleration are not already excessive.

---

## Offence Creator +1

- Offensive Awareness +1
- Ball Control +1
- Low Pass +1
- Kicking Power +1

Excellent for:

- AMF
- Creative Playmaker
- SS creator
- Blitz Curler players

---

## Passing +1

- Low Pass +1
- Lofted Pass +1
- Curl +1
- Kicking Power +1

---

## Physicality +1

- Jump +1
- Physical Contact +1
- Balance +1
- Stamina +1

---

## Rebuilding +1

- Low Pass +1
- Defensive Awareness +1
- Defensive Engagement +1
- Aggression +1

---

## Regista +1

- Tight Possession +1
- Low Pass +1
- Defensive Awareness +1
- Tackling +1

---

## Saving +1

- Goalkeeping (GK Awareness) +1
- GK Parrying +1
- GK Reflexes +1
- GK Reach +1

---

## Shooting +1

- Ball Control +1
- Finishing +1
- Kicking Power +1
- Physical Contact +1

---

## Shutdown +1

- Speed +1
- Defensive Awareness +1
- Tackling +1
- Defensive Engagement +1

---

## Stealing +1

- Acceleration +1
- Physical Contact +1
- Tackling +1
- Aggression +1

---

## Strength +1

- Speed +1
- Kicking Power +1
- Jump +1
- Physical Contact +1

---

## Striker's Instinct +1

- Offensive Awareness +1
- Ball Control +1
- Finishing +1
- Acceleration +1

Excellent when:

- OA needs help
- Finishing needs help
- Acceleration is not already excessive

Avoid when Acceleration is already around 99-102 unless the other three stats justify it.

---

## Technique +1

- Ball Control +1
- Dribbling +1
- Tight Possession +1
- Low Pass +1

Excellent for technical AMF/SS players.

---

# 11. Choosing the Booster

This section is about slot 2 only — the assignable booster. Slot 1 (the card's
natural booster) is fixed and cannot be changed; check what it already covers first
so slot 2 doesn't waste points duplicating stats slot 1 already boosts.

Do NOT choose the booster by name.

Choose it by the exact four stats it provides.

Example:

A Hole Player already has:

- 96 Speed
- 99 Acceleration
- 97 Balance

Do NOT automatically choose Agility.

Those points may be mostly wasted.

Instead consider:

Offence Creator:
- OA
- Ball Control
- Low Pass
- Kicking Power

or another booster that fixes actual weaknesses.

## Booster = progression points (user insight, audited 16 Oct 2026)

Every +1 from slot 2 — and the manager's +1/+1 (section 17) — is one category level on
that stat that the build no longer has to buy. By section 12's cost table that level is
worth **3 points at category levels 9–12** (2 at 5–8, 4 at 13–16), so a booster whose four
stats sit on the role's expensive categories stands in for 6–9 points of progression, and
the freed points buy something else. Measured across the whole squad (the smallest extra
budget a no-booster build needs to reach the same value in the `recommend.js` model):

- a slot-2 booster is worth **4–9 training points** for most cards, 13 for Messi (Creative
  Playmaker) and 16 for Gullit;
- for **Hazard, Eto'o, Kaká and Rivaldo it buys what no training can** — the category is
  already at the level-12 cap (section 13), so the booster is the only +1 still available
  there. Hazard's Striker's Instinct takes Acceleration 96 → 97 and Ball Control 96 → 97;
  Dexterity and Dribbling can't go higher.

Rules that follow:

- **Choose the booster with the build, not after it.** For each candidate, compare the
  no-booster build with the build around the candidate and read what it frees. The Build
  Lab's Recommended by AI card prints it ("Frees 6 training pts: Dexterity 9→8, Lower Body
  11→10, spent on Dribbling 6→8"). `recommend.js` ranks every candidate on such a traded
  build and re-optimises the best four.
- Prefer stats in categories the build already holds at level 12 (the only +1 left), then
  categories at 9–12 (3 points a level), then 5–8. A +1 on a stat whose category sits at
  0–4 is worth 1 point and only matters when it crosses a threshold.
- A level is not dropped just because the booster covers one of its stats: Dexterity −1
  also costs Offensive Awareness or Balance −1. The trade pays only when the uncovered
  stats are past their targets or the freed points buy more elsewhere — the audit found
  42 of 50 free-slot cards already had the best booster, and 8 changed (in the XI only
  Messi: Shooting +1 → Offence Creator +1, Offensive Awareness 89 → 90).
- **Manager Booster, same arithmetic** (section 17): Deschamps' Speed +1 / Ball Control +1
  is worth about 20 training points across the current XI; Capello (Defensive Awareness /
  Finishing) 19, Beckenbauer (Dribbling / Defensive Awareness) 15 — all three at Long
  Ball Counter 89 — and Mourinho (Finishing / Aggression, Long Ball Counter 90, owned since
  16 Oct 2026) 15: Aggression does nothing for this XI. The manager stays; the other four
  owned managers are out on proficiency alone. Re-run: `node tools/booster_audit.js`.

---

# 12. Progression Point Efficiency

## Verified formula (confirmed 26 Aug 2026 against 22 controlled test builds)

Training points are spent through 10 categories: Shooting, Passing, Dribbling,
Dexterity, Lower Body Strength, Aerial Strength, Defending, GK1, GK2, GK3. Each
category has its own level, 0 to a max of **20**.

**Cost per category level is tiered, not flat** — confirmed exactly against 8
distinct Lower Body Strength levels (4, 8, 9, 12, 13, 16, 17, 20), every one matching
this table with zero deviation:

| Level range | Cost per level | Cumulative points at top of range |
|---|---|---|
| 1–4 | 1 | 4 |
| 5–8 | 2 | 12 |
| 9–12 | 3 | 24 |
| 13–16 | 4 | 40 |
| 17–20 (max) | 5 | 60 |

Maxing one single category (level 20) costs 60 of the 64 points available at Level
Cap 33 — leaving exactly 4 points to spend elsewhere. Total point budget scales with
a card's own Level Cap (33 → 64 confirmed); the per-level cost table itself is
assumed universal across cards, not re-verified at other Level Caps.

**Category level → raw stat gain is a clean 1:1 ratio — NOT diminishing.** Every
level invested in a category adds exactly +1 to each of its associated raw stats,
confirmed across Shooting (levels 0/1/2/3), Passing (levels 0/1/2), and Lower Body
Strength (levels 4 through 20, every single-level step tested). There is no second
layer of diminishing returns at the stat level — all the nonlinearity is in the
points-per-level cost table above, not in the resulting stat gain.

Confirmed category → stat mappings — every one of the 10 categories isolated with a
single-level, all-others-zero test, each producing exactly +1 on its stats and zero
change anywhere else:

- **Shooting** → Finishing, Place Kicking, Curl
- **Passing** → Low Pass, Lofted Pass
- **Dribbling** → Ball Control, Dribbling, Tight Possession
- **Dexterity** → Offensive Awareness, Acceleration, Balance
- **Lower Body Strength** → Speed, Kicking Power, Stamina
- **Aerial Strength** → Jump, Physical Contact, Heading
- **Defending** → Defensive Awareness, Defensive Engagement, Tackling, Aggression
- **GK1** → GK Awareness (Goalkeeping), Jump
- **GK2** → GK Parrying, GK Reach
- **GK3** → GK Catching, GK Reflexes

Note Jump is shared: both Aerial Strength and GK1 raise it independently — an
outfield player only ever has access to Aerial Strength, but a goalkeeper could in
theory pull Jump from either category.

This mapping is now complete — there are no remaining unconfirmed categories. Given
a target raw stat increase, look up which category to spend in, then use the cost
table above to compute the exact points required for that category level.

## Hard rule: always spend every point

Never leave points unspent in a Build line — the total must always sum to exactly
the player's full budget. If the priority categories don't consume the last 1-3
points cleanly, park the remainder in whichever secondary category is least harmful
to the role rather than leaving it idle:

- **Aerial Strength** (Jump/Physical Contact/Heading) is usually the least wasteful
  dump for a technical/dribbling player — Physical Contact has some use for
  shielding the ball even outside an aerial role.
- **Defending** (DA/DE/Tackling/Aggression) is the alternative dump, useful mainly
  because it can help claw a low Defensive Awareness back toward the 70 threshold
  (section 3) where the Acceleration penalty in defensive scenarios stops applying.

Both start at level 0, so raising either from 0 to 1 always costs exactly 1 point —
useful for absorbing a leftover of exactly 1.

## General efficiency guidance

Always inspect the cost of progression levels.

Do not chase one stat if moving one progression category from 10 -> 12 costs many points for only a minor practical benefit.

Ask:

> What do I lose to gain this +1?

Example:

Going from:

- Speed 89 -> 90

can be worthwhile because 90 is an important threshold.

But going:

- Speed 96 -> 98

may not justify losing:

- +3 Ball Control
- +2 Passing
- +2 Balance

---

# 13. Build Anti-Patterns

Avoid these mistakes.

## 100+ defensive stat obsession

Do not blindly create:

- 102 DA
- 101 Tackling
- 100 Engagement

while leaving Acceleration at 81-83.

---

## 99 Finishing obsession

Do not chase 99 Finishing if the player already has:

- Phenomenal Finishing
- First Time Shot
- Will Power

and other stats are lacking.

---

## Tall-player dribbling obsession

Do not spend huge progression resources making a 195 cm CF reach 90+ Dribbling unless the role specifically requires it.

---

## Passing obsession

Do not chase 96-99 Low Pass when the player already has:

- Through Passing
- Phenomenal Pass
- Visionary Pass
- One Touch Pass

unless he is specifically being built as an elite distributor.

---

## Fighting the card

**13 or more levels in one category means the card isn't made for it (user decision,
11 Oct 2026).** Levels 13–16 cost 4 points each and 17–20 cost 5 (section 12), so lifting a
stat from a weak base to its target can eat half the budget — Maldini's Acceleration 70 → 91
took 14 Dexterity levels, 32 of 64 points. Build what the card is: a core stat that starts
more than 12 below its target is chased at full value only for about +10, the rest counts
half, and **no category goes past level 12** in a recommended build (goalkeeper categories
excepted — they are the keeper's whole job); the points spread over the role's other stats.
You can't make a goalkeeper out of Thuram. The Trainer warns at 13+.

## Overall rating optimization

Ignore overall rating when it conflicts with role optimization.

A 104-rated custom build can easily be stronger for a specific role than a 108-rated auto/community build.

---

# 14. Recommended Analysis Workflow

Whenever a new player screenshot is provided:

## Step 1 - Identify role

Determine, in this order (per section 18, eFootball 2027 / v6.0.0):

- intended position
- Attacking Playing Style
- Defensive Playing Style
- starter or substitute
- tactical purpose

Do NOT build before deciding this. A raw stat is not equally valuable across
playstyles even at the same position — see section 18's Hole Player vs Creative
Playmaker comparison for why.

---

## Step 2 - Inspect player model

Check:

- Height
- Weight
- Leg Coverage
- Leg Length
- Leg-based Height
- Jump Height
- Torso Collision

---

## Step 3 - Inspect natural skills

**Trained skills count too (user decision, 11 Oct 2026):** the additional skills already
bought for the card (★ picks in the Build Lab Trainer, USER-SQUAD choices) shape the build
like native ones — a card given Heading and Aerial Superiority gets the Heading 89 / Jump /
Physical Contact package, Pinpoint Crossing asks for Lofted Pass 90, Long-range Shooting
for Kicking Power 90, First-time Shot / Acrobatic Finishing for Finishing 90, a trained
Double Touch / Flip Flap / Sole Control package for close-control stats, Interception /
Blocker / Man Marking on a midfielder or attacker for Defensive Awareness 70, Through
Passing for the Low Pass 82 minimum. `recommend.js` reads them from the Trainer's ★ picks.

Identify important traits such as:

- Bullet Header
- Phenomenal Finishing
- Will Power
- Acceleration Burst
- Momentum Dribbling
- Magnetic Feet
- Phenomenal Pass
- Visionary Pass
- Long Reach Tackle
- Aerial Forte
- Fortress

---

## Step 4 - Identify current waste

Examples:

- Acceleration 102
- Speed 98
- DA 102
- Finishing 99
- Passing 97

Check whether those points can produce greater value elsewhere.

---

## Step 5 - Build around thresholds

Prioritize useful targets such as:

- OA 90+
- Speed 90
- Acceleration 91+
- Finishing 90+
- Heading 89 where relevant
- Passing 82 / 87+
- DA 90+

---

## Step 6 - Select booster last

After progression is close to final:

Choose the booster that fixes remaining weaknesses or crosses useful thresholds.

Do NOT choose the booster before understanding the final build.

Choose it **with** the build: for each candidate, see which category levels its +1s make
redundant (3 points each at levels 9–12 — section 11, "Booster = progression points") and
where the freed points go; the booster + build pair that ends best wins. On a category
already at the level-12 cap the booster is the only +1 left — that is where it is worth most.

---

## Step 7 - Select additional skills

Choose skills based on:

- role
- existing natural skills
- player model
- resulting stats

Do not recommend skills simply because they are considered generally strong.

---

# 15. Desired Response Format for Future Player Analysis

When analyzing a player, respond like this:

## Role

Name the position, Attacking Playing Style, and Defensive Playing Style (section 18)
separately — a card can carry one of each.

Example:

**SS — Attacking: Hole Player, Defensive: Covering Role**

Short explanation of why this is the best combination.

## Build

`Shooting - Passing - Dribbling - Dexterity - Lower Body - Aerial - Defending`

Example:

`7 - 4 - 7 - 14 - 7 - 0 - 0`

## Booster

**Off the ball +1**

Explain which four stats it provides and why they matter.

## Target Stats

List only important resulting stats:

- OA
- Finishing
- Speed
- Acceleration
- Ball Control
- Dribbling
- Tight Possession
- Passing
- Balance
- Physical
- Heading/Jump when relevant
- defensive stats when relevant

## Additional Skills

Exactly 5 recommendations.

## Final Verdict

State whether:

- build should be locked
- another variant should be tested
- player is starter / bench / situational
- preferred position

---

# 16. Main Principle

The best build is NOT the build with the most green numbers.

The best build is the build where:

**player model + playstyle + skills + booster + progression + role**

all work together.

Always optimize for actual match impact.

---

# 17. Manager (Coach) Effects

Managers affect players through two completely separate mechanics. Do not conflate them.

## 1. Manager Booster — direct stat increase, team-wide

Every manager grants a fixed **+1 to exactly two specific stats**, applied to the whole
squad for as long as that manager is assigned. This functions like the individual
player Booster (section 10), but at squad level instead of per-card, and it **stacks**
with each player's own individual Booster.

The bonus is always +1/+1 regardless of which manager — only the two stats chosen
differ between managers.

Observed examples:

| Manager | Boosted Stats |
|---|---|
| F. Beckenbauer | Dribbling +1, Defensive Awareness +1 |
| R. Martínez | Finishing +1, Attacking Awareness +1 |
| Fabio Capello | Finishing +1, Defensive Awareness +1 |
| Xabi Alonso | Ball Control +1, Finishing +1 |
| Frank Lampard | Low Pass +1, Defensive Engagement +1 |

Because this applies to the entire squad, picking a manager to maximize ONE player's
build is a team-level tradeoff, not an isolated decision — every player gets the same
two stats boosted, not just the one you are optimizing for. Pick the manager whose
pair best matches your squad's overall needs or your most important player's role,
using the same "choose by exact stats, not by name" principle as section 11.

Note: section 3 mentions "Extra point with 89 manager" for the Passing threshold.
The screens observed here show Team Playstyle Proficiency (0-100 per tactic), not an
overall manager rating/level — it is unconfirmed whether a manager's own quality/level
scales the Booster beyond the flat +1/+1 seen in all 5 examples above.

## 2. Coaching Affinity — training-speed multiplier, NOT a stat increase

Coaching Affinity increases match Experience Points gained by a specific player
segment (by position group, age bracket, or card rarity) by 200% or 400%. This makes
that segment level up faster — it does NOT add stat points directly and does NOT
affect overall rating by itself.

Observed examples:

| Manager | Coaching Affinity | Effect |
|---|---|---|
| F. Beckenbauer | DF Players+ | DF and GK players gain 400% more match XP |
| R. Martínez | Star Players+ | 5★ PV players gain 200% more match XP |
| Fabio Capello | Veteran Players+ | Players 30+ gain 200% more match XP |
| Xabi Alonso | MF Players+ | MF players gain 400% more match XP |
| Frank Lampard | Young Players+ | Players 23 or below gain 200% more match XP |

Only relevant while actively training/leveling a player through matches — irrelevant
for a player who is already fully progressed.

## Team Playstyle Proficiency — separate from both of the above

Every manager also has a 0-100 proficiency rating across 6 Team Playstyles: Possession
Game, Quick Counter, Long Ball Counter, Out Wide, Long Ball, Overload. This affects how
well the TEAM executes that tactic collectively. It is a team-tactics setting, not an
individual player stat, and does not factor into single-player build optimization.

## Practical takeaway for player analysis

When asked how much a manager adds to a specific player: **+1 to whichever two stats
that manager's Booster targets, if relevant to the role — otherwise 0.** Always check
the currently-assigned manager's Booster pair before finalizing a build's Target
Stats — it can let the raw progression target be 1 point lower on whichever of the
two stats is relevant.

---

# 18. Playing Styles (eFootball 2027 / v6.0.0)

As of eFootball 2027 / v6.0.0, the in-game help describes **Attacking Playing Style**
and **Defensive Playing Style** separately. A player can have both. An attacking style
activates only in its compatible position; an incompatible position acts as **Basic**.
The tables below distinguish the in-game description from our tactical interpretation.
Source: user screenshots IMG_1229–IMG_1236 (24 Sep 2026).

Section 7's role priorities describe the attacking-side profile. Defensive Playing
Style is an additional, independent layer on top of that — read both before building.

## Attacking Playing Styles

| Playstyle | Positions | Behavior |
|---|---|---|
| Goal Poacher | CF | Lives on the last defender's shoulder. Constantly looks for depth, through balls, and runs in behind. Rarely drops for the ball. |
| Fox in the Box | CF | Stays central and close to the box. Less deep-running, more looking for space to finish, rebounds, cutbacks, and low crosses. |
| Target Man | CF | Comes to the ball, plays with his back to goal, holds it up for support. Less interested in attacking space in behind. |
| Dummy Runner | CF / SS / AMF | Makes unconventional movements to drag markers and open space for others. Frequently changes direction and zone. |
| Deep-Lying Forward | CF / SS | Drops between the lines for the ball, combines with AMF/CMF, then attacks forward again. A CF that participates in build-up. |
| Creative Playmaker | SS / RWF / LWF / AMF / LMF / RMF | Seeks the ball. Finds pockets of space, moves laterally, offers passing options, and orchestrates play. Fewer aggressive runs than Hole Player. |
| Prolific Winger | LWF / RWF | Stays wide, receives on the flank, attacks the full-back 1v1, then goes to goal or crosses. |
| Roaming Flank | LWF / RWF / LMF / RMF | Starts wide but often drifts inside — effectively an inverted winger. |
| Cross Specialist | LWF / RWF / LMF / RMF | Holds width and actively seeks crossing position. Rarely comes inside. |
| Classic No. 10 | SS / AMF | Official: takes a high position to initiate attacks and also goes for goal. “Static creator” is not established by this description. |
| Hole Player | SS / AMF / LMF / RMF / CMF | Actively seeks the "hole" in the defense and runs from deep. Often gets ahead of the ball and finishes in the box. |
| Box-to-Box | LMF / RMF / CMF / DMF | Shuttles up and down the whole match. Joins the attack, tracks back, covers a huge area. |
| Anchor Man | DMF | Stays in front of the CBs. Very rarely leaves the central zone to attack — cover for the rest of midfield. |
| Orchestrator | CMF / DMF | Drops deep for the ball and organizes build-up from deep. Wants the ball to feet more than off-ball runs. |
| Build Up | CB | Offers as a safe outlet from the back line and participates in playing out. Less chaotic than an aggressive CB. |
| Extra Frontman | CB | A much more adventurous CB. Joins the attack high up when he sees the chance, can end up deep in the opponent's half. |
| Offensive Full-back / Wingback | LB / RB | Overlaps down the line, goes high, provides width, looks for crossing position. |
| Defensive Full-back | LB / RB | Stays back. Rarely overlaps, prioritizes defensive shape. |
| Full-back Finisher | LB / RB | Unlike a classic offensive full-back, often comes inside, underlaps, appears centrally or around the box. |
| High Line GK | GK | Takes a high position while the team attacks to cover the space behind its defenders and stop counters. The official text does not claim that he functions as an extra passing option. |

### Hole Player vs Creative Playmaker

Hole Player — "Give me space to run into":

- moves more without the ball
- attacks the box more aggressively
- more often gets beyond the DMF/CB line
- OA + Acceleration matter enormously
- ideal for a Gullit / Bellingham / Hazard type

Creative Playmaker — "Give me the ball to make something happen":

- comes toward the ball more
- looks for the pocket between the lines
- more passing and combination play
- fewer aggressive runs
- Ball Control + Passing + Tight Possession + Balance matter more

### Goal Poacher vs Fox in the Box

Goal Poacher attacks space behind the CB — favors OA, Acceleration, Speed, Finishing.

Fox in the Box attacks space inside and around the box — favors OA, Finishing, Ball
Control, Physical, and aerial stats if tall.

Example: Eto'o as Goal Poacher and Ibrahimović as Fox in the Box should not share the
same build even though both are CFs.

### Goal Poacher vs Deep-Lying Forward

Poacher runs AWAY from the ball, looking for depth. DLF goes TOWARD the ball first,
receives, plays, then attacks forward again — makes DLF a strong second-striker
pairing alongside a Poacher.

Example: Messi as DLF SS + Eto'o as Goal Poacher CF — Messi comes to the ball,
Eto'o immediately attacks the line.

### Offensive Full-back vs Full-back Finisher

Offensive Full-back goes outside, overlaps, holds the line, crosses.

Full-back Finisher underlaps more, comes inside, behaves almost like an extra
CMF/AMF in some sequences.

Example: Offensive Wingback fits Cafu; Full-back Finisher would be a completely
different profile for him.

## Defensive Playing Styles

New in eFootball 2027 / v6.0.0 — these automatically affect player behavior when the
opponent has the ball, independent of the Attacking Playing Style.

| Style | Behavior |
|---|---|
| Front Line Pressure | Forwards aggressively press the GK/CB to force a mistake. |
| Front Line Poacher | Watches opposing passing lanes and takes up smart positions. |
| Attack Outlet | Barely tracks back. Stays high, saves stamina, ready for the counter. |
| Pass Disruptor | Focuses on closing passing lanes and interceptions rather than the ball carrier. Interesting for midfielders. |
| Box-to-Box | Actively presses and tracks back across a large area. |
| All-Action Defender | Runs back aggressively when defending and responds to opposing attacks. |
| Anchor Man | Holds the central defensive zone in front of the defense. Doesn't step out unnecessarily. |
| Covering Role | Actively covers for teammates carrying out Match-up duties. The specific tracking pattern needs separate testing. |
| High Line Master | Maintains the defensive line and shape. Doesn't step out much, manages depth and open space. |
| The Destroyer | Opposite of Covering Role. Steps out of the line, presses aggressively, and goes for the duel/tackle. |
| Sweeper GK | Takes a high position and rushes out to cover a wide area behind the defence. |
| Offensive GK | More proactive, more willing to come off his line to close down the attacker/space. |
| Defensive GK | Stays closer to goal, takes fewer risks coming out, relies more on positioning/shot-stopping. |

### Official compatible positions (defensive styles)

| Style | Compatible positions |
|---|---|
| Front Line Pressure; Front Line Poacher | CF, SS, RWF, LWF |
| Attack Outlet | CF, SS, RWF, LWF, AMF |
| All-action Defender; Pass Disruptor | AMF, RMF, LMF, CMF, DMF |
| Box-to-Box | RMF, LMF, CMF, DMF |
| Anchor Man | DMF |
| The Destroyer; Covering Role | CMF, DMF, RB, LB, CB |
| High Line Master | RB, LB, CB |
| Attacking GK; Defensive GK; Sweeper GK | GK |

Source: in-game help screenshots IMG_1234–IMG_1236. A listed compatible position
activates the style; do not assume that position proficiency alone activates it.

### Destroyer vs Covering Role

The Destroyer prioritizes the player/run in front of him and goes aggressively for
the duel. Covering Role prioritizes the run in behind and the space a teammate left.

### CB pairing philosophy

| Style | Mentality |
|---|---|
| Build Up | "I hold position and play the ball out." |
| Destroyer | "I step out and win the ball." |
| Covering Role | "You step out, I'll cover behind you." |
| High Line Master | "We hold the line and shape." |
| Extra Frontman | "If we can attack, I'm joining too." |

**Destroyer + Build Up/Covering Role beats Destroyer + Destroyer** as a CB pairing —
two Destroyers can both step out of the line at the same time, leaving nobody covering.

## AI Playing Styles — a separate concept

Not the same as Attacking/Defensive Playing Style. The in-game help says these apply
**only when AI controls the player in possession**. Do not assume they drive the
user-controlled player or off-ball runs:

| AI Style | Tendency |
|---|---|
| Trickster | Uses dribbling/feints more often |
| Mazing Run | Likes to carry the ball through opponents |
| Speeding Bullet | Uses speed and explosive ball-carrying |
| Incisive Run | Cuts inside from the flank toward goal |
| Long Ball Expert | Looks for long passes / switches of play more often |
| Early Crosser | Crosses early, without waiting to reach the byline |
| Long Ranger | Looks for shots from distance more often |

Ronaldinho Gaucho's card (analyzed earlier in this project) has "Mazing Run" as its
COM Skill — this is the mechanism that skill belongs to.

## Updated analysis order

When budgeting a player, the order should now be:

**position → Attacking Playstyle → Defensive Playstyle → player model → skills →
stats/thresholds → booster.**

A given raw stat is not equally valuable across playstyles even at the same position.
90 Offensive Awareness is not worth the same to a Creative Playmaker as it is to a
Hole Player — a Hole Player will use that OA (and Acceleration) far more often for
off-ball runs.

---

# 19. Skill Mechanics Reference (raw Amadeusz testing data)

This is the primary empirical source section 8's guidance was distilled from. Each
skill's "Actual effect" is what Amadeusz's in-game testing found — not the marketing
description in the game's own tooltip. **A blank "actual effect" means untested, not
confirmed-to-do-nothing** — don't treat a blank cell as proof of no effect.

Important distinction: **the game's own skill description is not itself evidence of
a measurable effect.** Amadeusz tests a specific, narrow claim (e.g. "does this change
the Dribbling/Ball Control/Tight Possession stats or their in-game behavior") — a
skill can have zero measured effect on the exact thing tested while still doing
something real that just wasn't the specific test performed. Treat "not observed
during testing" as **unconfirmed**, not as **disproven**.

## Dribbling

| Skill | Actual effect |
|---|---|
| Double Touch | Also recovers the player's balance; the main advantage of "DT Boom" is that the GK's sideways shuffle doesn't react to the extra width Double Touch creates |
| Scissors Feint | (untested) |
| Flip Flap | Unlocks ball roll with Double Touch and Sole Control; creates more width but the animation is slower |
| Marseille Turn | (untested) |
| Sombrero | (untested) |
| Chop Turn | (untested) |
| Cut Behind & Turn | Also adds a Cruyff turn fake-shot animation |
| Scotch Move | (untested) |
| Sole Control | Dribbling, first-touch, and tight-control improvements were **not observed** in testing focused on those specific stats/behaviors. Confirmed value is unlocking ball roll together with Double Touch + Flip Flap. The game's own description ("control the ball more using the soles of his feet when executing feints and turns") describes a different, narrower claim about feint/turn execution specifically — that was not the thing tested, so it is unconfirmed, not disproven. Reasonable to keep for a player who regularly receives with their back to goal and has to turn away from a marker, even without the other two combo pieces. |
| Momentum Dribbling *(Show Time)* | Increases Touch Frequency beyond the normal stat limit, compared to a player with identical stats but no skill; heavily nerfed after initial release |
| Acceleration Burst *(Show Time)* | Official: permits a quick Sharp Touch while stationary/moving slowly and may trigger special Sharp Touch motions. Prior empirical observation: new animations. The screenshot alone does not establish that Acceleration is irrelevant. |
| Magnetic Feet *(Show Time)* | Official: improves ball retention in possession based on the number of opponents within 5 m, up to four. Magnitude and scaling untested. |

## Shooting

| Skill | Actual effect |
|---|---|
| Heading | Increases the likelihood of downward (more accurate) headers. Does not change animation or stats |
| Bullet Header *(Show Time)* | Greatly reduces headed-shot error when under physical pressure from defenders. Does not change animations |
| Long-range Curler | Equivalent to +10%+ Finishing and Kicking Power, plus Curl. Not a Type 3 stat skill, so it can exceed the 99 cap; can compensate for a weak-foot debuff. Works on any curl shot, not just long-range |
| Blitz Curler *(Show Time)* | Modifies curl-shot trajectory to a high dipping shot aimed at the top corners. Does NOT change stats. Stat importance: KP > Curl > Finishing |
| Chip Shot Control | (untested) |
| Knuckle Shot | Knuckleball movement; increases scoring chance, less than Dipping Shot. Usable at free kicks too. Activate: Stunning Shot at 50-65% power |
| Dipping Shot | Ball travels straight with vertical dip; the largest scoring-chance increase of the 3 stunning-shot skills because the straight trajectory targets bottom corners more easily. Activate: Stunning Shot at 20-50% power, ideally 40-50% |
| Rising Shot | Ball rises sharply — satisfying but actually *decreases* overall scoring chance because it often clears the crossbar. Activate: Stunning Shot at 65%+ power |
| Long-range Shooting | +10% Finishing on shots from outside the box; does not add Kicking Power |
| Low Screamer *(Show Time)* | Official: a Stunning Shot under 50% gauge gains shot speed and will **not** trigger Dipping Shot. Prior empirical estimate: +5.5% ball speed; animation timing not measured here. |
| Acrobatic Finishing | Adds acrobatic shot animations (bicycle kick, scorpion kick, etc.) |
| Heel Trick | Not found to affect the likelihood of heel shots or passes — more testing required |
| First-time Shot | "One-touch Pass" for shooting — reduces error on a shot taken first-time |
| Phenomenal Finishing *(Show Time)* | Greatly reduces shot error from an awkward body position. Does not change animation or stats |
| Willpower *(Show Time)* | +1 Finishing and +1 Kicking Power every shot taken, up to +8 total. Headers don't count |

## Passing

| Skill | Actual effect |
|---|---|
| One-touch Pass | "First-time Shot" for passing — reduces error on a pass played without controlling the ball first |
| Through Passing | +20% to both passing stats on a low or lofted through ball. Does not affect Curl or Kicking Power |
| Weighted Pass | Official: accurate lofted pass or chipped through ball with heavy backspin to a forward area. Prior testing observed a narrower activation from the defensive half; do not equate that test boundary with a proven universal rule. |
| Pinpoint Crossing | +10% to both passing stats depending on which cross button is used. Does not affect Curl or Kicking Power |
| Edged Crossing *(Show Time)* | Changes ball rotation from horizontal to vertical; activates on the weak foot when WF Accuracy is "Very High"; greatly increases ball speed on a normal cross |
| Outside Curler | Official: precise outside-of-foot shot/pass, even from distance, using the stronger foot. Prior empirical result: earlier animation and improved accuracy for tested trivela situations; do not treat three frames as universal. |
| Rabona | Rabona animation for shots and passes only |
| No Look Pass | Purely a "looking away" animation with no gameplay benefit |
| Game-changing Pass *(Show Time)* | +10% to both passing stats while drawing or losing in the 2nd half |
| Visionary Pass *(Show Time)* | A weaker First-time Shot + One-touch Pass for the **receiver** of the pass, plus improved first touch quality. Only helps the person receiving the pass, not the passer |
| Phenomenal Pass *(Show Time)* | Phenomenal Finishing, but for passes — reduces pass error from an awkward body position |
| Low Lofted Pass | Ball travels lower and takes a shorter path, faster and more accurate. Does not activate on a lofted through pass or a cross |

## GK & Others

| Skill | Actual effect |
|---|---|
| GK Low Punt | Changes the goal-kick punt path to fly lower and faster |
| GK High Punt | Increases distance and speed of the high kick — useful with a tall striker up front to flick on |
| Long Throw | Max throw range increases from 21m to 29m |
| GK Long Throw | Increases a goalkeeper's max throw range |
| Penalty Specialist | +10 (flat, not %) to Finishing and Place Kicking when taking a penalty |
| GK Penalty Saver | Predicted increase to goalkeeping stats during a penalty save |
| GK Directing Defence *(Show Time)* | Predicted increase to Tackling — testing confirmed it does NOT increase Defensive Awareness |
| GK Spirit Roar *(Show Time)* | Predicted increase to Physical Contact |
| Gamesmanship | Easier to win fouls when shielding the ball or clipped during close physical duels/dribbling, including inside the box (can draw penalties). Target profile is agile dribblers/wingers with LOW Physical Contact who get out-muscled in tight spaces — NOT physically dominant players. A player with high Physical Contact already holds up under contact and doesn't need the crutch. Consistent with our own low-Balance note above: this skill helps the physically vulnerable, not the physically dominant. Community reports inconsistent results (referees often don't call it) — treat as a situational, not a slam-dunk, pick even for the right profile. |

## Defending

| Skill | Actual effect |
|---|---|
| Man Marking | Official: reacts quickly to an opponent’s movement and applies close marking. Magnitude untested. |
| Track Back | Official: pressures the opponent carrying the ball aggressively from the front line. Empirical effect/magnitude untested. Do not infer a large DMF tracking bonus from the skill name. |
| Interception | Official: reacts to passes quickly and intercepts more often. Magnitude untested. |
| Blocker | Official: reacts to kicks, blocks passes/shots more often and reduces rebounds. Magnitude untested. |
| Aerial Superiority | Increases the chance of winning an aerial duel when both players have similar Jump Height. Duels won via this skill in shooting scenarios have low accuracy and do NOT help with scoring |
| Sliding Tackle | Predicted increase to the Tackling stat specifically when performing a sliding tackle |
| Long-reach Tackle *(Show Time)* | Official: increases frequency of standing tackles against distant opponents while stationary or moving slowly. Empirical observation: extra animations/reach. Do not assume unconditional reach at full sprint. |
| Fortress *(Show Time)* | Official: improves defensive abilities after the second-half mark while the team has a goal advantage. Prior empirical estimate: +5% DA/Tackling; other stats need testing. A lead at halftime is not required. |
| Acrobatic Clearance | Adds acrobatic clearance animations (e.g. bicycle-kick clearance) |
| Aerial Fort *(Show Time)* | Official: improves aerial duels **inside the player’s own penalty box**. Prior jump-height interpretation must be applied within this positional restriction. |

## Miscellaneous

| Skill | Actual effect |
|---|---|
| Captaincy | Official: reduces fatigue effects for the entire team. Prior narrow testing found no observable stamina increase; distinguish fatigue effect from an increase in the visible stamina stat. |
| Attack Trigger *(Show Time)* | Official: raises **other teammates’** Attacking Awareness while the holder controls the ball. Magnitude untested; does not claim a boost for the holder. |
| Super-sub | +5% Finishing and +1% Speed/Acceleration. Does NOT raise the Condition arrow by a step, despite common belief |
| Fighting Spirit | Official: preserves kicking/heading accuracy under pressure and reduces fatigue effects. Prior narrow testing observed reduced shot/pass error but no stamina effect; the fatigue claim remains unverified, not disproven. |

---

# 20. Official In-game Help Cross-check (screenshots, 24 Sep 2026)

These are **paraphrases of the in-game help**, not measured stat formulas. Screenshots
IMG_1229–IMG_1262 overlap; repeated images with `(1)` have identical content. Keep
section 19’s empirical claims separately and flag any disagreement for testing.

## Attribute definitions that change build interpretation

| Attribute | Official meaning (paraphrased) | Build implication / limit |
|---|---|---|
| Attacking Awareness | Attack reaction, including running past defenders | The tooltip does not quantify run frequency or the value of 90+. |
| Ball Control | Accuracy on trapping/feints that prepare the next action | Do not label it a pure dribble speed stat. |
| Dribbling | Ball-carrying accuracy, quickness, top speed and acceleration | Section 2’s off-ball speed model must **not** be carried over uncritically to on-ball movement. |
| Tight Possession | Turning skill during slow dribbling | Most relevant to tight turns; not a universal speed boost. |
| Low Pass; Lofted Pass | Accuracy and speed of corresponding passes | Includes low/chipped through balls respectively. |
| Finishing | Shot accuracy, including first-time and off-balance shots | Skill effects may still alter specific situations. |
| Heading | Accuracy and speed of headers for shooting, passing, clearing | Distinct from Jumping’s aerial reach. |
| Set Piece Taking; Curl | Set-piece accuracy; bend on shots, passes, set pieces | Avoid substituting either stat for Kicking Power. |
| Speed; Acceleration | Movement and dribbling speed; acceleration in movement and dribbling | Official text does not give distance, curve or thresholds. |
| Kicking Power | Power on shots, passes and set pieces | Applies beyond shooting. |
| Jumping | Height of jump and success in aerial duels | Interpret alongside player model and Heading. |
| Physical Contact | Holding off opponents and keeping balance under physical pressure | Distinct from Balance’s tackle resistance. |
| Balance | Resisting tackles and staying upright after physical contact | Not an alias for Physical Contact. |
| Stamina | Fitness and endurance | Separate from condition/form. |
| Defensive Awareness | Defending reaction, including pressing the ball carrier | Not simply “positioning” in the official wording. |
| Tackling | Range of standing/sliding tackles for winning the ball | A range description, not a measured tackle probability. |
| Aggression | How forcefully player presses/tackles | Does not itself confirm successful ball wins. |
| Defensive Engagement | Willingness to defend and speed of returning to position | Distinct from Aggression. |
| GK Awareness | Keeper reaction, positioning and recovery | Separate from GK Reflexes. |
| GK Catching | Catching stronger shots | Separate from parrying. |
| GK Parrying | Clearing shots away from second chances | Not the same as catch reliability. |
| GK Reflexes | Response to close shots and 1v1s | Separate from long-range reach. |
| GK Reach | Shot-blocking coverage against fast or well-placed shots | Check alongside height and model. |

Source: IMG_1237–IMG_1242. The more exact 16–18 m acceleration statement in
section 2 remains **empirical**, not an official definition, and is about the
reported off-ball test scenario.

## Characteristics and training

- Weak Foot Usage: frequency of weaker-foot use; “Regularly” means frequent use.
- Weak Foot Accuracy: accuracy of passes/shots with the weaker foot.
- Form: variability of match condition; “Unwavering” varies less.
- Injury Resistance: susceptibility to injury; “High” means less frequent injury.
- Position proficiency has low (uncoloured), intermediate (faded green), high
  (bright green) levels. Position Training uses special tokens only for available
  Additional Position Proficiency Slots; high is the cap. **A position’s proficiency
  is separate from a playing style’s compatible-position rule.**
- At most five additional skills; duplicate training has no effect; additions can
  be overwritten/deleted; Trending players cannot undertake Skill Training.

Source: IMG_1243–IMG_1244 and IMG_1260.

## Skill descriptions to retain beside empirical tests

| Skill | Officially described situation / effect | Evidence caution |
|---|---|---|
| Tap Trick | Executes a specific feint with its command | Screenshot IMG_1247 shows a controller icon; do not infer an unverified button sequence from OCR. |
| Sombrero | More accurate Sombrero/Rainbow Flick, plus Sombrero when receiving a low pass | Feint-specific. |
| Sole Control | Uses soles more in feints and turns | Broad raw-stat gains are unproven. |
| Momentum Dribbling | Improved dribbling in the attacking third | Do not generalize to all zones. |
| Acceleration Burst | Quick Sharp Touch when still/slow; special motions possible | Not a flat Acceleration stat bonus. |
| Magnetic Feet | Retains ball better with nearby opponents, up to four within 5 m | Scaling and magnitude unmeasured. |
| Snap Strike | Reduces time to take a Stunning Shot | No proven frame count. |
| Low Screamer | Speeds up Stunning Shot below 50% gauge; prevents Dipping Shot | This interaction matters when both skills are present. |
| Through Passing | Changes through-ball trajectory and improves accuracy | Empirical +20% estimate is separate. |
| Weighted Pass | Backspinning accurate lofted/chipped forward ball | Official wording does not restrict it to defensive half. |
| Outside Curler | Strong-foot outside-of-foot shot/pass, even from range | Useful for trivela passing when body angle permits. |
| Visionary Pass | Improves receiver’s one-touch pass, first-time shot and trap | Applies to the receiver, not to the holder’s own passing stat. |
| Phenomenal Pass | Improves power/accuracy from unusual passing body positions | Not a blanket increase to every pass. |
| Track Back | Presses the opposing ball carrier from the front line | Box-to-Box defensive movement does not prove the skill redundant, but central DMF value is unclear. |
| Man Marking; Interception; Blocker | Tight marking; more frequent interceptions; more blocks with fewer rebounds | Descriptions do not quantify magnitude. |
| Power Tackle | Body-contact standing tackle; more opponent imbalance | New skill; do not infer flat Tackling/Physical Contact bonus. |
| Shadow Hunt | Speed-related recovery when a pass goes behind a DMF, LB, RB or CB | No confirmed stat, duration or magnitude. |
| Attacking Surge | Speed-related abilities in attacking half when teammate has ball | Distinct trigger from Shadow Hunt. |
| Attack Trigger | Teammates’ Attacking Awareness while holder has the ball | Excludes holder; magnitude unmeasured. |
| Fortress | Defensive improvement after halftime while leading | Halftime score need not have been a lead. |
| Aerial Fort | Improved aerial duels in own penalty box | Not a field-wide aerial boost. |
| Fighting Spirit; Captaincy | Under-pressure kick/header accuracy and fatigue resistance; team fatigue reduction | Narrow tests did not observe a visible Stamina increase; do not present that as disproof. |

Source: IMG_1245–IMG_1259. The other listed skills remain in section 19; exact
activation thresholds for Knuckle (50–65%), Dipping (20–50%), Rising (65–95%)
and Blitz Curler (at least 50%) are given by the in-game descriptions, but
shot outcomes and numerical boosts remain empirical and patch-sensitive.

## Style-position corrections and evidence conflicts

- Attacking compatibility is recorded in section 18. In particular **Classic No. 10**
  is officially described as high-positioned, initiating attacks and also going
  for goal. Earlier “static” wording was an inference and should not be treated
  as an official mechanic.
- **High Line GK** is described as covering space behind defenders when the team
  attacks. Our older “extra passing option” claim lacked support in these screenshots.
- **Covering Role** refers to covering teammates performing Match-up; “always
  tracks runs in behind” was too specific.
- **AI Playing Styles** apply when AI controls the **ball holder**; they are not
  evidence of off-ball movement for a user-controlled card.
- Empirical numerical bonuses, animation timings and stat thresholds throughout
  this document were **not revalidated** by the in-game screenshots. Treat the
  official paraphrases and measurements as separate kinds of evidence.

---

# 21. User's Confirmed Squad Cards

The canonical user-specific card registry is **[`USER-SQUAD.md`](./USER-SQUAD.md)**.
Keep this knowledge-base section intentionally compact so build doctrine and user data do
not drift apart. When exact ownership/card identity matters, read `USER-SQUAD.md` first.

Hard rules:

- Never substitute another release of the same player when calculating progression,
  native skills, boosters or final stats.
- A screenshot or explicit eFHUB ID from the user overrides an older mapping.
- If an ID-to-player mapping is not confirmed, keep the ID as **unmapped** rather than guessing.
- Old build snapshots are historical evidence, not permission to overwrite a newer screenshot.

High-confidence exact cards carried into the registry include:

| Player | Exact card ID | Notes |
|---|---:|---|
| Gianluigi Buffon | `88040387118039` | Explicitly confirmed; current trained GK build still requires a current screenshot. |
| Ruud Gullit | `88039045074410` | User-confirmed mapping. |
| Samuel Eto'o | `88040387118554` | User-confirmed mapping. |
| Zlatan Ibrahimović | `88040387119642` | User-confirmed mapping. |
| Eden Hazard | `89137214427270` | User-confirmed mapping. |
| Wesley Sneijder | `88040387121974` | User-confirmed mapping. |
| Marcel Desailly | `89138288270047` | User-confirmed mapping. |
| Neymar | `89133993205152` | User-confirmed mapping. |
| Jaap Stam | `88045755964131` | Explicitly confirmed in the owned-card pool. |

The full owned-card snapshot, working name mappings, additional confirmed cards outside
that snapshot, current role notes and dated build snapshots are maintained in
`USER-SQUAD.md`.

---

# 22. User's Owned Managers (screenshots, 24 Sep 2026; Mourinho 16 Oct 2026)

These eight **specific manager cards are confirmed owned by the user**. Keep
their Link-up requirements separate from their team playstyle proficiency;
the manager's listed effect cannot be assumed active until both player roles
and positions match the card.

| Manager | Team booster | Possession | QC | LBC | Out Wide | Long Ball | Overload | Link-up Play | Center Piece | Key Man |
|---|---|---:|---:|---:|---:|---:|---:|---|---|---|
| D. Deschamps | Speed +1; Ball Control +1 | 89 | 68 | 89 | 59 | 63 | N/A | Breakthrough Pass A | Creative Playmaker, AMF | Goal Poacher, CF |
| R. Martínez | Finishing +1; Attacking Awareness +1 | 58 | 90 | 70 | 64 | 89 | N/A | Diagonal Long Pass B | Creative Playmaker, LWF/RWF | Attacking Full-back, LB/RB |
| F. Beckenbauer | Dribbling +1; Defensive Awareness +1 | 65 | 57 | 89 | 60 | 89 | N/A | Breakthrough Pass B | Box-to-Box, CMF | Goal Poacher, CF |
| Jürgen Klopp | Speed +1; Aggression +1 | 89 | 89 | 59 | 70 | 57 | N/A | Over-the-Top Pass C | Build Up, CB | Prolific Winger, LWF/RWF |
| Xabi Alonso | Ball Control +1; Finishing +1 | 71 | 89 | 54 | 89 | 56 | N/A | Breakthrough Pass A | Creative Playmaker, AMF | Goal Poacher, CF |
| Fabio Capello | Defensive Awareness +1; Finishing +1 | 46 | 57 | 89 | 64 | 89 | N/A | Over-the-Top Pass A | Orchestrator, DMF | Goal Poacher, CF |
| Frank Lampard | Low Pass +1; Defensive Engagement +1 | 75 | 60 | 58 | 69 | 89 | 89 | 1-2 Cut-in A | Creative Playmaker, LWF/RWF | Fox in the Box, CF |
| José Mourinho | Finishing +1; Aggression +1 | 62 | 82 | 90 | 67 | 75 | 59 | Shadow Link A; 1-2 Cut-in C | Deep-Lying Forward, CF; Prolific Winger, LWF/RWF | Classic No. 10, AMF; Deep-Lying Forward, CF |

The first screenshot contains two cards. Screenshots in displayed order: `14.07.50` (Deschamps/Martínez),
`14.07.55` (Beckenbauer), `14.08.00` (Klopp), `14.08.06` (Alonso),
`14.08.23` (Capello), `14.08.36` (Lampard). `N/A` is as shown on the
manager card; do not record it as 0 proficiency.

José Mourinho: screenshot `19.14.39` (16 Oct 2026) — the eFHUB card released 10 Sep 2026
(id `17608560707469`, Finishing +1 / Aggression +1), not his two older cards (Physical
Contact / Stamina, Aug 2025; Tackling, Feb 2025). One card, two Link-up plays: Shadow Link A
and 1-2 Cut-in C.

## Application to the current 4-2-2-2 Quick Counter XI

- Prefer **Xabi Alonso (QC 89)** for the currently proposed XI, contingent
  on verifying that the user's exact Sneijder card is Creative Playmaker at
  AMF and the exact Eto'o card is Goal Poacher at CF. This satisfies the
  displayed Breakthrough Pass A role/position pair without moving Hazard,
  Vieira or Seedorf out of their intended jobs. The screenshots give the
  prerequisites, not a measured estimate of the Link-up effect.
- **R. Martínez (QC 90)** gives Finishing +1/OA +1 but his Link-up requires
  a Creative Playmaker winger and Attacking Full-back. Those roles are absent
  from the proposed narrow 4-2-2-2. Do not change formation solely to turn
  on his Link-up.
- **Klopp (QC 89)** requires a Build Up CB and a Prolific Winger LWF/RWF;
  similarly, its link-up does not fit this narrow formation.
- For a future LBC shape, **Beckenbauer (LBC 89)** can link a Box-to-Box CMF
  (Seedorf if this is confirmed on his exact card) with Goal Poacher CF
  (Eto'o). **Deschamps (LBC 89)** has the same role/position Link-up pair as
  Alonso. Capello's LBC 89 Link-up specifically calls for an **Orchestrator
  DMF**; Vieira's Anchor Man at DMF would not satisfy it.
- **Mourinho (LBC 90, owned 16 Oct 2026)** has the squad's highest Long Ball Counter
  proficiency, but for the current 4-2-2-2 his Finishing +1 / Aggression +1 is worth
  about 15 training points across the XI against Deschamps' 20 (section 11 — Aggression
  does nothing for this XI), and neither Link-up fits: Shadow Link A needs a Deep-Lying
  Forward CF with a Classic No. 10 AMF (Puskás or Messi's SS card, with Stojković), 1-2
  Cut-in C a Prolific Winger with a Deep-Lying Forward CF. Deschamps stays; Mourinho is
  the manager for a Deep-Lying Forward front line, not this one.

---

# 23. Team Playstyles and Match-ups (community guides, Oct 2026)

What each team playstyle does, from community guides for eFootball 2026/2027 (v6.0.0) —
**not official text and not measured**. The Build Lab's Lineup tab ("Match helper") reads
this section through `data/knowledge.js`.

| Playstyle | In attack | Out of possession | Wants |
|---|---|---|---|
| Possession | Short passing, patient build-up, few runs behind | High line, coordinated press | Technical midfield |
| Quick Counter | Immediate vertical runs after winning the ball | High line, aggressive pressing | Pace up front, energetic midfield |
| Long Ball Counter | Spreads out, long balls to runners breaking the line | Deep compact block protecting the box | Runners who finish, second-ball midfielders |
| Out Wide | Width, overlaps, early crosses | Shape protects the channels, wingers drop | Quality wingers and overlapping full-backs |
| Long Ball | Direct balls to a focal striker, runners on second balls | Slightly deeper line | A strong target striker |
| Overload (new in v6.0.0) | Players crowd the ball side for short options | Compact, quick pressure, higher line | Players who receive in tight space |

**Match-up triangle (community rule of thumb — not tested):** Quick Counter beats
Possession, Possession beats Long Ball Counter, Long Ball Counter beats Quick Counter.
The 11 Oct 2026 web check (section 25) found no test or official source confirming it —
use it as a starting guess and judge by how the match goes.

**Answers to the other three are our reasoning, not a sourced match-up:**

- vs **Out Wide** — Long Ball Counter: their full-backs go high, so counter into the
  space they leave; keep one full-back home (Defensive) and mark their best winger tightly.
- vs **Long Ball** — Possession: keep the ball away from a direct side that sits deeper;
  put your best aerial CB on their target striker (Tight Marking).
- vs **Overload** — Long Ball Counter: they crowd one side and push the line up, so
  switch play to the far side and run in behind.

**Individual instructions (from the same guides):** Defensive on an Anchor/Destroyer DMF
or on full-backs that otherwise overlap; Counter Target on a striker who should stay high;
Tight Marking on the opponent's most dangerous attacker. **v6.0.0 removed the Attacking
and Deep Line instructions** (official patch notes). Two instructions per group:
Defensive / Anchoring (offensive group); Counter Target / Tight Marking / Man Marking
(defensive group), Man Marking only during a match (mejoress guide, pre-v6 — re-check in
game).

Sources: gamemarket.gg v6.0.0 Team Playstyle Guide; FIFPlay eFootball 2026 Team
Playstyles; eFootball Edge "Rock, Paper, Scissors of Playstyles"; Skycoach Best eFootball
Formations 2026; mejoress Individual Instructions guide.

---

# 24. Long Ball Counter 4-2-2-2 — game template (Oct 2026)

How to play the user's base setup (Long Ball Counter, 4-2-2-2 attacking / 4-4-2 defending
via Fluid Formation). Mixed evidence — each line says where it comes from: **[tested]** =
section 19, **[official]** = in-game text (sections 18/20), **[guides]** = community guides
(section 23), **[reasoning]** = ours, not measured. The squad-specific version (names, subs,
set-piece takers) is `USER-SQUAD.md` §3 "Game plan — 10 Oct 2026" and the Build Lab's
Game Plan tab (`data/knowledge.js` → `GAME_PLAN`).

**Principle:** defend deep and compact, then go forward in three passes or fewer — long to
the target striker, in behind for the Goal Poacher, or into the AMFs between the lines.
[guides]

## Build-up

- No more than three passes in your own half; when pressed, the long ball is the plan, not
  a panic clearance. [guides]
- Centre-backs pass or go long, never carry. Through Passing (+20% to both passing stats on
  low and lofted through balls) makes their balls in behind work. [tested]
- GK High Punt: longer, faster punts — useful with a tall striker to flick on. [tested]
- Phenomenal Pass on a ball-winning midfielder makes the first pass after a regain work
  from an awkward body position — play it forward at once. [tested]

## Attack patterns

1. Long ball to the tall Fox in the Box / Target striker; the Goal Poacher runs past him;
   the AMFs attack the second ball. [reasoning]
2. Link-up through ball: Center Piece (Creative Playmaker AMF) → Key Man (Goal Poacher CF)
   on the last defender's shoulder. The Link-up's measured effect is unknown. [reasoning]
3. Inside carry by a Momentum Dribbling / Magnetic Feet AMF in the half-space, then curl,
   slip the striker or switch. [official]
4. Wrong-footed AMF cutting in for a controlled curl shot at 50%+ power — Blitz Curler's
   dipping curve (Kicking Power > Curl > Finishing). [tested]
5. Byline cutback to the Fox in the Box — he lives on cutbacks, rebounds and low crosses.
   [official]

## Finishing

- Willpower: +1 Finishing / +1 Kicking Power per shot, up to +8, headers don't count —
  shoot early with its holder. [tested]
- Low Screamer: sub-50% stunning shots get faster and never become Dipping Shots. [tested]
- Long-range Curler works on any curl shot (≈ +10% Finishing and Kicking Power). [tested]

## Without the ball

- Fluid Formation gives a separate defence shape — usually the AMFs drop to LMF/RMF for a
  4-4-2 block; an AMF with no wide proficiency stays central and a Box-to-Box DMF takes
  his flank instead. Don't press with two players. [guides]
- Defend with the DMF in front of the box and let the AI centre-backs hold the line;
  pulling a CB out by hand opens the through ball. [reasoning]
- Long-reach Tackle works while the defender is still or moving slowly — jockey, don't
  sprint into tackles. [official]
- Press only on a trigger: back pass, heavy touch, full-back trapped on the touchline.
  [reasoning]
- Shadow Hunt (recovery when a pass goes in behind a DMF/LB/RB/CB) and Aerial Fort (own-box
  aerial duels) on the back line; Fortress improves defending in the second half while
  leading. [official]
- Both full-backs never go forward together; width comes from the AMFs. [reasoning]

## Game management

- First 15 minutes: identify the opponent's playstyle and answer it (section 23 triangle;
  Build Lab Match helper). [guides]
- v6.0.0 made Long Ball Counter's counters cost normal stamina (section 25) — first
  attacking sub around 55–60'. [official]
- ~60': Super-sub (+5% Finishing, +1% Speed/Acceleration) for a tired attacker. [tested]
- Chasing: fresh target striker and a fresh Goal Poacher (keeps the Link-up); against a deep
  block switch to Possession with an Orchestrator. [reasoning]
- Protecting: a second holding midfielder with the Defensive instruction; replace a
  Destroyer CB only with a Destroyer, never pair two. [reasoning]

---

# 25. Web research cross-check (11 Oct 2026)

A web sweep of official KONAMI notes, skill databases and community guides. Reddit and the
original Amadeusz videos couldn't be opened, so tests attributed to him are second-hand.
Labels: **[official]**, **[skill DB]** = efootbase.com (fan database, numbers read like
in-game help, source not stated), **[guide]** = community opinion.

## v6.0.0 changes that matter for Long Ball Counter [official]

Source: https://www.konami.com/efootball/en/page/v6/versioninfo_v6-00 (v6.0.0, Aug 2026).

- Long Ball Counter used less Stamina than other playstyles on counters; the consumption
  level was revised — its counters now cost normal stamina. Plan the first attacking sub
  earlier (~55–60').
- Attackers no longer sprint flat-out right after a regain; runners shake off their marker
  before running in behind and avoid offside better; wide players run diagonally in behind.
- Defenders tracking a runner no longer drop too far — through balls and crosses from deep
  are easier to land with the right timing.
- Match-up keeps the defender moving instead of pausing; the reaction speed of defenders you
  don't control depends on Defensive Awareness; AI teammates press less early on a pass;
  some tackle motions that won the ball too easily were reduced; position adjustment depends
  on Defensive Engagement and the Interception skill.
- The Attacking and Deep Line individual instructions were removed.
- Fluid Formation: separate attacking and defensive formations in the Game Plan, also
  settable inside the Sub-Tactic.
- v5.2.0 (early 2026): through balls were weakened, Defensive Awareness affects a defender's
  acceleration while marking, and Acceleration drops less as stamina falls.
- v6.1.0 (~Oct 2026): no gameplay changes.

## Link-up Play [official + guide]

KONAMI: the Center Piece and Key Man "combine in special ways and receive a boost to their
abilities at specific moments" — no magnitude published. Guides (gamingonphone, Jan 2026):
Breakthrough Pass triggers when the Creative Playmaker AMF receives in the attacking half;
the Goal Poacher then hunts space behind and through/chipped balls into him are more
accurate. Re-check the activation indicator in both Fluid Formation shapes.

## Formation meta [guide]

No post-v6 source ranks formations with data. 4-2-2-2 stays in the top LBC group; 4-2-1-3
is the most named alternative (efootballlab suggests it for Deschamps' Creative Playmaker
AMF → Goal Poacher CF Link-up). Guides advise keeping the attack and defence shapes of
Fluid Formation close, so transitions don't leave gaps.

## Condition and form [official + guide]

- Condition is set weekly from the Live Update Rating published the week before
  (KONAMI news 5179, May 2026). [official]
- Legend, Epic and Big Time cards are fixed at condition B; Form (Inconsistent / Standard /
  Unwavering) matters for cards whose condition moves. [guide, gamingonphone Sep 2026]
- No published stat value per arrow. Guides: arrows break ties, they don't rebuild the XI;
  swap only like-for-like. [guide]

## Skill values from the skill database [skill DB — unverified]

Confirms section 19: Through Passing +20% Low and Lofted Pass on through balls; Super-sub
+5% Finishing, +1% Speed/Acceleration (subbed on at or after half-time); Willpower up to
+8 Finishing and +8 Kicking Power with shots, feet only — the "+1 per shot" step is not
stated anywhere; Penalty Specialist +10 Finishing/Place Kicking (flat). New values:

- Attacking Surge: ≈ +8% Acceleration and Attacking Awareness in the attacking half while a
  teammate has the ball, on AI-controlled runs (second-hand Amadeusz: one of the strongest).
- Fortress: +5% Defensive Awareness and Tackling when leading in the second half.
- Magnetic Feet: +8 Dribbling, Tight Possession and Physical Contact while heavily marked.
- Momentum Dribbling: +6 Dribbling, Tight Possession and Speed on the ball in the final third.
- Game-changing Pass: +6/+6 passing when losing at half-time.

No numbers found for Long-reach Tackle, Aerial Fort, Interception, Blocker, Man Marking,
Captaincy, Fighting Spirit, Acceleration Burst, Low Screamer's speed gain, or for the
Acceleration 88/91 and Offensive Awareness 90 thresholds.

## Defending practice [guide]

Position, contain, then tackle; Call for Pressure only in ~1 s bursts; don't press with a
centre-back; Shoulder Charge only level with the dribbler; switch player before the pass
arrives. Button mappings differ between guides — use the in-game Command List
(footymeta Oct 2026, FIFPlay 2027 controls, gamemarket Sep 2026).


## Passing and Physical Contact (second sweep, 11 Oct 2026)

**What the web has:**

- **No tested thresholds** for Low Pass, Lofted Pass or Physical Contact. Two YouTube
  "passing stats" and "threshold" tests exist but couldn't be read. Section 3's 82 / 87
  remain our own working numbers. [guide]
- **Low Pass** sets both the accuracy and the speed of ground passes (FIFPlay 2026 stat
  definitions). eFHUB (Sep 2026) says the current engine intercepts ground passes more
  easily. A faster, more accurate first pass matters more for a counter team. [guide]
- **Physical Contact is relative.** KONAMI v4.0.0: in a physical contest "the player with
  the higher Physical Contact stat will have an advantage". AI players weigh relative
  Physical Contact before a Shoulder Charge, and shielding is automatic. [official]
- Balance does not decide physical duels; it only stops a player losing his balance or
  helps him recover (eFHUB, Sep 2026). [guide]
- **Patches:** v5.4.0 added physical-contest motions and made defenders likelier to tackle
  in side-on contests. v6.0.0 changed contact motions for dribblers only. No patch
  changed the weight of the stat. [official]
- **Skill numbers:** none found for Through Passing, Weighted Pass or Low Lofted Pass.
  Through Passing's +20% (section 19) stays a single-source skill-DB value.

**Community builds:** treated as popularity data, not tests (user, 11 Oct 2026). Midfield
passing is a secondary category. Strikers put Aerial Strength at 3–8 and Passing at 0–1.

**What changed in our builds (our reasoning):**

- **Box-to-Box and All-Action Defender midfielders aim for Low Pass 87** (section 3's
  ideal) instead of 82–85. In Long Ball Counter they play the first forward pass after a
  regain, so its speed and accuracy decide whether the counter starts.
  - The Box-to-Box role no longer drops to the Through Passing minimum of 82.
  - Seedorf: Low Pass 82 → 87, paid with one level each of Dexterity and Lower Body.
  - Makélélé: Low Pass 85 → 88, paid with two Dribbling levels. His defensive stats are
    unchanged.
- **Physical Contact unchanged everywhere:**
  - Because the stat is relative, +4 for Eto'o (80 → 84) still loses to a centre-back
    with 90+. His Ball Control 94 matters more for controlling long balls.
  - Hazard's Magnetic Feet already adds +8 Physical Contact when he is heavily marked.
  - Messi stays light by design (section 5).
  - Ibrahimović (99) and the defenders already win their duels.
- **Strikers get no extra Passing:**
  - Ibrahimović's spare points sit in Aerial Strength (Heading 89 threshold) and Ball
    Control 89.
  - Eto'o runs in behind; a lay-off doesn't justify taking points from his core stats.
- **Hazard keeps his Dribbling** (Momentum Dribbling and Magnetic Feet carry role).
  Moving 2 Dribbling levels into Passing would only take Low Pass 89 → 92, above the
  ideal he already meets.

## Skills, defending, keepers and v6 match play (third sweep, 11 Oct 2026)

- **Skill Training pool** [skill DB, Operation Sports Aug 2026]: the same 44 trainable
  skills as our pool. Show Time skills stay card-only, including Shadow Hunt, Power Tackle
  (Sep 2026), Tap Trick, Snap Strike, Long-reach Tackle, Fortress and Aerial Fort.
  - v6.1.0 adds **Select Skill Tokens** [official]: 100 tokens buy any trainable skill.
    Advanced tokens convert at 20 each. Our five-skill lists can now be bought exactly.
  - GK skills are trainable too, but Buffon already has all four, so his slots are filler.
  - No published odds for random training.
- **No numbers anywhere** for Long-reach Tackle, Interception, Blocker, Man Marking,
  Aerial Fort, Aerial Superiority, Sliding Tackle, Acrobatic Clearance, Track Back,
  Captaincy, Fighting Spirit or Gamesmanship. Descriptions only. No tested thresholds
  for Defensive Awareness, Tackling, Defensive Engagement or Aggression.
- **Other v6.0.0 notes** [official]:
  - Centre-backs recover a little more stamina at half-time.
  - Forwards track back more when the opponent attacks deep.
  - Sliding-tackle foul calls were revised.
  - Keepers' one-on-one positioning was revised, so they react to dribbling more easily.
  - Accuracy improved on one-time shots from fast-moving balls.
- **eFHUB v6 engine survey** (22 Aug 2026; pro group plus 200 players) [guide]:
  - 89% of the pros say **lofted through balls improved**; about half say ground
    through balls got worse.
  - Ground passes are intercepted more easily, which the author thinks hurts Long Ball
    Counter.
  - Long-range and Stunning shots still pay off.
  - Keepers are far too strong in one-on-ones.
  - Fluid Formation drains stamina.

  **Applied:**
  - The Game Plan defaults to the chipped through ball and finishes one-on-ones early or
    with a chip.
  - Every Goal Poacher gets Chip Shot Control among the AI skills. Eto'o swaps Fighting
    Spirit for it.
  - The DMF passing change above (Low Pass 87) fits the same finding.
- **Formation guides** (Aug–Sep 2026) [guide]:
  - 4-2-2-2 and 4-2-1-3 stay at the top for counter styles.
  - Operation Sports advises against Fluid Formation, because players leave gaps while
    switching. Our two shapes differ only by Seedorf moving wide.
- **Individual instructions in v6** [guide]:
  - Attacking group: Anchoring, Defensive. Defensive group: Counter Target, Tight Marking,
    Man Marking (in-match only). Two per group.
  - No source tests Tight Marking in v6.
- **Keepers:** v6.1.0 adds a **Build Up GK** playing style (Zion Suzuki so far). No
  tested GK thresholds or GK1–GK3 community builds were found.
- **Overall rating:** KONAMI never published the formula. A 1-point gap with the game
  (Messi 109 in game vs 108 here) has no confirmed cause.
- **Condition:** Epic, Big Time and Legend cards stay at B according to one guide.
  Community estimates put the gap between the best and the worst arrow at "a few points
  per stat", with no exact figures.
- **Card reviews** (eFHUB, Sep–Oct 2026) [guide]: per-card notes are in USER-SQUAD.md.
  - An attacker whose playing style doesn't apply at his slot makes few runs of his own.
    The review's example is a Prolific Winger at CF, which agrees with section 18.
  - eFHUB thinks v6 weakened heading.
- **Not found:** pro setups for the v6 season. FIFAe Finals are 16–25 Oct 2026; the July
  2026 world finals were played on v5.

## Community builds for the squad's cards (eFHUB top-voted, read 11 Oct 2026)

The most-voted eFHUB community build for each of the 23 Game Plan cards was compared with
the Recommended by AI build. eFHUB shows no date or reasoning, and most top builds assume
Fabio Capello, so they are popularity data, not tests. Patterns:

- **Strikers:** almost all use `10-0-4/6-12-8-4` with Striker's Instinct — maximum
  Shooting and Dexterity, **no Passing**. Adopted: the Goal Poacher template no longer
  chases Low Pass 75 (Eto'o 8-5-9-8-9-2 → 8-0-10-8-10-2, Low Pass 75 → 70, Ball Control
  94, Kicking Power 96; Saviola, Del Piero, Shevchenko likewise). Not adopted: Shooting 10
  at the cost of Speed — sections 3 and 8 (Speed 90/96/100, Phenomenal Finishing / Willpower
  make 97–99 Finishing unnecessary), and Ibrahimović keeps his aerial points for long balls.
- **Centre-backs and full-backs:** more Aerial / Defending, little Dexterity, Shutdown or
  Duelling +1. Not adopted — the user judged slower builds too slow (section 3, 3 Oct).
- **Skills:** Through Passing is near-universal (agrees with section 9). Common picks we
  don't follow: Rising Shot (section 19: lowers scoring chance), Track Back on centre-backs
  and full-backs (section 19: presses from the front line), Heel Trick (no measured effect).
- Interception is not an addable pick in any top build; every Game Plan defender already
  has it natively — it matters more since v6 (positioning depends on it).
