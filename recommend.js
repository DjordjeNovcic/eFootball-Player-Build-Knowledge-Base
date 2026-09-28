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
    goalPoacher: { label: "Goal Poacher", stats: [["offensiveAwareness", 10, 90, 95], ["acceleration", 9, 91, 97], ["finishing", 8, 90, 94], ["speed", 7, 90, 94], ["ballControl", 6, 88], ["balance", 5, 88], ["kickingPower", 4, 90], ["dribbling", 2, 85], ["tightPossession", 2, 85], ["lowPass", 1, 75]] },
    foxInTheBox: { label: "Fox in the Box", stats: [["offensiveAwareness", 10, 90, 95], ["finishing", 9, 90, 94], ["physicalContact", 7, 85], ["ballControl", 6, 88], ["acceleration", 6, 88, 92], ["heading", 4, 89], ["jump", 3, 85], ["kickingPower", 4, 90], ["balance", 4, 85], ["speed", 4, 90, 93]] },
    targetMan: { label: "Target Man", stats: [["physicalContact", 9, 88], ["heading", 8, 89], ["jump", 7, 88], ["ballControl", 7, 88], ["offensiveAwareness", 6, 88], ["finishing", 6, 88], ["lowPass", 4, 80], ["kickingPower", 4, 88], ["acceleration", 3, 85], ["speed", 2, 86]] },
    holePlayer: { label: "Hole Player", stats: [["offensiveAwareness", 10, 90, 95], ["acceleration", 9, 92, 97], ["balance", 8, 90], ["finishing", 7, 90, 94], ["ballControl", 6, 90], ["tightPossession", 5, 88], ["lowPass", 4, 82], ["speed", 4, 89, 94], ["kickingPower", 3, 88], ["dribbling", 3, 88]] },
    creativePlaymaker: { label: "Creative Playmaker", stats: [["ballControl", 9, 90], ["dribbling", 8, 90], ["tightPossession", 8, 88], ["lowPass", 8, 87], ["balance", 7, 88], ["acceleration", 6, 88, 94], ["kickingPower", 5, 85], ["finishing", 4, 85], ["offensiveAwareness", 3, 85, 88], ["loftedPass", 3, 80], ["speed", 3, 89, 94]] },
    deepLyingForward: { label: "Deep-Lying Forward", stats: [["ballControl", 9, 90], ["tightPossession", 8, 88], ["dribbling", 7, 88], ["lowPass", 7, 85], ["finishing", 7, 90], ["offensiveAwareness", 6, 88], ["acceleration", 6, 90], ["balance", 6, 88], ["kickingPower", 3, 88], ["speed", 3, 90, 94]] },
    dummyRunner: { label: "Dummy Runner", stats: [["offensiveAwareness", 10, 90, 95], ["acceleration", 9, 92, 97], ["speed", 8, 90, 94], ["finishing", 7, 90], ["balance", 6, 88], ["ballControl", 5, 88]] },
    classicNo10: { label: "Classic No. 10", stats: [["ballControl", 8, 90], ["lowPass", 8, 87], ["tightPossession", 7, 88], ["dribbling", 7, 88], ["finishing", 6, 88], ["offensiveAwareness", 6, 88], ["kickingPower", 5, 88], ["balance", 5, 88], ["acceleration", 5, 88], ["speed", 2, 89]] },
    prolificWinger: { label: "Prolific Winger", stats: [["acceleration", 9, 92, 97], ["speed", 8, 90, 94], ["dribbling", 8, 90], ["ballControl", 7, 88], ["balance", 7, 88], ["finishing", 6, 88], ["offensiveAwareness", 6, 88], ["kickingPower", 4, 88], ["tightPossession", 4, 85], ["loftedPass", 3, 80]] },
    crossSpecialist: { label: "Cross Specialist", stats: [["loftedPass", 9, 90, 92], ["speed", 8, 90], ["acceleration", 8, 90], ["dribbling", 6, 88], ["ballControl", 6, 88], ["curl", 5, 85], ["balance", 5, 85], ["stamina", 4, 88], ["offensiveAwareness", 3, 85], ["finishing", 3, 80]] },
    roamingFlank: { label: "Roaming Flank", stats: [["acceleration", 9, 92, 97], ["offensiveAwareness", 8, 90], ["dribbling", 8, 90], ["finishing", 7, 88], ["speed", 7, 90], ["ballControl", 7, 88], ["balance", 7, 88], ["kickingPower", 4, 88]] },
    boxToBox: { label: "Box-to-Box", stats: [["stamina", 8, 90], ["speed", 7, 88], ["acceleration", 7, 90], ["lowPass", 7, 85], ["ballControl", 6, 88], ["defensiveAwareness", 6, 85], ["ballWinning", 6, 85], ["balance", 6, 88], ["defensiveEngagement", 4, 85], ["physicalContact", 4, 82], ["kickingPower", 3, 85], ["finishing", 2, 80]] },
    orchestrator: { label: "Orchestrator", stats: [["lowPass", 10, 87, 92], ["tightPossession", 8, 88], ["ballControl", 8, 88], ["balance", 7, 88], ["acceleration", 6, 88], ["stamina", 6, 88], ["loftedPass", 5, 85], ["defensiveAwareness", 5, 82, 86], ["kickingPower", 2, 85], ["ballWinning", 3, 80, 84], ["dribbling", 3, 85]] },
    anchorMan: { label: "Anchor Man", stats: [["defensiveAwareness", 10, 90, 96], ["defensiveEngagement", 9, 88], ["ballWinning", 9, 88], ["speed", 7, 88], ["acceleration", 7, 88], ["physicalContact", 6, 85], ["stamina", 6, 88], ["lowPass", 3, 78], ["aggression", 3, 85], ["jump", 2, 80]] },
    allActionDefender: { label: "All-Action Defender", stats: [["defensiveAwareness", 9, 90, 96], ["defensiveEngagement", 9, 88], ["ballWinning", 8, 88], ["stamina", 8, 90], ["speed", 7, 88], ["acceleration", 7, 90], ["physicalContact", 5, 85], ["lowPass", 4, 80], ["ballControl", 3, 82]] },
    buildUp: { label: "Build Up CB", stats: [["defensiveAwareness", 10, 90, 96], ["speed", 8, 88], ["acceleration", 8, 88], ["ballWinning", 7, 88], ["physicalContact", 7, 85], ["defensiveEngagement", 6, 88], ["jump", 4, 85], ["heading", 3, 82], ["lowPass", 3, 78], ["aggression", 3, 85]] },
    destroyer: { label: "Destroyer", stats: [["acceleration", 10, 91, 95], ["defensiveAwareness", 9, 90, 96], ["ballWinning", 8, 88], ["speed", 7, 88], ["physicalContact", 7, 85], ["defensiveEngagement", 6, 88], ["aggression", 5, 88], ["jump", 4, 85], ["heading", 2, 82]] },
    coveringRole: { label: "Covering Role", stats: [["defensiveAwareness", 10, 90, 96], ["speed", 9, 90], ["acceleration", 8, 90], ["ballWinning", 7, 88], ["defensiveEngagement", 6, 88], ["physicalContact", 6, 85], ["jump", 3, 85]] },
    defensiveFullBack: { label: "Defensive Full-back", stats: [["defensiveAwareness", 10, 90, 96], ["ballWinning", 8, 88], ["speed", 8, 90], ["acceleration", 8, 90], ["physicalContact", 6, 85], ["stamina", 6, 88], ["defensiveEngagement", 5, 85], ["loftedPass", 2, 78]] },
    offensiveFullBack: { label: "Offensive Wingback", stats: [["speed", 9, 90, 95], ["acceleration", 9, 92, 97], ["stamina", 7, 90], ["loftedPass", 7, 90, 92], ["ballControl", 5, 85], ["defensiveAwareness", 7, 86], ["ballWinning", 6, 84], ["defensiveEngagement", 4, 83], ["balance", 4, 85], ["dribbling", 4, 85], ["lowPass", 4, 82], ["curl", 3, 80]] },
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
    // §4: Kicking Power, Jump and Stamina have no useful hard threshold — they keep
    // paying (at a reduced rate) all the way to 99.
    const LINEAR = new Set(["kickingPower", "jump", "stamina"]);
    const stats = tpl.stats.map(([k, w, t, cap]) => ({ k, w, t, cap: LINEAR.has(k) ? 99 : cap ?? t + 6, slope: LINEAR.has(k) ? 0.35 : 0.25 }));
    const get = (k) => stats.find((s) => s.k === k);
    const scale = (k, f) => { const s = get(k); if (s) s.w *= f; };
    const ensure = (k, w, t) => get(k) || stats.push({ k, w, t, cap: LINEAR.has(k) ? 99 : t + 6, slope: LINEAR.has(k) ? 0.35 : 0.25 });

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
    if (has("Bullet Header")) {
      ensure("heading", 5, 89); ensure("jump", 4, 85); ensure("physicalContact", 4, 85);
      scale("heading", 1.6); scale("jump", 1.5); scale("physicalContact", 1.3);
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
    // Physical Contact = holding off opponents and keeping balance under pressure (§20);
    // Aerial Strength is the least wasteful place for spare points because of it (§12).
    // Every attacker/midfielder gets a modest PC target so they don't get brushed off —
    // lighter players a bit lower (they can't be turned into tanks, §5 model limits).
    if ((ATTACKERS.has(p.position) || ["DMF", "CMF"].includes(p.position)) && !get("physicalContact")) {
      const t = p.weight < 73 ? 76 : 80;
      stats.push({ k: "physicalContact", w: 3, t, cap: t + 2, slope: 0.15 });
      if (p.weight < 73) notes.push(`${p.weight} kg — light frame; a modest Physical Contact target (${t}) so he isn't brushed off, without chasing a tank build (§5, §20).`);
    }
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
      const over = Math.min(f.$gain?.[k] || 0, f[k] - lim);
      if (over > 0) out[k] = over;
    });
    Object.entries(f.$lost || {}).forEach(([k, v]) => { out[k] = (out[k] || 0) + v; });
    return out;
  }

  function value(profile, f) {
    let v = 0;
    for (const s of profile.stats) {
      const x = f[s.k];
      v += s.w * (Math.min(x, s.t) + (s.slope ?? 0.25) * Math.max(0, Math.min(x, s.cap) - s.t) + (x >= s.t ? 2 : 0));
    }
    // Secondary stats: once the role's priorities are met, every extra point in a stat the
    // role still uses beats parking it somewhere useless (§4: KP/Jump/Stamina stay linear).
    for (const k of profile.secondary) v += 0.25 * Math.min(f[k], WASTE[k] ?? 99);
    for (const over of Object.values(wasteOf(f))) v -= 3 * over;
    return v;
  }

  const pointsOf = (levels) => Object.values(levels).reduce((a, l) => a + cumCost(l), 0);

  function optimise(p, profile, booster2) {
    const cats = categoriesFor(p).filter((c) => !c.gk || p.position === "GK");
    const levels = Object.fromEntries(cats.map((c) => [c.key, 0]));
    const budget = budgetFor(p.levelCap);
    let left = budget;
    let cur = value(profile, finalStats(p, levels, booster2));
    // Greedy with 1–4 level lookahead so multi-level jumps to a threshold are found.
    for (;;) {
      let best = null;
      for (const c of cats) {
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
    spendRemainder(p, profile, booster2, levels, cats, budget);
    return levels;
  }

  // §12 hard rule: spend every point. Leftovers go to Aerial Strength, else Defending,
  // else the cheapest useful level; if the remainder can't be matched exactly, trade one
  // level back and refill.
  function spendRemainder(p, profile, booster2, levels, cats, budget) {
    const order = ["aerial", "defending", ...cats.map((c) => c.key)];
    const fill = () => {
      let left = budget - pointsOf(levels);
      let guard = 60;
      while (left > 0 && guard--) {
        const k = order.find((key) => key in levels && levels[key] < MAX_LEVEL && levelCost(levels[key] + 1) <= left);
        if (!k) break;
        levels[k] += 1;
        left = budget - pointsOf(levels);
      }
      return left;
    };
    if (fill() === 0) return;
    const base = { ...levels };
    let bestLv = null;
    let bestVal = -Infinity;
    for (const c of cats) {
      if (!base[c.key]) continue;
      Object.assign(levels, base, { [c.key]: base[c.key] - 1 });
      if (fill() === 0) {
        const v = value(profile, finalStats(p, levels, booster2));
        if (v > bestVal) { bestVal = v; bestLv = { ...levels }; }
      }
    }
    Object.assign(levels, bestLv || base);
  }

  function chooseBooster(p, profile, levels) {
    if (p.booster2Fixed) return { booster: p.booster2Fixed, fixed: true };
    const gk = p.position === "GK";
    const pool = deps.boosterPool.filter((b) => gk ? /Goalkeeping|Saving/.test(b.name) : !/Goalkeeping|Saving/.test(b.name));
    const slot1 = new Set(Object.keys(p.booster1?.stats || {}));
    const before = finalStats(p, levels, null);
    let best = null;
    for (const b of pool) {
      const overlap = Object.keys(b.stats).filter((k) => slot1.has(k)).length;
      // §11: don't boost stats that are already ~97+ — those points are mostly wasted.
      const saturated = Object.keys(b.stats).filter((k) => before[k] >= 97).length;
      // §11: pick by the exact stats — only role stats still below target count.
      const weak = Object.keys(b.stats).filter((k) => profile.stats.some((st) => st.k === k && before[k] < st.t)).length;
      const v = value(profile, finalStats(p, levels, b)) - overlap * 0.5 - saturated * 3 + weak * 1.5;
      if (!best || v > best.v) best = { booster: b, v, overlap };
    }
    return { booster: best.booster, fixed: false, overlap: best.overlap };
  }

  /* ---------- additional skills (§9, USER-SQUAD §5) ---------- */
  function chooseSkills(p, profile, f) {
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
    const note = notesFor(p.id);
    [...(note?.prefSkills || []), ...(note?.snapshot?.skills || []), ...(deps.myPicks ? deps.myPicks(p.id) : [])].forEach((n) => {
      if (out.length >= 5 || out.includes(n) || has(n)) return;
      out.push(n);
      why[n] = "Your choice for this card."
        + (n === "Through Passing" && f.lowPass < 82 ? ` Low Pass is ${f.lowPass}, below the 82 it needs (§3).` : "")
        + (n === "Double Touch" && p.height >= 188 ? " Less valuable on a tall target man (§8)." : "")
        + (n === "Heel Trick" ? " No measured effect yet (§19)." : "");
    });
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
        push("Fighting Spirit", "Accuracy under pressure.");
      }
      push("Fighting Spirit", "Accuracy under pressure.");
    } else {
      // Attackers
      const striker = ["CF", "SS"].includes(pos);
      if (striker && !has("First-time Shot")) push("First-time Shot", "Reduces error on first-time finishes — core for a striker.");
      if (["goalPoacher", "dummyRunner", "holePlayer", "prolificWinger", "roamingFlank", "creativePlaymaker", "deepLyingForward", "classicNo10"].includes(key)) dtPackage();
      if ((striker || key === "targetMan" || key === "foxInTheBox") && tall && f.heading >= 80) {
        push("Heading", "More downward, accurate headers (§19).");
        push("Aerial Superiority", `${p.height} cm with ${f.heading} Heading — model supports it (§8).`);
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
    // Fallbacks so every card gets exactly five (§15), most useful first.
    const FALLBACK = pos === "GK" ? ["Low Lofted Pass", "Weighted Pass", "Fighting Spirit"]
      : ["CB", "LB", "RB", "DMF", "CMF"].includes(pos)
        ? ["Interception", "Blocker", "Man Marking", "One-touch Pass", "Weighted Pass", "Fighting Spirit", "Sliding Tackle", "Low Lofted Pass", ...(p.height >= 185 ? ["Aerial Superiority"] : []), "Outside Curler"]
        : ["One-touch Pass", "Outside Curler", "Fighting Spirit", "Long-range Shooting", ...(p.height <= 182 ? ["Double Touch"] : []),
          ...(["CF", "SS"].includes(pos) ? [] : ["Weighted Pass"])];
    FALLBACK.forEach((n) => push(n, "Best remaining option for the role."));
    return { skills: out, why };
  }

  /* ---------- assemble ---------- */
  const STARTER_SLOTS = { GK: 1, CB: 2, LB: 1, RB: 1, DMF: 2, CMF: 2, LMF: 1, RMF: 1, AMF: 2, LWF: 1, RWF: 1, SS: 1, CF: 2 };

  function recommend(p) {
    const profile = profileFor(p);
    let levels = optimise(p, profile, null);
    let b = chooseBooster(p, profile, levels);
    if (!b.fixed) {
      levels = optimise(p, profile, b.booster);
      b = chooseBooster(p, profile, levels);
    }
    const f = finalStats(p, levels, b.fixed ? null : b.booster);
    const rating = OVR.rating(p.position, p.height, p.weakFootAccuracy, f);
    const targets = [...profile.stats].sort((x, y) => y.w - x.w).slice(0, 8)
      .map((s) => ({ stat: s.k, value: f[s.k], target: s.t, hit: f[s.k] >= s.t, weight: s.w }));
    const { skills, why } = chooseSkills(p, profile, f);
    return { id: p.id, template: profile.tpl.key, roleLabel: profile.tpl.label, levels, booster2: b.fixed ? null : b.booster.id,
      booster: b.booster, boosterFixed: b.fixed, boosterOverlap: b.overlap || 0, final: f, rating, targets, skills, skillWhy: why, notes: profile.notes };
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
    const missed = key.filter((t) => !t.hit);
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
