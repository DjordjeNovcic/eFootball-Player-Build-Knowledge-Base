#!/usr/bin/env node
// Recommended by AI builds for the public card database — data/public/cards.json →
// data/public/builds.json — computed here once (Node) rather than in every visitor's
// browser. Same recommend.js as the Build Lab, pure knowledge-base rules (no squad notes,
// no user picks), with no manager: a visitor who picks a manager in the Public tab gets
// that one card re-run live. Re-run after any change to recommend.js, data/knowledge.js
// or cards.json:
//
//     node tools/build_public.js
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const IN = path.join(ROOT, "data", "public", "cards.json");
const OUT = path.join(ROOT, "data", "public", "builds.json");
if (!fs.existsSync(IN)) { console.error(`${IN} missing — run python3 tools/fetch_public.py first`); process.exit(2); }

const window = {};
const ctx = vm.createContext({ window, console });
for (const f of ["data/players.js", "data/knowledge.js", "data/ovr.js", "data/managers.js", "recommend.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
}
const { SQUAD_DATA: DATA, KB, OVR } = window;
const db = JSON.parse(fs.readFileSync(IN, "utf8"));
const labels = { ...DATA.labels, ...db.labels };

// Helpers mirror lab.js (norm aliases, cost table, categories) — keep them in step.
const MAX_LEVEL = 20;
const norm = (s) => {
  const k = String(s || "").toLowerCase().replace(/^the /, "").replace(/[^a-z0-9]/g, "");
  return { offensivewingback: "offensivefullback", attackingfullback: "offensivefullback", offensivegoalkeeper: "attackinggk" }[k] || k;
};
const skillLabel = (k) => labels[k] || k;
const levelCost = (lvl) => Math.ceil(lvl / 4);
const cumCost = (lvl) => { let t = 0; for (let i = 1; i <= lvl; i++) t += levelCost(i); return t; };
const budgetFor = (cap) => Math.max(0, (cap - 1) * 2);
const categoriesFor = (p) => KB.CATEGORIES.filter((c) => !c.gk || p.position === "GK");
const profAt = (p, pos) => (p.position === pos ? "primary" : Object.fromEntries((p.additionalPositions || []).map((a) => [a.position, a.familiarity === 2 ? "high" : "mid"]))[pos] || "none");

// Cards the recommender can't build (missing stats or cap) are reported, not fatal.
const players = db.players.filter((p) => p.stats && p.levelCap && p.position);
const skipped = db.players.length - players.length;

const t0 = Date.now();
const R = window.Recommender({
  players, KB, OVR, norm, skillLabel, categoriesFor, levelCost, cumCost, budgetFor, profAt,
  skillMultiplier: () => 1, managerProficiency: () => null, managerObj: () => null,
  notesFor: () => null, myPicks: () => [], onBench: () => false,
  context: { manager: "", tactic: "" }, MAX_LEVEL, boosterPool: DATA.boosterPool,
});

const out = {};
let off = 0;
for (const p of players) {
  const r = R.recs[p.id];
  const spent = categoriesFor(p).reduce((a, c) => a + cumCost(r.levels[c.key] || 0), 0);
  if (spent !== budgetFor(p.levelCap)) off++;
  out[p.id] = {
    role: r.roleLabel, template: r.template, levels: r.levels, booster2: r.booster2, booster: r.booster.name, boosterFixed: r.boosterFixed,
    rating: r.rating, final: r.final, targets: r.targets, skills: r.aiSkills, why: r.aiWhy, notes: r.notes,
    lock: r.lock, missed: r.missed, waste: r.waste, altPosition: r.altPosition,
  };
}
fs.writeFileSync(OUT, JSON.stringify({ built: new Date().toISOString().slice(0, 10), cards: db.fetched, builds: out }) + "\n");
console.log(`${players.length} builds → ${path.relative(ROOT, OUT)} in ${((Date.now() - t0) / 1000).toFixed(1)} s · ${skipped} cards skipped (no stats/cap) · ${off} off budget`);
process.exit(off ? 1 : 0);
