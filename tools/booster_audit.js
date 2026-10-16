#!/usr/bin/env node
// How much is each slot-2 booster worth, in training points? (KNOWLEDGE-BASE §11,
// "Booster = progression points"). For every card with a free slot 2 this re-optimises the
// build around every booster in the pool and reports, per candidate, the smallest extra
// point budget a no-booster build would need to reach the same value ("PE", points
// equivalent; ">20" means no training gets there — the category is at the level-12 cap).
//
//     node tools/booster_audit.js                       # D. Deschamps, Long Ball Counter
//     node tools/booster_audit.js "Fabio Capello" "Long Ball Counter"
//     node tools/booster_audit.js --only Hazard,Gullit  # name filter (case-insensitive)
//
// Takes about a minute. The setup mirrors tools/check_builds.js — keep them in step.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const window = {};
const ctx = vm.createContext({ window, console });
for (const f of ["data/players.js", "data/knowledge.js", "data/ovr.js", "data/managers.js", "recommend.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
}
const { SQUAD_DATA: DATA, KB, OVR } = window;

const MAX_LEVEL = 20;
const norm = (s) => {
  const k = String(s || "").toLowerCase().replace(/^the /, "").replace(/[^a-z0-9]/g, "");
  return { offensivewingback: "offensivefullback", attackingfullback: "offensivefullback", offensivegoalkeeper: "attackinggk" }[k] || k;
};
const skillLabel = (k) => DATA.labels[k] || k;
const levelCost = (lvl) => Math.ceil(lvl / 4);
const cumCost = (lvl) => { let t = 0; for (let i = 1; i <= lvl; i++) t += levelCost(i); return t; };
const baseBudget = (cap) => Math.max(0, (cap - 1) * 2);
const categoriesFor = (p) => KB.CATEGORIES.filter((c) => !c.gk || p.position === "GK");
const profAt = (p, pos) => (p.position === pos ? "primary" : Object.fromEntries(p.additionalPositions.map((a) => [a.position, a.familiarity === 2 ? "high" : "mid"]))[pos] || "none");
const MANAGER_SKILL = [.65, .6675, .685, .7025, .72, .7375, .755, .7725, .79, .8075, .825, .8425, .86, .8775, .895, .9125, .93, .9475, .965, .9825,
  1, 1, 1.01163, 1.01389, 1.015625, 1.01755, 1.01925, 1.02125, 1.02275, 1.0244, 1.026, 1.02725, 1.029, 1.03, 1.03196, 1.03275, 1.03375, 1.034091,
  1.0355, 1.036, 1.0365, 1.036];
const ALL_MANAGERS = [
  ...KB.MANAGERS.map((m) => ({ ...m, key: `kb:${m.name}` })),
  ...(window.EF_MANAGERS || []).map((m) => ({ ...m, key: `ef:${m.id}` })),
];
const managerObj = (v) => ALL_MANAGERS.find((m) => m.key === v) || ALL_MANAGERS.find((m) => m.name === v) || null;
const managerProficiency = (name, tactic) => { const m = managerObj(name); const i = KB.TACTICS.indexOf(tactic); return m && i >= 0 ? m.prof[i] : null; };
const skillMultiplier = (prof) => { if (prof == null) return 1; const v = Math.min(90, Math.max(70, prof)); return MANAGER_SKILL[Math.min(v - 50, MANAGER_SKILL.length - 1)]; };

const argv = process.argv.slice(2);
const onlyIx = argv.indexOf("--only");
const only = onlyIx >= 0 ? argv[onlyIx + 1].toLowerCase().split(",") : null;
const args = argv.filter((a, i) => !a.startsWith("--") && i !== onlyIx + 1);
const manager = args[0] || KB.CURRENT_MANAGER;
const tactic = args[1] || "Long Ball Counter";
if (!managerObj(manager)) { console.error(`Unknown manager "${manager}"`); process.exit(2); }

const makeRec = (extra, players) => window.Recommender({
  players, KB, OVR, norm, skillLabel, categoriesFor, levelCost, cumCost, budgetFor: (cap) => baseBudget(cap) + extra, profAt,
  skillMultiplier, managerProficiency, managerObj, notesFor: (id) => KB.SQUAD_NOTES[id], myPicks: () => [],
  context: { manager, tactic }, MAX_LEVEL, boosterPool: DATA.boosterPool, onBench: () => false,
});
const FULL = makeRec(0, DATA.players);
const I = FULL.internals;
const BUD = {};
const budRec = (x) => (BUD[x] ||= makeRec(x, []));
const NONE = { id: 0, name: "None", stats: {} };
const MAX_PE = 20;
const line = (p, lv) => categoriesFor(p).map((c) => lv[c.key] || 0).join("-");
const SHORT = { offensiveAwareness: "OA", ballControl: "BC", dribbling: "Dr", tightPossession: "TP", lowPass: "LP", loftedPass: "LoP", finishing: "Fin", heading: "Hd", curl: "Cu", setPieceTaking: "PK",
  speed: "Sp", acceleration: "Ac", kickingPower: "KP", jump: "Jmp", physicalContact: "PC", balance: "Bal", stamina: "Sta", defensiveAwareness: "DA", ballWinning: "Tk", defensiveEngagement: "DE", aggression: "Ag",
  gkAwareness: "GKA", gkReflexes: "GKRf", gkReach: "GKRe", gkClearing: "GKP", gkCatching: "GKC" };

const summary = [];
for (const p of DATA.players) {
  if (only && !only.some((n) => p.name.toLowerCase().includes(n))) continue;
  const r = FULL.recs[p.id];
  if (p.booster2Fixed) { console.log(`\n${p.name} (${p.position}) — slot 2 fixed: ${p.booster2Fixed.name}`); continue; }
  const profile = I.profileFor(p);
  const gk = p.position === "GK";
  const pool = DATA.boosterPool.filter((b) => gk ? /Goalkeeping|Saving/.test(b.name) : !/Goalkeeping|Saving/.test(b.name));
  const lv0 = I.optimise(p, profile, NONE);
  const f0 = I.finalStats(p, lv0, NONE);
  // Value of the best no-booster build at budget + x, x = 0..MAX_PE.
  const curve = [];
  for (let x = 0; x <= MAX_PE; x++) { const R = budRec(x); const pr = R.internals.profileFor(p); const lv = R.internals.optimise(p, pr, NONE); curve.push(R.internals.value(pr, R.internals.finalStats(p, lv, NONE))); }
  const pe = (v) => { const i = curve.findIndex((c) => c >= v); return i < 0 ? `>${MAX_PE}` : i; };
  const res = pool.map((b) => {
    const lv = I.optimise(p, profile, b); const f = I.finalStats(p, lv, b); const v = I.value(profile, f);
    return { b, lv, f, v, pe: pe(v), rating: OVR.rating(p.position, p.height, p.weakFootAccuracy, f) };
  }).sort((a, b) => b.v - a.v);
  const pick = res.find((x) => x.b.id === r.booster.id);
  const diff = categoriesFor(p).filter((c) => (lv0[c.key] || 0) !== (pick.lv[c.key] || 0)).map((c) => `${c.label.split(" ")[0]} ${lv0[c.key] || 0}→${pick.lv[c.key] || 0}`).join(", ");
  const stats = Object.keys(pick.f).filter((k) => f0[k] !== pick.f[k] && !/^gk/.test(k)).map((k) => `${SHORT[k] || k} ${f0[k]}→${pick.f[k]}`).join(" ");
  console.log(`\n${p.name} (${p.position}, ${r.roleLabel}) — no booster ${line(p, lv0)}`);
  console.log(`  pick  : ${pick.b.name.padEnd(22)} worth ${String(pick.pe).padStart(3)} pts  ${line(p, pick.lv)} [${diff || "no level trade"}] rating ${pick.rating}`);
  console.log(`          ${stats}`);
  console.log("  others: " + res.filter((x) => x !== pick).slice(0, 5).map((x) => `${x.b.name.replace(" +1", "")} ${x.pe}`).join(" | "));
  summary.push({ card: p.name, pos: p.position, booster: r.booster.name, worthPts: pick.pe, bestByValue: res[0].b.name, freed: r.boosterFreed });
}
console.log(`\n${manager} at ${tactic} · "worth" = extra training points a no-booster build needs to match it (>${MAX_PE}: no training gets there — level-12 cap, §13)`);
console.table(summary);
