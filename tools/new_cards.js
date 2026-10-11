#!/usr/bin/env node
// The week's new public cards, ranked — what to look at (and maybe chase) after a refresh.
// Reads data/public/cards.json + builds.json; prints every card that appeared on eFHUB in
// the last N days (default 7) with its AI build, then the best new card per position.
//
//     node tools/new_cards.js            # last 7 days
//     node tools/new_cards.js 14         # last 14 days
//     node tools/new_cards.js 7 --all    # every card, not only new ones (top 40 by AI rating)
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const cards = JSON.parse(fs.readFileSync(path.join(ROOT, "data/public/cards.json"), "utf8"));
const builds = JSON.parse(fs.readFileSync(path.join(ROOT, "data/public/builds.json"), "utf8")).builds;
const days = Number(process.argv[2]) || 7;
const all = process.argv.includes("--all");
const KEYS = ["shooting", "passing", "dribbling", "dexterity", "lowerBody", "aerial", "defending", "gk1", "gk2", "gk3"];
const LABEL = { offensiveAwareness: "OA", ballControl: "BC", dribbling: "Dr", tightPossession: "TP", lowPass: "LP", loftedPass: "LoP", finishing: "Fin", heading: "Hd", curl: "Cu", speed: "Sp", acceleration: "Ac", kickingPower: "KP", jump: "Jmp", physicalContact: "PC", balance: "Bal", stamina: "Sta", defensiveAwareness: "DA", ballWinning: "Tk", defensiveEngagement: "DE", aggression: "Ag", gkAwareness: "GKA", gkReflexes: "GKRf", gkReach: "GKRe", gkClearing: "GKP", gkCatching: "GKC" };
const fresh = (p) => p.added && (Date.now() - Date.parse(p.added)) / 864e5 <= days;
let list = cards.players.filter((p) => builds[p.id] && (all || fresh(p)));
list.sort((a, b) => builds[b.id].rating - builds[a.id].rating || (b.overall || 0) - (a.overall || 0));
if (all) list = list.slice(0, 40);
console.log(all ? `Top ${list.length} public cards by AI build rating (eFHUB ${cards.fetched})`
  : `${list.length} new card${list.length === 1 ? "" : "s"} on eFHUB in the last ${days} days (data ${cards.fetched})`);
for (const p of list) {
  const r = builds[p.id];
  const line = KEYS.filter((k) => k in r.levels || (p.position === "GK" ? true : !k.startsWith("gk"))).map((k) => r.levels[k] || 0).join("-");
  const styles = [p.playingStyle, p.playingStyleDefensive].filter(Boolean).join(" / ") || "no style";
  const targets = r.targets.slice(0, 6).map((t) => `${LABEL[t.stat] || t.stat} ${t.value}${t.hit ? "" : "/" + t.target}`).join(" ");
  console.log(`\n${p.name} (${p.team || "—"}) · ${p.cardType || "?"} · ${p.position} · card ${p.overall ?? "—"} → AI ${r.rating} · ${p.height} cm, ${p.foot || "?"} foot · cap ${p.levelCap} · added ${p.added}`);
  console.log(`  ${styles} → ${r.role}${r.lock ? " · lock" : " · test"} · ${line} · ${r.booster}${r.boosterFixed ? " (fixed)" : ""}`);
  console.log(`  ${targets}`);
  console.log(`  skills: ${r.skills.join(", ")}`);
  console.log(`  https://efhub.com/players/${p.id}`);
}
if (!all && list.length) {
  const best = {};
  list.forEach((p) => { if (!best[p.position]) best[p.position] = p; });
  console.log(`\nBest new card per position: ${Object.entries(best).map(([pos, p]) => `${pos} ${p.name} ${builds[p.id].rating}`).join(" · ")}`);
}
