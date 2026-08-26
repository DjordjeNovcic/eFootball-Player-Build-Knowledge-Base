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

---

## Acceleration

Important values:

**88 minimum**
**91 ideal baseline**

Around 88 appears to unlock an improved running stride.

Around 91 is a strong efficiency point before larger diminishing returns.

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
- Finishing 88-93+
- Balance 90+
- good Ball Control

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
- Track Back

---

## Common CB additions

Once defensive skill coverage is already complete, consider distribution skills:

- One Touch Pass
- Weighted Pass
- Low Lofted Pass
- Outside Curler
- Sole Control

Do not force unnecessary attacking skills.

---

## Additional Skill slot limit

A player can have a maximum of **5 Additional Skills** added via the Skill Training
Program, on top of whatever skills the card already has natively. Confirmed directly
in-game — the Additional Skills picker itself shows a "0/5" counter.

Do not plan a build around more than 5 additional skills — it is a hard cap.

---

## Addable skills vs Show Time skills

Do NOT assume every skill that exists in the game can be added manually.

eFootball splits skills into two pools:

1. **Regular skills** — addable via Skill Training, subject to GP cost and Player
   Type eligibility. The 44-skill list below was directly confirmed by scrolling
   through the live in-game Additional Skills picker.
2. **Show Time skills** — exclusive to specific Epic / Show Time / Big Time player
   cards. These CANNOT be added through Skill Training, no matter the GP spent.

A card's natural (pre-installed) skills are NOT necessarily all Show Time skills —
a player typically has around 10 natural skills, and that native set is usually a mix
of ordinary skills (e.g. Heading, which is also in the addable pool below) and, on
special cards, one or more Show Time skills. Only the Show Time ones are irreplaceable
identity of that specific card; the ordinary ones a card lacks can be added to it (or
to any other eligible player) via Skill Training.

### Show Time skills (NOT addable — card-exclusive only)

- **Phenomenal Finishing** — massively boosts a player's ability to finish with all shot types
- **Phenomenal Pass** — boosts the accuracy/speed of all passes
- **Blitz Curler** — adds more accuracy and an ever-sharper curve to Controlled Shots (50%+ power)
- **Visionary Pass** — temporarily boosts the receiver's first-time ball control and one-touch shots/passes after a pass
- **Bullet Header** — boosts the accuracy and power of headers
- **Momentum Dribbling** — keeps tight control of the ball when dribbling, translating into faster ball speed and quicker transitions between moves
- **Edged Crossing** — boosts the accuracy of crosses
- **Fortress** — increases defensive and physical performance if leading at the start of the second half
- **Game-changing Pass** — boosts the accuracy of passes if losing at halftime
- **Aerial Fort** — further boosts aerial prowess
- **Acceleration Burst** — allows a higher acceleration boost off the dribble
- **Long-reach Tackle** — massively improves range and success rate on standing tackles
- **GK Directing Defense** — increases the defensive abilities of your defenders
- **Low Screamer** — enables powerful low screamers (Stunning Shot under 50% power)
- **GK Spirit Roar** — boosts the physicality of your defenders
- **Willpower** — continuously boosts shooting ability the more shots taken
- **Magnetic Feet** — keeps control of the ball while heavily marked
- **Attack Trigger** *(new)* — increases the Attacking Awareness of all teammates while the player is on the ball

If a player already has one of these natively, treat it as a fixed asset of that
specific card — it is never something you can add to a different player, and it is
never something you should plan to add later.

### Addable skills (regular pool — can be trained onto eligible players)

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

---

# 12. Progression Point Efficiency

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

## Overall rating optimization

Ignore overall rating when it conflicts with role optimization.

A 104-rated custom build can easily be stronger for a specific role than a 108-rated auto/community build.

---

# 14. Recommended Analysis Workflow

Whenever a new player screenshot is provided:

## Step 1 - Identify role

Determine:

- intended position
- playstyle
- starter or substitute
- tactical purpose

Do NOT build before deciding this.

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

Example:

**SS Hole Player**

Short explanation of why this is the best role.

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
