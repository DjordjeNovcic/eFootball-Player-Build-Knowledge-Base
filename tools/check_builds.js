#!/usr/bin/env node
// Headless check of the Recommended by AI builds (recommend.js) — run after any change to
// KNOWLEDGE-BASE doctrine, recommend.js or data/:
//
//     node tools/check_builds.js                       # owner context: D. Deschamps, Long Ball Counter
//     node tools/check_builds.js "Xabi Alonso" "Quick Counter"
//     node tools/check_builds.js --json > builds.json  # every build as JSON
//
// Prints every card's role, build (Sh-Pa-Dr-Dx-LB-Ae-De[-GK1-GK2-GK3]), slot-2 booster,
// rating and the §14 flags (trained points past the useful range, missed core targets),
// then fails (exit 1) if any build doesn't spend the card's exact point budget (§12).
// The helpers below mirror lab.js (norm aliases, cost table, manager multiplier) — keep
// them in step when lab.js changes.
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
const budgetFor = (cap) => Math.max(0, (cap - 1) * 2);
const categoriesFor = (p) => KB.CATEGORIES.filter((c) => !c.gk || p.position === "GK");
const profAt = (p, pos) => (p.position === pos ? "primary" : Object.fromEntries(p.additionalPositions.map((a) => [a.position, a.familiarity === 2 ? "high" : "mid"]))[pos] || "none");
const MANAGER_SKILL = [.65, .6675, .685, .7025, .72, .7375, .755, .7725, .79, .8075, .825, .8425, .86, .8775, .895, .9125, .93, .9475, .965, .9825,
  1, 1, 1.01163, 1.01389, 1.015625, 1.01755, 1.01925, 1.02125, 1.02275, 1.0244, 1.026, 1.02725, 1.029, 1.03, 1.03196, 1.03275, 1.03375, 1.034091,
  1.0355, 1.036, 1.0365, 1.036];
const ALL_MANAGERS = [
  ...KB.MANAGERS.map((m) => ({ ...m, key: `kb:${m.name}`, linkUps: m.linkUps || (m.linkUp ? [{ name: m.linkUp, centerPiece: m.centerPiece, keyMan: m.keyMan }] : []) })),
  ...(window.EF_MANAGERS || []).map((m) => ({ ...m, key: `ef:${m.id}`, linkUps: m.linkUps || [] })),
];
const managerObj = (v) => ALL_MANAGERS.find((m) => m.key === v) || ALL_MANAGERS.find((m) => m.name === v) || null;
const managerProficiency = (name, tactic) => { const m = managerObj(name); const i = KB.TACTICS.indexOf(tactic); return m && i >= 0 ? m.prof[i] : null; };
const skillMultiplier = (prof) => { if (prof == null) return 1; const v = Math.min(90, Math.max(70, prof)); return MANAGER_SKILL[Math.min(v - 50, MANAGER_SKILL.length - 1)]; };

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const json = process.argv.includes("--json");
const manager = args[0] || KB.CURRENT_MANAGER;
const tactic = args[1] || "Long Ball Counter";
if (!managerObj(manager)) { console.error(`Unknown manager "${manager}"`); process.exit(2); }

const R = window.Recommender({
  players: DATA.players, KB, OVR, norm, skillLabel, categoriesFor, levelCost, cumCost, budgetFor, profAt,
  skillMultiplier, managerProficiency, managerObj, notesFor: (id) => KB.SQUAD_NOTES[id], myPicks: () => [],
  context: { manager, tactic }, MAX_LEVEL, boosterPool: DATA.boosterPool, onBench: () => false,
});

const SHORT = { offensiveAwareness: "OA", ballControl: "BC", dribbling: "Dr", tightPossession: "TP", lowPass: "LP", loftedPass: "LoP", finishing: "Fin", heading: "Hd", curl: "Cu",
  speed: "Sp", acceleration: "Ac", kickingPower: "KP", jump: "Jmp", physicalContact: "PC", balance: "Bal", stamina: "Sta", defensiveAwareness: "DA", ballWinning: "Tk", defensiveEngagement: "DE", aggression: "Ag",
  gkAwareness: "GKA", gkReflexes: "GKRf", gkReach: "GKRe", gkClearing: "GKP", gkCatching: "GKC" };
let bad = 0;
const out = [];
for (const p of DATA.players) {
  const r = R.recs[p.id];
  const cats = categoriesFor(p);
  const spent = cats.reduce((a, c) => a + cumCost(r.levels[c.key] || 0), 0);
  const budget = budgetFor(p.levelCap);
  const line = cats.map((c) => r.levels[c.key] || 0).join("-");
  const waste = Object.entries(r.waste).map(([k, v]) => `${SHORT[k] || k}+${v}`).join(" ");
  const missed = r.missed.map((t) => `${SHORT[t.stat] || t.stat} ${t.value}/${t.target}`).join(" ");
  if (spent !== budget) bad++;
  if (json) { out.push({ id: p.id, name: p.name, position: p.position, role: r.roleLabel, levels: r.levels, booster2: r.booster.name, boosterShift: r.boosterShift, boosterFreed: r.boosterFreed, rating: r.rating, final: r.final, aiSkills: r.aiSkills, waste: r.waste, missed: r.missed }); continue; }
  const better = r.goodAt?.length ? `good at ${r.goodAt.map((a) => `${a.pos} ${a.r}`).join(", ")}` : "";
  const flags = [spent !== budget ? `BUDGET ${spent}/${budget}` : "", waste ? `waste ${waste}` : "", missed ? `missed ${missed}` : "", better].filter(Boolean).join(" · ");
  console.log(`${p.name.padEnd(22)} ${(p.position + (r.buildAs ? "→" + r.buildAs : "")).padEnd(7)} ${r.roleLabel.padEnd(20)} ${line.padEnd(20)} ${r.booster.name.padEnd(22)} ${String(r.rating).padStart(3)}${flags ? "   " + flags : ""}`);
}
if (json) { console.log(JSON.stringify({ manager, tactic, builds: out }, null, 1)); }
else {
  const flagged = DATA.players.filter((p) => Object.keys(R.recs[p.id].waste).length || R.recs[p.id].missed.length).length;
  console.log(`\n${DATA.players.length} cards · ${manager} at ${tactic} · ${flagged} flagged (waste or missed target) · ${bad} off budget`);
}
process.exitCode = bad ? 1 : 0; // not process.exit(): it truncates a piped --json dump
