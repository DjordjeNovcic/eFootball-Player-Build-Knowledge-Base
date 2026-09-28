// Structured extract of KNOWLEDGE-BASE.md and USER-SQUAD.md for the web UI.
// KNOWLEDGE-BASE.md / USER-SQUAD.md stay the source of truth — when they change,
// update the matching entries here.
window.KB = (() => {
  "use strict";

  /* ---- Section 12: progression categories (level 0–20, 1:1 stat gain) ---- */
  const CATEGORIES = [
    { key: "shooting", label: "Shooting", stats: ["finishing", "setPieceTaking", "curl"] },
    { key: "passing", label: "Passing", stats: ["lowPass", "loftedPass"] },
    { key: "dribbling", label: "Dribbling", stats: ["ballControl", "dribbling", "tightPossession"] },
    { key: "dexterity", label: "Dexterity", stats: ["offensiveAwareness", "acceleration", "balance"] },
    { key: "lowerBody", label: "Lower Body Strength", stats: ["speed", "kickingPower", "stamina"] },
    { key: "aerial", label: "Aerial Strength", stats: ["jump", "physicalContact", "heading"] },
    { key: "defending", label: "Defending", stats: ["defensiveAwareness", "defensiveEngagement", "ballWinning", "aggression"] },
    { key: "gk1", label: "GK 1", stats: ["gkAwareness", "jump"], gk: true },
    { key: "gk2", label: "GK 2", stats: ["gkClearing", "gkReach"], gk: true },
    { key: "gk3", label: "GK 3", stats: ["gkCatching", "gkReflexes"], gk: true },
  ];

  const STAT_LABELS = {
    offensiveAwareness: "Attacking Awareness", ballControl: "Ball Control", dribbling: "Dribbling",
    tightPossession: "Tight Possession", lowPass: "Low Pass", loftedPass: "Lofted Pass",
    finishing: "Finishing", heading: "Heading", setPieceTaking: "Set Piece Taking", curl: "Curl",
    speed: "Speed", acceleration: "Acceleration", kickingPower: "Kicking Power", jump: "Jumping",
    physicalContact: "Physical Contact", balance: "Balance", stamina: "Stamina",
    defensiveAwareness: "Defensive Awareness", ballWinning: "Tackling", aggression: "Aggression",
    defensiveEngagement: "Defensive Engagement", gkAwareness: "GK Awareness", gkCatching: "GK Catching",
    gkClearing: "GK Parrying", gkReflexes: "GK Reflexes", gkReach: "GK Reach",
  };

  const STAT_GROUPS = [
    { title: "Attacking", stats: ["offensiveAwareness", "ballControl", "dribbling", "tightPossession", "lowPass", "loftedPass", "finishing", "heading", "setPieceTaking", "curl"] },
    { title: "Athleticism", stats: ["speed", "acceleration", "kickingPower", "jump", "physicalContact", "balance", "stamina"] },
    { title: "Defending", stats: ["defensiveAwareness", "ballWinning", "aggression", "defensiveEngagement"] },
    { title: "Goalkeeping", stats: ["gkAwareness", "gkCatching", "gkClearing", "gkReflexes", "gkReach"] },
  ];

  /* ---- Section 3: thresholds (ideal minimums, not hard caps) ---- */
  const THRESHOLDS = {
    offensiveAwareness: [{ at: 90, note: "OA acceleration benefit peaks ~90 (attacking roles)" }],
    speed: [{ at: 90, note: "Returns beyond 90 are significantly smaller" }],
    acceleration: [{ at: 88, note: "Improved running stride" }, { at: 91, note: "Ideal baseline before bigger diminishing returns" }],
    finishing: [{ at: 90, note: "Sufficient for most attackers" }],
    lowPass: [{ at: 82, note: "Minimum, esp. with Through Passing" }, { at: 87, note: "General ideal range" }],
    loftedPass: [{ at: 90, note: "Crossing target; don't overspend above" }],
    heading: [{ at: 89, note: "Stronger heading animation may unlock" }],
    defensiveAwareness: [{ at: 70, note: "Below 70 the defensive Acceleration penalty applies (§12)" }, { at: 90, note: "Strong baseline for important defenders" }],
  };

  /* ---- Sections 8, 9, 19, 20: skills ---- */
  // pool: "add" = verified in the Additional Skills picker, "excl" = card-exclusive
  // (not addable), "unk" = new skill, picker availability not established.
  const S = (name, cat, pool, tested, official, extra = {}) => ({ name, cat, pool, tested, official, ...extra });
  const SKILLS = [
    // Dribbling
    S("Double Touch", "Dribbling", "add", "Also recovers balance; 'DT Boom' — GK's sideways shuffle doesn't react to the extra width.", null,
      { note: "Double Touch + Sole Control + Flip Flap enable the trap-cancel ball roll — elite close dribbling (Messi, Neymar, Saviola, Dembélé, Hazard, Del Piero, technical AMFs). Less important for target men and pure CBs." }),
    S("Scissors Feint", "Dribbling", "add", null, null),
    S("Flip Flap", "Dribbling", "add", "Unlocks ball roll with Double Touch and Sole Control; more width but slower animation.", null),
    S("Marseille Turn", "Dribbling", "add", null, null),
    S("Sombrero", "Dribbling", "add", null, "More accurate Sombrero/Rainbow Flick, plus Sombrero when receiving a low pass.", { avoid: "Unpredictable." }),
    S("Chop Turn", "Dribbling", "add", null, null),
    S("Cut Behind & Turn", "Dribbling", "add", "Also adds a Cruyff-turn fake-shot animation.", null,
      { note: "Strong for dribblers closed down 1v1 (wingers, AMF, SS) — spins away behind the marker. Less relevant for target men." }),
    S("Scotch Move", "Dribbling", "add", null, null, { avoid: "Considered the weakest skill move." }),
    S("Sole Control", "Dribbling", "add", "Dribbling / first-touch / tight-control gains NOT observed. Confirmed value: ball roll with Double Touch + Flip Flap.", "Uses soles more in feints and turns.",
      { note: "Not universal (USER-SQUAD §5): only for the DT + Flip Flap package or a demonstrated tight-turn / back-to-goal role. Not a default CMF/CB/GK addition." }),
    S("Tap Trick", "Dribbling", "unk", null, "Executes a specific feint with its command."),
    S("Momentum Dribbling", "Dribbling", "excl", "Touch Frequency beyond the normal stat limit; heavily nerfed after release.", "Improved dribbling in the attacking third.",
      { note: "Give enough Dribbling, Tight Possession and Balance to exploit it." }),
    S("Acceleration Burst", "Dribbling", "excl", "New animations.", "Quick Sharp Touch while stationary/slow; special Sharp Touch motions possible.",
      { note: "Very strong with high Acceleration + Balance (Poacher, Dummy Runner, Hole Player). Don't push Acceleration beyond 97–99." }),
    S("Magnetic Feet", "Dribbling", "excl", null, "Ball retention improves with the number of opponents within 5 m (up to four). Magnitude untested.",
      { note: "Strong for technical AMF/SS; reduces the need to chase absurd raw Ball Control." }),
    // Shooting
    S("Heading", "Shooting", "add", "More downward (accurate) headers. No animation/stat change.", null),
    S("Long-range Curler", "Shooting", "add", "≈ +10%+ Finishing & Kicking Power plus Curl on any curl shot; can exceed the 99 cap; can offset a weak-foot debuff.", null),
    S("Chip Shot Control", "Shooting", "add", null, null),
    S("Knuckle Shot", "Shooting", "add", "Knuckleball; raises scoring chance (less than Dipping). Works at free kicks.", "Stunning Shot at 50–65% power."),
    S("Dipping Shot", "Shooting", "add", "Biggest scoring-chance gain of the three stunning-shot skills (straight path to bottom corners).", "Stunning Shot at 20–50% power, ideally 40–50%."),
    S("Rising Shot", "Shooting", "add", "Rises sharply — actually lowers scoring chance, often clears the bar.", "Stunning Shot at 65–95% power.", { avoid: "Reduces scoring chance." }),
    S("Long-range Shooting", "Shooting", "add", "+10% Finishing on shots from outside the box; no Kicking Power.", null),
    S("Acrobatic Finishing", "Shooting", "add", "Adds acrobatic shot animations (bicycle, scorpion…).", null,
      { note: "Not automatic (USER-SQUAD §5) — only when role and finishing profile benefit from the animations." }),
    S("Heel Trick", "Shooting", "add", "No change to heel shot/pass likelihood found — more testing needed.", null),
    S("First-time Shot", "Shooting", "add", "Reduces error on first-time shots.", null),
    S("Snap Strike", "Shooting", "excl", null, "Reduces Stunning Shot wind-up time. No proven frame count."),
    S("Phenomenal Finishing", "Shooting", "excl", "Greatly reduces shot error from awkward body positions. No animation/stat change.", null,
      { note: "90–95 Finishing is often enough; don't chase 97–99." }),
    S("Bullet Header", "Shooting", "excl", "Greatly reduces headed-shot error under physical pressure.", null,
      { note: "Pair with a tall model, Heading, Jump, Aerial Superiority, Physical Contact." }),
    S("Blitz Curler", "Shooting", "excl", "High dipping curl to the top corners; no stat change.", "Controlled Shot at ≥50% power.",
      { note: "Stat order: Kicking Power > Curl > Finishing. Don't max all three." }),
    S("Low Screamer", "Shooting", "excl", "≈ +5.5% ball speed (prior estimate).", "Stunning Shot under 50% gauge gains speed and will NOT trigger Dipping Shot."),
    S("Willpower", "Shooting", "excl", "+1 Finishing & +1 Kicking Power per shot taken, up to +8. Headers don't count.", null,
      { note: "Don't overspend on starting Finishing/Kicking Power." }),
    // Passing
    S("One-touch Pass", "Passing", "add", "Reduces error on first-time passes.", null),
    S("Through Passing", "Passing", "add", "+20% to both passing stats on low/lofted through balls.", "Changes through-ball trajectory and improves accuracy.",
      { note: "Low Pass ~82+ is already functional; no need for 95+." }),
    S("Weighted Pass", "Passing", "add", "Tested activation from the defensive half (not a proven universal rule).", "Accurate lofted/chipped forward ball with heavy backspin."),
    S("Pinpoint Crossing", "Passing", "add", "+10% to both passing stats depending on the cross button.", null),
    S("Outside Curler", "Passing", "add", "Earlier animation and better accuracy in tested trivela situations.", "Strong-foot outside-of-foot shot/pass, even from range."),
    S("Rabona", "Passing", "add", "Animation only.", null, { avoid: "No gameplay benefit." }),
    S("No Look Pass", "Passing", "add", "'Looking away' animation only.", null, { avoid: "No gameplay benefit." }),
    S("Low Lofted Pass", "Passing", "add", "Lower, shorter, faster, more accurate path. Not on lofted through balls or crosses.", null),
    S("Phenomenal Pass", "Passing", "excl", "Reduces pass error from awkward body positions.", "Power/accuracy from unusual passing body positions — not a blanket pass boost."),
    S("Visionary Pass", "Passing", "excl", "Weaker First-time Shot + One-touch Pass for the RECEIVER, plus better first touch.", "Improves the receiver's one-touch pass, first-time shot and trap."),
    S("Edged Crossing", "Passing", "excl", "Vertical spin; greatly increases ball speed on a normal cross; weak foot at 'Very High' WF accuracy.", null),
    S("Game-changing Pass", "Passing", "excl", "+10% to both passing stats while drawing/losing in the 2nd half.", null),
    // GK & others
    S("GK Low Punt", "GK & Others", "add", "Goal-kick punt flies lower and faster.", null),
    S("GK High Punt", "GK & Others", "add", "More distance and speed on the high kick — good with a tall target striker.", null),
    S("Long Throw", "GK & Others", "add", "Max throw range 21 m → 29 m.", null, { avoid: "Not worth GP via Player Fusion alone." }),
    S("GK Long Throw", "GK & Others", "add", "Increases a GK's max throw range.", null),
    S("Penalty Specialist", "GK & Others", "add", "+10 flat Finishing & Place Kicking on penalties.", null, { avoid: "Not worth GP via Player Fusion alone." }),
    S("GK Penalty Saver", "GK & Others", "add", "Predicted GK stat increase on penalty saves.", null),
    S("Gamesmanship", "GK & Others", "add", "Easier to win fouls when shielding / clipped in close duels, incl. in the box.", null,
      { note: "For agile dribblers with LOW Physical Contact — not physically dominant players. Referee results inconsistent." }),
    S("GK Directing Defence", "GK & Others", "excl", "Predicted Tackling increase; confirmed NOT to raise Defensive Awareness.", "Improves defenders' defensive abilities deep in own territory."),
    S("GK Spirit Roar", "GK & Others", "excl", "Predicted Physical Contact increase for defenders.", null),
    // Defending
    S("Man Marking", "Defending", "add", null, "Reacts quickly to an opponent's movement and marks closely. Magnitude untested."),
    S("Track Back", "Defending", "add", null, "Aggressively presses the ball carrier from the front line.",
      { note: "Mainly for front-line pressing roles — not an automatic Box-to-Box DMF pick." }),
    S("Interception", "Defending", "add", null, "Reacts to passes quickly, intercepts more often. Magnitude untested."),
    S("Blocker", "Defending", "add", null, "Blocks passes/shots more often, fewer rebounds. Magnitude untested."),
    S("Aerial Superiority", "Defending", "add", "Wins more aerial duels at similar Jump Height; won duels in shooting situations are inaccurate.", null,
      { note: "Only with a supporting model + aerial stats; role-dependent — not for a CMF just for decent Jump/PC." }),
    S("Sliding Tackle", "Defending", "add", "Predicted Tackling increase on sliding tackles.", null),
    S("Acrobatic Clearance", "Defending", "add", "Acrobatic clearance animations.", null),
    S("Power Tackle", "Defending", "unk", null, "Body-contact standing tackle; more chance to unbalance the opponent. No flat stat bonus inferred."),
    S("Shadow Hunt", "Defending", "excl", null, "Speed-related recovery when a pass goes behind a DMF/LB/RB/CB."),
    S("Long-reach Tackle", "Defending", "excl", "Extra animations/reach.", "More standing tackles vs distant opponents while stationary/slow."),
    S("Fortress", "Defending", "excl", "≈ +5% DA/Tackling (prior estimate).", "Defensive boost after half-time while leading (no halftime lead required)."),
    S("Aerial Fort", "Defending", "excl", null, "Improves aerial duels inside the player's OWN penalty box."),
    // Misc
    S("Captaincy", "Miscellaneous", "add", "No visible stamina increase in narrow testing.", "Reduces fatigue effects for the entire team.", { avoid: "Supposed stamina boost not observed." }),
    S("Super-sub", "Miscellaneous", "add", "+5% Finishing, +1% Speed/Acceleration. Does NOT raise Condition.", null),
    S("Fighting Spirit", "Miscellaneous", "add", "Reduced shot/pass error under pressure; no stamina effect seen.", "Preserves kicking/heading accuracy under pressure; reduces fatigue."),
    S("Attack Trigger", "Miscellaneous", "excl", null, "Raises OTHER teammates' Attacking Awareness while the holder has the ball."),
    S("Attacking Surge", "Miscellaneous", "excl", null, "Speed-related abilities in the attacking half while a teammate has the ball."),
  ];

  /* ---- Section 18: playing styles ---- */
  const ATT_STYLES = [
    ["Goal Poacher", "CF", "Lives on the last defender's shoulder; depth, through balls, runs in behind."],
    ["Fox in the Box", "CF", "Stays central near the box; rebounds, cutbacks, low crosses."],
    ["Target Man", "CF", "Comes to the ball, back to goal, holds it up."],
    ["Dummy Runner", "CF, SS, AMF", "Unconventional movement to drag markers and open space."],
    ["Deep-Lying Forward", "CF, SS", "Drops between the lines, combines, then attacks forward."],
    ["Creative Playmaker", "SS, LWF, RWF, AMF, LMF, RMF", "Seeks the ball in pockets, orchestrates; fewer runs than Hole Player."],
    ["Prolific Winger", "LWF, RWF", "Stays wide, attacks the full-back 1v1, then shoots or crosses."],
    ["Roaming Flank", "LWF, RWF, LMF, RMF", "Starts wide, drifts inside — inverted winger."],
    ["Cross Specialist", "LWF, RWF, LMF, RMF", "Holds width, seeks crossing positions."],
    ["Classic No. 10", "SS, AMF", "Official: high position to initiate attacks, also goes for goal."],
    ["Hole Player", "SS, AMF, LMF, RMF, CMF", "Attacks the hole and runs from deep; finishes in the box."],
    ["Box-to-Box", "LMF, RMF, CMF, DMF", "Shuttles the whole match, covers a huge area."],
    ["Anchor Man", "DMF", "Stays in front of the CBs; rarely attacks."],
    ["Orchestrator", "CMF, DMF", "Drops deep and organises build-up."],
    ["Build Up", "CB", "Safe outlet from the back line."],
    ["Extra Frontman", "CB", "Adventurous CB who joins attacks high up."],
    ["Offensive Full-back", "LB, RB", "Overlaps, provides width, crosses."],
    ["Defensive Full-back", "LB, RB", "Stays back, prioritises shape."],
    ["Full-back Finisher", "LB, RB", "Underlaps, comes inside toward the box."],
    ["High Line GK", "GK", "High position while attacking to cover space behind the defence."],
  ].map(([name, positions, behavior]) => ({ name, positions, behavior }));

  const DEF_STYLES = [
    ["Front Line Pressure", "CF, SS, RWF, LWF", "Presses the GK/CB aggressively to force mistakes."],
    ["Front Line Poacher", "CF, SS, RWF, LWF", "Watches passing lanes, takes smart positions."],
    ["Attack Outlet", "CF, SS, RWF, LWF, AMF", "Barely tracks back; stays high for the counter."],
    ["Pass Disruptor", "AMF, RMF, LMF, CMF, DMF", "Closes passing lanes, intercepts."],
    ["All-Action Defender", "AMF, RMF, LMF, CMF, DMF", "Runs back aggressively, responds to attacks."],
    ["Box-to-Box", "RMF, LMF, CMF, DMF", "Presses and tracks back across a large area."],
    ["Anchor Man", "DMF", "Holds the central zone in front of the defence."],
    ["The Destroyer", "CMF, DMF, RB, LB, CB", "Steps out, presses, goes for the duel."],
    ["Covering Role", "CMF, DMF, RB, LB, CB", "Covers teammates doing Match-up duties."],
    ["High Line Master", "RB, LB, CB", "Maintains the line and shape."],
    ["Sweeper GK", "GK", "High position, rushes out to cover behind the defence."],
    ["Attacking GK", "GK", "Comes off the line to close down attacker/space."],
    ["Defensive GK", "GK", "Stays near goal, relies on positioning."],
  ].map(([name, positions, behavior]) => ({ name, positions, behavior }));

  const AI_STYLES = [
    ["Trickster", "Uses dribbling/feints more often"],
    ["Mazing Run", "Carries the ball through opponents"],
    ["Speeding Bullet", "Speed and explosive ball-carrying"],
    ["Incisive Run", "Cuts inside from the flank toward goal"],
    ["Long Ball Expert", "Long passes / switches of play"],
    ["Early Crosser", "Crosses early, without reaching the byline"],
    ["Long Ranger", "Shoots from distance more often"],
  ].map(([name, behavior]) => ({ name, behavior }));

  /* ---- Sections 17 & 22 + USER-SQUAD §3/§6: the user's seven managers ---- */
  const TACTICS = ["Possession", "Quick Counter", "Long Ball Counter", "Out Wide", "Long Ball", "Overload"];
  const M = (name, boost, prof, linkUp, centerPiece, keyMan, affinity = null) => ({ name, boost, prof, linkUp, centerPiece, keyMan, affinity });
  const MANAGERS = [
    M("D. Deschamps", ["speed", "ballControl"], [89, 68, 89, 59, 63, null], "Breakthrough Pass A", ["Creative Playmaker", "AMF"], ["Goal Poacher", "CF"]),
    M("R. Martínez", ["finishing", "offensiveAwareness"], [58, 90, 70, 64, 89, null], "Diagonal Long Pass B", ["Creative Playmaker", "LWF/RWF"], ["Offensive Full-back", "LB/RB"], "Star Players+ (5★ +200% XP)"),
    M("F. Beckenbauer", ["dribbling", "defensiveAwareness"], [65, 57, 89, 60, 89, null], "Breakthrough Pass B", ["Box-to-Box", "CMF"], ["Goal Poacher", "CF"], "DF Players+ (DF/GK +400% XP)"),
    M("Jürgen Klopp", ["speed", "aggression"], [89, 89, 59, 70, 57, null], "Over-the-Top Pass C", ["Build Up", "CB"], ["Prolific Winger", "LWF/RWF"]),
    M("Xabi Alonso", ["ballControl", "finishing"], [71, 89, 54, 89, 56, null], "Breakthrough Pass A", ["Creative Playmaker", "AMF"], ["Goal Poacher", "CF"], "MF Players+ (MF +400% XP)"),
    M("Fabio Capello", ["defensiveAwareness", "finishing"], [46, 57, 89, 64, 89, null], "Over-the-Top Pass A", ["Orchestrator", "DMF"], ["Goal Poacher", "CF"], "Veteran Players+ (30+ +200% XP)"),
    M("Frank Lampard", ["lowPass", "defensiveEngagement"], [75, 60, 58, 69, 89, 89], "1-2 Cut-in A", ["Creative Playmaker", "LWF/RWF"], ["Fox in the Box", "CF"], "Young Players+ (≤23 +200% XP)"),
  ];
  const CURRENT_MANAGER = "D. Deschamps"; // USER-SQUAD §3 (Sep 2026)

  /* ---- USER-SQUAD §2 & §4: role notes and dated build snapshots (by eFHUB ID) ---- */
  const SQUAD_NOTES = {
    "88040387119642": { role: "CF — Fox in the Box; central striker / target finisher.",
      snapshot: { date: "24 Sep 2026", levels: [5, 0, 6, 11, 9, 8, 0], skills: ["Double Touch", "One-touch Pass", "Outside Curler", "Through Passing", "Heel Trick"] } },
    "88040387118554": { role: "CF — Goal Poacher.",
      snapshot: { date: "24 Sep 2026", levels: [8, 0, 8, 10, 8, 6, 0], note: "Through Passing preferred over Cut Behind & Turn for the utility slot." } },
    "89137214427270": { role: "AMF/SS — Hole Player. Target profile: PC 80+, Acceleration 96, OA 93, Balance 87." },
    "88039045074410": { role: "AMF/SS/CMF depending on shape; Hole Player." },
    "88040387121974": { role: "AMF — Creative Playmaker." },
    "88041460859805": { role: "CMF/DMF — Box-to-Box.",
      snapshot: { date: "saved Build Lab", levels: [4, 5, 8, 10, 8, 4, 8], note: "One-touch Pass and Through Passing valued; Sole Control only for a turning use case." } },
    "88044145348029": { role: "DMF — Anchor Man; may drop into CB in the defensive structure." },
    "88045755964130": { role: "CMF/DMF defensive role; reinforces DMF in the defensive phase." },
    "88039850289220": { role: "CB — Build Up." },
    "89138288270047": { role: "CB — Destroyer." },
    "88041460993474": { role: "LB — Defensive Full-back." },
    "88039581948640": { role: "RB — Defensive Full-back." },
    "88045755964131": { role: "CB — Destroyer; rotation/bench until additional skills are set." },
    "88040387120260": { role: "SS/CF — Deep-Lying Forward; left-footed." },
    "88039581945312": { role: "CMF/DMF — Orchestrator." },
    "88039581945358": { role: "Goal Poacher." },
    "88040387118039": { role: "GK — current squad keeper; trained build needs a current screenshot." },
  };

  return { CATEGORIES, STAT_LABELS, STAT_GROUPS, THRESHOLDS, SKILLS, ATT_STYLES, DEF_STYLES, AI_STYLES, TACTICS, MANAGERS, CURRENT_MANAGER, SQUAD_NOTES };
})();
