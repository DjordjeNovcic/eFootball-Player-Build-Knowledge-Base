// Recommended builds, derived from KNOWLEDGE-BASE.md — not from overall rating.
//
// Workflow (§14): role from position + attacking/defensive style → role priorities
// (§7) with §3 thresholds → player-model and native-skill adjustments (§5, §6, §8) →
// greedy spend of progression levels by value per point (§12 cost table), always
// spending every point → slot-2 booster chosen last on the finished build (§11) →
// 5 additional skills (§9) → verdict. Manager context: USER-SQUAD §3.
window.Recommender = (deps) => {
  "use strict";
  const { players, KB, OVR, norm, skillLabel, categoriesFor, levelCost, cumCost, budgetFor,
    skillMultiplier, managerProficiency, profAt, MAX_LEVEL } = deps;
  const notesFor = deps.notesFor || ((id) => KB.SQUAD_NOTES[id]);

  const MANAGER = deps.context?.manager ?? KB.CURRENT_MANAGER;
  const TACTIC = deps.context?.tactic ?? "Long Ball Counter";

  /* ---------- role templates: [stat, weight, target, cap?] ---------- */
  // Weights follow the order of §7's priority lists; targets are §3 thresholds or
  // the §7 "ideal profile" numbers. Past the target a stat keeps 25% of its value up
  // to the cap, then nothing (diminishing returns, §3/§13).
  const T = {
    goalPoacher: { label: "Goal Poacher", stats: [["offensiveAwareness", 10, 90, 95], ["acceleration", 9, 91, 97], ["finishing", 8, 90, 94], ["speed", 8, 92, 96], ["ballControl", 6, 88], ["balance", 5, 88], ["kickingPower", 4, 90], ["dribbling", 2, 85], ["tightPossession", 2, 85], ["lowPass", 1, 75]] },
    foxInTheBox: { label: "Fox in the Box", stats: [["offensiveAwareness", 10, 90, 95], ["finishing", 9, 90, 94], ["physicalContact", 7, 85], ["ballControl", 6, 88], ["acceleration", 6, 88, 92], ["heading", 4, 89], ["jump", 3, 85], ["kickingPower", 4, 90], ["balance", 4, 85], ["speed", 4, 90, 93]] },
    targetMan: { label: "Target Man", stats: [["physicalContact", 9, 88], ["heading", 8, 89], ["jump", 7, 88], ["ballControl", 7, 88], ["offensiveAwareness", 6, 88], ["finishing", 6, 88], ["lowPass", 4, 80], ["kickingPower", 4, 88], ["acceleration", 3, 85], ["speed", 2, 86]] },
    holePlayer: { label: "Hole Player", stats: [["offensiveAwareness", 10, 90, 95], ["acceleration", 9, 92, 97], ["balance", 8, 90], ["finishing", 7, 90, 94], ["ballControl", 6, 90], ["tightPossession", 5, 88], ["lowPass", 4, 82], ["speed", 8, 92, 96], ["kickingPower", 3, 88], ["dribbling", 3, 88]] },
    creativePlaymaker: { label: "Creative Playmaker", stats: [["ballControl", 9, 90], ["dribbling", 8, 90], ["tightPossession", 8, 88], ["lowPass", 8, 87], ["balance", 7, 88], ["acceleration", 6, 88, 94], ["kickingPower", 5, 85], ["finishing", 4, 85], ["offensiveAwareness", 3, 85, 88], ["loftedPass", 3, 80], ["speed", 3, 89, 94]] },
    deepLyingForward: { label: "Deep-Lying Forward", stats: [["ballControl", 9, 90], ["tightPossession", 8, 88], ["dribbling", 7, 88], ["lowPass", 7, 85], ["finishing", 7, 90], ["offensiveAwareness", 6, 88], ["acceleration", 6, 90], ["balance", 6, 88], ["kickingPower", 3, 88], ["speed", 3, 90, 94]] },
    dummyRunner: { label: "Dummy Runner", stats: [["offensiveAwareness", 10, 90, 95], ["acceleration", 9, 92, 97], ["speed", 8, 92, 96], ["finishing", 7, 90], ["balance", 6, 88], ["ballControl", 5, 88]] },
    classicNo10: { label: "Classic No. 10", stats: [["ballControl", 8, 90], ["lowPass", 8, 87], ["tightPossession", 7, 88], ["dribbling", 7, 88], ["finishing", 6, 88], ["offensiveAwareness", 6, 88], ["kickingPower", 5, 88], ["balance", 5, 88], ["acceleration", 5, 88], ["speed", 2, 89]] },
    prolificWinger: { label: "Prolific Winger", stats: [["acceleration", 9, 92, 97], ["speed", 9, 92, 96], ["dribbling", 8, 90], ["ballControl", 7, 88], ["balance", 7, 88], ["finishing", 6, 88], ["offensiveAwareness", 6, 88], ["kickingPower", 4, 88], ["tightPossession", 4, 85], ["loftedPass", 3, 80]] },
    crossSpecialist: { label: "Cross Specialist", stats: [["loftedPass", 9, 90, 92], ["speed", 8, 92, 96], ["acceleration", 8, 90], ["dribbling", 6, 88], ["ballControl", 6, 88], ["curl", 5, 85], ["balance", 5, 85], ["stamina", 4, 88], ["offensiveAwareness", 3, 85], ["finishing", 3, 80]] },
    roamingFlank: { label: "Roaming Flank", stats: [["acceleration", 9, 92, 97], ["offensiveAwareness", 8, 90], ["dribbling", 8, 90], ["finishing", 7, 88], ["speed", 8, 92, 96], ["ballControl", 7, 88], ["balance", 7, 88], ["kickingPower", 4, 88]] },
    boxToBox: { label: "Box-to-Box", stats: [["stamina", 8, 90], ["speed", 7, 90], ["acceleration", 7, 90], ["lowPass", 7, 85], ["ballControl", 6, 88], ["defensiveAwareness", 6, 85], ["ballWinning", 6, 85], ["balance", 6, 88], ["defensiveEngagement", 4, 85], ["physicalContact", 4, 82], ["kickingPower", 3, 85], ["finishing", 2, 80]] },
    orchestrator: { label: "Orchestrator", stats: [["lowPass", 10, 87, 92], ["tightPossession", 8, 88], ["ballControl", 8, 88], ["balance", 7, 88], ["acceleration", 6, 88], ["stamina", 6, 88], ["loftedPass", 5, 85], ["defensiveAwareness", 5, 82, 86], ["kickingPower", 2, 85], ["ballWinning", 3, 80, 84], ["dribbling", 3, 85], ["speed", 4, 88, 92]] },
    anchorMan: { label: "Anchor Man", stats: [["defensiveAwareness", 10, 90, 96], ["defensiveEngagement", 9, 88], ["ballWinning", 9, 88], ["speed", 7, 90], ["acceleration", 7, 88], ["physicalContact", 6, 85], ["stamina", 6, 88], ["lowPass", 3, 78], ["aggression", 3, 85], ["jump", 2, 80]] },
    allActionDefender: { label: "All-Action Defender", stats: [["defensiveAwareness", 9, 90, 96], ["defensiveEngagement", 9, 88], ["ballWinning", 8, 88], ["stamina", 8, 90], ["speed", 7, 90], ["acceleration", 7, 90], ["physicalContact", 5, 85], ["lowPass", 4, 80], ["ballControl", 3, 82]] },
    buildUp: { label: "Build Up CB", stats: [["defensiveAwareness", 10, 90, 96], ["speed", 8, 91, 95], ["acceleration", 8, 90], ["ballWinning", 7, 88], ["physicalContact", 7, 85], ["defensiveEngagement", 6, 88], ["jump", 4, 85], ["heading", 3, 82], ["lowPass", 3, 78], ["aggression", 3, 85]] },
    destroyer: { label: "Destroyer", stats: [["acceleration", 10, 91, 95], ["defensiveAwareness", 9, 90, 96], ["ballWinning", 8, 88], ["speed", 8, 91, 95], ["physicalContact", 7, 85], ["defensiveEngagement", 6, 88], ["aggression", 5, 88], ["jump", 4, 85], ["heading", 2, 82]] },
    coveringRole: { label: "Covering Role", stats: [["defensiveAwareness", 10, 90, 96], ["speed", 9, 92, 96], ["acceleration", 8, 90], ["ballWinning", 7, 88], ["defensiveEngagement", 6, 88], ["physicalContact", 6, 85], ["jump", 3, 85]] },
    defensiveFullBack: { label: "Defensive Full-back", stats: [["defensiveAwareness", 10, 90, 96], ["ballWinning", 8, 88], ["speed", 8, 92, 96], ["acceleration", 8, 90], ["physicalContact", 6, 85], ["stamina", 6, 88], ["defensiveEngagement", 5, 85], ["loftedPass", 2, 78]] },
    offensiveFullBack: { label: "Offensive Wingback", stats: [["speed", 9, 92, 96], ["acceleration", 9, 92, 97], ["stamina", 7, 90], ["loftedPass", 7, 90, 92], ["ballControl", 5, 85], ["defensiveAwareness", 7, 86], ["ballWinning", 6, 84], ["defensiveEngagement", 4, 83], ["balance", 4, 85], ["dribbling", 4, 85], ["lowPass", 4, 82], ["curl", 3, 80]] },
    goalkeeper: { label: "Goalkeeper", stats: [["gkAwareness", 10, 90], ["gkReflexes", 9, 90], ["gkReach", 8, 90], ["gkClearing", 7, 88], ["gkCatching", 7, 88], ["jump", 4, 85]] },
  };
  const STYLE_TEMPLATE = {
    goalpoacher: "goalPoacher", foxinthebox: "foxInTheBox", targetman: "targetMan", holeplayer: "holePlayer",
    creativeplaymaker: "creativePlaymaker", deeplyingforward: "deepLyingForward", dummyrunner: "dummyRunner",
    classicno10: "classicNo10", prolificwinger: "prolificWinger", crossspecialist: "crossSpecialist",
    roamingflank: "roamingFlank", boxtobox: "boxToBox", orchestrator: "orchestrator", anchorman: "anchorMan",
    allactiondefender: "allActionDefender", buildup: "buildUp", destroyer: "destroyer", coveringrole: "coveringRole",
    defensivefullback: "defensiveFullBack", offensivefullback: "offensiveFullBack", attackinggk: "goalkeeper",
  };
  const POSITION_TEMPLATE = { GK: "goalkeeper", CB: "buildUp", LB: "defensiveFullBack", RB: "defensiveFullBack", DMF: "anchorMan", CMF: "boxToBox",
    LMF: "crossSpecialist", RMF: "crossSpecialist", AMF: "creativePlaymaker", LWF: "prolificWinger", RWF: "prolificWinger", SS: "holePlayer", CF: "goalPoacher" };

  const ATTACKERS = new Set(["CF", "SS", "LWF", "RWF", "AMF", "LMF", "RMF"]);
  const SECONDARY = {
    ATT: ["offensiveAwareness", "ballControl", "dribbling", "tightPossession", "lowPass", "finishing", "kickingPower", "speed", "acceleration", "balance", "stamina", "curl"],
    MID: ["ballControl", "tightPossession", "lowPass", "loftedPass", "speed", "acceleration", "balance", "stamina", "defensiveAwareness", "ballWinning", "defensiveEngagement", "physicalContact", "kickingPower"],
    DEF: ["defensiveAwareness", "ballWinning", "defensiveEngagement", "aggression", "speed", "acceleration", "physicalContact", "jump", "heading", "stamina", "balance"],
    GK: ["gkAwareness", "gkReflexes", "gkReach", "gkClearing", "gkCatching", "jump"],
  };

  function templateFor(p) {
    const key = STYLE_TEMPLATE[norm(p.playingStyle)] || STYLE_TEMPLATE[norm(p.playingStyleDefensive)] || POSITION_TEMPLATE[p.position];
    return { key, ...T[key] };
  }

  /* ---------- player-model and native-skill adjustments ---------- */
  function profileFor(p) {
    const tpl = templateFor(p);
    const native = new Set(p.skills.map((k) => norm(skillLabel(k))));
    const has = (n) => native.has(norm(n));
    const notes = [];
    // §4: Kicking Power, Jump and Stamina have no useful hard threshold — past the role's
    // target they keep paying all the way to 99, at the same reduced rate as any other stat
    // (a higher rate let Stamina 97–99 outbid ball skills a midfielder still lacked).
    // Goalkeeping stats are the keeper's whole job and have no known threshold either:
    // they keep half their value past the target, beyond 99 (boosters).
    const LINEAR = new Set(["kickingPower", "jump", "stamina"]);
    const GK_STATS = new Set(["gkAwareness", "gkReflexes", "gkReach", "gkClearing", "gkCatching"]);
    const shape = (k, t, cap) => (GK_STATS.has(k) ? { cap: 105, slope: 0.5 } : LINEAR.has(k) ? { cap: 99, slope: 0.25 } : { cap: cap ?? t + 6, slope: 0.25 });
    const stats = tpl.stats.map(([k, w, t, cap]) => ({ k, w, t, ...shape(k, t, cap) }));
    const get = (k) => stats.find((s) => s.k === k);
    const scale = (k, f) => { const s = get(k); if (s) s.w *= f; };
    const ensure = (k, w, t) => get(k) || stats.push({ k, w, t, ...shape(k, t) });

    if (ATTACKERS.has(p.position) && p.height >= 188) {
      scale("dribbling", 0.4); scale("tightPossession", 0.5);
      ensure("heading", 4, 89); ensure("jump", 3, 85); ensure("physicalContact", 4, 85);
      scale("heading", 1.5); scale("jump", 1.4); scale("physicalContact", 1.3);
      notes.push(`${p.height} cm — dribbling is not worth heavy spend; aerial/physical points go further (§5, §13).`);
    } else if (ATTACKERS.has(p.position) && p.height <= 173) {
      scale("dribbling", 1.2); scale("tightPossession", 1.2); scale("balance", 1.2);
      notes.push(`${p.height} cm — in the smooth-dribbling height band (§5), so close-control stats pay off.`);
    }
    if (has("Phenomenal Finishing") || has("Willpower")) {
      const s = get("finishing"); if (s) { s.t = Math.min(s.t, 90); s.cap = s.t + 2; }
      notes.push(`${has("Phenomenal Finishing") ? "Phenomenal Finishing" : "Willpower"} — no need to chase 97–99 Finishing (§8, §13).`);
    }
    if (["foxInTheBox", "targetMan"].includes(tpl.key)) { const pc = get("physicalContact"); if (pc) pc.cap = 97; }
    // §7 Fox in the Box: "Heading/Jump if player model supports it" — below 185 cm he
    // won't win the aerial duels, so those points go to finishing and reception instead.
    if (tpl.key === "foxInTheBox" && p.height < 185 && !has("Bullet Header")) {
      scale("heading", 0.35); scale("jump", 0.35);
      const h = get("heading"); if (h) { h.t = 80; h.cap = 82; }
      notes.push(`${p.height} cm — not an aerial Fox in the Box; Heading/Jump kept low (§6, §7).`);
    }
    if (has("Bullet Header")) {
      // Same aerial package as the tall-forward rule above — the stronger weight wins,
      // the two don't stack.
      ensure("heading", 5, 89); ensure("jump", 4, 85); ensure("physicalContact", 4, 85);
      [["heading", 8], ["jump", 6], ["physicalContact", 5.2]].forEach(([k, w]) => { get(k).w = Math.max(get(k).w, w); });
      notes.push("Bullet Header — build Heading/Jump/Physical Contact around it (§8).");
    }
    if (has("Blitz Curler")) {
      ensure("kickingPower", 5, 90); ensure("curl", 5, 85);
      scale("kickingPower", 1.5); scale("finishing", 0.8);
      notes.push("Blitz Curler — Kicking Power > Curl > Finishing (§8).");
    }
    // §3: Low Pass 82 is the functional minimum for a passer with native Through Passing.
    // Only applied where passing is part of the role — a striker's lay-off pass doesn't
    // justify pulling points out of his core stats (the skill reason flags a low LP instead).
    const lp = get("lowPass");
    if (has("Through Passing") && lp && lp.w >= 4) {
      if (!["orchestrator", "creativePlaymaker", "classicNo10"].includes(tpl.key)) { lp.t = Math.min(lp.t, 82); lp.cap = lp.t + 3; }
      notes.push("Through Passing — Low Pass 82 is its functional minimum (§3).");
    }
    if (has("Phenomenal Pass") || has("Visionary Pass")) {
      scale("lowPass", 0.7); scale("loftedPass", 0.7);
      notes.push("Phenomenal/Visionary Pass — raw Passing does not need maxing (§8).");
    }
    if (has("Acceleration Burst")) {
      const s = get("acceleration"); if (s) s.cap = Math.min(s.cap, 97);
      scale("balance", 1.2);
      notes.push("Acceleration Burst — pair with Balance; no point pushing Acceleration past ~97 (§8).");
    }
    if (has("Momentum Dribbling")) {
      scale("dribbling", 1.3); scale("tightPossession", 1.3); scale("balance", 1.3);
      notes.push("Momentum Dribbling — feed it Dribbling, Tight Possession and Balance (§8).");
    }
    if (has("Magnetic Feet")) { const s = get("ballControl"); if (s) s.cap = s.t + 2; }
    // §7 Box-to-Box: "do NOT force every Box-to-Box player into a scorer" — Lampard can
    // justify more Shooting, Seedorf is a transition player / carrier / passer / defender
    // "rather than forcing high Finishing from a weak base". The card's native skills say
    // which one he is: a shooting skill set makes him the goal threat from midfield.
    if (tpl.key === "boxToBox") {
      const SHOOTER = ["Long-range Curler", "Long-range Shooting", "Knuckle Shot", "Dipping Shot", "First-time Shot",
        "Low Screamer", "Acrobatic Finishing", "Phenomenal Finishing", "Willpower", "Blitz Curler"];
      if (SHOOTER.filter(has).length >= 3 && p.stats.offensiveAwareness >= 78) {
        Object.assign(get("finishing"), { w: 6, t: 88, cap: 93 });
        ensure("offensiveAwareness", 5, 88);
        Object.assign(get("kickingPower"), { w: 5, t: 88 });
        ["defensiveAwareness", "ballWinning", "defensiveEngagement"].forEach((k) => { const s = get(k); if (s) Object.assign(s, { w: s.w * 0.6, t: 80, cap: 84 }); });
        notes.push("Box-to-Box with a shooter's skill set — the goal threat from midfield: Finishing, Attacking Awareness and Kicking Power over a full defensive build (§7).");
      } else {
        ensure("dribbling", 5, 88); ensure("tightPossession", 5, 88);
        Object.assign(get("ballControl"), { w: 7, t: 90 });
        scale("finishing", 0.5);
        notes.push("Box-to-Box carrier — Ball Control, Dribbling and Tight Possession to carry the ball through midfield, not a forced scorer (§7).");
      }
    }
    // Physical Contact = holding off opponents and keeping balance under pressure (§20);
    // Aerial Strength is the least wasteful place for spare points because of it (§12).
    // Every attacker/midfielder gets a modest PC target so they don't get brushed off —
    // lighter players a bit lower (they can't be turned into tanks, §5 model limits).
    if ((ATTACKERS.has(p.position) || ["DMF", "CMF"].includes(p.position)) && !get("physicalContact")) {
      const t = p.weight < 73 ? 76 : 80;
      stats.push({ k: "physicalContact", w: 3, t, cap: t + 2, slope: 0.15 });
      if (p.weight < 73) notes.push(`${p.weight} kg — light frame; a modest Physical Contact target (${t}) so he isn't brushed off, without chasing a tank build (§5, §20).`);
    }
    // §7 "rather than forcing high Finishing from a weak base", §12 "what do I lose to gain
    // this +1?": a supporting stat (outside the role's top three weights, ties included) that
    // starts far below its target is lifted about 8 points at full value; the rest of the
    // gap counts half, so it doesn't swallow a third of the budget. The role's core stats
    // are always chased in full.
    const zero = finalStats(p, {}, null);
    const coreW = [...stats].map((x) => x.w).sort((a, b) => b - a)[2] ?? 0;
    // Speed is exempt: 80 → 90 is worth far more than anything above it (§3).
    stats.forEach((x) => { if (x.w < coreW && x.k !== "speed" && x.t - zero[x.k] > 8) x.soft = zero[x.k] + 8; });
    const inTpl = new Set(stats.map((x) => x.k));
    const group = p.position === "GK" ? SECONDARY.GK : ["CB", "LB", "RB"].includes(p.position) ? SECONDARY.DEF
      : ["DMF", "CMF"].includes(p.position) ? SECONDARY.MID : SECONDARY.ATT;
    const tallAttacker = ATTACKERS.has(p.position) && p.height >= 188;
    const secondary = group.filter((k) => !inTpl.has(k) && !(tallAttacker && (k === "dribbling" || k === "tightPossession")));
    return { tpl, stats, notes, has, secondary };
  }

  /* ---------- stat pipeline (mirrors lab.js compute) ---------- */
  const mult = skillMultiplier(managerProficiency(MANAGER, TACTIC));
  const mgr = deps.managerObj ? deps.managerObj(MANAGER) : KB.MANAGERS.find((m) => m.name === MANAGER);

  function finalStats(p, levels, booster2) {
    const t = { ...p.stats };
    const gain = {};
    const lost = {};
    categoriesFor(p).forEach((c) => {
      const lvl = levels[c.key] || 0;
      if (lvl) c.stats.forEach((s) => {
        const next = t[s] + lvl;
        if (next > 99) lost[s] = (lost[s] || 0) + next - 99;
        gain[s] = (gain[s] || 0) + Math.min(99, next) - t[s];
        t[s] = Math.min(99, next);
      });
    });
    const f = {};
    Object.keys(t).forEach((k) => { f[k] = mult === 1 ? t[k] : Math.min(99, t[k] + Math.floor(t[k] * (mult - 1))); });
    if (mgr) mgr.boost.forEach((k) => { f[k] += 1; });
    [p.booster1, p.booster2Fixed || booster2].forEach((b) => b && Object.entries(b.stats).forEach(([k, v]) => { f[k] += v; }));
    Object.defineProperty(f, "$gain", { value: gain });
    Object.defineProperty(f, "$lost", { value: lost });
    return f;
  }

  // §14 step 4 / §3 / §13: past these values extra training is waste (the examples in
  // §14 are Acceleration 102, Speed 98, DA 102, Finishing 99, Passing 97; OA 96+ only
  // "when progression cost is low"). Only points that came from training count.
  const WASTE = { offensiveAwareness: 95, acceleration: 97, speed: 96, defensiveAwareness: 98, finishing: 95,
    lowPass: 95, loftedPass: 94, ballWinning: 98, defensiveEngagement: 98, aggression: 96,
    ballControl: 97, dribbling: 97, tightPossession: 97, balance: 97 };
  function wasteOf(f) {
    const out = {};
    Object.entries(WASTE).forEach(([k, lim]) => {
      if (k === "speed" && f.speed >= 100) return; // 100+ is a step again (§3)
      const over = Math.min(f.$gain?.[k] || 0, f[k] - lim);
      if (over > 0) out[k] = over;
    });
    // Speed trained into the dead 97–99 band is waste too.
    if (f.speed >= 97 && f.speed <= 99) {
      const dead = Math.min(f.$gain?.speed || 0, f.speed - 96);
      if (dead > 0) out.speed = Math.max(out.speed || 0, dead);
    }
    Object.entries(f.$lost || {}).forEach(([k, v]) => { out[k] = (out[k] || 0) + v; });
    return out;
  }

  // Community tests (Amadeusz, via KNOWLEDGE-BASE §3): 96 Speed is already top speed and
  // 97–99 adds nothing, while 100+ gives a new step. Value Speed as capped at 96 unless it
  // reaches 100, which earns a small step bonus (one target-point's worth: enough when a
  // booster makes 100 cheap, not enough to sell core stats for it).
  const SPEED_STEP = 1;
  const effective = (k, x) => (k === "speed" && x < 100 ? Math.min(x, 96) : x);
  // Acceleration pays roughly 3 : 2 : 1 per point below 88 : 88–91 : above 91 (§3,
  // community testing), so each point past 91 is worth a third of one below 88 — and
  // nothing past the role's cap.
  const accelCurve = (x, cap) => Math.min(x, 88) + (2 / 3) * Math.max(0, Math.min(x, 91) - 88)
    + (1 / 3) * Math.max(0, Math.min(x, cap) - 91);
  // §3: "thresholds are NOT hard caps" — past the role's cap a stat the role uses keeps a
  // little value up to where §14 calls it waste (WASTE below), so leftover points sharpen
  // the role's own stats (a poacher's Finishing 92→95) instead of drifting into categories
  // the role barely uses (a poacher's Low Pass).
  const TAIL = 0.1;
  const tail = (s, x) => TAIL * Math.max(0, Math.min(x, WASTE[s.k] ?? 99) - s.cap);
  function value(profile, f) {
    let v = 0;
    for (const s of profile.stats) {
      const x = effective(s.k, f[s.k]);
      // Points between the soft limit and the target (see profileFor) count half.
      const half = s.soft ? Math.max(0, Math.min(x, s.t) - s.soft) : 0;
      if (s.k === "acceleration") {
        const curve = (y) => accelCurve(y, s.cap);
        const slack = s.soft ? curve(Math.min(x, s.t)) - curve(Math.min(x, s.soft)) : 0;
        v += s.w * (curve(x) - 0.5 * slack + (x >= s.t ? 2 : 0) + tail(s, x));
        continue;
      }
      v += s.w * (Math.min(x, s.t) - 0.5 * half + (s.slope ?? 0.25) * Math.max(0, Math.min(x, s.cap) - s.t) + (x >= s.t ? 2 : 0)
        + tail(s, x)
        // §3: 100+ Speed is a noticeable step again — worth it when boosters make it cheap.
        + (s.k === "speed" && x >= 100 ? SPEED_STEP : 0));
    }
    // Secondary stats: once the role's priorities are met, every extra point in a stat the
    // role still uses beats parking it somewhere useless (§4: KP/Jump/Stamina stay linear).
    for (const k of profile.secondary) v += 0.25 * Math.min(effective(k, f[k]), WASTE[k] ?? 99);
    // Trained points past the useful range (dead-zone Speed included) are pure loss —
    // penalised hard enough that the optimiser moves them to a stat the role still uses.
    for (const over of Object.values(wasteOf(f))) v -= 8 * over;
    return v;
  }

  const pointsOf = (levels) => Object.values(levels).reduce((a, l) => a + cumCost(l), 0);

  function optimise(p, profile, booster2) {
    const levels = optimiseOnce(p, profile, booster2, null);
    // Speed trained into the dead 97–99 band: step Lower Body back to 96 and spend the
    // freed points elsewhere (Lower Body frozen for the rerun).
    let f = finalStats(p, levels, booster2);
    if (f.speed >= 97 && f.speed <= 99 && (f.$gain?.speed || 0) > 0) {
      const fixed = { ...levels };
      while (fixed.lowerBody > 0) {
        fixed.lowerBody -= 1;
        f = finalStats(p, fixed, booster2);
        if (f.speed <= 96) break;
      }
      return optimiseOnce(p, profile, booster2, fixed);
    }
    return levels;
  }

  function optimiseOnce(p, profile, booster2, start) {
    const cats = categoriesFor(p).filter((c) => !c.gk || p.position === "GK");
    const levels = start ? { ...start } : Object.fromEntries(cats.map((c) => [c.key, 0]));
    const frozen = start ? new Set(["lowerBody"]) : new Set();
    const budget = budgetFor(p.levelCap);
    let left = budget - pointsOf(levels);
    let cur = value(profile, finalStats(p, levels, booster2));
    // Greedy with 1–4 level lookahead so multi-level jumps to a threshold are found.
    for (;;) {
      let best = null;
      for (const c of cats) {
        if (frozen.has(c.key)) continue;
        let cost = 0;
        for (let d = 1; d <= 4 && levels[c.key] + d <= MAX_LEVEL; d++) {
          cost += levelCost(levels[c.key] + d);
          if (cost > left) break;
          const trial = { ...levels, [c.key]: levels[c.key] + d };
          const gain = value(profile, finalStats(p, trial, booster2)) - cur;
          const ratio = gain / cost;
          if (gain > 0.01 && (!best || ratio > best.ratio)) best = { key: c.key, d, cost, ratio, gain };
        }
      }
      if (!best) break;
      levels[best.key] += best.d;
      left -= best.cost;
      cur += best.gain;
    }
    spendRemainder(p, profile, booster2, levels, cats.filter((c) => !frozen.has(c.key)), budget);
    return levels;
  }

  // §12 hard rule: spend every point. The last points go wherever they are worth the most
  // for the role (ties to Aerial Strength, then Defending — §12's usual parking spots).
  // When they can't be matched exactly, or trading one level back buys something better,
  // one level is traded back and the points refilled.
  function spendRemainder(p, profile, booster2, levels, cats, budget) {
    const pref = (k) => ({ aerial: 0.02, defending: 0.01, passing: 0.005 }[k] || 0);
    const fill = (lv) => {
      let left = budget - pointsOf(lv);
      while (left > 0) {
        let best = null;
        for (const c of cats) {
          if (lv[c.key] >= MAX_LEVEL || levelCost(lv[c.key] + 1) > left) continue;
          const v = value(profile, finalStats(p, { ...lv, [c.key]: lv[c.key] + 1 }, booster2)) + pref(c.key);
          if (!best || v > best.v) best = { key: c.key, v };
        }
        if (!best) break;
        lv[best.key] += 1;
        left = budget - pointsOf(lv);
      }
      return left;
    };
    const options = [{ ...levels }, ...cats.filter((c) => levels[c.key] > 0).map((c) => ({ ...levels, [c.key]: levels[c.key] - 1 }))];
    let bestLv = null;
    let bestVal = -Infinity;
    for (const lv of options) {
      if (fill(lv) !== 0) continue;
      const v = value(profile, finalStats(p, lv, booster2));
      if (v > bestVal) { bestVal = v; bestLv = lv; }
    }
    Object.assign(levels, bestLv || options[0]);
  }

  function chooseBooster(p, profile, levels) {
    if (p.booster2Fixed) return { booster: p.booster2Fixed, fixed: true };
    const gk = p.position === "GK";
    const pool = deps.boosterPool.filter((b) => gk ? /Goalkeeping|Saving/.test(b.name) : !/Goalkeeping|Saving/.test(b.name));
    const slot1 = new Set(Object.keys(p.booster1?.stats || {}));
    const before = finalStats(p, levels, null);
    // §11: pick by the exact four stats — a booster with two stats the role never uses
    // (Striker's Instinct on a defensive midfielder) is half wasted, whatever it adds.
    const used = (k) => profile.stats.some((st) => st.k === k) || profile.secondary.includes(k);
    const fits = pool.filter((b) => Object.keys(b.stats).filter((k) => !used(k)).length < 2);
    const ranked = (fits.length ? fits : pool).map((b) => {
      const overlap = Object.keys(b.stats).filter((k) => slot1.has(k)).length;
      // §11: don't boost stats that are already ~97+ — those points are mostly wasted.
      const saturated = Object.keys(b.stats).filter((k) => before[k] >= 97).length;
      // §11: pick by the exact stats — only role stats still below target count.
      const weak = Object.keys(b.stats).filter((k) => profile.stats.some((st) => st.k === k && before[k] < st.t)).length;
      const dead = Object.keys(b.stats).filter((k) => !used(k)).length;
      const adj = -overlap * 0.5 - saturated * 3 + weak * 1.5 - dead * 1.5;
      return { booster: b, overlap, adj, v: value(profile, finalStats(p, levels, b)) + adj };
    }).sort((x, y) => y.v - x.v);
    return { booster: ranked[0].booster, fixed: false, overlap: ranked[0].overlap, shortlist: ranked.slice(0, 3) };
  }

  /* ---------- additional skills (§9, USER-SQUAD §5) ---------- */
  // `pure`: the knowledge-base picks alone, ignoring the user's own choices — shown as
  // "Recommended by AI" next to the player's actual skill list.
  function chooseSkills(p, profile, f, pure = false) {
    const has = profile.has;
    const key = profile.tpl.key;
    const pos = p.position;
    const tall = p.height >= 185;
    const out = [];
    const why = {};
    const addable = new Set(KB.SKILLS.filter((s) => s.pool === "add" && !s.avoid).map((s) => s.name));
    const push = (name, reason) => {
      if (out.length >= 5 || out.includes(name) || has(name) || !addable.has(name)) return;
      out.push(name); why[name] = reason;
    };
    // Skill choices the user already made in Build Lab come first (USER-SQUAD §4).
    const note = pure ? null : notesFor(p.id);
    [...(note?.prefSkills || []), ...(note?.snapshot?.skills || []), ...(!pure && deps.myPicks ? deps.myPicks(p.id) : [])].forEach((n) => {
      if (out.length >= 5 || out.includes(n) || has(n)) return;
      out.push(n);
      why[n] = "Your choice for this card."
        + (n === "Through Passing" && f.lowPass < 82 ? ` Low Pass is ${f.lowPass}, below the 82 it needs (§3).` : "")
        + (n === "Double Touch" && p.height >= 188 ? " Less valuable on a tall target man (§8)." : "")
        + (n === "Heel Trick" ? " No measured effect yet (§19)." : "");
    });
    // A set-piece specialist: Knuckle Shot is usable at free kicks (§19).
    const setPiece = f.setPieceTaking >= 88;
    const setPieceWhy = `Set-piece taker (Set Piece Taking ${f.setPieceTaking}) — knuckleball free kicks and long shots (§19).`;
    const aerialWhy = `${p.height} cm with ${f.heading} Heading — wins more aerial duels on long balls and flick-ons; headers won through it aren't more accurate (§19).`;
    const dtPackage = () => {
      // Double Touch + Flip Flap + Sole Control ball roll (§8) — only for smaller technical players.
      if (p.height > 182) return;
      const need = ["Double Touch", "Flip Flap", "Sole Control"].filter((n) => !has(n));
      if (need.length <= 2) need.forEach((n) => push(n, "Completes the Double Touch + Flip Flap + Sole Control ball-roll package (§8)."));
    };
    if (pos === "GK") {
      push("GK Penalty Saver", "Penalty saves.");
      push("GK High Punt", "Long Ball Counter with a tall target striker — longer, faster punts (§19).");
      push("GK Long Throw", "Faster distribution to start counters.");
      push("GK Low Punt", "Lower, faster goal-kick option.");
      push("One-touch Pass", "Safer first-time distribution under pressure.");
      push("Fighting Spirit", "Kicking accuracy under pressure.");
    } else if (["CB"].includes(pos)) {
      push("Interception", "Core CB coverage — reacts to passes, intercepts more often.");
      push("Blocker", "Blocks shots/passes, fewer rebounds.");
      if (tall) push("Aerial Superiority", `${p.height} cm — wins more aerial duels at similar jump height.`);
      push("Man Marking", "Tight marking on the striker.");
      push("Sliding Tackle", "Better sliding tackles as a last resort.");
      push("Low Lofted Pass", "Faster, more accurate lofted distribution (§9 CB).");
      if (key === "buildUp") { push("One-touch Pass", "Build Up CB — safer first-time distribution (§9 CB)."); push("Low Lofted Pass", "Faster, more accurate lofted distribution (§9 CB)."); }
      push("One-touch Pass", "Distribution once defensive coverage is complete (§9 CB).");
      push("Weighted Pass", "Long Ball Counter distribution (§9 CB).");
    } else if (["LB", "RB"].includes(pos)) {
      push("Interception", "Reads passes into the channel.");
      if (key === "offensiveFullBack") { push("Pinpoint Crossing", "+10% passing stats on crosses — Offensive Wingback identity (§19)."); push("One-touch Pass", "Quick combinations on the overlap."); }
      push("Blocker", "Blocks crosses and shots.");
      push("Man Marking", "Tight marking on the winger.");
      push("Sliding Tackle", "Recovery tackles.");
      push("One-touch Pass", "Safer first-time passes.");
      push("Weighted Pass", "Long Ball Counter switches.");
      push("Fighting Spirit", "Accuracy under pressure.");
    } else if (["DMF", "CMF"].includes(pos)) {
      const defensive = ["anchorMan", "allActionDefender", "destroyer", "coveringRole"].includes(key);
      if (defensive) {
        push("Interception", "Midfield ball-winning (§9 midfielder).");
        push("Blocker", "Screens shots in front of the CBs (§9 midfielder).");
        push("Man Marking", "Tracks the opposing AMF.");
        if (tall) push("Aerial Superiority", `${p.height} cm defensive midfielder — wins second-ball headers.`);
        push("One-touch Pass", "Safe quick release after winning the ball (§9 midfielder).");
        push("Weighted Pass", "Long Ball Counter outlet pass (§9 midfielder).");
      } else {
        push("One-touch Pass", "Tempo passing (§9 midfielder).");
        if (!has("Through Passing")) push("Through Passing", "+20% passing stats on through balls — key for Long Ball Counter.");
        push("Weighted Pass", "Accurate lofted balls forward (§9 midfielder).");
        push("Interception", "Adds defensive value to the midfield (§9 midfielder).");
        push("Blocker", "Screens shots (§9 midfielder).");
        push("Long-range Shooting", "+10% Finishing from outside the box.");
        if (setPiece) push("Knuckle Shot", setPieceWhy);
        push("Fighting Spirit", "Accuracy under pressure.");
      }
      push("Fighting Spirit", "Accuracy under pressure.");
    } else {
      // Attackers
      const striker = ["CF", "SS"].includes(pos);
      if (striker && !has("First-time Shot")) push("First-time Shot", "Reduces error on first-time finishes — core for a striker.");
      if (["goalPoacher", "dummyRunner", "holePlayer", "prolificWinger", "roamingFlank", "creativePlaymaker", "deepLyingForward", "classicNo10"].includes(key)) dtPackage();
      // §8: Bullet Header is built with a tall model, Heading and Aerial Superiority — for
      // any attacker who has it, not only a striker.
      if (((striker || key === "targetMan" || key === "foxInTheBox") || has("Bullet Header")) && tall && f.heading >= 80) {
        push("Heading", "More downward, accurate headers (§19).");
        push("Aerial Superiority", aerialWhy);
      }
      push("One-touch Pass", "Quick combinations (§9 attacking).");
      if (["creativePlaymaker", "classicNo10", "deepLyingForward"].includes(key)) push("Through Passing", "Creator — +20% passing stats on through balls (§19).");
      if (striker && f.lowPass >= 78) push("Through Passing", `Long Ball Counter lay-offs and through balls — +20% passing stats (§19); Low Pass ${f.lowPass}${f.lowPass < 82 ? ", a bit under the 82 it wants (§3)" : ""}.`);
      if (["prolificWinger", "roamingFlank", "holePlayer", "creativePlaymaker", "dummyRunner"].includes(key) || (key === "goalPoacher" && p.height <= 182))
        push("Cut Behind & Turn", "Beats a tight marker 1v1 and spins in behind (§8).");
      if (key === "crossSpecialist") push("Pinpoint Crossing", "+10% passing stats on crosses.");
      push("Outside Curler", "Strong-foot trivela shots and passes (§9 attacking).");
      if (!has("Long-range Curler")) push("Long-range Shooting", "+10% Finishing from outside the box (§9 attacking).");
      push("Fighting Spirit", "Shooting accuracy under pressure (§9 attacking).");
      if (f.physicalContact < 72 && p.height <= 176) push("Gamesmanship", "Low Physical Contact, agile — draws fouls when out-muscled (§19).");
      if (p.height <= 182) push("Double Touch", "Extra close-control move for a mobile attacker.");
      if (["goalPoacher", "foxInTheBox"].includes(key) && f.finishing >= 90) push("Acrobatic Finishing", "Pure finisher with 90+ Finishing — the extra shot animations get used (USER-SQUAD §5).");
      if (["creativePlaymaker", "classicNo10", "deepLyingForward", "crossSpecialist", "prolificWinger", "roamingFlank", "holePlayer"].includes(key)) push("Weighted Pass", "Lofted through balls for runners (§9 attacking).");
      // Super-sub only pays off the bench (§19); Heel Trick has no measured effect (§19) —
      // neither is recommended as filler for a starter.
      if (deps.onBench?.(p.id)) push("Super-sub", "On your bench — +5% Finishing, +1% Speed/Acceleration when he comes on (§19).");
    }
    // Fallbacks so every card gets all five (§9, §15), most useful first — still only
    // skills that fit the role and the player model, never avoid-listed ones.
    const pressing = /frontlinepressure/.test(norm(p.playingStyleDefensive));
    const sec = pos === "CB" ? "§9 CB" : ["DMF", "CMF"].includes(pos) ? "§9 midfielder" : "§9";
    // §3: Through Passing wants Low Pass 82 (78 tolerated); a pure striker's lofted
    // passing rarely justifies Weighted Pass.
    const tpOk = f.lowPass >= 78;
    const wpOk = f.loftedPass >= 78 || !["goalPoacher", "foxInTheBox", "targetMan", "dummyRunner"].includes(key);
    const FALLBACK = pos === "GK" ? [["Low Lofted Pass", "Faster, more accurate long distribution."], ["Weighted Pass", "Accurate lofted outlets."], ["Fighting Spirit", "Accuracy under pressure."]]
      : ["CB", "LB", "RB", "DMF", "CMF"].includes(pos)
        ? [["Interception", `Defensive coverage (${sec}).`], ["Blocker", `Defensive coverage (${sec}).`], ["Man Marking", `Defensive coverage (${sec}).`],
          ["One-touch Pass", `Distribution once coverage is complete (${sec}).`], ["Weighted Pass", `Distribution (${sec}).`], ["Fighting Spirit", "Accuracy under pressure."],
          ["Sliding Tackle", "Recovery tackles."], ["Low Lofted Pass", `Faster, more accurate lofted distribution (${sec}).`],
          ...(setPiece && ["DMF", "CMF"].includes(pos) ? [["Knuckle Shot", setPieceWhy]] : []),
          ...(p.height >= 185 ? [["Aerial Superiority", `${p.height} cm — wins more aerial duels.`], ["Heading", "Set-piece headers — more downward, accurate headers (§19)."]] : []),
          ["Acrobatic Clearance", "Clears awkward balls in the box."], ["Outside Curler", `Distribution with the outside of the foot (${sec}).`]]
        : [["One-touch Pass", "Quick combinations (§9 attacking)."], ["Outside Curler", "Strong-foot trivela shots and passes (§9 attacking)."],
          ["Fighting Spirit", "Shooting accuracy under pressure (§9 attacking)."], ["Long-range Shooting", "+10% Finishing from outside the box (§9 attacking)."],
          ...(pressing ? [["Track Back", "Front Line Pressure — presses the ball carrier from the front line (§9, §18)."]] : []),
          ...(["goalPoacher", "foxInTheBox", "targetMan", "holePlayer", "dummyRunner"].includes(key) && f.finishing >= 88
            ? [["Acrobatic Finishing", "Finisher — extra shot animations in the box (§9 attacking)."]] : []),
          ...(setPiece ? [["Knuckle Shot", setPieceWhy]] : []),
          ["Chip Shot Control", "One-on-one finishing option over a rushing keeper."],
          ...(p.height <= 182 ? [["Double Touch", "Extra close-control move for a mobile attacker."], ["Sole Control", "Ball-roll control package (§8)."],
            ["Flip Flap", "Ball-roll control package (§8)."], ["Marseille Turn", "Turns out of pressure in tight spaces."]] : []),
          ...(p.height >= 185 && f.heading >= 80 ? [["Heading", "More downward, accurate headers (§19)."], ["Aerial Superiority", aerialWhy]] : []),
          ["Dipping Shot", "Stunning shot that dips — the biggest scoring gain of the three stunning-shot skills (§19)."],
          ...(wpOk ? [["Weighted Pass", "Lofted through balls for runners (§9 attacking)."]] : []),
          ...(tpOk ? [["Through Passing", "+20% passing stats on through balls (§19)."]] : []),
          ["Knuckle Shot", "Knuckleball long shot, usable at free kicks (§19)."]];
    // §20: Low Screamer stops a sub-50% Stunning Shot from becoming a Dipping Shot.
    FALLBACK.filter(([n]) => !(n === "Dipping Shot" && has("Low Screamer"))).forEach(([n, why]) => push(n, why));
    // Always five (user rule): when the role-specific options run out, fill from the
    // rest of the addable pool, closest to the role first — never avoid-listed skills,
    // and Super-sub / Heel Trick only as the very last resort. Track Back presses from the
    // front line (§19), so behind the forwards it is the last of these; Aerial Superiority
    // only for a frame that wins duels (§8).
    const tallOnly = (n) => (n === "Aerial Superiority" && p.height < 185 ? [] : [n]);
    const LAST = (pos === "GK"
      ? ["Outside Curler", "Acrobatic Clearance", "Pinpoint Crossing", "Through Passing"]
      : pos === "CB" ? ["Acrobatic Clearance", "Heading", "Aerial Superiority", ...(tpOk ? ["Through Passing"] : []), "Track Back", "Sole Control", "Gamesmanship"]
        : ["LB", "RB"].includes(pos) ? ["Acrobatic Clearance", "Pinpoint Crossing", ...(tpOk ? ["Through Passing"] : []), "Double Touch", "Heading", "Aerial Superiority", "Track Back", "Sole Control", "Gamesmanship"]
          : ["DMF", "CMF"].includes(pos) ? [...(tpOk ? ["Through Passing"] : []), "Long-range Shooting", "Acrobatic Clearance", "Pinpoint Crossing", "Heading", "Aerial Superiority", "Track Back", "Sole Control", "Gamesmanship"]
            // A big back-to-goal forward doesn't spin past markers (§8 Cut Behind & Turn, §5):
            // aerial and shooting skills first, and Sole Control for turning away (§19).
            : p.height >= 185 && ["foxInTheBox", "targetMan"].includes(key) ? ["Heading", "Aerial Superiority", "Long-range Curler", "Sole Control", "Marseille Turn", "Cut Behind & Turn", "Scissors Feint", "Chop Turn", "Flip Flap", "Gamesmanship", "Track Back", "Pinpoint Crossing"]
              : ["Cut Behind & Turn", "Scissors Feint", "Chop Turn", "Marseille Turn", "Sole Control", "Flip Flap", "Heading", "Aerial Superiority", "Gamesmanship", "Track Back", "Long-range Curler", "Pinpoint Crossing"]
    ).flatMap(tallOnly);
    const lastWhy = (n) => (n === "Track Back" && !ATTACKERS.has(pos)
      ? "Fills the fifth slot — it presses from the front line (§19), so little use behind the forwards; the useful skills for this role are already on the card."
      : n === "Sole Control" && ATTACKERS.has(pos) && p.height >= 185 && ["foxInTheBox", "targetMan"].includes(key)
        ? "Fills the fifth slot — sole feints and turns when he receives with his back to goal (§19)."
        : "Fills the fifth slot — smaller benefit for this role than the picks above.");
    LAST.forEach((n) => push(n, lastWhy(n)));
    const gkSkill = (n) => /^GK /.test(n);
    [...addable].filter((n) => !["Super-sub", "Heel Trick"].includes(n) && gkSkill(n) === (pos === "GK"))
      .forEach((n) => push(n, "Fills the fifth slot — smaller benefit for this role than the picks above."));
    [...addable].forEach((n) => push(n, "Fills the fifth slot — minimal benefit for this role."));
    return { skills: out, why };
  }

  /* ---------- assemble ---------- */
  const STARTER_SLOTS = { GK: 1, CB: 2, LB: 1, RB: 1, DMF: 2, CMF: 2, LMF: 1, RMF: 1, AMF: 2, LWF: 1, RWF: 1, SS: 1, CF: 2 };

  function recommend(p) {
    const profile = profileFor(p);
    let levels = optimise(p, profile, null);
    let b = chooseBooster(p, profile, levels);
    if (!b.fixed) {
      // §14 step 6: the booster comes last, on the finished build — but the levels then
      // shift around whichever stats it covers, so each of the few best candidates gets
      // its own re-optimised build and the best build + booster pair is kept.
      const pick = b.shortlist.map((c) => {
        const lv = optimise(p, profile, c.booster);
        return { ...c, levels: lv, v: value(profile, finalStats(p, lv, c.booster)) + c.adj };
      }).reduce((x, y) => (y.v > x.v ? y : x));
      levels = pick.levels;
      b = { booster: pick.booster, fixed: false, overlap: pick.overlap };
    }
    const f = finalStats(p, levels, b.fixed ? null : b.booster);
    const rating = OVR.rating(p.position, p.height, p.weakFootAccuracy, f);
    const targets = [...profile.stats].sort((x, y) => y.w - x.w).slice(0, 8)
      .map((s) => ({ stat: s.k, value: f[s.k], target: s.t, hit: f[s.k] >= s.t, weight: s.w, soft: !!s.soft }));
    const short = profile.stats.filter((s) => s.soft && f[s.k] < s.t).map((s) => `${KB.STAT_LABELS[s.k] || s.k} ${f[s.k]}`);
    const notes = short.length ? [...profile.notes, `Not forced from a weak base (§7, §12): ${short.join(", ")} — the points do more elsewhere.`] : profile.notes;
    const { skills, why } = chooseSkills(p, profile, f);
    const ai = chooseSkills(p, profile, f, true);
    return { aiSkills: ai.skills, aiWhy: ai.why, id: p.id, template: profile.tpl.key, roleLabel: profile.tpl.label, levels, booster2: b.fixed ? null : b.booster.id,
      booster: b.booster, boosterFixed: b.fixed, boosterOverlap: b.overlap || 0, final: f, rating, targets, skills, skillWhy: why, notes };
  }

  const recs = Object.fromEntries(players.map((p) => [p.id, recommend(p)]));

  // Starter vs rotation: rank recommended ratings within each primary position.
  const byPos = {};
  players.forEach((p) => (byPos[p.position] ||= []).push(p));
  Object.entries(byPos).forEach(([pos, list]) => {
    list.sort((a, b) => recs[b.id].rating - recs[a.id].rating);
    list.forEach((p, i) => { recs[p.id].depth = { rank: i + 1, of: list.length, starter: i < (STARTER_SLOTS[pos] || 1) }; });
  });

  // Verdict (§15): lock / test, starter / bench, preferred position.
  players.forEach((p) => {
    const r = recs[p.id];
    const key = r.targets.filter((t) => t.weight >= 7);
    // A supporting stat deliberately not forced from a weak base isn't a miss (see notes).
    const missed = key.filter((t) => !t.hit && !t.soft);
    const alt = OVR.POSITIONS.filter((pos) => pos !== p.position && profAt(p, pos) !== "none")
      .map((pos) => ({ pos, r: OVR.rating(pos, p.height, p.weakFootAccuracy, r.final) }))
      .sort((a, b) => b.r - a.r)[0];
    r.waste = wasteOf(r.final);
    r.lock = missed.length === 0 && Object.keys(r.waste).length === 0;
    r.missed = missed;
    r.altPosition = alt || null;
  });

  return { recs, context: { manager: MANAGER, tactic: TACTIC } };
};
