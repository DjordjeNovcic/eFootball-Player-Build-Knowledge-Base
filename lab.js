(() => {
  "use strict";

  const DATA = window.SQUAD_DATA;
  const KB = window.KB;
  const OVR = window.OVR;

  /* ---------------------------------------------------------
     Constants & helpers
  --------------------------------------------------------- */

  const MAX_LEVEL = 20; // KNOWLEDGE-BASE §12 (in-game verified)
  const SKILL_CAP = 5; // §9 hard cap on additional skills
  const STORE_KEY = "efb-build-lab-v1";
  const POSITION_GROUP = {
    GK: "GK", CB: "DEF", LB: "DEF", RB: "DEF",
    DMF: "MID", CMF: "MID", LMF: "MID", RMF: "MID", AMF: "MID",
    LWF: "FWD", RWF: "FWD", SS: "FWD", CF: "FWD",
  };
  const POS_ORDER = OVR.POSITIONS;

  const $ = (sel, root = document) => root.querySelector(sel);
  // Card and manager photos that fail to load drop out (no inline onerror handlers — the
  // Content Security Policy in index.html forbids them).
  document.addEventListener("error", (e) => { const t = e.target; if (t instanceof HTMLImageElement && t.classList.contains("js-img")) t.remove(); }, true);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Replace an element's HTML only when it actually changed: the squad is re-rendered on
  // every sync event at start-up, and rebuilding 55 card tiles makes them flash.
  const htmlHash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return `${s.length}:${h}`; };
  function setHtml(el, html) {
    const key = htmlHash(html);
    if (el.dataset.hash === key) return false;
    el.innerHTML = html;
    el.dataset.hash = key;
    return true;
  }
  // Keyed list render: a tile whose HTML didn't change keeps its DOM node (and its loaded
  // images, open sheet and scroll position); the others are rebuilt, and all are put in the
  // new order. Cloud sync re-renders the squad a few times at start-up — without this every
  // card image flashed.
  function renderKeyed(root, items) {
    const existing = new Map([...root.children].filter((el) => el.dataset.key).map((el) => [el.dataset.key, el]));
    const frag = document.createDocumentFragment();
    for (const { key, html } of items) {
      const h = htmlHash(html);
      let el = existing.get(key);
      if (!el || el.dataset.hash !== h) {
        const tpl = document.createElement("template");
        tpl.innerHTML = html.trim();
        el = tpl.content.firstElementChild;
        el.dataset.key = key;
        el.dataset.hash = h;
      }
      frag.appendChild(el);
    }
    root.replaceChildren(frag);
    delete root.dataset.hash;
  }
  const norm = (s) => {
    const k = String(s || "").toLowerCase().replace(/^the /, "").replace(/[^a-z0-9]/g, "");
    return { offensivewingback: "offensivefullback", attackingfullback: "offensivefullback", offensivegoalkeeper: "attackinggk" }[k] || k;
  };
  const statLabel = (k) => KB.STAT_LABELS[k] || k;
  const skillLabel = (k) => DATA.labels[k] || k;
  const levelCost = (lvl) => Math.ceil(lvl / 4); // cost of reaching `lvl` (1–4:1, 5–8:2, …)
  const cumCost = (lvl) => { let t = 0; for (let i = 1; i <= lvl; i++) t += levelCost(i); return t; };
  const budgetFor = (cap) => Math.max(0, (cap - 1) * 2);
  const isGK = (p) => p.position === "GK";
  const categoriesFor = (p) => KB.CATEGORIES.filter((c) => !c.gk || isGK(p));
  const styleText = (p) => [p.playingStyle, p.playingStyleDefensive].filter(Boolean).join(" · ") || "—";
  // Playing-style filter shared by every card list (§18): one <select> of the attacking and
  // defensive styles; a card matches on either of its two style slots.
  const STYLE_OPTIONS = `<option value="">All styles</option>`
    + `<optgroup label="Attacking">${KB.ATT_STYLES.map((s) => `<option value="${norm(s.name)}">${esc(s.name)}</option>`).join("")}</optgroup>`
    + `<optgroup label="Defensive">${KB.DEF_STYLES.map((s) => `<option value="${norm(s.name)}">${esc(s.name)}</option>`).join("")}</optgroup>`
    + `<option value="basic">No playing style (Basic)</option>`;
  const styleMatch = (p, key) => !key || (key === "basic" ? !p.playingStyle && !p.playingStyleDefensive
    : norm(p.playingStyle) === key || norm(p.playingStyleDefensive) === key);
  function bindStyleFilter(prefix, state, render) {
    const sel = $(`#${prefix}Style`);
    if (!sel) return;
    sel.innerHTML = STYLE_OPTIONS;
    sel.addEventListener("change", (e) => { state.style = e.target.value; render(); });
  }
  // Playing-style guide (§18): resolve both style slots to the KB entry, its compatible
  // positions and what to expect. eFHUB files some defensive styles in the attacking slot.
  const STYLE_INDEX = (() => {
    const idx = {};
    KB.ATT_STYLES.forEach((x) => { idx["att:" + norm(x.name)] = { ...x, kind: "Attacking", guide: KB.STYLE_GUIDE.att[x.name] }; });
    KB.DEF_STYLES.forEach((x) => { idx["def:" + norm(x.name)] = { ...x, kind: "Defensive", guide: KB.STYLE_GUIDE.def[x.name] }; });
    return idx;
  })();
  function stylesOf(p) {
    const out = [];
    if (p.playingStyle) out.push(STYLE_INDEX["att:" + norm(p.playingStyle)] || STYLE_INDEX["def:" + norm(p.playingStyle)] || { name: p.playingStyle, kind: "Attacking" });
    if (p.playingStyleDefensive) out.push(STYLE_INDEX["def:" + norm(p.playingStyleDefensive)] || { name: p.playingStyleDefensive, kind: "Defensive" });
    return out;
  }
  const styleActiveAt = (st, pos) => (st.positions ? st.positions.split(/,\s*/).includes(pos) : null);
  function styleGuideHtml(p, pos, focus) {
    const list = stylesOf(p);
    const ai = KB.AI_STYLES.filter((a) => p.comSkills.some((k) => norm(skillLabel(k)) === norm(a.name)));
    if (!list.length && !ai.length) return `<p class="sg-empty">No playing style on this card — he plays as Basic.</p>`;
    return list.map((st) => {
      const active = styleActiveAt(st, pos);
      return `
        <div class="sg">
          <div class="sg__head">
            <span class="sg__kind">${st.kind}</span>
            <b class="sg__name">${esc(st.name)}</b>
            ${active == null ? "" : active
              ? `<span class="badge badge--green">active at ${pos}</span>`
              : `<span class="badge badge--ember" title="Compatible: ${esc(st.positions)}">${st.kind === "Attacking" ? `plays as Basic at ${pos}` : `inactive at ${pos}`}</span>`}
            ${st.positions ? `<span class="sg__pos">${esc(st.positions)}</span>` : ""}
          </div>
          ${st.guide ? `<p class="sg__expect"><span>What he does</span>${esc(st.guide.expect)}</p>` : st.behavior ? `<p class="sg__expect"><span>What he does</span>${esc(st.behavior)}</p>` : ""}
          ${st.guide?.use ? `<p class="sg__use"><span>How to use him</span>${esc(st.guide.use)}</p>` : ""}
        </div>`;
    }).join("") + (ai.length ? `<div class="sg sg--ai"><div class="sg__head"><span class="sg__kind">AI styles</span></div>
        <p class="sg__expect">${ai.map((a) => `<b>${esc(a.name)}</b> — ${esc(a.behavior.toLowerCase())}`).join("; ")}. Only when the AI controls him on the ball (§18).</p></div>` : "")
      + (focus?.length ? `<p class="sg__focus"><span>Build focus</span>${focus.map((k) => esc(statLabel(k))).join(" · ")}</p>` : "");
  }
  function styleExpectShort(p) {
    const st = stylesOf(p).find((x) => x.guide);
    return st ? st.guide.expect : "";
  }

  // Rating colours: blue 90+, green 80s, yellow 70s, red below 70 (darker under 60).
  const statTier = (v) => (v >= 90 ? "elite" : v >= 80 ? "good" : v >= 70 ? "ok" : v >= 60 ? "low" : "poor");

  // The working squad: generated cards + cards added in this browser − removed ones.
  // Mutated in place by rebuildPlayers() so every view keeps its reference.
  const players = [];
  const byId = {};
  const playerNativeNames = (p) => new Set(p.skills.map((k) => norm(skillLabel(k))));

  function cardImg(p, cls) {
    return `<img class="${cls} js-img" src="${esc(p.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
  }

  /* ---------------------------------------------------------
     Persistence (per-viewer, this browser only)
  --------------------------------------------------------- */

  // Profiles: "me" (the squad in data/players.js + USER-SQUAD.md notes) and any number of
  // friend squads. Each profile keeps its own players, builds, lineups, positions,
  // managers and playstyle. `store` always points at the active profile.
  const FRIEND_FILES = window.FRIEND_SQUADS || {};
  function blankProfile(kind, name, extra = {}) {
    return { kind, name, builds: {}, manager: kind === "me" ? KB.CURRENT_MANAGER : "", tactic: "Long Ball Counter",
      lineups: [], activeLineup: null, positions: {}, customPlayers: {}, removed: [], ownedManagers: [],
      playerSkills: {}, skillSource: {}, ...extra };
  }
  function normaliseProfile(p, kind, name) {
    return { ...blankProfile(kind, name), ...p, kind, name: p.name || name };
  }
  function loadRoot() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch { /* private mode */ }
    // Older saves kept one flat squad — that becomes the "me" profile.
    const root = s.profiles ? s : { active: "me", profiles: { me: s } };
    root.profiles.me = normaliseProfile(root.profiles.me || {}, "me", "My squad");
    Object.entries(root.profiles).forEach(([id, p]) => { if (id !== "me") root.profiles[id] = normaliseProfile(p, "friend", p.name || "Friend"); });
    // One squad per account: the site always shows "My squad" (friends sign in to their own).
    root.active = "me";
    return root;
  }
  const root = loadRoot();
  let store = root.profiles[root.active];
  const isMe = () => root.active === "me";
  // The repo squad (data/players.js + USER-SQUAD notes) belongs to the site owner; cloud.js
  // switches it off when someone else signs in, so their "My squad" starts empty.
  // Owner-only: cloud.js sets it on the owner's sign-in and remembers it on that device
  // (so the owner's squad shows instantly); everyone else never sees it. With cloud sync
  // not configured at all, the site is single-user and always shows it.
  const OWNER_FLAG = "efb-build-lab-owner";
  let repoSquad = (() => {
    if (!document.querySelector('script[src^="cloud.js"]')) return true;
    try { return localStorage.getItem(OWNER_FLAG) === "1"; } catch { return false; }
  })();
  // "My squad" of the site owner (or anyone signed out, as a demo) = the repo squad with its
  // USER-SQUAD notes and seven managers. Everyone else's "My squad" works like a friend's.
  // With cloud sync on the page, nothing is painted from the owner flag until the auth
  // state is known (cloud.js → setAuth): a stale flag used to flash the owner's squad at a
  // signed-out visitor. Without cloud.js the site is single-user and paints at once; if
  // Firebase never answers, the flag is trusted after a few seconds.
  const CLOUD = !!document.querySelector('script[src^="cloud.js"]');
  let authKnown = !CLOUD;
  const ownsRepo = () => isMe() && repoSquad;
  const notesFor = (id) => (ownsRepo() ? KB.SQUAD_NOTES[id] : null);
  const auth = { enabled: false, signedIn: false };
  // Signed out on a site with cloud sync: the squad features ask for an account first.
  // Elements with data-auth-open open the sign-in / register dialog (cloud.js).
  const gated = () => auth.enabled && !auth.signedIn;
  const gateHtml = (what) => `<div class="pro-gate gate"><p><b>Sign in or create a free account</b> to ${what}. Your squad, builds and lineups are saved to your account and follow you to every device.</p><button type="button" class="btn btn--primary" data-auth-open>Sign in / Register</button></div>`;
  const openAuth = () => { if (gated()) document.getElementById("cloudIn")?.click(); };
  // Builds the site owner publishes for everyone (cloud.js → creatorBuilds/{playerId}).
  // Each carries its own card snapshot, so viewers don't need the card in their squad.
  const pro = { name: "CoinPlayTV", isCreator: false, loaded: false, error: null, builds: {}, publish: null, unpublish: null };

  function rebuildPlayers() {
    const removed = new Set(store.removed);
    const base = isMe() ? (repoSquad && authKnown ? DATA.players : []) : FRIEND_FILES[store.fileKey]?.players || [];
    const all = [...base, ...Object.values(store.customPlayers).filter((c) => !base.some((p) => p.id === c.id))];
    all.forEach((p) => { if (p.labels) Object.assign(DATA.labels, p.labels); });
    players.length = 0;
    Object.keys(byId).forEach((k) => delete byId[k]);
    all.filter((p) => !removed.has(p.id)).forEach((p) => { players.push(p); byId[p.id] = p; });
  }
  rebuildPlayers();
  // Cloud sync (cloud.js) listens here; `silent` is used when applying remote data so it
  // isn't echoed back.
  const changeListeners = [];
  const deleteListeners = [];
  function saveStore(opts = {}) {
    if (!opts.silent) store.updatedAt = Date.now();
    try { localStorage.setItem(STORE_KEY, JSON.stringify(root)); } catch { /* private mode */ }
    if (!opts.silent) changeListeners.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  }

  /* ---------------------------------------------------------
     Position proficiency — card default from eFHUB (familiarity 2 = high,
     1 = intermediate), overridable per player for positions trained in-game.
  --------------------------------------------------------- */

  const PROF_LABEL = { primary: "Main", high: "High", mid: "Intermediate", none: "None" };
  function cardPositions(p) {
    return Object.fromEntries(p.additionalPositions.map((a) => [a.position, a.familiarity === 2 ? "high" : "mid"]));
  }
  function positionsOf(p) {
    return store.positions[p.id] || cardPositions(p);
  }
  function profAt(p, pos) {
    if (p.position === pos) return "primary";
    return positionsOf(p)[pos] || "none";
  }
  const positionsEdited = (p) => !!store.positions[p.id];
  function positionList(p) {
    const extra = positionsOf(p);
    return [p.position, ...POS_ORDER.filter((pos) => pos !== p.position && extra[pos])]
      .map((pos) => ({ pos, prof: profAt(p, pos) }));
  }

  /* ---------------------------------------------------------
     Additional skills — trained on the player (not per build), up to 5.
     Source per skill: "mine" (chosen by the user, or saved in USER-SQUAD) or "rec".
  --------------------------------------------------------- */

  const skillsOf = (id) => store.playerSkills[id] || [];
  const skillSrc = (id, name) => store.skillSource[id]?.[name] || "rec";
  const myPicks = (id) => skillsOf(id).filter((n) => skillSrc(id, n) === "mine");
  function setSkills(id, list, sources) {
    store.playerSkills[id] = list.slice(0, SKILL_CAP);
    const touched = sources?.__touched ?? store.skillSource[id]?.__touched;
    store.skillSource[id] = Object.fromEntries(store.playerSkills[id].map((n) => [n, sources?.[n] || skillSrc(id, n)]));
    if (touched) store.skillSource[id].__touched = true;
  }
  function recommendedSkillPlan(p) {
    const note = notesFor(p.id);
    const saved = new Set([...(note?.prefSkills || []), ...(note?.snapshot?.skills || []), ...myPicks(p.id)]);
    const list = REC.recs[p.id]?.skills || [];
    return { list, sources: Object.fromEntries(list.map((n) => [n, saved.has(n) ? "mine" : "rec"])) };
  }
  // Every player gets a skill plan the first time it's seen: the user's own picks first,
  // then the knowledge-base recommendation (recommend.js) up to five.
  // Until the user edits a player's list, it follows the latest recommendation (so rule
  // improvements reach it); once edited ("touched") it stays exactly as chosen.
  function ensureSkillPlans() {
    let changed = false;
    players.forEach((p) => {
      if (store.skillSource[p.id]?.__touched) return;
      const plan = recommendedSkillPlan(p);
      if (JSON.stringify(plan.list) === JSON.stringify(skillsOf(p.id))) return;
      setSkills(p.id, plan.list, plan.sources);
      changed = true;
    });
    if (changed) saveStore();
  }

  /* ---------------------------------------------------------
     Build math
  --------------------------------------------------------- */

  function emptyBuild(p) {
    return { levels: Object.fromEntries(categoriesFor(p).map((c) => [c.key, 0])), booster2: null, skills: [], levelCap: p.levelCap };
  }

  function pointsUsed(build) {
    return Object.values(build.levels).reduce((t, l) => t + cumCost(l), 0);
  }

  function booster2Of(p, build) {
    if (p.booster2Fixed) return p.booster2Fixed;
    return DATA.boosterPool.find((b) => b.id === build.booster2) || null;
  }

  // §11/§12: the trade the recommended slot-2 booster enabled — its +1s stand in for
  // category levels (3 pts each at levels 9–12), read against the no-booster build.
  function boosterTradeText(r) {
    const short = (l) => l.replace("Lower Body Strength", "Lower Body").replace("Aerial Strength", "Aerial");
    const step = (s) => `${short(s.label)} ${s.from}→${s.to}`;
    const drops = (r.boosterShift || []).filter((s) => s.to < s.from).map(step);
    const ups = (r.boosterShift || []).filter((s) => s.to > s.from).map(step);
    if (!drops.length || !ups.length) return "Adds on top of the finished build — none of its stats sits on a category level worth trading away (§11, §12).";
    return `Frees ${r.boosterFreed} training pts: ${drops.join(", ")} (its +1s stand in for those levels), spent on ${ups.join(", ")} (§11, §12).`;
  }

  // Managers: the user's eight (with Link-up data, §22) plus every eFHUB manager card.
  // Keys: "kb:<name>" / "ef:<id>"; older saves stored the bare name.
  // Photos and Link-up plays come from amine250's manager database (tools/fetch_players.py);
  // the KB cards borrow the photo of the eFHUB card with the same proficiencies.
  const efSame = (m) => (window.EF_MANAGERS || []).find((e) => e.prof.slice(0, 5).join() === m.prof.slice(0, 5).join());
  const ALL_MANAGERS = [
    ...KB.MANAGERS.map((m) => ({ ...m, key: `kb:${m.name}`, photo: efSame(m)?.photo || null,
      linkUps: m.linkUps || (m.linkUp ? [{ name: m.linkUp, centerPiece: m.centerPiece, keyMan: m.keyMan }] : []) })),
    ...(window.EF_MANAGERS || []).map((m) => ({ ...m, key: `ef:${m.id}`, linkUps: m.linkUps || [], affinity: null })),
  ];
  const mgrPhoto = (m, cls = "mgr-photo") => (m?.photo
    ? `<img class="${cls} js-img" src="${esc(m.photo)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : "");
  // The photo of whichever manager a <select> currently holds (Trainer, Lineup).
  function syncMgrPhoto(selectId) {
    const sel = $(`#${selectId}`);
    const box = document.querySelector(`[data-mgr-photo-for="${selectId}"]`);
    if (sel && box) box.innerHTML = mgrPhoto(managerObj(sel.value), "mgr-photo mgr-photo--inline");
  }
  const setManagerSelect = (selectId, value) => { $(`#${selectId}`).value = managerKey(value); syncMgrPhoto(selectId); };
  const linkUpText = (m) => m.linkUps.map((l) =>
    `<b>${esc(l.name)}</b><small>${esc(l.centerPiece.join(" "))} → ${esc(l.keyMan.join(" "))}</small>`).join("") || "—";
  function managerObj(v = store.manager) {
    if (!v) return null;
    return ALL_MANAGERS.find((m) => m.key === v) || ALL_MANAGERS.find((m) => m.name === v) || null;
  }
  const managerKey = (v) => managerObj(v)?.key || "";
  const bestTactic = (m) => {
    const i = m.prof.reduce((b, v, j) => ((v ?? 0) > (m.prof[b] ?? 0) ? j : b), 0);
    return `${KB.TACTICS[i]} ${m.prof[i]}`;
  };
  function profileManagers() {
    if (ownsRepo()) return ALL_MANAGERS.filter((m) => m.key.startsWith("kb:"));
    const owned = ALL_MANAGERS.filter((m) => m.key.startsWith("ef:") && store.ownedManagers.includes(m.key));
    return owned.length ? owned : ALL_MANAGERS.filter((m) => m.key.startsWith("ef:"));
  }
  const managerOption = (m) => `<option value="${esc(m.key)}">${esc(m.name)} — ${m.boost.map(statLabel).join(" +1, ")} +1 · ${esc(bestTactic(m))}</option>`;

  // Team-playstyle proficiency → stat multiplier on trained stats (eFHUB's model; the
  // table covers proficiency 50–100, eFHUB's UI limits it to 70–90, so we clamp the same).
  const MANAGER_SKILL = [.65, .6675, .685, .7025, .72, .7375, .755, .7725, .79, .8075, .825, .8425, .86, .8775, .895, .9125, .93, .9475, .965, .9825,
    1, 1, 1.01163, 1.01389, 1.015625, 1.01755, 1.01925, 1.02125, 1.02275, 1.0244, 1.026, 1.02725, 1.029, 1.03, 1.03196, 1.03275, 1.03375, 1.034091,
    1.0355, 1.036, 1.0365, 1.036];
  const PROF_MIN = 70;
  const PROF_MAX = 90;
  function managerProficiency(managerName, tactic) {
    const m = managerObj(managerName);
    const i = KB.TACTICS.indexOf(tactic);
    return m && i >= 0 ? m.prof[i] : null;
  }
  function skillMultiplier(prof) {
    if (prof == null) return 1;
    const v = Math.min(PROF_MAX, Math.max(PROF_MIN, prof));
    return MANAGER_SKILL[Math.min(v - 50, MANAGER_SKILL.length - 1)];
  }

  function compute(p, build, managerName = store.manager, tactic = store.tactic) {
    const trained = { ...p.stats };
    const wasted = {};
    categoriesFor(p).forEach((c) => {
      const lvl = build.levels[c.key] || 0;
      if (!lvl) return;
      c.stats.forEach((s) => {
        const next = trained[s] + lvl;
        if (next > 99) wasted[s] = (wasted[s] || 0) + (next - 99);
        trained[s] = Math.min(99, next);
      });
    });
    const mult = skillMultiplier(managerProficiency(managerName, tactic));
    const final = { ...trained };
    const boostOf = {};
    const add = (stats) => Object.entries(stats || {}).forEach(([k, v]) => {
      final[k] += v;
      boostOf[k] = (boostOf[k] || 0) + v;
    });
    if (mult !== 1) {
      Object.keys(final).forEach((k) => {
        const gain = Math.min(99, trained[k] + Math.floor(trained[k] * (mult - 1))) - trained[k];
        if (gain) add({ [k]: gain });
      });
    }
    if (p.booster1) add(p.booster1.stats);
    const b2 = booster2Of(p, build);
    if (b2) add(b2.stats);
    const mgr = managerObj(managerName);
    if (mgr) add(Object.fromEntries(mgr.boost.map((k) => [k, 1])));
    const ratings = Object.fromEntries(POS_ORDER.map((pos) => [pos, OVR.rating(pos, p.height, p.weakFootAccuracy, final)]));
    return { trained, final, boostOf, wasted, ratings };
  }

  function buildLine(p, build) {
    const cap = build.levelCap || p.levelCap;
    const nums = categoriesFor(p).map((c) => build.levels[c.key] || 0).join(" - ");
    return `${nums} (${pointsUsed(build)}/${budgetFor(cap)})`;
  }

  /* ---------------------------------------------------------
     Tabs / routing
  --------------------------------------------------------- */

  const TABS = ["squad", "pro", "public", "mybuilds", "train", "lineup", "skills", "managers", "styles"];
  const view = { playerId: null, draft: null, position: null };

  function route() {
    const [tab, arg] = location.hash.replace(/^#/, "").split("/");
    if (tab === "recommended") { location.replace("#squad"); return; } // the Recommended by AI tab lives in My Squad now
    if (tab === "plan") { if (KB.GAME_PLAN && store.lineups.some((x) => x.id === KB.GAME_PLAN.planId)) store.activeLineup = KB.GAME_PLAN.planId; location.replace("#lineup"); return; } // the Game Plan is the plan lineup's Playbook now
    const active = TABS.includes(tab) ? tab : "squad";
    document.querySelectorAll("[data-tab]").forEach((el) => el.classList.toggle("is-active", el.dataset.tab === active));
    document.querySelectorAll("[data-tab-link]").forEach((el) => {
      const on = el.dataset.tabLink === active;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-selected", String(on));
    });
    if (active === "train") {
      $("#trainEmpty").hidden = players.length > 0;
      if (!players.length) $("#trainEmpty").innerHTML = gated() ? gateHtml("train your own players") : `No players in this squad yet — add some in <a href="#squad">My Squad</a>.`;
      $("#trainBody").hidden = players.length === 0;
      if (players.length) openTrainer(arg && byId[arg] ? arg : byId[view.playerId] ? view.playerId : defaultPlayerId());
    }
    if (active === "lineup") renderLineup();
    if (active === "mybuilds") renderMyBuilds();
    if (active === "pro") renderPro();
    if (active === "public") { loadPublic(); renderPublic(); }
  }
  function go(tab, arg) {
    const hash = `#${tab}${arg ? "/" + arg : ""}`;
    if (location.hash === hash) route(); else location.hash = hash;
    window.scrollTo({ top: 0 });
  }
  function defaultPlayerId() {
    const saved = Object.keys(store.builds).find((id) => byId[id]);
    return saved || players[0].id;
  }

  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-open-player]");
    if (open) { e.preventDefault(); go("train", open.dataset.openPlayer); }
  });
  window.addEventListener("hashchange", route);

  /* ---------------------------------------------------------
     Squad tab
  --------------------------------------------------------- */

  const squadState = { q: "", group: "ALL", style: "", open: new Set() };

  function renderSquad() {
    const root = $("#squadGrid");
    if (!authKnown) {
      $("#squadMeta").textContent = "Loading…";
      setHtml(root, `<p class="empty-state">Loading your squad…</p>`);
      return;
    }
    const q = squadState.q.trim().toLowerCase();
    // "Starting XI" / "Bench" follow the active lineup (Lineup tab), in its own order.
    const lineup = store.lineups.find((x) => x.id === store.activeLineup) || store.lineups[0] || null;
    const order = squadState.group === "XI" ? (lineup?.xi || []) : squadState.group === "BENCH" ? (lineup?.bench || []) : null;
    const list = players
      .filter((p) => squadState.group === "ALL" || (order ? order.includes(p.id) : POSITION_GROUP[p.position] === squadState.group))
      .filter((p) => styleMatch(p, squadState.style))
      .filter((p) => !q || `${p.name} ${p.team} ${positionList(p).map((x) => x.pos).join(" ")} ${styleText(p)} ${p.id}`.toLowerCase().includes(q))
      .sort((a, b) => (order ? order.indexOf(a.id) - order.indexOf(b.id) : POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position) || b.overall - a.overall));

    const counts = players.reduce((c, p) => ((c[POSITION_GROUP[p.position]] = (c[POSITION_GROUP[p.position]] || 0) + 1), c), {});
    $("#squadMeta").innerHTML =
      `${players.length} card${players.length === 1 ? "" : "s"} · GK ${counts.GK || 0} · DEF ${counts.DEF || 0} · MID ${counts.MID || 0} · FWD ${counts.FWD || 0}`
      + (order && lineup ? ` · ${squadState.group === "XI" ? "starting XI" : "bench"} of “${esc(lineup.name)}”` : "")
      + (REC ? ` · builds rated with ${recContextHtml()}` : "") + ` · stats from eFHUB, ${esc(DATA.fetched)}`;

    const tiles = list.map((p) => {
      const note = notesFor(p.id);
      const saved = store.builds[p.id];
      // The tile's rating: the saved build's, else the Recommended by AI build's.
      // Rated where he actually plays when USER-SQUAD says so (buildAs — Gullit, Bale at CF).
      const ratedAt = REC?.recs[p.id]?.buildAs || p.position;
      const rating = saved ? compute(p, saved).ratings[ratedAt] : REC?.recs[p.id]?.rating ?? p.overall;
      let savedBadge = "";
      if (saved) savedBadge = `<span class="badge badge--lime">★ Build saved</span>`;
      else if (note?.snapshot) savedBadge = `<span class="badge">Snapshot ${esc(note.snapshot.date)}</span>`;
      const r = REC?.recs[p.id];
      const role = lineupRole(p.id);
      return { key: p.id, html: `
        <details class="rec-card squad-card" data-group="${POSITION_GROUP[p.position]}" data-rec="${p.id}">
          <summary class="squad-card__sum" title="${r ? "Open the Recommended by AI build" : ""}">
          <div class="squad-card__head">
            <div class="squad-card__media">${cardImg(p, "squad-card__img")}
              <div class="squad-card__ovr" title="${saved ? "Your saved build" : "Recommended by AI build"} at ${ratedAt} · card ${p.overall}"><b>${rating}${saved ? "<sup>★</sup>" : ""}</b><span>${p.position} · card ${p.overall}</span></div>
            </div>
            <div class="squad-card__id">
              <h3 class="squad-card__name">${esc(p.name)}</h3>
              <p class="squad-card__team">${esc(p.team || "")}</p>
              <p class="squad-card__team">${p.height} cm · ${esc(p.foot || "")} foot</p>
              <p class="squad-card__style">${esc(styleText(p))}</p>
              <p class="squad-card__pos">${positionList(p).map(({ pos, prof }) => `<span class="pp pp--${prof}">${pos}</span>`).join("")}${positionsEdited(p) ? `<span class="pp-edited" title="Edited in Trainer">✎</span>` : ""}</p>
              <p class="squad-card__boost">${esc(p.booster1?.name || "No booster")}${p.booster2Fixed ? " + " + esc(p.booster2Fixed.name) : ""}</p>
            </div>
          </div>
          <div class="squad-card__body">
            ${skillsOf(p.id).length ? `<div class="squad-card__skills" title="Additional skills — ★ your pick, outlined = Recommended by AI"><span class="squad-card__label">Skills${skillsOf(p.id).some((n) => skillSrc(p.id, n) !== "mine") ? ` <i class="ai-mark">AI</i>` : ""}</span>${skillsOf(p.id).map((n) => `<span class="sk${skillSrc(p.id, n) === "mine" ? " is-mine" : ""}">${skillSrc(p.id, n) === "mine" ? "★ " : ""}${esc(n)}</span>`).join("")}</div>` : ""}
            ${styleExpectShort(p) ? `<p class="squad-card__expect" title="${esc(stylesOf(p).filter((x) => x.guide).map((x) => `${x.name}: ${x.guide.expect} ${x.guide.use}`).join("\n\n"))}">${esc(styleExpectShort(p))}</p>` : ""}
            ${note ? `<p class="squad-card__note">${esc(note.role)}</p>` : ""}
          </div>
          <div class="squad-card__foot">
            <div class="squad-card__meta">
              ${role ? `<span class="badge badge--lime">${esc(role.label)} in lineup</span>` : ""}
              ${r ? `<span class="badge" title="By the AI build, among the ${p.position} cards in your squad">#${r.depth.rank}/${r.depth.of} ${p.position}</span>` : ""}
              ${r ? (r.lock ? `<span class="badge badge--green">Lock</span>` : `<span class="badge badge--amber">Test variant</span>`) : ""}
              ${p.custom ? `<span class="badge badge--amber" title="Added in this browser">Added here</span>` : ""}
              ${savedBadge}
              <span class="squad-card__pts">Lv cap ${p.levelCap} · ${budgetFor(p.levelCap)} pts</span>
            </div>
            <div class="squad-card__actions">
              <button type="button" class="btn btn--icon btn--solid" data-open-player="${p.id}">Train</button>
              <a class="btn btn--icon" href="https://efhub.com/players/${p.id}" target="_blank" rel="noopener">eFHUB ↗</a>
              <button type="button" class="btn btn--icon btn--danger squad-card__remove" data-remove-player="${p.id}" aria-label="Remove ${esc(p.name)} from squad" title="Remove from squad"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg></button>
            </div>
          </div>
          </summary>
        </details>` };
    });
    if (!players.length && gated()) { setHtml(root, gateHtml("build your squad — add your cards from eFHUB or the Public Cards tab")); return; }
    if (tiles.length) {
      renderKeyed(root, tiles);
      // Open state and the lazily built sheet live outside the tile's HTML, so a tile that
      // didn't change keeps both and a rebuilt one gets them back.
      root.querySelectorAll("details[data-rec]").forEach((d) => {
        const id = d.dataset.rec;
        const open = squadState.open.has(id);
        if (open && !d.querySelector(":scope > .rec-card__body") && REC?.recs[id]) d.insertAdjacentHTML("beforeend", recSheetHtml(byId[id], REC.recs[id]));
        if (d.open !== open) d.open = open;
      });
    } else setHtml(root, (players.length ? `<p class="empty-state">${order && lineup && !q
        ? (order.some(Boolean) ? `None of the ${squadState.group === "XI" ? "starters" : "bench players"} in “${esc(lineup.name)}” are in your squad any more.`
          : `“${esc(lineup.name)}” has no ${squadState.group === "XI" ? "starting XI" : "bench"} yet — fill it in the Lineup tab.`)
        : order && !lineup ? "No lineup yet — set up your starting XI and bench in the Lineup tab." : "No cards match."}</p>`
      : isMe() && auth.enabled && !auth.signedIn
        ? `<p class="empty-state"><b>Sign in</b> (top right) to build your squad — it's saved to your account and follows you to every device.</p>`
      : isMe()
        ? `<p class="empty-state">Your squad is empty — click <b>+ Add player</b> above to bring in your cards from eFHUB, then pick your managers in the Managers tab.</p>`
        : `<p class="empty-state">No cards in ${esc(store.name)}'s squad yet — click <b>+ Add player</b> above.</p>`));
  }

  $("#squadSearch").addEventListener("input", (e) => { squadState.q = e.target.value; renderSquad(); });
  bindStyleFilter("squad", squadState, renderSquad);
  $("#squadGroups").addEventListener("click", (e) => {
    const b = e.target.closest("[data-group]");
    if (!b) return;
    squadState.group = b.dataset.group;
    $("#squadGroups").querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-selected", c === b));
    renderSquad();
  });

  /* ---------------------------------------------------------
     Trainer tab
  --------------------------------------------------------- */

  function renderPlayerSelect() {
    const groups = { GK: "Goalkeepers", DEF: "Defenders", MID: "Midfielders", FWD: "Forwards" };
    const sorted = [...players].sort((a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position) || b.overall - a.overall);
    $("#trainPlayer").innerHTML = Object.entries(groups).map(([g, label]) => `
      <optgroup label="${label}">
        ${sorted.filter((p) => POSITION_GROUP[p.position] === g).map((p) =>
          `<option value="${p.id}">${esc(p.name)} — ${p.position} ${p.overall} · ${esc(p.team || "")}${store.builds[p.id] ? " ★" : ""}</option>`).join("")}
      </optgroup>`).join("");
    $("#trainTactic").innerHTML = KB.TACTICS.map((t) => `<option>${t}</option>`).join("");
    $("#trainManager").innerHTML = `<option value="">No manager</option>` +
      profileManagers().map(managerOption).join("");
  }

  function openTrainer(id) {
    const p = byId[id];
    if (!p) return;
    if (view.playerId !== id) {
      view.playerId = id;
      const saved = store.builds[id];
      view.draft = saved ? structuredClone(saved) : emptyBuild(p);
      categoriesFor(p).forEach((c) => { view.draft.levels[c.key] ??= 0; });
      view.position = p.position;
    }
    $("#trainPlayer").value = id;
    setManagerSelect("trainManager", store.manager);
    $("#trainTactic").value = store.tactic;
    renderTrainer();
  }

  function renderTrainer() {
    const p = byId[view.playerId];
    const b = view.draft;
    const cap = b.levelCap || p.levelCap;
    const budget = budgetFor(cap);
    const used = pointsUsed(b);
    const left = budget - used;
    const res = compute(p, b);
    const note = notesFor(p.id);
    // What changed since the last render of this player (so a +/− click shows its effect).
    const prev = view.prev?.id === p.id ? view.prev : null;
    const diffOf = (k) => (prev ? res.final[k] - prev.final[k] : 0);
    const posDiff = (pos) => (prev ? res.ratings[pos] - prev.ratings[pos] : 0);
    view.prev = { id: p.id, final: { ...res.final }, ratings: { ...res.ratings } };
    const chg = (d) => (d ? `<span class="chg ${d > 0 ? "chg--up" : "chg--down"}">${d > 0 ? "▲" : "▼"}${Math.abs(d)}</span>` : "");

    // Header card
    $("#trainHead").innerHTML = `
      <div class="train-head__media">${cardImg(p, "train-head__img")}</div>
      <div class="train-head__info">
        <p class="train-head__eyebrow">${p.position}${p.additionalPositions.length ? " · also " + p.additionalPositions.map((a) => a.position).join(", ") : ""} · ${esc(p.team || "")}</p>
        <h2 class="train-head__name">${esc(p.name)}</h2>
        <p class="train-head__style">${esc(styleText(p))}</p>
        ${note ? `<p class="train-head__note">${esc(note.role)}</p>` : ""}
      </div>
      <div class="train-head__phys">
        ${[["Height", `${p.height} cm`], ["Weight", `${p.weight} kg`], ["Age", p.age], ["Foot", p.foot || "—"], ["Weak foot", `${p.weakFootUsage ?? "—"} / ${p.weakFootAccuracy ?? "—"}`], ["Card", p.cardType || (p.levelCap ? `Lv cap ${p.levelCap}` : "—")]]
          .map(([k, v]) => `<div class="phys"><span>${k}</span><b>${esc(String(v ?? "—"))}</b></div>`).join("")}
      </div>
      <div class="train-head__ovr">
        <span class="train-head__ovr-num">${res.ratings[view.position]}${chg(posDiff(view.position))}</span>
        <span class="train-head__ovr-lbl">${view.position} · card ${p.overall}</span>
      </div>`;

    // Playing-style guide for the position being rated
    const focus = REC?.recs[p.id]?.targets.slice(0, 5).map((t) => t.stat);
    $("#trainStyle").innerHTML = `<h3 class="group__title">Playing style — what to expect <span class="group__hint">at ${view.position}</span></h3>${styleGuideHtml(p, view.position, focus)}`;

    // Manager proficiency multiplier
    const prof = managerProficiency(store.manager, store.tactic);
    const mult = skillMultiplier(prof);
    $("#trainProfInfo").textContent = !store.manager ? "" : prof == null ? "· N/A for this manager"
      : `· proficiency ${prof} → ${mult >= 1 ? "+" : ""}${((mult - 1) * 100).toFixed(1)}% stats${prof < PROF_MIN ? " (below 70 not modelled)" : ""}`;

    // Points
    $("#trainCap").value = cap;
    $("#trainPoints").innerHTML = `<b class="${left === 0 ? "is-done" : left < 0 ? "is-over" : ""}">${used}</b> / ${budget} pts`;
    $("#trainBuildLine").textContent = buildLine(p, b);

    // Snapshot button
    const snapBtn = $("#trainSnapshot");
    snapBtn.hidden = !note?.snapshot;
    if (note?.snapshot) snapBtn.textContent = `Load snapshot (${note.snapshot.date})`;

    // Categories
    $("#trainCats").innerHTML = categoriesFor(p).map((c) => {
      const lvl = b.levels[c.key] || 0;
      const next = lvl + 1;
      const canAdd = lvl < MAX_LEVEL && levelCost(next) <= left;
      return `
        <div class="cat-row">
          <div class="cat-row__info">
            <span class="cat-row__name">${c.label}</span>
            <span class="cat-row__stats">${c.stats.map(statLabel).join(" · ")}</span>
          </div>
          <div class="cat-row__ctrl">
            <button type="button" class="step" data-cat="${c.key}" data-d="-1" ${lvl === 0 ? "disabled" : ""} aria-label="Lower ${c.label}">−</button>
            <span class="cat-row__lvl">${lvl}</span>
            <button type="button" class="step" data-cat="${c.key}" data-d="1" ${canAdd ? "" : "disabled"} aria-label="Raise ${c.label}">+</button>
          </div>
          <span class="cat-row__cost">${lvl < MAX_LEVEL ? `next ${levelCost(next)} pt` : "max"} · ${cumCost(lvl)} used</span>
        </div>`;
    }).join("");

    // Boosters & manager
    const pool = DATA.boosterPool;
    $("#trainBoost1").textContent = p.booster1 ? `${p.booster1.name} — ${Object.keys(p.booster1.stats).map(statLabel).join(", ")}` : "None";
    const b2sel = $("#trainBoost2");
    if (p.booster2Fixed) {
      b2sel.innerHTML = `<option>${esc(p.booster2Fixed.name)} (fixed on card)</option>`;
      b2sel.disabled = true;
    } else {
      b2sel.disabled = false;
      b2sel.innerHTML = `<option value="">— none —</option>` + pool.map((x) => {
        const dup = p.booster1 && Object.keys(x.stats).some((k) => k in p.booster1.stats);
        return `<option value="${x.id}">${esc(x.name)} — ${Object.keys(x.stats).map(statLabel).join(", ")}${dup ? " (overlaps slot 1)" : ""}</option>`;
      }).join("");
      b2sel.value = b.booster2 ?? "";
    }

    // Additional skills
    const native = playerNativeNames(p);
    const addable = KB.SKILLS.filter((s) => s.pool === "add");
    const mine = skillsOf(p.id);
    $("#trainSkillCount").textContent = `${mine.length}/${SKILL_CAP}`;
    const why = REC?.recs[p.id]?.skillWhy || {};
    $("#trainSkillPlan").innerHTML = mine.length
      ? mine.map((n) => `<span class="tag ${skillSrc(p.id, n) === "mine" ? "tag--mine" : "tag--rec"}" title="${esc(why[n] || "")}">${skillSrc(p.id, n) === "mine" ? "★ " : `<i class="ai-mark">AI</i> `}${esc(n)}</span>`).join("")
      : `<em class="rec-muted">none yet</em>`;
    // Recommended by AI: the knowledge-base picks on their own, each with its reason.
    const ai = REC?.recs[p.id]?.aiSkills || [];
    const aiWhy = REC?.recs[p.id]?.aiWhy || {};
    $("#trainAiSkills").innerHTML = ai.map((n) => {
      const on = mine.includes(n);
      return `<li class="${on ? "is-on" : ""}"><div><b>${esc(n)}</b><span>${esc(aiWhy[n] || "")}</span></div>
        ${on ? `<span class="badge badge--green">on player</span>`
          : `<button type="button" class="btn btn--icon" data-ai-skill="${esc(n)}" ${mine.length >= SKILL_CAP ? `disabled title="5/5 — remove one first"` : ""}>+ Add</button>`}</li>`;
    }).join("") || `<li class="rec-muted">The card already has every skill worth adding for this role natively.</li>`;
    if (ai.length && ai.length < SKILL_CAP) $("#trainAiSkills").insertAdjacentHTML("beforeend", `<li class="rec-muted">Only ${ai.length} worthwhile — the card has the rest natively (§9).</li>`);
    $("#trainSkills").innerHTML = addable.map((s) => {
      const has = native.has(norm(s.name));
      const sel = mine.includes(s.name);
      const full = mine.length >= SKILL_CAP && !sel;
      return `<button type="button" class="chip ${sel ? "is-selected" : ""} ${has || full ? "is-disabled" : ""} ${s.avoid ? "chip--warn" : ""}"
        data-skill="${esc(s.name)}" ${has ? "disabled" : ""} title="${esc(has ? "Already native on this card" : why[s.name] || s.avoid || s.note || s.tested || s.official || "")}">${sel && skillSrc(p.id, s.name) === "mine" ? "★ " : ""}${esc(s.name)}${has ? " ✓" : ""}</button>`;
    }).join("");
    $("#trainNative").innerHTML = p.skills.map((k) => {
      const kb = KB.SKILLS.find((s) => norm(s.name) === norm(skillLabel(k)));
      return `<span class="tag ${kb?.pool === "excl" ? "tag--excl" : ""}" title="${esc(kb?.note || kb?.tested || kb?.official || "")}">${esc(skillLabel(k))}</span>`;
    }).join("") + (p.comSkills.length ? `<span class="tag tag--ai">AI: ${p.comSkills.map((k) => esc(skillLabel(k))).join(", ")}</span>` : "");

    // Position ratings — laid out like the pitch (attack on top)
    const tile = (pos) => {
      const prof = profAt(p, pos);
      const d = posDiff(pos);
      return `<button type="button" class="pmap__tile is-${prof} ${pos === view.position ? "is-current" : ""} ${d ? "is-changed" : ""}" data-pos="${pos}" title="${pos} · ${PROF_LABEL[prof]} proficiency">
        <span>${pos}</span><b>${res.ratings[pos]}</b>${chg(d)}</button>`;
    };
    const stack = (list) => `<div class="pmap__stack">${list.map(tile).join("")}</div>`;
    $("#trainPositions").innerHTML = `
      ${tile("LWF")}${stack(["CF", "SS"])}${tile("RWF")}
      ${tile("LMF")}${stack(["AMF", "CMF", "DMF"])}${tile("RMF")}
      ${tile("LB")}${stack(["CB", "GK"])}${tile("RB")}`;

    // Position proficiency editor
    $("#trainProfState").textContent = positionsEdited(p) ? "edited — saved in this browser" : "card default (eFHUB)";
    $("#trainProfReset").hidden = !positionsEdited(p);
    $("#trainProf").innerHTML = POS_ORDER.map((pos) => {
      const prof = profAt(p, pos);
      return `<button type="button" class="prof-btn is-${prof}" data-prof="${pos}" ${prof === "primary" ? "disabled" : ""}
        title="${pos}: ${PROF_LABEL[prof]}${prof === "primary" ? "" : " — tap to change"}"><b>${pos}</b><span>${PROF_LABEL[prof]}</span></button>`;
    }).join("");

    // Stats — bar scale 40→105 so the differences that matter are visible
    const showGK = isGK(p);
    const pct = (v) => Math.max(0, Math.min(100, ((v - 40) / 65) * 100));
    $("#trainStats").innerHTML = KB.STAT_GROUPS.filter((g) => showGK || g.title !== "Goalkeeping").map((g) => `
      <section class="sgroup">
        <h4 class="sgroup__title">${g.title}</h4>
        ${g.stats.map((k) => {
          const base = p.stats[k];
          const trained = res.trained[k];
          const boost = res.boostOf[k] || 0;
          const fin = res.final[k];
          const th = showGK ? [] : (KB.THRESHOLDS[k] || []);
          const ticks = th.filter((t) => fin < t.at).map((t) => `<em class="tick" style="left:${pct(t.at)}%" title="${t.at}: ${esc(t.note)}"></em>`).join("");
          const hit = th.filter((t) => fin >= t.at);
          const miss = th.find((t) => fin < t.at);
          const need = res.wasted[k]
            ? `<span class="need need--waste" title="Points past the 99 training cap are lost">${res.wasted[k]} lost</span>`
            : miss ? `<span class="need" title="${esc(miss.note)}">${miss.at} −${miss.at - fin}</span>` : "";
          return `
            <div class="srow ${diffOf(k) ? "is-changed" : ""}">
              <span class="srow__label tier-${statTier(fin)}">${statLabel(k)}${hit.length ? `<i class="hit" title="${hit.map((t) => `${t.at} ✓ ${esc(t.note)}`).join(" · ")}">✓${hit[hit.length - 1].at}</i>` : ""}</span>
              <span class="srow__bar">
                <i class="seg seg--base" style="width:${pct(base)}%"></i>
                <i class="seg seg--train" style="left:${pct(base)}%;width:${pct(trained) - pct(base)}%"></i>
                <i class="seg seg--boost" style="left:${pct(trained)}%;width:${pct(fin) - pct(trained)}%"></i>
                ${ticks}
              </span>
              <span class="srow__pills">${trained > base ? `<span class="pill pill--train">+${trained - base}</span>` : ""}${boost ? `<span class="pill pill--boost">+${boost}</span>` : ""}</span>
              <span class="srow__val tier-bg-${statTier(fin)}">${fin}${chg(diffOf(k))}</span>
              <span class="srow__need">${need}</span>
            </div>`;
        }).join("")}
      </section>`).join("");

    // Warnings (KB hard rules)
    const warns = [];
    if (left > 0) warns.push(`<b>${left} point${left > 1 ? "s" : ""} unspent.</b> §12 hard rule: spend every point — park leftovers in Aerial Strength or Defending.`);
    if (left < 0) warns.push(`<b>${-left} points over budget</b> for level cap ${cap}.`);
    if (res.final.speed > 96 && res.trained.speed > p.stats.speed && res.final.speed - (res.trained.speed - p.stats.speed) < 96)
      warns.push(`<b>Speed ${res.final.speed}</b> — 96 is already top speed; training past it is wasted (§3). Take Lower Body down until Speed is 96.`);
    categoriesFor(p).filter((c) => (b.levels[c.key] || 0) >= 13).forEach((c) =>
      warns.push(`<b>${c.label} ${b.levels[c.key]}</b> — 13+ levels in one category means the card isn't made for it (§13): the levels past 12 cost 4–5 points each. Spread them unless this stat is the whole role.`));
    const wastedTotal = Object.values(res.wasted).reduce((a, v) => a + v, 0);
    if (wastedTotal) warns.push(`${wastedTotal} stat point(s) lost above the 99 training cap (${Object.keys(res.wasted).map(statLabel).join(", ")}).`);
    skillsOf(p.id).forEach((n) => {
      const s = KB.SKILLS.find((x) => x.name === n);
      if (s?.avoid) warns.push(`<b>${esc(n)}</b>: ${esc(s.avoid)}`);
    });
    $("#trainWarnings").innerHTML = warns.map((w) => `<li>${w}</li>`).join("");
    $("#trainWarnings").hidden = !warns.length;

    const savedFlag = store.builds[p.id];
    $("#trainSaveState").textContent = savedFlag ? `Saved privately ${new Date(savedFlag.savedAt).toLocaleString()}` : "Not saved";
    renderPublish(p);
  }

  // Owner only: publish the Trainer's current draft as a CoinPlayTV build.
  function renderPublish(p) {
    $("#trainPublishRow").hidden = !pro.isCreator;
    if (!pro.isCreator) return;
    const pub = pro.builds[p.id];
    if (view.publishFor !== p.id) {
      view.publishFor = p.id;
      $("#trainPublishNote").value = pub?.note || "";
    }
    $("#trainUnpublish").hidden = !pub;
    $("#trainPublish").textContent = pub ? "Update public build" : "Publish · public";
    $("#trainPublishState").textContent = pub
      ? `Public since ${new Date(pub.publishedAt).toLocaleString()}${pub.updatedAt !== pub.publishedAt ? ` · updated ${new Date(pub.updatedAt).toLocaleString()}` : ""}`
      : "Not public";
  }

  $("#trainPlayer").addEventListener("change", (e) => go("train", e.target.value));
  // A friend's recommendations follow the Trainer's manager / playstyle (recContext) unless
  // the toolbar picker overrides them — rebuild them only when the context really moved.
  const afterTrainCtx = (before) => { if (JSON.stringify(recContext()) !== before) setRecContext({}); else renderSquad(); };
  $("#trainManager").addEventListener("change", (e) => { const before = JSON.stringify(recContext()); store.manager = e.target.value; syncMgrPhoto("trainManager"); saveStore(); renderTrainer(); afterTrainCtx(before); });
  $("#trainTactic").addEventListener("change", (e) => { const before = JSON.stringify(recContext()); store.tactic = e.target.value; saveStore(); renderTrainer(); afterTrainCtx(before); });
  $("#trainBoost2").addEventListener("change", (e) => { view.draft.booster2 = e.target.value ? Number(e.target.value) : null; renderTrainer(); });
  $("#trainCap").addEventListener("change", (e) => {
    const v = Math.max(1, Math.min(99, Number(e.target.value) || byId[view.playerId].levelCap));
    view.draft.levelCap = v;
    renderTrainer();
  });
  $("#trainCats").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cat]");
    if (!btn || btn.disabled) return;
    const k = btn.dataset.cat;
    view.draft.levels[k] = Math.max(0, Math.min(MAX_LEVEL, (view.draft.levels[k] || 0) + Number(btn.dataset.d)));
    renderTrainer();
  });
  $("#trainSkills").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-skill]");
    if (!chip || chip.disabled) return;
    const n = chip.dataset.skill;
    const id = view.playerId;
    const list = [...skillsOf(id)];
    const i = list.indexOf(n);
    const src = { ...(store.skillSource[id] || {}) };
    if (i >= 0) list.splice(i, 1);
    else if (list.length < SKILL_CAP) { list.push(n); src[n] = "mine"; }
    // Touching the list makes the remaining ones deliberate choices too.
    list.forEach((x) => { src[x] = "mine"; });
    src.__touched = true;
    setSkills(id, list, src);
    refreshRec(id); // trained skills shape the build (§14 step 3)
    saveStore();
    renderTrainer(); renderSquad(); renderMyBuilds();
  });
  $("#trainAiSkills").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ai-skill]");
    if (!b || b.disabled) return;
    const id = view.playerId;
    const list = [...skillsOf(id)];
    if (list.length >= SKILL_CAP || list.includes(b.dataset.aiSkill)) return;
    list.push(b.dataset.aiSkill);
    setSkills(id, list, { ...(store.skillSource[id] || {}), [b.dataset.aiSkill]: "rec", __touched: true });
    refreshRec(id);
    saveStore();
    renderTrainer(); renderSquad(); renderMyBuilds();
  });
  $("#trainPositions").addEventListener("click", (e) => {
    const c = e.target.closest("[data-pos]");
    if (!c) return;
    view.position = c.dataset.pos;
    renderTrainer();
  });
  $("#trainProf").addEventListener("click", (e) => {
    const b = e.target.closest("[data-prof]");
    if (!b || b.disabled) return;
    const p = byId[view.playerId];
    const next = { none: "mid", mid: "high", high: "none" };
    const map = { ...positionsOf(p) };
    const v = next[profAt(p, b.dataset.prof)];
    if (v === "none") delete map[b.dataset.prof]; else map[b.dataset.prof] = v;
    store.positions[p.id] = map;
    saveStore();
    renderTrainer(); renderSquad(); renderLineup();
  });
  $("#trainProfReset").addEventListener("click", () => {
    delete store.positions[view.playerId];
    saveStore();
    renderTrainer(); renderSquad(); renderLineup();
  });
  $("#trainReset").addEventListener("click", () => {
    const p = byId[view.playerId];
    view.draft = { ...emptyBuild(p), booster2: view.draft.booster2 };
    renderTrainer();
  });
  $("#trainSnapshot").addEventListener("click", () => {
    const p = byId[view.playerId];
    const snap = notesFor(p.id)?.snapshot;
    if (!snap) return;
    categoriesFor(p).forEach((c, i) => { view.draft.levels[c.key] = snap.levels[i] ?? 0; });
    if (snap.skills) {
      const list = snap.skills.filter((n) => !playerNativeNames(p).has(norm(n))).slice(0, SKILL_CAP);
      setSkills(p.id, list, { ...Object.fromEntries(list.map((n) => [n, "mine"])), __touched: true });
      saveStore();
    }
    renderTrainer();
  });
  $("#trainSave").addEventListener("click", () => {
    store.builds[view.playerId] = { ...structuredClone(view.draft), skills: [...skillsOf(view.playerId)], savedAt: Date.now() };
    saveStore();
    renderPlayerSelect();
    $("#trainPlayer").value = view.playerId;
    setManagerSelect("trainManager", store.manager);
    renderTrainer();
    renderSquad();
    renderLineup();
    renderMyBuilds();
  });
  $("#trainPublish").addEventListener("click", async () => {
    const p = byId[view.playerId];
    if (!pro.publish || !p) return;
    const btn = $("#trainPublish");
    const { custom, addedAt, ...card } = p;
    const labels = Object.fromEntries([...p.skills, ...p.comSkills].map((k) => [k, skillLabel(k)]));
    const prev = pro.builds[p.id];
    btn.disabled = true;
    try {
      await pro.publish({
        playerId: p.id,
        player: { ...card, labels },
        build: { levels: { ...view.draft.levels }, booster2: view.draft.booster2 ?? null, levelCap: view.draft.levelCap || p.levelCap, skills: [...skillsOf(p.id)] },
        position: view.position || p.position,
        manager: store.manager || "",
        tactic: store.tactic,
        note: $("#trainPublishNote").value.trim(),
        publishedAt: prev?.publishedAt || Date.now(),
        updatedAt: Date.now(),
      });
      flash(btn, prev ? "Updated" : "Published");
    } catch (err) {
      console.error("[pro] publish", err);
      $("#trainPublishState").textContent = `Couldn't publish: ${err?.code || err}`;
    } finally {
      btn.disabled = false;
    }
  });
  $("#trainUnpublish").addEventListener("click", async () => {
    const p = byId[view.playerId];
    if (!pro.unpublish || !p || !pro.builds[p.id]) return;
    if (!confirm(`Remove the published ${pro.name} build for ${p.name}? Everyone stops seeing it.`)) return;
    try { await pro.unpublish(p.id); }
    catch (err) { console.error("[pro] unpublish", err); $("#trainPublishState").textContent = `Couldn't unpublish: ${err?.code || err}`; }
  });
  $("#trainDelete").addEventListener("click", () => {
    if (!store.builds[view.playerId]) return;
    delete store.builds[view.playerId];
    saveStore();
    renderPlayerSelect();
    $("#trainPlayer").value = view.playerId;
    setManagerSelect("trainManager", store.manager);
    renderTrainer();
    renderSquad();
    renderLineup();
    renderMyBuilds();
  });
  $("#trainCopy").addEventListener("click", async () => {
    const p = byId[view.playerId];
    const b = view.draft;
    const b2 = booster2Of(p, b);
    const text = [
      `${p.name} (${p.id}) — ${view.position}`,
      `Build: ${buildLine(p, b)}  [${categoriesFor(p).map((c) => c.label).join(" / ")}]`,
      `Booster: ${p.booster1?.name || "—"} + ${b2?.name || "—"}${store.manager ? ` · Manager: ${store.manager}` : ""}`,
      `Additional skills: ${skillsOf(p.id).join(", ") || "—"}`,
      `OVR ${view.position}: ${compute(p, b).ratings[view.position]}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      flash($("#trainCopy"), "Copied");
    } catch {
      window.prompt("Copy build:", text);
    }
  });
  $("#trainExport").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), ...root }, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "build-lab-backup.json" });
    document.body.appendChild(a); a.click(); a.remove();
  });
  $("#trainImport").addEventListener("click", () => $("#trainImportFile").click());
  $("#trainImportFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const merge = (into, from) => {
        Object.assign(into.builds, from.builds || {});
        Object.assign(into.positions, from.positions || {});
        Object.assign(into.customPlayers, from.customPlayers || {});
        (from.removed || []).forEach((id) => { if (!into.removed.includes(id)) into.removed.push(id); });
        (from.ownedManagers || []).forEach((k) => { if (!into.ownedManagers.includes(k)) into.ownedManagers.push(k); });
        const known = new Set(into.lineups.map((l) => l.id));
        (from.lineups || []).forEach((l) => { if (!known.has(l.id)) into.lineups.push(l); });
      };
      if (parsed.profiles) {
        // Full backup: every profile (mine and friends').
        Object.entries(parsed.profiles).forEach(([id, prof]) => {
          if (!root.profiles[id]) root.profiles[id] = normaliseProfile(prof, id === "me" ? "me" : "friend", prof.name || "Friend");
          else merge(root.profiles[id], prof);
        });
      } else {
        merge(store, parsed); // older single-squad backup → current profile
      }
      saveStore();
      refreshAll();
      renderLineup();
      renderPlayerSelect();
      view.playerId = null;
      route();
      renderSquad();
    } catch (err) {
      $("#trainSaveState").textContent = `Import failed: ${err.message}`;
    } finally {
      e.target.value = "";
    }
  });

  function flash(btn, text) {
    const old = btn.textContent;
    btn.textContent = text;
    setTimeout(() => { btn.textContent = old; }, 1200);
  }

  /* ---------------------------------------------------------
     Skills tab
  --------------------------------------------------------- */

  const skillState = { q: "", cat: "", pool: "", mine: false };
  const nativeIndex = {};
  function rebuildNativeIndex() {
    Object.keys(nativeIndex).forEach((k) => delete nativeIndex[k]);
    players.forEach((p) => p.skills.forEach((k) => { (nativeIndex[norm(skillLabel(k))] ||= []).push(p); }));
  }
  rebuildNativeIndex();

  function playerChips(list) {
    return list.map((p) => `<button type="button" class="pchip" data-open-player="${p.id}" title="${esc(p.team || "")} · ${p.position} ${p.overall}">${esc(p.name)}</button>`).join("");
  }

  function renderSkills() {
    const cats = [...new Set(KB.SKILLS.map((s) => s.cat))];
    const catSel = $("#skillCat");
    if (!catSel.options.length) catSel.innerHTML = `<option value="">All categories</option>` + cats.map((c) => `<option>${c}</option>`).join("");
    const q = skillState.q.trim().toLowerCase();
    const list = KB.SKILLS.filter((s) =>
      (!skillState.cat || s.cat === skillState.cat) &&
      (!skillState.pool || s.pool === skillState.pool) &&
      (!skillState.mine || nativeIndex[norm(s.name)]) &&
      (!q || [s.name, s.tested, s.official, s.note].join(" ").toLowerCase().includes(q)));
    const POOL = { add: ["Addable", "badge--lime"], excl: ["Card-exclusive", "badge--violet"], unk: ["Picker unverified", "badge--amber"] };
    $("#skillMeta").textContent = `${list.length} of ${KB.SKILLS.length} skills`;
    $("#skillGrid").innerHTML = list.map((s) => {
      const owners = nativeIndex[norm(s.name)] || [];
      return `
        <article class="kb-card">
          <header class="kb-card__head">
            <h3>${esc(s.name)}</h3>
            <div class="kb-card__badges">
              <span class="badge ${POOL[s.pool][1]}">${POOL[s.pool][0]}</span>
              <span class="badge">${esc(s.cat)}</span>
              ${s.avoid ? `<span class="badge badge--ember">Not worth adding</span>` : ""}
            </div>
          </header>
          ${s.official ? `<p class="kb-card__row"><span>Official</span>${esc(s.official)}</p>` : ""}
          ${s.tested ? `<p class="kb-card__row"><span>Tested</span>${esc(s.tested)}</p>` : ""}
          ${!s.official && !s.tested ? `<p class="kb-card__row kb-card__row--muted"><span>Effect</span>Untested — not the same as no effect.</p>` : ""}
          ${s.note ? `<p class="kb-card__row kb-card__row--note"><span>Build note</span>${esc(s.note)}</p>` : ""}
          ${s.avoid ? `<p class="kb-card__row kb-card__row--warn"><span>Why skip</span>${esc(s.avoid)}</p>` : ""}
          <div class="kb-card__owners">
            <span class="kb-card__owners-lbl">Native in my squad (${owners.length})</span>
            <div class="pchips">${owners.length ? playerChips(owners) : `<em>none</em>`}</div>
          </div>
        </article>`;
    }).join("") || `<p class="empty-state">No skills match.</p>`;
  }
  $("#skillSearch").addEventListener("input", (e) => { skillState.q = e.target.value; renderSkills(); });
  $("#skillCat").addEventListener("change", (e) => { skillState.cat = e.target.value; renderSkills(); });
  $("#skillPool").addEventListener("change", (e) => { skillState.pool = e.target.value; renderSkills(); });
  $("#skillMine").addEventListener("change", (e) => { skillState.mine = e.target.checked; renderSkills(); });

  /* ---------------------------------------------------------
     Managers tab
  --------------------------------------------------------- */

  function playersFitting([style, positions]) {
    const posSet = positions.split("/");
    return players.filter((p) =>
      (norm(p.playingStyle) === norm(style) || norm(p.playingStyleDefensive) === norm(style)) &&
      (posSet.includes(p.position) || p.additionalPositions.some((a) => posSet.includes(a.position))));
  }

  const mgrState = { q: "" };
  function renderManagers() {
    const me = ownsRepo();
    const list = me ? profileManagers() : ALL_MANAGERS.filter((m) => m.key.startsWith("ef:") && store.ownedManagers.includes(m.key));
    const current = managerKey(me ? KB.CURRENT_MANAGER : store.manager);
    $("#mgrMeta").textContent = me
      ? `${list.length} owned cards · team booster is a flat +1/+1 on the whole squad (§17)`
      : `${list.length} owned by ${isMe() ? "you" : store.name} · pick them from eFHUB's ${ALL_MANAGERS.filter((m) => m.key.startsWith("ef:")).length} manager cards below`;
    const head = `<tr><th>Manager</th><th>Team booster</th>${KB.TACTICS.map((t) => `<th class="num">${t}</th>`).join("")}<th>Link-up · Center Piece → Key Man</th>${me ? "" : "<th></th>"}</tr>`;
    const row = (m, owned) => `
      <tr class="${m.key === current ? "is-current" : ""}">
        <td><div class="mgr-cell">${mgrPhoto(m)}<span><b>${esc(m.name)}</b>${m.key === current ? ` <span class="badge badge--lime">current</span>` : ""}${m.released ? `<small>${esc(m.released)}</small>` : ""}</span></div></td>
        <td>${m.boost.map((k) => `${statLabel(k)} +1`).join("<br>") || "—"}</td>
        ${m.prof.map((v) => `<td class="num ${v >= 89 ? "hot" : v >= 70 ? "warm" : ""}">${v ?? "N/A"}</td>`).join("")}
        <td class="mgr-link">${linkUpText(m)}</td>
        ${me ? "" : `<td class="actions">${owned
          ? `<button type="button" class="btn btn--icon" data-mgr-current="${esc(m.key)}">Set current</button> <button type="button" class="btn btn--icon btn--danger" data-mgr-toggle="${esc(m.key)}">Remove</button>`
          : `<button type="button" class="btn btn--icon btn--solid" data-mgr-toggle="${esc(m.key)}">+ Owned</button>`}</td>`}
      </tr>`;
    $("#mgrTable").innerHTML = `<thead>${head}</thead><tbody>${list.map((m) => row(m, true)).join("") || `<tr><td colspan="10"><em>No managers yet — mark the ones ${isMe() ? "you own" : `${esc(store.name)} owns`} in the list below.</em></td></tr>`}</tbody>`;
    $("#mgrPickerBox").hidden = me;
    $("#mgrLinkBox").hidden = !me;
    if (!me) {
      const q = mgrState.q.trim().toLowerCase();
      const pool = ALL_MANAGERS.filter((m) => m.key.startsWith("ef:") && !store.ownedManagers.includes(m.key))
        .filter((m) => !q || `${m.name} ${m.boost.map(statLabel).join(" ")} ${m.linkUps.map((l) => `${l.name} ${l.centerPiece.join(" ")} ${l.keyMan.join(" ")}`).join(" ")}`.toLowerCase().includes(q));
      $("#mgrPool").innerHTML = `<thead>${head}</thead><tbody>${pool.map((m) => row(m, false)).join("")}</tbody>`;
      return;
    }

    // One card per Link-up play — Mourinho's card carries two.
    const linkCards = KB.MANAGERS.flatMap((mgr) => (mgr.linkUps || [{ name: mgr.linkUp, centerPiece: mgr.centerPiece, keyMan: mgr.keyMan }])
      .map((l) => ({ ...mgr, linkUp: l.name, centerPiece: l.centerPiece, keyMan: l.keyMan })));
    $("#mgrLinks").innerHTML = linkCards.map((m) => {
      const cp = playersFitting(m.centerPiece);
      const km = playersFitting(m.keyMan);
      const live = cp.length && km.length;
      return `
        <article class="kb-card">
          <header class="kb-card__head">
            <h3>${mgrPhoto(ALL_MANAGERS.find((x) => x.key === `kb:${m.name}`), "mgr-photo mgr-photo--head")}${esc(m.name)}</h3>
            <div class="kb-card__badges">
              <span class="badge">${esc(m.linkUp)}</span>
              <span class="badge ${live ? "badge--lime" : "badge--ember"}">${live ? "Squad can activate" : "Missing a role"}</span>
            </div>
          </header>
          <div class="kb-card__owners">
            <span class="kb-card__owners-lbl">Center Piece — ${esc(m.centerPiece.join(", "))} (${cp.length})</span>
            <div class="pchips">${cp.length ? playerChips(cp) : "<em>none in squad</em>"}</div>
          </div>
          <div class="kb-card__owners">
            <span class="kb-card__owners-lbl">Key Man — ${esc(m.keyMan.join(", "))} (${km.length})</span>
            <div class="pchips">${km.length ? playerChips(km) : "<em>none in squad</em>"}</div>
          </div>
          ${m.affinity ? `<p class="kb-card__row"><span>Coaching affinity</span>${esc(m.affinity)}</p>` : ""}
        </article>`;
    }).join("");
  }

  $("#mgrSearch").addEventListener("input", (e) => { mgrState.q = e.target.value; renderManagers(); });
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-mgr-toggle]");
    if (t) {
      const k = t.dataset.mgrToggle;
      store.ownedManagers = store.ownedManagers.includes(k) ? store.ownedManagers.filter((x) => x !== k) : [...store.ownedManagers, k];
      if (!store.manager && store.ownedManagers.length) {
        store.manager = store.ownedManagers[0];
        store.lineups.forEach((l) => { if (!l.manager) l.manager = store.manager; });
      }
      saveStore(); refreshAll();
    }
    const c = e.target.closest("[data-mgr-current]");
    if (c) { store.manager = c.dataset.mgrCurrent; saveStore(); refreshAll(); }
  });

  /* ---------------------------------------------------------
     Styles tab
  --------------------------------------------------------- */

  function renderStyles() {
    // eFHUB files some defensive styles (Destroyer, Anchor Man…) under the attacking
    // field, so match a style name against either slot.
    const table = (list) => `
      <thead><tr><th>Style</th><th>Compatible positions</th><th>Behaviour</th><th>In my squad</th></tr></thead>
      <tbody>${list.map((s) => {
        const mine = players.filter((p) => norm(p.playingStyle) === norm(s.name) || norm(p.playingStyleDefensive) === norm(s.name));
        return `<tr>
          <td><b>${esc(s.name)}</b></td>
          <td class="pos-list">${esc(s.positions)}</td>
          <td>${esc(s.behavior)}</td>
          <td><div class="pchips">${mine.length ? playerChips(mine) : "<em>—</em>"}</div></td>
        </tr>`;
      }).join("")}</tbody>`;
    $("#styleAtt").innerHTML = table(KB.ATT_STYLES);
    $("#styleDef").innerHTML = table(KB.DEF_STYLES);
    $("#styleAI").innerHTML = `
      <thead><tr><th>AI style</th><th>Tendency (AI-controlled ball holder only)</th><th>In my squad</th></tr></thead>
      <tbody>${KB.AI_STYLES.map((s) => {
        const mine = players.filter((p) => p.comSkills.some((k) => norm(skillLabel(k)) === norm(s.name)));
        return `<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.behavior)}</td>
          <td><div class="pchips">${mine.length ? playerChips(mine) : "<em>—</em>"}</div></td></tr>`;
      }).join("")}</tbody>`;
  }

  /* ---------------------------------------------------------
     Lineup tab — formation, starting XI, bench, sub plan
  --------------------------------------------------------- */

  // [position, x%, y%] — x from the left touchline, y from our own goal line.
  const BACK4 = [["LB", 12, 27], ["CB", 37, 20], ["CB", 63, 20], ["RB", 88, 27]];
  const BACK3 = [["CB", 24, 21], ["CB", 50, 18], ["CB", 76, 21]];
  const FORMATIONS = {
    "4-3-3": [...BACK4, ["CMF", 27, 50], ["DMF", 50, 40], ["CMF", 73, 50], ["LWF", 15, 78], ["CF", 50, 86], ["RWF", 85, 78]],
    "4-1-2-3": [...BACK4, ["DMF", 50, 38], ["CMF", 32, 55], ["CMF", 68, 55], ["LWF", 15, 78], ["CF", 50, 86], ["RWF", 85, 78]],
    "4-2-3-1": [...BACK4, ["DMF", 36, 41], ["DMF", 64, 41], ["LMF", 14, 64], ["AMF", 50, 64], ["RMF", 86, 64], ["CF", 50, 86]],
    "4-2-1-3": [...BACK4, ["DMF", 36, 41], ["DMF", 64, 41], ["AMF", 50, 60], ["LWF", 15, 79], ["CF", 50, 86], ["RWF", 85, 79]],
    "4-2-2-2": [...BACK4, ["DMF", 36, 41], ["DMF", 64, 41], ["AMF", 28, 64], ["AMF", 72, 64], ["CF", 37, 86], ["CF", 63, 86]],
    "4-3-1-2": [...BACK4, ["CMF", 27, 49], ["DMF", 50, 40], ["CMF", 73, 49], ["AMF", 50, 66], ["CF", 37, 86], ["CF", 63, 86]],
    "4-3-2-1": [...BACK4, ["CMF", 30, 49], ["DMF", 50, 40], ["CMF", 70, 49], ["AMF", 30, 66], ["AMF", 70, 66], ["CF", 50, 86]],
    "4-4-2": [...BACK4, ["LMF", 12, 55], ["CMF", 37, 50], ["CMF", 63, 50], ["RMF", 88, 55], ["CF", 37, 84], ["CF", 63, 84]],
    "4-1-4-1": [...BACK4, ["DMF", 50, 38], ["LMF", 12, 58], ["CMF", 37, 56], ["CMF", 63, 56], ["RMF", 88, 58], ["CF", 50, 86]],
    "3-4-3": [...BACK3, ["LMF", 11, 52], ["DMF", 38, 44], ["DMF", 62, 44], ["RMF", 89, 52], ["LWF", 17, 79], ["CF", 50, 86], ["RWF", 83, 79]],
    "3-5-2": [...BACK3, ["LMF", 10, 56], ["CMF", 32, 51], ["DMF", 50, 41], ["CMF", 68, 51], ["RMF", 90, 56], ["CF", 37, 85], ["CF", 63, 85]],
    "5-3-2": [["LB", 8, 32], ["CB", 29, 20], ["CB", 50, 18], ["CB", 71, 20], ["RB", 92, 32], ["CMF", 27, 51], ["DMF", 50, 43], ["CMF", 73, 51], ["CF", 37, 84], ["CF", 63, 84]],
  };
  const TEAM_TACTICS = KB.TACTICS; // incl. Overload (v6.0.0)
  const BENCH_MAX = 12;
  // Bench order, front to back (user request, 11 Oct 2026).
  const BENCH_ORDER = ["CF", "SS", "LWF", "RWF", "AMF", "LMF", "RMF", "CMF", "DMF", "LB", "RB", "CB", "GK"];
  const slotsFor = (f) => [["GK", 50, 6], ...(FORMATIONS[f] || FORMATIONS["4-3-3"])];
  const OUTFIELD_ROLES = ["CB", "LB", "RB", "DMF", "CMF", "LMF", "RMF", "AMF", "LWF", "RWF", "SS", "CF"];

  // Per-lineup slot layout [role, x, y]; starts from the formation preset and can be
  // edited by dragging markers or picking a role.
  function layoutOf(l) {
    if (!Array.isArray(l.layout) || l.layout.length !== 11) l.layout = slotsFor(l.formation).map((s) => [...s]);
    return l.layout;
  }
  const isEdited = (l) => JSON.stringify(layoutOf(l)) !== JSON.stringify(slotsFor(l.formation));

  // Fluid Formation (eFootball 2027 Game Plan): a second shape the same XI takes without the
  // ball. defLayout[i] is where xi[i] defends. A defence preset is laid onto the attacking
  // shape by the cheapest total move (exact assignment over the 10 outfield spots), so
  // each player drops into the defensive spot nearest his attacking one.
  const bitCount = (m) => { let c = 0; for (; m; m &= m - 1) c++; return c; };
  function mapShape(from, to) {
    const n = from.length;
    const full = (1 << n) - 1;
    const best = new Float64Array(full + 1).fill(Infinity);
    const pick = new Int8Array(full + 1);
    best[0] = 0;
    for (let mask = 0; mask < full; mask++) {
      if (best[mask] === Infinity) continue;
      const i = bitCount(mask);
      for (let j = 0; j < n; j++) {
        if (mask & (1 << j)) continue;
        const c = best[mask] + Math.hypot(from[i][1] - to[j][1], from[i][2] - to[j][2]);
        if (c < best[mask | (1 << j)]) { best[mask | (1 << j)] = c; pick[mask | (1 << j)] = j; }
      }
    }
    const out = [];
    for (let mask = full, i = n - 1; i >= 0; i--) { const j = pick[mask]; out[i] = [...to[j]]; mask &= ~(1 << j); }
    return out;
  }
  const DEFAULT_DEF_FORMATION = "4-4-2";
  function freshDefLayout(l) {
    const preset = slotsFor(l.defFormation || DEFAULT_DEF_FORMATION);
    return [[...preset[0]], ...mapShape(layoutOf(l).slice(1), preset.slice(1))];
  }
  function defLayoutOf(l) {
    if (!Array.isArray(l.defLayout) || l.defLayout.length !== 11) l.defLayout = freshDefLayout(l);
    return l.defLayout;
  }
  // Sub-tactic shape: the in-game Sub Tactic re-arranges the same eleven, so it is a third
  // layout for xi[i] (subLayout), laid onto the attacking shape by nearest spot like the
  // defence one, with its own formation (l.subTactic.formation, else the main one).
  const subFormationOf = (l) => l.subTactic?.formation || l.formation;
  function freshSubLayout(l) {
    const preset = slotsFor(subFormationOf(l));
    return [[...preset[0]], ...mapShape(layoutOf(l).slice(1), preset.slice(1))];
  }
  function subLayoutOf(l) {
    if (!Array.isArray(l.subLayout) || l.subLayout.length !== 11) l.subLayout = freshSubLayout(l);
    return l.subLayout;
  }
  const inSub = (l) => lu.plan === "sub" && !!l.subTactic?.tactic;
  const shownTactic = (l) => (inSub(l) ? l.subTactic.tactic : l.tactic);
  const inDefence = (l) => !inSub(l) && !!l.fluid && lu.phase === "def";
  // Markers are centred on their spot; keep the card-image markers fully on the pitch.
  const slotBottom = (y) => `clamp(3.4rem, ${y}%, calc(100% - 3.4rem))`;
  // The shape on screen: the defence one while Fluid Formation is on and Defence is picked.
  const shownLayout = (l) => (inSub(l) ? subLayoutOf(l) : inDefence(l) ? defLayoutOf(l) : layoutOf(l));
  const shownEdited = (l) => (inSub(l) ? JSON.stringify(subLayoutOf(l)) !== JSON.stringify(freshSubLayout(l))
    : inDefence(l) ? JSON.stringify(defLayoutOf(l)) !== JSON.stringify(freshDefLayout(l)) : isEdited(l));

  // Role from pitch zone (x from left touchline, y from own goal line) — bands chosen so
  // every preset formation maps back onto its own roles.
  function roleAt(x, y) {
    const wide = x < 25 ? "L" : x > 75 ? "R" : "";
    if (y < 31) return wide ? `${wide}B` : "CB";
    if (y < 46) return x < 22 ? "LB" : x > 78 ? "RB" : "DMF";
    if (y < 58) return wide ? `${wide}MF` : "CMF";
    if (y < 71) return wide ? `${wide}MF` : "AMF";
    const wing = x < 28 ? "LWF" : x > 72 ? "RWF" : "";
    if (y < 80) return wing || "SS";
    return wing || "CF";
  }

  // Style → compatible positions, for both style slots (§18).
  const styleEntries = (list, kind) => list.map((s) => ({ key: norm(s.name), name: s.name, kind, positions: s.positions.split(/,\s*/) }));
  const ATT_IDX = Object.fromEntries(styleEntries(KB.ATT_STYLES, "att").map((s) => [s.key, s]));
  const DEF_IDX = Object.fromEntries(styleEntries(KB.DEF_STYLES, "def").map((s) => [s.key, s]));
  function styleFit(p, pos) {
    const out = [];
    const att = ATT_IDX[norm(p.playingStyle)] || DEF_IDX[norm(p.playingStyle)];
    const def = DEF_IDX[norm(p.playingStyleDefensive)];
    [[p.playingStyle, att], [p.playingStyleDefensive, def]].forEach(([name, entry]) => {
      if (name && entry) out.push({ name, kind: entry.kind, ok: entry.positions.includes(pos) });
    });
    return out;
  }
  function shortName(p) {
    const t = p.name.split(" ");
    return t[t.length - 1].length < 3 && t.length > 1 ? t.slice(-2).join(" ") : t[t.length - 1];
  }
  const proficiency = profAt;

  const uid = () => `l_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  function newLineup(name = "My XI") {
    return { id: uid(), name, formation: "4-2-2-2", manager: ownsRepo() ? KB.CURRENT_MANAGER : store.manager, tactic: store.tactic || "Long Ball Counter",
      xi: Array(11).fill(null), bench: [], subs: [], notes: "" };
  }
  // The owner's agreed match plans (USER-SQUAD §3 via KB.MATCH_PLANS) are added to the
  // Lineup tab once each and opened; after that they're ordinary lineups — edit or delete
  // freely, a deleted plan doesn't come back.
  function seedMatchPlans() {
    if (!ownsRepo()) return false;
    store.seededPlans ||= [];
    let added = false;
    (KB.MATCH_PLANS || []).forEach((plan) => {
      const seeded = store.lineups.find((l) => l.id === plan.id);
      const shape = () => ({ fluid: plan.fluid, defFormation: plan.defFormation, defLayout: plan.defLayout ? plan.defLayout.map((s) => [...s]) : null });
      if (seeded && seeded.fluid === undefined && plan.fluid !== undefined) { Object.assign(seeded, shape()); added = true; }
      (plan.updates || []).forEach((u) => {
        if (store.seededPlans.includes(u.id)) return;
        // Wait until every card the update names is loaded (a stale cached players.js
        // would otherwise drop the new ones for good).
        const named = [...(u.bench || []), ...(u.fill || []), ...Object.values(u.replace || {})];
        if (named.some((id) => !byId[id])) return;
        store.seededPlans.push(u.id);
        added = true;
        if (!seeded) return; // a fresh copy already has it
        // Plain fields (instructions, sub-tactic, …) set as a whole.
        if (u.set) Object.entries(u.set).forEach(([k, v]) => { seeded[k] = structuredClone(v); });
        // A whole new bench / substitution plan (starters stay off the bench).
        if (u.bench) seeded.bench = u.bench.filter((id) => byId[id] && !seeded.xi.includes(id)).slice(0, BENCH_MAX);
        if (u.subs) seeded.subs = u.subs.map((s) => ({ ...s }));
        if (u.defLayout) { seeded.defFormation = u.defFormation || seeded.defFormation; seeded.defLayout = u.defLayout.map((x) => [...x]); }
        // Add these to the bench if they're missing and there's room.
        (u.fill || []).forEach((id) => {
          if (!seeded.xi.includes(id) && !seeded.bench.includes(id) && seeded.bench.length < BENCH_MAX) seeded.bench.push(id);
        });
        Object.entries(u.replace || {}).forEach(([from, to]) => {
          if (!byId[to] || seeded.xi.includes(to)) return;
          const i = seeded.xi.indexOf(from);
          if (i >= 0) {
            seeded.xi[i] = to;
            seeded.bench = seeded.bench.filter((id) => id !== to);
          } else {
            const j = seeded.bench.indexOf(from);
            if (j < 0 || seeded.bench.includes(to)) return;
            seeded.bench[j] = to;
          }
          seeded.subs.forEach((s) => { if (s.out === from) s.out = to; if (s.in === from) s.in = to; });
        });
      });
      if (store.seededPlans.includes(plan.id)) return;
      store.seededPlans.push(plan.id);
      if (seeded) return;
      const keep = (id) => (byId[id] ? id : null);
      store.lineups.push({ ...plan, ...shape(), xi: plan.xi.map(keep), bench: plan.bench.filter((id) => byId[id]),
        subs: plan.subs.map((s) => ({ ...s })) });
      store.activeLineup = plan.id;
      added = true;
    });
    if (added) saveStore();
    return added;
  }
  function activeLineup() {
    if (!store.lineups.length) store.lineups.push(newLineup());
    let l = store.lineups.find((x) => x.id === store.activeLineup);
    if (!l) { l = store.lineups[0]; store.activeLineup = l.id; }
    return l;
  }
  const lu = { sel: null, q: "", mode: "players", phase: "att", plan: "main", justDragged: false }; // sel = { area: "xi"|"bench", i }; plan = "main" | "sub"

  // Ratings use the player's saved Trainer build, else his Recommended by AI build — not
  // the untrained card.
  const lineupBuild = (p) => store.builds[p.id] || (REC?.recs[p.id] ? recBuild(p.id) : emptyBuild(p));
  const buildTag = (p) => (store.builds[p.id] ? "your saved build" : REC?.recs[p.id] ? "Recommended by AI build" : "untrained");
  function slotRating(p, pos, l, tactic = l.tactic) {
    return compute(p, lineupBuild(p), l.manager, tactic).ratings[pos];
  }
  // What the lineup shows (user decision, 11 Oct 2026): the build's rating — at the card's
  // main position, as in the Trainer — wherever the player stands. The picker still ranks
  // candidates by their rating at the slot.
  const buildRating = (p, l, tactic) => slotRating(p, p.position, l, tactic);

  // Best XI: the strongest assignment of the squad to this lineup's slots. Each player's
  // rating at the slot comes from his build (saved or AI) with this manager and playstyle
  // (compute); nobody without proficiency there (§20); intermediate proficiency and a
  // playing style that is inactive at the slot (§18) count against him; one card per
  // player and never two Destroyer centre-backs (§18). GK: the best keeper.
  function hungarian(cost) {
    const n = cost.length, m = cost[0].length;
    const u = new Array(n + 1).fill(0), v = new Array(m + 1).fill(0), p = new Array(m + 1).fill(0), way = new Array(m + 1).fill(0);
    for (let i = 1; i <= n; i++) {
      p[0] = i;
      let j0 = 0;
      const minv = new Array(m + 1).fill(Infinity), used = new Array(m + 1).fill(false);
      do {
        used[j0] = true;
        const i0 = p[j0];
        let delta = Infinity, j1 = 0;
        for (let j = 1; j <= m; j++) {
          if (used[j]) continue;
          const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
          if (minv[j] < delta) { delta = minv[j]; j1 = j; }
        }
        for (let j = 0; j <= m; j++) { if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta; }
        j0 = j1;
      } while (p[j0] !== 0);
      do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
    }
    const out = new Array(n).fill(-1);
    for (let j = 1; j <= m; j++) if (p[j]) out[p[j] - 1] = j - 1;
    return out;
  }
  const isDestroyer = (p) => [p.playingStyle, p.playingStyleDefensive].some((s) => norm(s) === "destroyer");
  function bestXI(l) {
    const slots = layoutOf(l);
    const rows = slots.map(([pos], i) => ({ pos, i })).filter((s) => s.pos !== "GK");
    const score = (p, pos) => {
      const prof = proficiency(p, pos);
      if (prof === "none") return null;
      return slotRating(p, pos, l) - (prof === "mid" ? 1.5 : 0) - (styleFit(p, pos).some((f) => !f.ok) ? 3 : 0);
    };
    const banned = new Set();
    let picked = null;
    for (let iter = 0; iter < 30 && !picked; iter++) {
      const cols = players.filter((p) => p.position !== "GK" && !banned.has(p.id));
      if (cols.length < rows.length) return null;
      const asg = hungarian(rows.map(({ pos }) => cols.map((p) => { const sc = score(p, pos); return sc == null ? 1e6 : 1000 - sc; })));
      const xi = rows.map((r, k) => ({ ...r, p: cols[asg[k]], sc: score(cols[asg[k]], r.pos) }));
      if (xi.some((x) => x.sc == null)) return null;
      const byName = {};
      xi.forEach((x) => (byName[norm(x.p.name)] ||= []).push(x));
      const twice = Object.values(byName).find((g) => g.length > 1);
      const cbs = xi.filter((x) => x.pos === "CB" && isDestroyer(x.p));
      const clash = twice || (cbs.length > 1 ? cbs : null);
      if (clash) { banned.add(clash.sort((a, b) => a.sc - b.sc)[0].p.id); continue; }
      picked = xi;
    }
    if (!picked) return null;
    const gk = players.filter((p) => p.position === "GK").sort((a, b) => slotRating(b, "GK", l) - slotRating(a, "GK", l))[0];
    const xi = slots.map(() => null);
    if (gk) xi[0] = gk.id;
    picked.forEach((x) => { xi[x.i] = x.p.id; });
    // Displaced starters go to the bench if there is room; nobody twice on the team sheet.
    const names = new Set(xi.filter(Boolean).map((id) => norm(byId[id].name)));
    const bench = [...l.bench, ...l.xi].filter((id, k, arr) => byId[id] && !xi.includes(id) && !names.has(norm(byId[id].name)) && arr.indexOf(id) === k).slice(0, BENCH_MAX);
    const ratings = xi.filter(Boolean).map((id) => buildRating(byId[id], l));
    return { xi, bench, avg: ratings.reduce((a, b) => a + b, 0) / ratings.length };
  }

  function placePlayer(l, id) {
    const { area, i } = lu.sel;
    const target = area === "xi" ? l.xi : l.bench;
    const prev = target[i] ?? null;
    // If the player already sits somewhere else, swap them.
    const inXi = l.xi.indexOf(id);
    const inBench = l.bench.indexOf(id);
    if (inXi >= 0) l.xi[inXi] = prev;
    else if (inBench >= 0) { if (prev) l.bench[inBench] = prev; else l.bench.splice(inBench, 1); }
    if (area === "bench" && i >= l.bench.length) l.bench.push(id); else target[i] = id;
    l.bench = l.bench.filter(Boolean);
    lu.sel = null;
  }

  function lineupWarnings(l) {
    const w = [];
    const slots = layoutOf(l);
    const empty = l.xi.filter((x) => !x).length;
    if (empty) w.push(`<b>${empty} empty slot${empty > 1 ? "s" : ""}</b> in the starting XI.`);
    l.xi.forEach((id, i) => {
      const p = byId[id];
      if (!p) return;
      const pos = slots[i][0];
      if (proficiency(p, pos) === "none") w.push(`<b>${esc(p.name)}</b> has no ${pos} proficiency.`);
      styleFit(p, pos).filter((f) => !f.ok).forEach((f) =>
        w.push(`<b>${esc(p.name)}</b>: ${esc(f.name)} is not compatible with ${pos}${f.kind === "att" ? " — plays as Basic" : " — style inactive"} (§18).`));
    });
    const names = {};
    [...l.xi, ...l.bench].filter((id) => byId[id]).forEach((id) => { const n = norm(byId[id].name); (names[n] ||= []).push(id); });
    Object.values(names).filter((ids) => ids.length > 1).forEach((ids) =>
      w.push(`<b>${esc(byId[ids[0]].name)}</b> is selected ${ids.length}× (different cards of the same player).`));
    if (l.fluid) {
      const def = defLayoutOf(l);
      l.xi.forEach((id, i) => {
        const p = byId[id];
        if (!p || i === 0) return;
        const pos = def[i][0];
        if (proficiency(p, pos) === "none") w.push(`In defence <b>${esc(p.name)}</b> drops to ${pos} — no ${pos} proficiency.`);
        styleFit(p, pos).filter((f) => !f.ok).forEach((f) =>
          w.push(`In defence <b>${esc(p.name)}</b> drops to ${pos}: ${esc(f.name)} isn't active there (§18) — Edit positions to keep him where it is.`));
      });
    }
    if (l.subTactic?.tactic) {
      const sub = subLayoutOf(l);
      l.xi.forEach((id, i) => {
        const p = byId[id];
        if (!p || i === 0) return;
        const pos = sub[i][0];
        if (proficiency(p, pos) === "none") w.push(`In the sub-tactic <b>${esc(p.name)}</b> stands at ${pos} — no ${pos} proficiency.`);
        styleFit(p, pos).filter((f) => !f.ok).forEach((f) =>
          w.push(`In the sub-tactic <b>${esc(p.name)}</b> at ${pos}: ${esc(f.name)} isn't active there (§18).`));
      });
    }
    const destroyerCBs = l.xi.filter((id, i) => byId[id] && slots[i][0] === "CB" &&
      [byId[id].playingStyle, byId[id].playingStyleDefensive].some((s) => norm(s) === "destroyer"));
    if (destroyerCBs.length > 1) w.push(`<b>${destroyerCBs.length} Destroyer CBs</b> — both can step out at once; pair a Destroyer with Build Up / Covering Role (§18).`);
    return w;
  }

  function linkUpStatus(l, m = managerObj(l.manager)) {
    if (!m || !m.linkUps.length) return []; // older cards have no Link-up play
    const slots = layoutOf(l);
    const find = ([style, positions]) => {
      const set = positions.split("/");
      return l.xi.map((id, i) => ({ p: byId[id], pos: slots[i][0] }))
        .filter(({ p, pos }) => p && set.includes(pos) &&
          (norm(p.playingStyle) === norm(style) || norm(p.playingStyleDefensive) === norm(style)))
        .map(({ p }) => p);
    };
    return m.linkUps.map((link) => ({ link, cp: find(link.centerPiece), km: find(link.keyMan) }));
  }

  function renderLineup() {
    if (!$("#luPitch")) return;
    const l = activeLineup();
    if (!l.fluid) lu.phase = "att";
    if (!l.subTactic?.tactic) lu.plan = "main";
    const slots = shownLayout(l);
    while (l.xi.length < 11) l.xi.push(null);
    l.xi.length = 11;

    $("#luSelect").innerHTML = store.lineups.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join("");
    $("#luSelect").value = l.id;
    $("#luName").value = l.name;
    $("#luFormation").innerHTML = Object.keys(FORMATIONS).map((f) => `<option>${f}</option>`).join("");
    $("#luFormation").value = l.formation;
    $("#luFormationLabel").textContent = l.fluid ? "Attack formation" : "Formation";
    $("#luFluidSeg").querySelectorAll("[data-fluid]").forEach((b) => b.classList.toggle("is-on", (b.dataset.fluid === "on") === !!l.fluid));
    $("#luDefFormationField").hidden = !l.fluid;
    $("#luDefFormation").innerHTML = Object.keys(FORMATIONS).map((f) => `<option>${f}</option>`).join("");
    $("#luDefFormation").value = l.defFormation || DEFAULT_DEF_FORMATION;
    $("#luPlan").hidden = !l.subTactic?.tactic;
    $("#luPlan").querySelectorAll("[data-plan]").forEach((b) => b.classList.toggle("is-on", b.dataset.plan === lu.plan));
    $("#luFluidSeg").hidden = inSub(l);
    $("#luPhase").hidden = !l.fluid || inSub(l);
    $("#luDefFormationField").hidden = !l.fluid || inSub(l);
    $("#luPhase").querySelectorAll("[data-phase]").forEach((b) => b.classList.toggle("is-on", b.dataset.phase === lu.phase));
    $("#luPitch").classList.toggle("is-sub", inSub(l));
    const shapeName = inSub(l) ? `${subFormationOf(l)} · sub-tactic · ${l.subTactic.tactic}` : inDefence(l) ? `${l.defFormation || DEFAULT_DEF_FORMATION} · defence` : l.fluid ? `${l.formation} · attack` : l.formation;
    $("#luLayoutState").textContent = shownEdited(l) ? `${shapeName} · edited` : shapeName;
    $("#luResetLayout").hidden = !shownEdited(l);
    $("#luModes").querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("is-on", b.dataset.mode === lu.mode));
    $("#luPitch").classList.toggle("is-editing", lu.mode === "positions");
    $("#luModeHint").textContent = lu.mode === "positions"
      ? "Drag a marker to move it — its role follows the pitch zone. Tap a marker to set the role by hand."
      : inSub(l) ? "Sub-tactic shape: the same eleven re-arranged — drag one starter onto another to swap where they stand, or Edit positions. Change its formation in the match card."
      : inDefence(l) ? "Defence shape: drag one starter onto another to swap where they defend — their attacking spots stay. Drag from the bench to bring a player on."
      : "Drag a player onto another slot or the bench to swap. Tap a player for his builds, an empty slot to pick from the squad.";
    const mgrs = profileManagers();
    const cur = managerObj(l.manager);
    $("#luManager").innerHTML = `<option value="">No manager</option>` + (cur && !mgrs.includes(cur) ? managerOption(cur) : "") + mgrs.map(managerOption).join("");
    setManagerSelect("luManager", l.manager);
    $("#luTactic").innerHTML = TEAM_TACTICS.map((t) => `<option>${t}</option>`).join("");
    $("#luTactic").value = l.tactic;

    // Pitch
    const ratings = [];
    $("#luPitch").innerHTML = `<div class="pitch__lines" aria-hidden="true"><i class="pitch__half"></i><i class="pitch__circle"></i><i class="pitch__box pitch__box--own"></i><i class="pitch__box pitch__box--opp"></i></div>` +
      slots.map(([pos, x, y], i) => {
        const p = byId[l.xi[i]];
        const sel = lu.sel?.area === "xi" && lu.sel.i === i;
        if (!p) {
          return `<button type="button" class="slot slot--empty ${sel ? "is-selected" : ""}" style="left:${x}%;bottom:${slotBottom(y)}" data-slot="${i}" aria-label="Pick ${pos}">
            <span class="slot__ovr">+</span><span class="slot__pos">${pos}</span></button>`;
        }
        const r = buildRating(p, l, shownTactic(l));
        const atSlot = slotRating(p, pos, l, shownTactic(l));
        ratings.push(r);
        const prof = proficiency(p, pos);
        const bad = styleFit(p, pos).some((f) => !f.ok);
        return `<button type="button" class="slot slot--${prof} ${sel ? "is-selected" : ""} ${bad ? "slot--style" : ""}" style="left:${x}%;bottom:${slotBottom(y)}" data-slot="${i}"
            title="${esc(p.name)} — ${p.position} ${r} (${buildTag(p)})${atSlot !== r ? ` · at ${pos}: ${atSlot}` : ""}">
          ${cardImg(p, "slot__img")}
          <span class="slot__ovr">${r}${store.builds[p.id] ? "<sup>★</sup>" : ""}</span>
          <span class="slot__name">${esc(shortName(p))}</span>
          <span class="slot__pos">${pos}</span></button>`;
      }).join("");

    // Bench — in position order unless the lineup turned it off (then drag order).
    if (l.benchByPos !== false) {
      const sorted = [...l.bench].sort((a, b) => BENCH_ORDER.indexOf(byId[a]?.position) - BENCH_ORDER.indexOf(byId[b]?.position));
      if (sorted.join() !== l.bench.join()) { l.bench = sorted; saveStore(); }
    }
    $("#luBenchSort").classList.toggle("is-selected", l.benchByPos !== false);
    const benchCells = l.bench.map((id, i) => {
      const p = byId[id];
      if (!p) return "";
      const sel = lu.sel?.area === "bench" && lu.sel.i === i;
      const r = slotRating(p, p.position, l);
      return `<button type="button" class="bench-cell ${sel ? "is-selected" : ""}" data-bench="${i}" title="${esc(p.name)} — ${p.position} ${r} (${buildTag(p)})">
        ${cardImg(p, "bench-cell__img")}<b>${r}${store.builds[p.id] ? "<sup>★</sup>" : ""}</b><span>${esc(p.name)}</span><em>${p.position}</em></button>`;
    });
    if (l.bench.length < BENCH_MAX) {
      const sel = lu.sel?.area === "bench" && lu.sel.i === l.bench.length;
      benchCells.push(`<button type="button" class="bench-cell bench-cell--add ${sel ? "is-selected" : ""}" data-bench="${l.bench.length}"><b>+</b><span>Add sub</span></button>`);
    }
    $("#luBench").innerHTML = benchCells.join("");
    $("#luBenchCount").textContent = `${l.bench.length}/${BENCH_MAX}`;

    // Summary
    const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—";
    const m = managerObj(l.manager);
    const tIdx = KB.TACTICS.indexOf(shownTactic(l));
    const prof = m && tIdx >= 0 ? m.prof[tIdx] : null;
    const links = linkUpStatus(l);
    $("#luSummary").innerHTML = `
      <div class="lu-kpis">
        <div><b>${avg}</b><span>avg XI rating</span></div>
        <div><b>${ratings.length}/11</b><span>starters</span></div>
        <div><b class="${prof >= 89 ? "is-hot" : ""}">${prof ?? "—"}</b><span>${esc(shownTactic(l))}${inSub(l) ? " (sub-tactic)" : ""} proficiency${prof != null ? ` · +${((skillMultiplier(prof) - 1) * 100).toFixed(1)}%` : ""}</span></div>
      </div>
      ${m ? `<p class="lu-line">${mgrPhoto(m, "mgr-photo mgr-photo--inline")}Team booster: ${m.boost.map((k) => `${statLabel(k)} +1`).join(", ")}, plus the proficiency multiplier — both included in the ratings.</p>` : ""}
      ${links.map(({ link, cp, km }) => `<div class="lu-link ${cp.length && km.length ? "is-on" : ""}">
          <span class="field__label">Link-up · ${esc(link.name)}</span>
          <p>Center Piece (${esc(link.centerPiece.join(" "))}): ${cp.length ? cp.map((p) => esc(p.name)).join(", ") : "<em>not in XI</em>"}</p>
          <p>Key Man (${esc(link.keyMan.join(" "))}): ${km.length ? km.map((p) => esc(p.name)).join(", ") : "<em>not in XI</em>"}</p>
          <p class="lu-link__state">${cp.length && km.length ? "Active" : "Inactive — both roles must be fielded"}</p>
        </div>`).join("")}`;
    const warns = lineupWarnings(l);
    if (m && prof == null) warns.unshift(`<b>${esc(m.name)}</b> has no ${esc(l.tactic)} proficiency (N/A) — pick another team playstyle.`);
    else if (m && prof < PROF_MIN) warns.unshift(`${esc(l.tactic)} proficiency ${prof} is below 70 — the in-game penalty isn't modelled, ratings assume 70.`);
    $("#luWarnings").innerHTML = warns.map((x) => `<li>${x}</li>`).join("");
    $("#luWarnings").hidden = !warns.length;

    renderManagerFit(l);
    renderPositionTraining(l);
    renderMatchHelper(l);
    renderPicker(l, slots);
    renderInstructions(l);
    renderSubTactic(l);
    renderSubs(l, layoutOf(l));
    $("#luNotes").value = l.notes || "";
    // The owner's plan lineup carries the written playbook (KB.GAME_PLAN) as a fold below.
    const pb = $("#luPlaybookPanel");
    const isPlan = !!KB.GAME_PLAN && l.id === KB.GAME_PLAN.planId;
    pb.hidden = !isPlan;
    if (isPlan) renderGamePlan();
  }

  // Individual instructions (§23): two per group, as in the game since v6.0.0.
  const INSTR = [
    ["counterTarget", "Counter Target", "defensive group — stays high for the ball in behind"],
    ["tightMarking", "Tight Marking", "defensive group — on their most dangerous attacker"],
    ["defensive", "Defensive", "attacking group — holds position, doesn't join attacks"],
    ["anchoring", "Anchoring", "attacking group — a full-back or midfielder who stays home"],
  ];
  function renderInstructions(l) {
    const box = $("#luInstructions");
    if (!box) return;
    l.instructions ||= {};
    const slots = layoutOf(l);
    const opts = (cur) => `<option value="">—</option>` + l.xi.map((id, i) => (byId[id] ? `<option value="${id}" ${cur === id ? "selected" : ""}>${slots[i][0]} · ${esc(byId[id].name)}</option>` : "")).join("");
    box.innerHTML = INSTR.map(([k, label, hint]) => `<label class="instr__row" title="${esc(hint)}"><span class="badge">${label}</span><select data-instr="${k}">${opts(l.instructions[k])}</select></label>`).join("");
  }
  $("#luInstructions").addEventListener("change", (e) => {
    const sel = e.target.closest("[data-instr]");
    if (!sel) return;
    const l = activeLineup();
    l.instructions ||= {};
    l.instructions[sel.dataset.instr] = sel.value || null;
    saveLineup();
  });

  // Sub-tactic (eFootball Game Plan): the saved second playstyle + shape you switch to in a
  // match. "Suggest" picks the manager's strongest other playstyle in §23 order and the
  // bench players whose styles fit it.
  const SUB_WHEN = {
    "Possession": "They sit deep and compact, long balls get cleared, few real chances by ~55′ — keep the ball and draw them out.",
    "Long Ball": "You need a goal and the counters aren't coming — go direct to the tall focal striker, runners on the second ball.",
    "Quick Counter": "They play Possession and press high — win it and go at once, pace in behind.",
    "Long Ball Counter": "They press with a high line — sit deep, soak it up and go in behind.",
    "Out Wide": "They sit narrow and deep — go wide, overlap and cross early.",
    "Overload": "They defend zonally in the middle — crowd one side with short options, then switch play.",
  };
  const SUB_PREFER = {
    "Long Ball Counter": ["Possession", "Long Ball", "Quick Counter", "Out Wide", "Overload"],
    "Quick Counter": ["Long Ball Counter", "Possession", "Long Ball", "Out Wide", "Overload"],
    "Possession": ["Quick Counter", "Long Ball Counter", "Long Ball", "Out Wide", "Overload"],
    "Out Wide": ["Long Ball Counter", "Possession", "Quick Counter", "Long Ball", "Overload"],
    "Long Ball": ["Long Ball Counter", "Possession", "Quick Counter", "Out Wide", "Overload"],
    "Overload": ["Possession", "Long Ball Counter", "Quick Counter", "Long Ball", "Out Wide"],
  };
  function suggestSubTactic(l) {
    const m = managerObj(l.manager);
    const prof = (t) => m?.prof[KB.TACTICS.indexOf(t)] ?? null;
    const order = (SUB_PREFER[l.tactic] || KB.TACTICS).filter((t) => t !== l.tactic);
    const tactic = order.find((t) => (prof(t) ?? 0) >= 85) || [...order].sort((a, b) => (prof(b) ?? -1) - (prof(a) ?? -1))[0];
    const slots = layoutOf(l);
    const bench = l.bench.map((id) => byId[id]).filter(Boolean);
    const xi = l.xi.map((id, i) => ({ p: byId[id], pos: slots[i][0] })).filter((x) => x.p);
    const styleIs = (p, ...names) => names.some((n) => norm(p.playingStyle) === norm(n) || norm(p.playingStyleDefensive) === norm(n));
    const findBench = (...names) => bench.find((p) => styleIs(p, ...names));
    const findXi = (...names) => xi.find((x) => styleIs(x.p, ...names));
    const forwards = xi.filter((x) => ["CF", "SS"].includes(x.pos));
    const pace = (p) => p.stats.speed + p.stats.acceleration;
    const moves = [];
    if (tactic === "Possession") {
      const orch = findBench("Orchestrator"), hold = findXi("Anchor Man", "All-Action Defender", "The Destroyer");
      if (orch && hold) moves.push(`${orch.name} for ${hold.p.name} (Orchestrator builds from deep)`);
      const dlf = findBench("Deep-Lying Forward"), fox = forwards.find((x) => styleIs(x.p, "Fox in the Box", "Target Man")) || forwards[0];
      if (dlf && fox) moves.push(`${dlf.name} for ${fox.p.name} (Deep-Lying Forward drops between the lines)`);
    } else if (tactic === "Long Ball") {
      const tall = bench.filter((p) => ["CF", "SS"].includes(p.position)).sort((a, b) => b.height - a.height)[0];
      const shortest = [...forwards].sort((a, b) => a.p.height - b.p.height)[0];
      if (tall && shortest && tall.height > shortest.p.height) moves.push(`${tall.name} (${tall.height} cm) for ${shortest.p.name} as the focal striker`);
      const second = findBench("Box-to-Box", "Hole Player");
      if (second) moves.push(`${second.name} on for the second balls`);
    } else if (tactic === "Quick Counter") {
      const fast = bench.filter((p) => ["CF", "SS", "LWF", "RWF"].includes(p.position)).sort((a, b) => pace(b) - pace(a))[0];
      const slow = [...forwards].sort((a, b) => pace(a.p) - pace(b.p))[0];
      if (fast && slow && pace(fast) > pace(slow.p)) moves.push(`${fast.name} for ${slow.p.name} (pace in behind)`);
    } else if (tactic === "Long Ball Counter") {
      const anchor = findBench("Anchor Man", "All-Action Defender"), mid = xi.find((x) => x.pos === "CMF");
      if (anchor && mid) moves.push(`${anchor.name} for ${mid.p.name} (a holding midfielder for the deep block)`);
      const poacher = findBench("Goal Poacher"), fwd = forwards.find((x) => !styleIs(x.p, "Goal Poacher"));
      if (poacher && fwd) moves.push(`${poacher.name} for ${fwd.p.name} (runs in behind)`);
    } else if (tactic === "Out Wide") {
      const wb = findBench("Offensive Full-back"), fb = xi.find((x) => ["LB", "RB"].includes(x.pos) && !styleIs(x.p, "Offensive Full-back"));
      if (wb && fb) moves.push(`${wb.name} for ${fb.p.name} (an overlapping full-back)`);
    }
    return { tactic, formation: "", when: SUB_WHEN[tactic] || "",
      subs: moves.join("; ") || (bench.length ? "" : "Fill the bench first — the suggestion names who comes on from it.") };
  }
  function renderSubTactic(l) {
    const box = $("#luSubTactic");
    if (!box) return;
    const st = l.subTactic || {};
    const m = managerObj(l.manager);
    const prof = (t) => m?.prof[KB.TACTICS.indexOf(t)];
    const avg = st.tactic && m ? xiAverage(l, m.key, st.tactic) : null;
    const p = st.tactic ? prof(st.tactic) : null;
    box.innerHTML = `
      ${st.tactic ? `<div class="subtactic__head">
        <span class="subtactic__badge ${p >= 85 ? "is-hot" : ""}">${esc(st.tactic)}<small>${p ?? "N/A"}</small></span>
        <span class="subtactic__shape">${esc(st.formation || l.formation)}${st.formation ? "" : " <small>(same shape)</small>"}</span>
        ${avg != null ? `<span class="subtactic__avg" title="Average XI rating at this playstyle with ${esc(m.name)}">${avg.toFixed(1)}<small>avg</small></span>` : ""}
        <button type="button" class="chip chip--small ${lu.plan === "sub" ? "is-selected" : ""}" data-plan-show="sub">${lu.plan === "sub" ? "On the pitch" : "Show on pitch"}</button>
      </div>` : ""}
      <div class="subtactic__row">
        <label class="field field--inline"><span class="field__label">Playstyle</span><select data-st="tactic"><option value="">—</option>${KB.TACTICS.map((t) => `<option value="${t}" ${st.tactic === t ? "selected" : ""}>${t}${m ? ` · ${prof(t) ?? "N/A"}` : ""}</option>`).join("")}</select></label>
        <label class="field field--inline"><span class="field__label">Shape</span><select data-st="formation"><option value="">same as now</option>${Object.keys(FORMATIONS).map((f) => `<option ${st.formation === f ? "selected" : ""}>${f}</option>`).join("")}</select></label>
      </div>
      <label class="field field--notes"><span class="field__label">When to switch</span><textarea data-st="when" rows="2" placeholder="e.g. they sit deep and the long balls get cleared">${esc(st.when || "")}</textarea></label>
      <label class="field field--notes"><span class="field__label">Who comes on</span><textarea data-st="subs" rows="2" placeholder="e.g. Pirlo for Makélélé, Puskás for Gullit">${esc(st.subs || "")}</textarea></label>
      ${!st.tactic ? `<p class="rec-muted">Nothing saved yet — <b>Suggest</b> fills it from ${esc(m?.name || "the manager")}'s other playstyles and your bench.</p>` : ""}`;
  }
  $("#luSubTactic").addEventListener("change", (e) => {
    const el = e.target.closest("[data-st]");
    if (!el) return;
    const l = activeLineup();
    l.subTactic ||= {};
    l.subTactic[el.dataset.st] = el.value;
    if (el.dataset.st === "formation") l.subLayout = null; // re-lay the eleven onto the new shape
    if (el.dataset.st === "tactic" && !el.value) lu.plan = "main";
    saveLineup();
    if (el.dataset.st === "tactic" || el.dataset.st === "formation") renderLineup(); else renderSubTactic(l);
  });
  $("#luSubTactic").addEventListener("click", (e) => {
    const b = e.target.closest("[data-plan-show]");
    if (!b) return;
    lu.plan = lu.plan === "sub" ? "main" : "sub";
    lu.sel = null; renderLineup();
    if (lu.plan === "sub") $("#luPitch").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#luSubSuggest").addEventListener("click", () => {
    const l = activeLineup();
    l.subTactic = suggestSubTactic(l);
    l.subLayout = null;
    saveLineup(); renderLineup();
    flash($("#luSubSuggest"), l.subTactic.tactic || "—");
  });

  // Manager fit (§17, §22): the XI's average rating with each of the profile's managers —
  // their team booster and playstyle-proficiency multiplier — at the lineup's playstyle
  // and at the manager's own best one, plus which Link-up plays this XI switches on.
  function xiAverage(l, managerKey, tactic) {
    const slots = layoutOf(l);
    const r = l.xi.map((id, i) => (byId[id] ? compute(byId[id], lineupBuild(byId[id]), managerKey, tactic).ratings[byId[id].position] : null)).filter((x) => x != null);
    return r.length ? r.reduce((a, b) => a + b, 0) / r.length : null;
  }
  function renderManagerFit(l) {
    const box = $("#luManagers");
    if (!box) return;
    if (!l.xi.some((id) => byId[id])) { box.innerHTML = gated() && !players.length ? gateHtml("build a lineup") : `<p class="empty-state">Put players in the XI to compare managers.</p>`; return; }
    const cur = managerObj(l.manager);
    const rows = profileManagers().map((m) => {
      const profAtTactic = (t) => m.prof[KB.TACTICS.indexOf(t)];
      const bestIdx = m.prof.reduce((b, v, j) => ((v ?? -1) > (m.prof[b] ?? -1) ? j : b), 0);
      const best = KB.TACTICS[bestIdx];
      const here = profAtTactic(l.tactic);
      const links = linkUpStatus(l, m);
      return { m, best, bestProf: m.prof[bestIdx], here, avgHere: here == null ? null : xiAverage(l, m.key, l.tactic),
        avgBest: xiAverage(l, m.key, best), on: links.filter((x) => x.cp.length && x.km.length) };
    // What you'd actually play first: the lineup's own playstyle, then Link-ups, then each
    // manager's best playstyle.
    }).sort((a, b) => (b.avgHere ?? 0) - (a.avgHere ?? 0) || b.on.length - a.on.length || (b.avgBest ?? 0) - (a.avgBest ?? 0));
    const f = (x) => (x == null ? "—" : x.toFixed(1));
    box.innerHTML = `<div class="mfit">${rows.map((r) => `
      <div class="mfit__row ${cur && cur.key === r.m.key ? "is-current" : ""}">
        <span class="mfit__ph">${mgrPhoto(r.m, "mgr-photo")}</span>
        <div class="mfit__who">
          <b>${esc(r.m.name)}</b>
          <span>${r.m.boost.map((k) => `${statLabel(k)} +1`).join(" · ")}</span>
          ${r.on.length ? r.on.map((x) => `<span class="mfit__link">Link-up ${esc(x.link.name)}: ${x.cp.map((p) => esc(shortName(p))).join("/")} → ${x.km.map((p) => esc(shortName(p))).join("/")}</span>`).join("")
            : `<span class="mfit__nolink">No Link-up with this XI</span>`}
        </div>
        <div class="mfit__num" title="Average XI rating at ${esc(l.tactic)} (proficiency ${r.here ?? "N/A"})">
          <b>${f(r.avgHere)}</b><span>${esc(l.tactic)} ${r.here ?? "N/A"}</span></div>
        <div class="mfit__num" title="Average XI rating at his best playstyle">
          <b>${f(r.avgBest)}</b><span>${esc(r.best)} ${r.bestProf}</span></div>
        ${cur && cur.key === r.m.key ? `<span class="badge badge--lime">Current</span>`
          : `<button type="button" class="btn btn--icon" data-mfit="${esc(r.m.key)}" data-mfit-tactic="${esc(r.here >= PROF_MIN ? l.tactic : r.best)}">Use</button>`}
      </div>`).join("")}</div>
      <p class="mfit__note">Ratings include each manager's +1/+1 booster and playstyle multiplier (§17). Link-up needs both roles in the XI at their positions (§22) — its strength isn't measured.</p>
      ${scoutHtml(l, rows.map((r) => r.m))}`;
  }
  // Managers you don't own (every eFHUB manager card): the ones this XI would rate highest
  // at the lineup's playstyle, Link-ups that would switch on first — what to look for in
  // the next manager pick. Only playstyle proficiency 85+ is worth a look.
  function scoutHtml(l, owned) {
    const tIdx = KB.TACTICS.indexOf(l.tactic);
    if (tIdx < 0) return "";
    const sig = new Set(owned.map((m) => m.prof.slice(0, 5).join()));
    const rows = ALL_MANAGERS.filter((m) => m.key.startsWith("ef:") && !sig.has(m.prof.slice(0, 5).join()) && (m.prof[tIdx] ?? 0) >= 85)
      .map((m) => ({ m, here: m.prof[tIdx], avg: xiAverage(l, m.key, l.tactic), on: linkUpStatus(l, m).filter((x) => x.cp.length && x.km.length) }))
      .filter((r) => r.avg != null)
      .sort((a, b) => b.on.length - a.on.length || b.avg - a.avg || b.here - a.here)
      .slice(0, 6);
    if (!rows.length) return "";
    return `<details class="mfit__scout"><summary>Not owned — managers worth a look for this XI at ${esc(l.tactic)}</summary>
      <div class="mfit">${rows.map((r) => `
        <div class="mfit__row">
          <span class="mfit__ph">${mgrPhoto(r.m, "mgr-photo")}</span>
          <div class="mfit__who">
            <b>${esc(r.m.name)}</b>
            <span>${r.m.boost.map((k) => `${statLabel(k)} +1`).join(" · ")}${r.m.released ? ` · eFHUB ${esc(r.m.released)}` : ""}</span>
            ${r.on.length ? r.on.map((x) => `<span class="mfit__link">Link-up ${esc(x.link.name)}: ${x.cp.map((p) => esc(shortName(p))).join("/")} → ${x.km.map((p) => esc(shortName(p))).join("/")}</span>`).join("")
              : (r.m.linkUps || []).map((x) => `<span class="mfit__nolink">${esc(x.name)}: ${esc(x.centerPiece.join(" "))} → ${esc(x.keyMan.join(" "))} — not with this XI</span>`).join("") || `<span class="mfit__nolink">No Link-up play on this card</span>`}
          </div>
          <div class="mfit__num" title="Average XI rating at ${esc(l.tactic)} (proficiency ${r.here})"><b>${r.avg.toFixed(1)}</b><span>${esc(l.tactic)} ${r.here}</span></div>
        </div>`).join("")}</div>
      <p class="mfit__note">From eFHUB's manager list (data/managers.js) — whether a card is on sale in the game right now isn't tracked.</p></details>`;
  }
  // Position Training (§20): every spot this lineup asks a player to fill — attacking
  // shape, Fluid defence shape, and the slot a planned substitute takes over — where his
  // proficiency isn't high. Proficiency is separate from style compatibility (§20).
  function renderPositionTraining(l) {
    const box = $("#luTraining");
    if (!box) return;
    const att = layoutOf(l);
    const def = l.fluid ? defLayoutOf(l) : null;
    const uses = []; // { id, pos, how }
    const sub = l.subTactic?.tactic ? subLayoutOf(l) : null;
    l.xi.forEach((id, i) => {
      if (!byId[id]) return;
      uses.push({ id, pos: att[i][0], how: l.fluid ? "attack" : "starter" });
      if (def && def[i][0] !== att[i][0]) uses.push({ id, pos: def[i][0], how: "defence shape" });
      if (sub && sub[i][0] !== att[i][0]) uses.push({ id, pos: sub[i][0], how: `sub-tactic (${l.subTactic.tactic})` });
    });
    l.subs.forEach((s) => {
      const i = l.xi.indexOf(s.out);
      if (!byId[s.in] || i < 0) return;
      uses.push({ id: s.in, pos: att[i][0], how: `sub for ${shortName(byId[s.out])}${s.minute ? ` (${s.minute}')` : ""}` });
      if (def && def[i][0] !== att[i][0]) uses.push({ id: s.in, pos: def[i][0], how: `sub for ${shortName(byId[s.out])}, defence shape` });
    });
    const RANK = { none: 0, mid: 1 };
    const seen = new Set();
    const todo = uses.map((u) => ({ ...u, prof: proficiency(byId[u.id], u.pos) }))
      .filter((u) => u.pos !== "GK" && RANK[u.prof] != null && !seen.has(u.id + u.pos) && seen.add(u.id + u.pos))
      .sort((a, b) => RANK[a.prof] - RANK[b.prof]);
    box.innerHTML = `<h3 class="group__title group__title--spaced">Position training</h3>` + (todo.length
      ? `<ul class="ptrain">${todo.map((u) => {
          const p = byId[u.id];
          const style = styleFit(p, u.pos).filter((f) => !f.ok).map((f) => f.name);
          return `<li><b>${esc(p.name)}</b> → <span class="pp pp--${u.prof}">${u.pos}</span>
            <em>${u.prof === "none" ? "no proficiency" : "intermediate"} → train to high · ${esc(u.how)}${style.length ? ` · ${esc(style.join(", "))} stays inactive there (§20)` : ""}</em></li>`;
        }).join("")}</ul><p class="mfit__note">Uses an Additional Position Proficiency slot and a Position Training token; high is the cap (§20). If you've already trained it, set it in the Trainer's positions.</p>`
      : `<p class="rec-muted">Everyone in this plan — starters, Fluid defence shape and planned subs — already has high proficiency where he plays.</p>`);
  }

  // Match helper (KNOWLEDGE-BASE §23): pick the opponent's team playstyle → which one to
  // switch to (checked against your manager's proficiency) and instructions naming your
  // own players.
  function renderMatchHelper(l) {
    const sel = $("#luOpponent");
    if (!sel) return;
    sel.innerHTML = `<option value="">— pick their playstyle —</option>` + KB.TACTICS.map((t) => `<option>${t}</option>`).join("");
    sel.value = l.opponent || "";
    const box = $("#luMatch");
    const mu = KB.MATCHUPS?.[l.opponent];
    if (!mu) { box.innerHTML = `<p class="empty-state">Pick the opponent's team playstyle.</p>`; return; }
    const m = managerObj(l.manager);
    const prof = (t, mm = m) => mm?.prof[KB.TACTICS.indexOf(t)] ?? null;
    const target = prof(mu.answer);
    const others = profileManagers().filter((x) => x !== m && prof(mu.answer, x) >= 85).map((x) => `${x.name} (${prof(mu.answer, x)})`);
    const switchLine = !m ? `Switch to <b>${esc(mu.answer)}</b>.`
      : target >= PROF_MIN ? `Switch to <b>${esc(mu.answer)}</b> — ${mgrPhoto(m, "mgr-photo mgr-photo--inline")}${esc(m.name)} has ${target} there${l.tactic === mu.answer ? " (you're already on it)" : "; set it as the sub-tactic or change it in the match"}.`
      : `<b>${esc(mu.answer)}</b> is the answer, but ${esc(m.name)} has ${target ?? "N/A"} there — stay on ${esc(l.tactic)} and lean on the instructions${others.length ? `, or pick a manager strong in it: ${others.map(esc).join(", ")}` : ""}.`;
    // Players the tips name, from the XI's builds.
    const slots = layoutOf(l);
    const xi = l.xi.map((id, i) => (byId[id] ? { p: byId[id], pos: slots[i][0], f: compute(byId[id], lineupBuild(byId[id]), l.manager, l.tactic).final } : null)).filter(Boolean);
    // A player takes one defensive instruction (Defensive or Tight Marking) — the next
    // tip goes to the next-best player.
    const taken = new Set();
    const pick = (filter, score) => {
      const p = xi.filter((x) => filter(x) && !taken.has(x.p.id)).sort((a, b) => score(b) - score(a))[0]?.p;
      if (p) taken.add(p.id);
      return p;
    };
    const nm = (p, fallback) => (p ? `<b>${esc(p.name)}</b>` : fallback);
    const isFwd = (x) => ["CF", "SS", "LWF", "RWF"].includes(x.pos);
    const isMid = (x) => ["DMF", "CMF"].includes(x.pos);
    const isFB = (x) => ["LB", "RB"].includes(x.pos);
    const tackle = (x) => x.f.defensiveAwareness + x.f.ballWinning;
    const TIPS = {
      counterTarget: () => `Counter Target on ${nm(xi.filter(isFwd).sort((a, b) => b.f.speed + b.f.acceleration - a.f.speed - a.f.acceleration)[0]?.p, "your fastest striker")} — he stays high for the ball in behind.`,
      defensiveDMF: () => `Defensive on ${nm(pick(isMid, tackle), "your holding midfielder")} — he holds the zone in front of the CBs.`,
      defensiveFB: () => `Defensive on ${nm(pick(isFB, (x) => x.f.defensiveAwareness + x.f.speed), "one full-back")} — he stays home instead of overlapping.`,
      tightCreator: () => `Tight Marking: ${nm(pick(isMid, tackle), "a defensive midfielder")} on their AMF / main creator.`,
      tightWinger: () => `Tight Marking: ${nm(pick(isFB, (x) => x.f.speed + x.f.defensiveAwareness), "a full-back")} on their most dangerous winger.`,
      tightTarget: () => `Tight Marking: ${nm(pick((x) => x.pos === "CB", (x) => x.f.jump + x.f.heading + x.f.physicalContact + x.p.height), "your best aerial CB")} on their target striker.`,
      patience: () => "Be patient on the ball — don't force long balls into their block; one full-back stays home against their counter.",
      switchPlay: () => "Switch play to the far side — they crowd the ball side; diagonal balls find space.",
    };
    box.innerHTML = `
      <p class="match__line">${switchLine}</p>
      <p class="rec-muted">${esc(mu.why)} ${mu.basis === "sourced" ? "(community rule of thumb, not tested — §23)" : "(our reasoning, not a sourced match-up — §23)"}</p>
      <ul class="match__tips">${mu.tips.map((t) => `<li>${TIPS[t]()}</li>`).join("")}</ul>`;
  }
  $("#luOpponent").addEventListener("change", (e) => { activeLineup().opponent = e.target.value; saveLineup(); renderLineup(); });

  /* ---------------------------------------------------------
     Game Plan tab (KB.GAME_PLAN — USER-SQUAD §3, KNOWLEDGE-BASE §24): the plan's XI with
     each starter's build, booster and skills live from the Trainer / recommend.js, then
     the written game template. Uses the owner's lineup copy once it's been edited.
  --------------------------------------------------------- */

  const BASIS_LABEL = { measured: "tested (§19)", official: "in-game text", guides: "community guides", reasoning: "our reasoning" };
  function renderGamePlan() {
    const box = $("#gamePlan");
    const gp = KB.GAME_PLAN;
    if (!box || !gp) return;
    const plan = (KB.MATCH_PLANS || []).find((x) => x.id === gp.planId);
    const own = ownsRepo() ? store.lineups.find((x) => x.id === gp.planId) : null;
    // A detached copy, so layoutOf()/defLayoutOf() can fill in shapes without touching the plan.
    const l = own || (plan ? JSON.parse(JSON.stringify({ ...plan, layout: null })) : null);
    const fielded = l && l.xi.every((id) => byId[id]);
    const basis = (b) => `<span class="gp-basis gp-basis--${esc(b)}">${esc(BASIS_LABEL[b] || b)}</span>`;
    let xiHtml = "";
    if (fielded) {
      const att = layoutOf(l);
      const def = l.fluid ? defLayoutOf(l) : att;
      const m = managerObj(l.manager);
      const rows = l.xi.map((id, i) => {
        const p = byId[id];
        const b = lineupBuild(p);
        const c = compute(p, b, l.manager, l.tactic);
        const pos = att[i][0];
        const dpos = def[i][0];
        const styles = stylesOf(p).map((st) => {
          const on = styleActiveAt(st, pos);
          return `<span class="${on === false ? "gp-off" : ""}" title="${on === false ? `inactive at ${pos}` : ""}">${esc(st.name)}</span>`;
        }).join(" · ") || "—";
        const rec = REC.recs[id];
        const keys = (rec?.targets || []).slice(0, 4).map((t) => `${esc(statLabel(t.stat))} <b>${c.final[t.stat]}</b>`).join(" · ");
        const b2 = booster2Of(p, b);
        const lv = categoriesFor(p).map((cat) => b.levels[cat.key] || 0).join("-");
        return `<tr>
          <td class="pos-list">${esc(pos)}${dpos !== pos ? `<small> → ${esc(dpos)}</small>` : ""}</td>
          <td><a href="#train/${esc(id)}" data-open-player="${esc(id)}"><b>${esc(p.name)}</b></a>${store.builds[id] ? " ★" : ""}<br><small class="rec-muted">${styles}</small></td>
          <td class="num hot" title="${c.ratings[pos] !== c.ratings[p.position] ? `at ${esc(pos)}: ${c.ratings[pos]}` : ""}">${c.ratings[p.position] ?? "—"}</td>
          <td class="gp-lv">${lv}<br><small class="rec-muted">${b2 ? esc(b2.name) : "no slot-2 booster"}</small></td>
          <td class="gp-keys">${keys}</td>
          <td class="gp-skills">${skillsOf(id).map(esc).join(", ") || "—"}</td>
        </tr>`;
      }).join("");
      const ratings = l.xi.map((id) => buildRating(byId[id], l));
      const avg = (ratings.reduce((a, x) => a + x, 0) / ratings.length).toFixed(1);
      const links = linkUpStatus(l);
      const prof = m?.prof[KB.TACTICS.indexOf(l.tactic)] ?? null;
      const bench = l.bench.filter((id) => byId[id]).map((id) => `<a href="#train/${esc(id)}" data-open-player="${esc(id)}">${esc(byId[id].name)}</a>`).join(", ");
      xiHtml = `
        <div class="panel">
          <div class="panel__head">
            <h2>STARTING XI &amp; BUILDS</h2>
            <p class="panel__meta">${own ? "your lineup copy" : "the plan"} · ★ your saved build, otherwise the AI build</p>
          </div>
          <div class="lu-kpis">
            <div><b>${avg}</b><span>avg XI rating</span></div>
            <div><b class="${prof >= 89 ? "is-hot" : ""}">${prof ?? "—"}</b><span>${mgrPhoto(m, "mgr-photo mgr-photo--kpi")}${esc(m?.name || "no manager")} · ${esc(l.tactic)}</span></div>
            <div><b class="${links.some((x) => x.cp.length && x.km.length) ? "is-hot" : ""}">${links.some((x) => x.cp.length && x.km.length) ? "ON" : "OFF"}</b><span>Link-up${links[0] ? ` · ${esc(links[0].link.name)}` : ""}</span></div>
          </div>
          <div class="table-wrap">
            <table class="kb-table gp-xi">
              <thead><tr><th>Pos</th><th>Player · styles</th><th class="num">Rating</th><th>Build (Sh-Pa-Dr-Dx-LB-Ae-De) · booster</th><th>Key stats</th><th>Additional skills</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <p class="gp-bench"><span class="field__label">Bench</span> ${bench || "—"}</p>
          <div class="panel__actions">

          </div>
        </div>`;
    }
    const sections = gp.sections.map((s) => `
      <div class="panel gp-section">
        <div class="panel__head"><h2>${esc(s.title.toUpperCase())}</h2></div>
        <ul class="gp-items">${s.items.map((it) => `<li><b>${esc(it.head)}</b> ${basis(it.basis)}<p>${esc(it.text)}</p></li>`).join("")}</ul>
      </div>`).join("");
    box.innerHTML = `
      <div class="panel gp-hero">
        <div class="panel__head">
          <h2>GAME PLAN</h2>
          <p class="panel__meta">${esc(gp.date)} · not measured — check it against your results</p>
        </div>
        <p class="gp-title">${esc(gp.title)}</p>
        <p class="gp-summary">${esc(gp.summary)}</p>
        ${fielded ? "" : `<p class="empty-state">Written for the site owner's squad — the XI isn't in yours, but the principles below still apply.</p>`}
        <h3 class="group__title group__title--spaced">Instructions</h3>
        <ul class="gp-instr">${gp.instructions.map((x) => `<li><span class="badge">${esc(x.what)}</span> <b>${esc(x.who)}</b> — ${esc(x.why)}</li>`).join("")}</ul>
        <h3 class="group__title group__title--spaced">What changed since 3 Oct</h3>
        <ul class="gp-items">${gp.changes.map((x) => `<li><p>${esc(x.text)}</p></li>`).join("")}</ul>
      </div>
      ${xiHtml}
      <div class="gp-grid">${sections}</div>
      <div class="panel">
        <div class="panel__head"><h2>ALTERNATIVES</h2><p class="panel__meta">when the base plan isn't the answer</p></div>
        <ul class="gp-items">${gp.alternatives.map((a) => `<li><b>${esc(a.name)}</b><p>${esc(a.when)}</p></li>`).join("")}</ul>
      </div>`;
  }

  $("#luManagers").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mfit]");
    if (!b) return;
    const l = activeLineup();
    l.manager = b.dataset.mfit;
    l.tactic = b.dataset.mfitTactic;
    saveLineup(); renderLineup();
  });

  function renderPicker(l, slots) {
    const box = $("#luPicker");
    if (!lu.sel) {
      box.innerHTML = `<p class="empty-state">Tap a player to see his AI build next to yours (and to replace him), or an empty slot to pick a player.</p>`;
      return;
    }
    const pos = lu.sel.area === "xi" ? slots[lu.sel.i][0] : null;
    const current = lu.sel.area === "xi" ? l.xi[lu.sel.i] : l.bench[lu.sel.i];
    const q = lu.q.trim().toLowerCase();
    const rows = players
      .filter((p) => !q || `${p.name} ${p.team} ${p.position} ${styleText(p)}`.toLowerCase().includes(q))
      .map((p) => ({ p, r: pos ? slotRating(p, pos, l) : p.overall, prof: pos ? proficiency(p, pos) : "primary" }))
      .sort((a, b) => b.r - a.r);
    const RANK = { primary: 0, high: 1, mid: 2, none: 3 };
    const fits = rows.filter((x) => x.prof !== "none").sort((a, b) => RANK[a.prof] - RANK[b.prof] || b.r - a.r);
    const others = rows.filter((x) => x.prof === "none");
    box.innerHTML = `
      <div class="picker__head">
        <span class="field__label">${pos ? `Pick ${pos}` : "Pick a substitute"}</span>
        <div class="panel__actions">
          ${current ? `<button type="button" class="btn btn--icon btn--danger" data-lu="clear">Remove</button>` : ""}
          <button type="button" class="btn btn--icon" data-lu="cancel">Close</button>
        </div>
      </div>
      ${pos && lu.sel.i > 0 ? `<div class="role-row"><span class="field__label">Role</span>${OUTFIELD_ROLES.map((r) =>
        `<button type="button" class="role-btn ${r === pos ? "is-on" : ""}" data-role="${r}">${r}</button>`).join("")}</div>` : ""}
      <input type="text" id="luSearch" placeholder="Search…" value="${esc(lu.q)}" aria-label="Search players">
      <div class="picker__list">${pos ? `<p class="picker__group">Can play ${pos} (${fits.length})</p>` : ""}${(pos ? fits : rows).map(pickRow).join("") || `<p class="empty-state">No one in the squad has ${pos} proficiency.</p>`}
        ${pos && others.length ? (lu.showOthers || q
          ? `<p class="picker__group">Out of position (${others.length}) <button type="button" class="linkish" data-lu="others">hide</button></p>${others.map(pickRow).join("")}`
          : `<button type="button" class="btn btn--icon picker__more" data-lu="others">Show ${others.length} out-of-position players</button>`) : ""}
      </div>`;

    function pickRow({ p, r, prof }) {
        const where = l.xi.includes(p.id) ? "XI" : l.bench.includes(p.id) ? "Bench" : "";
        const fit = pos ? styleFit(p, pos) : [];
        return `<button type="button" class="pick ${p.id === current ? "is-current" : ""}" data-pick="${p.id}">
          <b class="pick__r pick__r--${prof}">${r}</b>
          <span class="pick__name">${esc(p.name)}<small>${p.position} ${p.overall} · ${esc(styleText(p))}</small></span>
          <span class="pick__tags">
            ${pos && prof === "none" ? `<span class="badge badge--ember">no ${pos}</span>` : ""}
            ${pos && (prof === "high" || prof === "mid") ? `<span class="badge ${prof === "high" ? "badge--green" : ""}">${PROF_LABEL[prof]}</span>` : ""}
            ${fit.some((f) => !f.ok) ? `<span class="badge badge--amber">style off</span>` : ""}
            ${store.builds[p.id] ? `<span class="badge">★ build</span>` : ""}
            ${where ? `<span class="badge badge--lime">${where}</span>` : ""}
          </span></button>`;
    }
  }

  function renderSubs(l, slots) {
    const xiOpts = l.xi.map((id, i) => byId[id] ? `<option value="${id}">${slots[i][0]} · ${esc(byId[id].name)}</option>` : "").join("");
    const benchOpts = l.bench.map((id) => byId[id] ? `<option value="${id}">${esc(byId[id].name)} (${byId[id].position})</option>` : "").join("");
    $("#luSubs").innerHTML = l.subs.map((s, i) => `
      <div class="sub-row" data-sub="${i}">
        <label class="sub-row__min"><span class="field__label">Min</span><input type="number" min="1" max="120" value="${s.minute ?? ""}" data-sf="minute"></label>
        <label><span class="field__label">Off</span><select data-sf="out"><option value="">—</option>${xiOpts}</select></label>
        <label><span class="field__label">On</span><select data-sf="in"><option value="">—</option>${benchOpts}</select></label>
        <label class="sub-row__note"><span class="field__label">Note</span><input type="text" value="${esc(s.note || "")}" data-sf="note" placeholder="e.g. if leading, protect"></label>
        <button type="button" class="btn btn--icon btn--danger" data-sub-del="${i}" aria-label="Remove substitution">✕</button>
      </div>`).join("") || `<p class="empty-state">No substitutions planned.</p>`;
    l.subs.forEach((s, i) => {
      const row = $(`[data-sub="${i}"]`, $("#luSubs"));
      $("[data-sf=out]", row).value = s.out || "";
      $("[data-sf=in]", row).value = s.in || "";
    });
  }

  function saveLineup() { saveStore(); }

  // Tapping a player opens his builds; an empty slot (or Edit positions) opens the picker.
  $("#luPitch").addEventListener("click", (e) => {
    const b = e.target.closest("[data-slot]");
    if (!b || lu.justDragged) return;
    const i = Number(b.dataset.slot);
    const id = activeLineup().xi[i];
    if (id && lu.mode === "players") { openBuildDialog(id, "xi", i); return; }
    lu.sel = lu.sel?.area === "xi" && lu.sel.i === i ? null : { area: "xi", i };
    renderLineup();
  });
  $("#luBench").addEventListener("click", (e) => {
    const b = e.target.closest("[data-bench]");
    if (!b || lu.justDragged) return;
    const i = Number(b.dataset.bench);
    const id = activeLineup().bench[i];
    if (id) { openBuildDialog(id, "bench", i); return; }
    lu.sel = lu.sel?.area === "bench" && lu.sel.i === i ? null : { area: "bench", i };
    renderLineup();
  });

  /* ---- Player build dialog: the AI build next to the player's own ---- */

  const bd = { id: null, area: null, i: null };
  function openBuildDialog(id, area, i) {
    const p = byId[id];
    const r = REC?.recs[id];
    if (!p || !r) return;
    Object.assign(bd, { id, area, i });
    const l = activeLineup();
    const pos = area === "xi" ? shownLayout(l)[i][0] : p.position;
    const cats = categoriesFor(p);
    const stats = r.targets.map((t) => t.stat);
    const ai = recBuild(id);
    const mine = store.builds[id] || null;
    const aiRes = compute(p, ai, l.manager, l.tactic);
    const col = (title, build, res, isMine) => {
      if (!build) {
        return `<section class="bd-col bd-col--empty"><h4>${title}</h4>
          <p class="rec-muted">No saved build for this card yet — make one in the Trainer, or take the AI build as yours.</p></section>`;
      }
      const pts = cats.reduce((t, c) => t + cumCost(build.levels[c.key] || 0), 0);
      const b2 = booster2Of(p, build);
      return `<section class="bd-col ${isMine ? "is-mine" : ""}">
        <h4>${title}<span>${pos} <b>${res.ratings[pos]}</b></span></h4>
        <div class="rec-levels">${cats.map((c) => `<span class="${build.levels[c.key] ? "" : "is-zero"}"><b>${build.levels[c.key] || 0}</b><i>${c.label.replace("Lower Body Strength", "Lower Body").replace("Aerial Strength", "Aerial")}</i></span>`).join("")}</div>
        <p class="bd-meta">${pts}/${budgetFor(p.levelCap)} pts · ${b2 ? `${esc(b2.name)}${p.booster2Fixed ? " (fixed)" : ""}` : "no slot-2 booster"}</p>
        <div class="rec-targets">${stats.map((k) => {
          const d = isMine ? res.final[k] - aiRes.final[k] : 0;
          return `<span class="rec-t" title="${statLabel(k)}"><i>${statLabel(k)}</i><b class="tier-bg-${statTier(res.final[k])}">${res.final[k]}</b>${d ? `<em class="${d > 0 ? "is-up" : "is-down"}">${d > 0 ? "+" : ""}${d}</em>` : ""}</span>`;
        }).join("")}</div>
      </section>`;
    };
    const skills = skillsOf(id);
    $("#bdBody").innerHTML = `
      <div class="bd-head">
        ${cardImg(p, "bd-img")}
        <div>
          <h2 id="bdTitle">${esc(p.name)}</h2>
          <p>${area === "xi" ? `${pos} in “${esc(l.name)}”` : "On the bench"} · ${esc(styleText(p))} · card ${p.overall} · Lv cap ${p.levelCap}</p>
          <p class="rec-muted">Rated with ${mgrPhoto(managerObj(l.manager), "mgr-photo mgr-photo--inline")}${esc(managerObj(l.manager)?.name || "no manager")} at ${esc(l.tactic)}.</p>
        </div>
      </div>
      <div class="bd-cols">
        ${col("Recommended by AI", ai, aiRes, false)}
        ${col("★ Your build", mine, mine ? compute(p, mine, l.manager, l.tactic) : null, true)}
      </div>
      <section class="bd-skills">
        <h4>Additional skills</h4>
        <p>${skills.length ? skills.map((n) => `<span class="${skillSrc(id, n) === "mine" ? "is-mine" : ""}">${skillSrc(id, n) === "mine" ? "★ " : `<i class="ai-mark">AI</i> `}${esc(n)}</span>`).join("") : `<span class="rec-muted">None set.</span>`}</p>
        <p class="rec-muted">AI picks: ${r.aiSkills.map(esc).join(", ")}</p>
      </section>
      <div class="bd-actions">
        <button type="button" class="btn btn--icon" data-bd="replace">Replace player</button>
        ${mine ? `<button type="button" class="btn btn--icon" data-bd="mine">Open my build in Trainer</button>` : ""}
        <button type="button" class="btn btn--icon" data-bd="ai">Open AI build in Trainer</button>
        <button type="button" class="btn btn--icon btn--solid" data-bd="use">${mine ? "Replace my build with AI" : "Use AI build as mine"}</button>
      </div>`;
    const dlg = $("#buildDialog");
    if (!dlg.open) dlg.showModal();
  }
  // A click outside the dialog box (on the backdrop) closes any dialog — the backdrop's
  // clicks land on the <dialog> element itself, outside its content rectangle.
  document.querySelectorAll("dialog").forEach((dlg) => dlg.addEventListener("click", (e) => {
    if (e.target !== dlg) return;
    const r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
  }));
  $("#bdBody").addEventListener("click", (e) => {
    const act = e.target.closest("[data-bd]")?.dataset.bd;
    if (!act) return;
    const dlg = $("#buildDialog");
    if (act === "replace") {
      dlg.close();
      lu.sel = { area: bd.area, i: bd.i };
      renderLineup();
      $("#luPicker").scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else if (act === "mine") {
      dlg.close();
      openInTrainer(bd.id, store.builds[bd.id]);
    } else if (act === "ai") {
      dlg.close();
      openInTrainer(bd.id, recBuild(bd.id));
    } else if (act === "use") {
      useRecommendation(bd.id);
      openBuildDialog(bd.id, bd.area, bd.i);
    }
  });
  $("#luPicker").addEventListener("click", (e) => {
    const l = activeLineup();
    const pick = e.target.closest("[data-pick]");
    const act = e.target.closest("[data-lu]");
    if (pick) { placePlayer(l, pick.dataset.pick); saveLineup(); renderLineup(); }
    const role = e.target.closest("[data-role]");
    if (role && lu.sel?.area === "xi") { shownLayout(l)[lu.sel.i][0] = role.dataset.role; saveLineup(); renderLineup(); return; }
    if (act?.dataset.lu === "cancel") { lu.sel = null; renderLineup(); }
    if (act?.dataset.lu === "others") { lu.showOthers = !lu.showOthers; renderPicker(l, shownLayout(l)); }
    if (act?.dataset.lu === "clear") {
      if (lu.sel.area === "xi") l.xi[lu.sel.i] = null; else l.bench.splice(lu.sel.i, 1);
      lu.sel = null; saveLineup(); renderLineup();
    }
  });
  $("#luPicker").addEventListener("input", (e) => {
    if (e.target.id !== "luSearch") return;
    lu.q = e.target.value;
    const pos = e.target.selectionStart;
    renderPicker(activeLineup(), shownLayout(activeLineup()));
    const s = $("#luSearch"); s.focus(); s.setSelectionRange(pos, pos);
  });
  $("#luSelect").addEventListener("change", (e) => { store.activeLineup = e.target.value; lu.sel = null; saveLineup(); renderLineup(); });
  $("#luName").addEventListener("change", (e) => { activeLineup().name = e.target.value.trim() || "Untitled"; saveLineup(); renderLineup(); });
  $("#luFormation").addEventListener("change", (e) => {
    const l = activeLineup();
    l.formation = e.target.value;
    l.layout = null;
    l.defLayout = null; // the defence shape is laid onto the attacking one
    l.subLayout = null; // and so is the sub-tactic shape
    lu.sel = null; saveLineup(); renderLineup();
  });
  $("#luResetLayout").addEventListener("click", () => {
    const l = activeLineup();
    if (inSub(l)) l.subLayout = null; else if (inDefence(l)) l.defLayout = null; else l.layout = null;
    saveLineup(); renderLineup();
  });
  $("#luFluidSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-fluid]");
    if (!b) return;
    const l = activeLineup();
    l.fluid = b.dataset.fluid === "on";
    if (l.fluid && !l.defFormation) l.defFormation = DEFAULT_DEF_FORMATION;
    lu.phase = l.fluid ? "def" : "att"; // show the new shape straight away
    lu.sel = null; saveLineup(); renderLineup();
  });
  $("#luDefFormation").addEventListener("change", (e) => {
    const l = activeLineup();
    l.defFormation = e.target.value;
    l.defLayout = null;
    lu.phase = "def"; lu.sel = null; saveLineup(); renderLineup();
  });
  $("#luPhase").addEventListener("click", (e) => {
    const b = e.target.closest("[data-phase]");
    if (!b) return;
    lu.phase = b.dataset.phase;
    lu.sel = null; renderLineup();
  });
  $("#luPlan").addEventListener("click", (e) => {
    const b = e.target.closest("[data-plan]");
    if (!b) return;
    lu.plan = b.dataset.plan;
    lu.sel = null; renderLineup();
  });
  $("#luModes").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]");
    if (!b) return;
    lu.mode = b.dataset.mode;
    renderLineup();
  });
  $("#luManager").addEventListener("change", (e) => { activeLineup().manager = e.target.value; saveLineup(); renderLineup(); });
  $("#luTactic").addEventListener("change", (e) => { activeLineup().tactic = e.target.value; saveLineup(); renderLineup(); });
  $("#luBenchSort").addEventListener("click", () => {
    const l = activeLineup();
    l.benchByPos = l.benchByPos === false; // off → on, on → off (drag order)
    saveLineup(); renderLineup();
  });
  $("#luNotes").addEventListener("change", (e) => { activeLineup().notes = e.target.value; saveLineup(); });
  $("#luNew").addEventListener("click", () => {
    const l = newLineup(`Lineup ${store.lineups.length + 1}`);
    store.lineups.push(l); store.activeLineup = l.id; lu.sel = null; saveLineup(); renderLineup();
  });
  // Best bench: cover for every position the XI uses (a keeper first), then the
  // strongest cards left — one card per player, never a starter.
  function bestBench(l) {
    const slots = layoutOf(l);
    const names = new Set(l.xi.filter((id) => byId[id]).map((id) => norm(byId[id].name)));
    const pool = players.filter((p) => !l.xi.includes(p.id) && !names.has(norm(p.name)));
    const taken = new Set();
    const out = [];
    const take = (p) => { if (p && !taken.has(p.id) && out.length < BENCH_MAX) { taken.add(p.id); out.push(p.id); names.add(norm(p.name)); } };
    const best = (pos) => pool.filter((p) => !taken.has(p.id) && !names.has(norm(p.name)) && proficiency(p, pos) !== "none")
      .sort((a, b) => slotRating(b, pos, l) - slotRating(a, pos, l) || (proficiency(a, pos) === "high" ? -1 : 1))[0];
    take(best("GK"));
    const positions = [...new Set(slots.slice(1).map(([pos]) => pos))];
    positions.forEach((pos) => take(best(pos)));
    pool.filter((p) => !taken.has(p.id) && !names.has(norm(p.name)) && p.position !== "GK")
      .sort((a, b) => buildRating(b, l) - buildRating(a, l)).forEach(take);
    return out;
  }
  $("#luBestBench").addEventListener("click", () => {
    const l = activeLineup();
    if (!l.xi.some(Boolean)) { flash($("#luBestBench"), "Fill the XI first"); return; }
    if (l.bench.length && !confirm(`Replace the bench of "${l.name}" with the best cover for this XI?`)) return;
    l.bench = bestBench(l);
    lu.sel = null; saveLineup(); renderLineup();
    flash($("#luBestBench"), `${l.bench.length} on the bench`);
  });
  $("#luBest").addEventListener("click", () => {
    const l = activeLineup();
    const r = bestXI(l);
    if (!r) { flash($("#luBest"), "No full XI"); return; }
    if (l.xi.some(Boolean) && !confirm(`Replace the starting XI of "${l.name}" with the strongest XI for ${l.fluid ? `${l.formation} (attack)` : l.formation}, ${managerObj(l.manager)?.name || "no manager"} and ${l.tactic}? Displaced starters go to the bench.`)) return;
    l.xi = r.xi; l.bench = r.bench; lu.sel = null; saveLineup(); renderLineup();
    flash($("#luBest"), `avg ${r.avg.toFixed(1)}`);
  });
  $("#luDuplicate").addEventListener("click", () => {
    const l = { ...structuredClone(activeLineup()), id: uid() };
    l.name = `${l.name} (copy)`;
    store.lineups.push(l); store.activeLineup = l.id; saveLineup(); renderLineup();
  });
  $("#luDelete").addEventListener("click", () => {
    const l = activeLineup();
    if (!confirm(`Delete lineup "${l.name}"?`)) return;
    store.lineups = store.lineups.filter((x) => x.id !== l.id);
    store.activeLineup = null; lu.sel = null; saveLineup(); renderLineup();
  });
  $("#luAddSub").addEventListener("click", () => {
    activeLineup().subs.push({ minute: 60, out: "", in: "", note: "" }); saveLineup(); renderLineup();
  });
  $("#luSubs").addEventListener("change", (e) => {
    const row = e.target.closest("[data-sub]");
    if (!row || !e.target.dataset.sf) return;
    const s = activeLineup().subs[Number(row.dataset.sub)];
    const k = e.target.dataset.sf;
    s[k] = k === "minute" ? Number(e.target.value) || null : e.target.value;
    if (k === "minute") activeLineup().subs.sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));
    saveLineup(); renderLineup();
  });
  $("#luSubs").addEventListener("click", (e) => {
    const d = e.target.closest("[data-sub-del]");
    if (!d) return;
    activeLineup().subs.splice(Number(d.dataset.subDel), 1); saveLineup(); renderLineup();
  });
  $("#luCopy").addEventListener("click", async () => {
    const l = activeLineup();
    const slots = layoutOf(l);
    const def = l.fluid ? defLayoutOf(l) : null;
    const text = [
      `${l.name} — ${l.fluid ? `Fluid: attack ${l.formation} / defence ${l.defFormation || DEFAULT_DEF_FORMATION}` : l.formation} · ${l.tactic}${l.manager ? ` · ${l.manager}` : ""}`,
      ...l.xi.map((id, i) => `${(def ? `${slots[i][0]}/${def[i][0]}` : slots[i][0]).padEnd(def ? 9 : 4)} ${byId[id] ? `${byId[id].name} (${buildRating(byId[id], l)})` : "—"}`),
      `Bench: ${l.bench.map((id) => byId[id]?.name).filter(Boolean).join(", ") || "—"}`,
      ...INSTR.filter(([k]) => l.instructions?.[k] && byId[l.instructions[k]]).map(([k, label]) => `${label}: ${byId[l.instructions[k]].name}`),
      ...(l.subTactic?.tactic ? [`Sub-tactic: ${l.subTactic.tactic} ${subFormationOf(l)} — ${l.xi.map((id, i) => (byId[id] ? `${subLayoutOf(l)[i][0]} ${shortName(byId[id])}` : null)).filter(Boolean).join(", ")}${l.subTactic.when ? `\n  when: ${l.subTactic.when}` : ""}${l.subTactic.subs ? `\n  subs: ${l.subTactic.subs}` : ""}`] : []),
      ...l.subs.map((s) => `${s.minute ?? "?"}' ${byId[s.out]?.name || "?"} → ${byId[s.in]?.name || "?"}${s.note ? ` (${s.note})` : ""}`),
    ].join("\n");
    try { await navigator.clipboard.writeText(text); flash($("#luCopy"), "Copied"); }
    catch { window.prompt("Copy lineup:", text); }
  });

  /* ---- Drag & drop (pointer events: mouse + touch) ---- */

  let drag = null;
  const DRAG_THRESHOLD = 6;

  function dragSource(el, l) {
    if (el.dataset.slot != null) {
      const i = Number(el.dataset.slot);
      if (lu.mode === "positions") return i === 0 ? null : { area: "xi", i };
      return l.xi[i] ? { area: "xi", i } : null;
    }
    if (lu.mode === "positions") return null;
    const i = Number(el.dataset.bench);
    return l.bench[i] ? { area: "bench", i } : null;
  }

  function onDragStart(e) {
    if (e.button > 0) return;
    const el = e.target.closest("[data-slot], [data-bench]");
    if (!el) return;
    const src = dragSource(el, activeLineup());
    if (!src) return;
    drag = { src, el, id: e.pointerId, x0: e.clientX, y0: e.clientY, active: false, ghost: null, over: null };
  }

  function pitchPoint(e) {
    const r = $("#luPitch").getBoundingClientRect();
    const x = Math.min(96, Math.max(4, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(93, Math.max(12, ((r.bottom - e.clientY) / r.height) * 100));
    return [Math.round(x), Math.round(y)];
  }

  function dropTargetAt(e) {
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    return hit?.closest("#luPitch [data-slot], #luBench [data-bench]") || hit?.closest("#luBench") || null;
  }

  function onDragMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.active) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < DRAG_THRESHOLD) return;
      drag.active = true;
      drag.el.classList.add("is-dragging");
      if (lu.mode === "players") {
        drag.ghost = drag.el.cloneNode(true);
        drag.ghost.className += " drag-ghost";
        drag.ghost.style.cssText = "";
        document.body.appendChild(drag.ghost);
      }
    }
    e.preventDefault();
    if (lu.mode === "positions") {
      const [x, y] = pitchPoint(e);
      drag.el.style.left = `${x}%`;
      drag.el.style.bottom = `${y}%`;
      $(".slot__pos", drag.el).textContent = roleAt(x, y);
      return;
    }
    drag.ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    const over = dropTargetAt(e);
    if (over !== drag.over) {
      drag.over?.classList.remove("is-drop");
      drag.over = over && over !== drag.el ? over : null;
      drag.over?.classList.add("is-drop");
    }
  }

  function applyDrop(l, src, target) {
    const get = (a) => (a.area === "xi" ? l.xi[a.i] : l.bench[a.i]) ?? null;
    const set = (a, v) => { if (a.area === "xi") l.xi[a.i] = v; else l.bench[a.i] = v; };
    let dst = null;
    if (target.dataset?.slot != null) dst = { area: "xi", i: Number(target.dataset.slot) };
    else if (target.dataset?.bench != null) dst = { area: "bench", i: Number(target.dataset.bench) };
    else dst = { area: "bench", i: l.bench.length }; // dropped on the bench area → append
    if (dst.area === src.area && dst.i === src.i) return;
    if ((inDefence(l) || inSub(l)) && src.area === "xi" && dst.area === "xi" && src.i && dst.i) {
      // Two starters swap where they defend (or stand in the sub-tactic); their attacking spots stay.
      const d = inSub(l) ? subLayoutOf(l) : defLayoutOf(l);
      [d[src.i], d[dst.i]] = [d[dst.i], d[src.i]];
      return;
    }
    if (dst.area === "bench" && src.area === "bench") {
      // reorder within the bench
      const [moved] = l.bench.splice(src.i, 1);
      l.bench.splice(Math.min(dst.i, l.bench.length), 0, moved);
      return;
    }
    if (dst.area === "bench" && dst.i >= l.bench.length && l.bench.length >= BENCH_MAX) return;
    const a = get(src);
    const b = get(dst);
    set(dst, a);
    set(src, b);
    l.bench = l.bench.filter(Boolean);
  }

  function onDragEnd(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!d.active) return;
    lu.justDragged = true;
    setTimeout(() => { lu.justDragged = false; }, 0);
    d.ghost?.remove();
    d.over?.classList.remove("is-drop");
    const l = activeLineup();
    if (e.type !== "pointercancel") {
      if (lu.mode === "positions") {
        const [x, y] = pitchPoint(e);
        shownLayout(l)[d.src.i] = [roleAt(x, y), x, y];
      } else {
        const target = dropTargetAt(e);
        if (target) applyDrop(l, d.src, target);
      }
      lu.sel = null;
      saveLineup();
    }
    renderLineup();
  }

  $("#luPitch").addEventListener("pointerdown", onDragStart);
  $("#luBench").addEventListener("pointerdown", onDragStart);
  document.addEventListener("pointermove", onDragMove, { passive: false });
  document.addEventListener("pointerup", onDragEnd);
  document.addEventListener("pointercancel", onDragEnd);

  /* ---------------------------------------------------------
     Recommended builds (Claude, from KNOWLEDGE-BASE) & My Builds
  --------------------------------------------------------- */

  // Recommendations are rated in the profile's own context: USER-SQUAD §3 for me,
  // the chosen manager/playstyle for a friend — unless a manager / playstyle is picked in
  // the My Squad or My Builds toolbar (kept in this browser): a manager's +1/+1 and his
  // playstyle proficiency move the points, so every card gets the best build for *that*
  // manager (§11 "Booster = progression points", §17).
  const REC_CTX_KEY = "efblab.recCtx";
  const recState = (() => { try { return JSON.parse(localStorage.getItem(REC_CTX_KEY) || "{}"); } catch { return {}; } })();
  const baseRecContext = () => (ownsRepo() ? { manager: KB.CURRENT_MANAGER, tactic: "Long Ball Counter" } : { manager: store.manager, tactic: store.tactic });
  const recContext = () => {
    const base = baseRecContext();
    const manager = recState.manager && profileManagers().some((m) => m.key === recState.manager) ? recState.manager : base.manager;
    const tactic = KB.TACTICS.includes(recState.tactic) ? recState.tactic : base.tactic;
    return { manager, tactic };
  };
  const recContextLabel = () => { const c = recContext(); return `${managerObj(c.manager)?.name || "no manager"} at ${c.tactic}`; };
  const recContextHtml = () => { const c = recContext(); const m = managerObj(c.manager); return `${mgrPhoto(m, "mgr-photo mgr-photo--inline")}${esc(m?.name || "no manager")} at ${esc(c.tactic)}`; };
  let REC = null; // filled at init (needs the multiplier table above)
  const recDeps = () => ({
    players, KB, OVR, norm, skillLabel, categoriesFor, levelCost, cumCost, budgetFor, profAt,
    skillMultiplier, managerProficiency, managerObj, notesFor, myPicks, context: recContext(), MAX_LEVEL, boosterPool: DATA.boosterPool,
    onBench: (id) => lineupRole(id)?.label === "Bench",
  });
  const makeRecommender = () => window.Recommender(recDeps());

  // The manager / playstyle pickers on My Squad and My Builds (one choice, two places).
  function syncRecControls() {
    const ctx = recContext();
    const mOpts = profileManagers().map((m) => `<option value="${esc(m.key)}">${esc(m.name)} — ${m.boost.map(statLabel).join(" +1, ")} +1</option>`).join("");
    const tOpts = KB.TACTICS.map((t) => { const prof = managerProficiency(ctx.manager, t); return `<option value="${esc(t)}">${esc(t)}${prof != null ? ` · ${prof}` : ""}</option>`; }).join("");
    ["squad", "mine"].forEach((prefix) => {
      const m = $(`#${prefix}Manager`), t = $(`#${prefix}Tactic`);
      if (!m || !t) return;
      m.innerHTML = mOpts; m.value = managerKey(ctx.manager);
      t.innerHTML = tOpts; t.value = ctx.tactic;
    });
  }
  function setRecContext(patch) {
    Object.assign(recState, patch);
    try { localStorage.setItem(REC_CTX_KEY, JSON.stringify(recState)); } catch { /* private mode */ }
    REC = makeRecommender();
    // Open sheets were built for the old context — drop them so they're rebuilt on render.
    document.querySelectorAll("#squadGrid .rec-card__body").forEach((el) => el.remove());
    syncRecControls();
    renderSquad(); renderMyBuilds();
  }
  ["squad", "mine"].forEach((prefix) => {
    $(`#${prefix}Manager`)?.addEventListener("change", (e) => setRecContext({ manager: e.target.value }));
    $(`#${prefix}Tactic`)?.addEventListener("change", (e) => setRecContext({ tactic: e.target.value }));
  });
  // "Build by manager" in a card's sheet: the card through recommend.js once per owned
  // manager (same playstyle), computed on first open.
  $("#squadGrid").addEventListener("toggle", (e) => {
    const d = e.target.closest?.("[data-rec-managers]");
    if (!d || !d.open || d.dataset.done) return;
    d.dataset.done = "1";
    const p = byId[d.dataset.recManagers];
    const box = d.querySelector(".rec-bymgr__body");
    if (!p || !box) return;
    setTimeout(() => {
      const ctx = recContext();
      const line = (lv) => categoriesFor(p).map((c) => lv[c.key] || 0).join("-");
      const rows = profileManagers().map((m) => {
        const r = window.Recommender({ ...recDeps(), players: [p], context: { manager: m.key, tactic: ctx.tactic } }).recs[p.id];
        const prof = managerProficiency(m.key, ctx.tactic);
        const cur = m.key === managerKey(ctx.manager);
        return `<tr class="${cur ? "is-current" : ""}"><td>${mgrPhoto(m, "mgr-photo mgr-photo--inline")}<b>${esc(m.name)}</b><small>${m.boost.map((k) => `${statLabel(k)} +1`).join(", ")}${prof != null ? ` · ${esc(ctx.tactic)} ${prof}` : ""}</small></td><td><code>${line(r.levels)}</code></td><td>${esc(r.booster.name)}</td><td class="num">${r.rating}</td></tr>`;
      });
      box.innerHTML = `<div class="table-wrap"><table class="kb-table rec-bymgr__table"><thead><tr><th>Manager</th><th>Build</th><th>Slot 2</th><th class="num">OVR</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>
        <p class="rec-muted">Same playstyle (${esc(ctx.tactic)}); the manager's +1/+1 and his proficiency move the points (§11, §17). Pick a manager in the toolbar to make every build for him.</p>`;
    }, 0);
  }, true);
  // One card's recommendation again (its ★ skills changed) without redoing the whole squad;
  // the squad-relative rank is kept.
  function refreshRec(id) {
    const p = byId[id];
    if (!p || !REC) return;
    const one = window.Recommender({ ...recDeps(), players: [p] }).recs[id];
    if (REC.recs[id]?.depth) one.depth = REC.recs[id].depth;
    REC.recs[id] = one;
  }
  const mineState = { q: "", group: "ALL", style: "", onlyMine: false };

  function lineupRole(id) {
    const l = store.lineups.find((x) => x.id === store.activeLineup) || store.lineups[0];
    if (!l) return null;
    const i = l.xi.indexOf(id);
    if (i >= 0) return { label: "Starter", lineup: l.name, pos: layoutOf(l)[i][0] };
    if (l.bench.includes(id)) return { label: "Bench", lineup: l.name };
    return null;
  }
  function recBuild(id) {
    const p = byId[id];
    const r = REC.recs[id];
    const b = emptyBuild(p);
    Object.assign(b.levels, r.levels);
    b.booster2 = r.booster2;
    b.skills = [...r.skills];
    return b;
  }
  function openInTrainer(id, build) {
    const p = byId[id];
    view.playerId = id;
    view.draft = structuredClone(build);
    categoriesFor(p).forEach((c) => { view.draft.levels[c.key] ??= 0; });
    view.position = p.position;
    go("train", id);
  }
  const ctxRating = (p, build, pos = REC?.recs[p.id]?.buildAs || p.position) => compute(p, build, recContext().manager, recContext().tactic).ratings[pos];
  const sameBuild = (a, b) => JSON.stringify(Object.entries(a.levels).filter(([, v]) => v).sort())
    === JSON.stringify(Object.entries(b.levels).filter(([, v]) => v).sort());

  function verdictText(p, r) {
    const out = [];
    if (budgetFor(p.levelCap) === 0) {
      out.push("Fixed card — eFHUB lists no progression points, so only the booster and skills can change.");
    } else if (r.lock) {
      out.push("<b>Lock it.</b> Every high-priority target for the role is met.");
    } else {
      const bits = [];
      if (r.missed.length) bits.push(`still short on ${r.missed.map((t) => `${statLabel(t.stat)} (${t.value}/${t.target})`).join(", ")}`);
      const waste = Object.entries(r.waste || {});
      if (waste.length) bits.push(`${waste.map(([k, n]) => `${n} pt${n > 1 ? "s" : ""} of ${statLabel(k)}`).join(", ")} past the useful range (§14 step 4) — the category also feeds stats the role needs, so it's a trade-off`);
      const text = bits.join("; ");
      out.push(`<b>Test a variant.</b> ${text.charAt(0).toUpperCase()}${text.slice(1)}.`);
    }
    const role = lineupRole(p.id);
    out.push(role
      ? `<b>${role.label}</b> in your lineup “${esc(role.lineup)}”${role.pos ? ` at ${role.pos}` : ""}. By this build he is #${r.depth.rank} of ${r.depth.of} ${p.position} cards.`
      : `Not in your active lineup — #${r.depth.rank} of ${r.depth.of} ${p.position} cards by this build, so ${r.depth.starter ? "a <b>starter candidate</b>" : "<b>rotation / situational</b>"} unless the plan needs his profile.`);
    const here = r.rating;
    const alt = r.altPosition;
    out.push(alt && alt.r > here
      ? `Preferred position: <b>${p.position}</b> for the style (${esc(p.playingStyle || p.playingStyleDefensive || "")}); ${alt.pos} rates higher (${alt.r}) but check style compatibility before moving him.`
      : `Preferred position: <b>${p.position}</b>${alt ? ` (best alternative ${alt.pos} ${alt.r})` : ""}.`);
    const snap = notesFor(p.id)?.snapshot;
    if (snap) {
      const line = categoriesFor(p).map((c) => r.levels[c.key] || 0).join("-");
      const mine = snap.levels.join("-");
      out.push(line === mine ? `Matches your ${esc(snap.date)} snapshot.` : `Your ${esc(snap.date)} snapshot was <code>${mine}</code> — compare both in the Trainer.`);
    }
    return out.map((x) => `<p>${x}</p>`).join("");
  }

  // The Recommended by AI sheet for one of the squad's cards — the §15 sections with the
  // spending order and the verdict, plus Open in Trainer / Use as my build. It is the open
  // half of a My Squad tile.
  function recSheetHtml(p, r) {
    const cats = categoriesFor(p);
    const pts = cats.reduce((t, c) => t + cumCost(r.levels[c.key] || 0), 0);
    const att = KB.ATT_STYLES.find((s) => norm(s.name) === norm(p.playingStyle));
    const def = KB.DEF_STYLES.find((s) => norm(s.name) === norm(p.playingStyleDefensive || p.playingStyle));
    const b = r.booster;
    const slot1 = Object.keys(p.booster1?.stats || {});
    const mine = store.builds[p.id];
    return `
          <div class="rec-card__body">

          <section class="rec-sec">
            <h4>Role</h4>
            <p><b>${r.buildAs || p.position} — Attacking: ${esc(att?.name || p.playingStyle || "Basic")} · Defensive: ${esc(p.playingStyleDefensive ? (def?.name || p.playingStyleDefensive) : "—")}</b></p>
            <p class="rec-muted">${esc(r.roleLabel)} priorities (§7).${r.buildAs ? ` Built for ${esc(r.buildAs)}, where he plays (USER-SQUAD) — the card is ${esc(p.position)} and its style is inactive there (§18).` : ""}</p>
            <div class="rec-style">${styleGuideHtml(p, r.buildAs || p.position)}</div>
            ${r.notes.map((n) => `<p class="rec-note">${esc(n)}</p>`).join("")}
          </section>

          <section class="rec-sec">
            <h4>Build <span class="rec-muted">${pts}/${budgetFor(p.levelCap)} pts</span></h4>
            <div class="rec-levels">${cats.map((c) => `<span class="${r.levels[c.key] ? "" : "is-zero"}"><b>${r.levels[c.key] || 0}</b><i>${c.label.replace("Lower Body Strength", "Lower Body").replace("Aerial Strength", "Aerial")}</i></span>`).join("")}</div>
          </section>

          ${r.path.length ? `<section class="rec-sec">
            <h4>Spending order <span class="rec-muted">while he levels up · 2 pts per level</span></h4>
            ${pathRows(p, r)}
          </section>` : ""}

          <section class="rec-sec">
            <h4>Booster</h4>
            <p><b>${esc(b.name)}</b> — ${Object.keys(b.stats).map(statLabel).join(", ")}${r.boosterFixed ? " <span class=\"rec-muted\">(fixed on this card)</span>" : ""}</p>
            <p class="rec-muted">${r.boosterFixed ? "Slot 2 is pre-assigned on this card." : r.boosterUserPick ? "Your pick (USER-SQUAD) — the build is optimised around it (§11)." : `Picked last, on the finished build (§11)${slot1.length ? ` — slot 1 (${esc(p.booster1.name)}) already covers ${slot1.map(statLabel).join(", ")}` : ""}${r.boosterOverlap ? `; overlaps ${r.boosterOverlap} of them` : ""}.`}</p>
            ${r.boosterFixed ? "" : `<p class="rec-muted">${esc(boosterTradeText(r))}</p>`}
          </section>

          <details class="rec-sec rec-bymgr" data-rec-managers="${p.id}">
            <summary>Build by manager <span class="rec-muted">this one: ${esc(managerObj(recContext().manager)?.name || "no manager")} at ${esc(recContext().tactic)} · ${profileManagers().length} managers</span></summary>
            <div class="rec-bymgr__body"><p class="rec-muted">Computing…</p></div>
          </details>

          <section class="rec-sec">
            <h4>Target stats</h4>
            <div class="rec-targets">${r.targets.map((t) => `<span class="rec-t ${t.hit ? "is-hit" : "is-miss"}" title="Target ${t.target}"><i>${statLabel(t.stat)}</i><b class="tier-bg-${statTier(t.value)}">${t.value}</b>${t.hit ? "" : `<em>→${t.target}</em>`}</span>`).join("")}</div>
          </section>

          <section class="rec-sec">
            <h4>Additional skills <span class="rec-muted">${r.skills.length}/5</span></h4>
            <ul class="rec-skills">${r.skills.map((n) => `<li><b>${esc(n)}</b> <span>${esc(r.skillWhy[n] || "")}</span></li>`).join("")}
            ${r.skills.length < 5 ? `<li class="rec-muted">Only ${r.skills.length} worthwhile additions — the card already has the rest natively.</li>` : ""}</ul>
          </section>

          <section class="rec-sec rec-verdict">
            <h4>Final verdict</h4>
            ${verdictText(p, r)}
          </section>

          <div class="rec-card__actions">
            <button type="button" class="btn btn--icon" data-rec-open="${p.id}">Open in Trainer</button>
            <button type="button" class="btn btn--icon btn--solid" data-rec-use="${p.id}">${mine ? "Replace my build" : "Use as my build"}</button>
          </div>
          </div>
`;
  }

  // The build at every 5th player level along the recommended spending order (§12).
  function pathRows(p, r) {
    const cats = categoriesFor(p);
    const lv = Object.fromEntries(cats.map((c) => [c.key, 0]));
    const rows = [];
    let spent = 0;
    let s = 0;
    const marks = [];
    for (let L = 6; L < p.levelCap; L += 5) marks.push(L);
    marks.push(p.levelCap);
    marks.forEach((L) => {
      const pts = budgetFor(L);
      const before = { ...lv };
      while (s < r.path.length && spent + r.path[s].cost <= pts) { lv[r.path[s].key] = r.path[s].level; spent += r.path[s].cost; s++; }
      const added = cats.filter((c) => lv[c.key] > before[c.key])
        .map((c) => `${c.label.replace(" Strength", "")} ${before[c.key]}→${lv[c.key]}`);
      rows.push(`<li><b>Lv ${L}</b><span class="rec-muted">${pts} pts</span><code>${cats.map((c) => lv[c.key]).join("-")}</code><em>${added.join(", ") || "—"}</em></li>`);
    });
    return `<ol class="rec-path">${rows.join("")}</ol>`;
  }

  function useRecommendation(id) {
    const p = byId[id];
    if (store.builds[id] && !confirm(`Replace your saved build for ${p.name} with the recommended one?`)) return;
    store.builds[id] = { ...recBuild(id), savedAt: Date.now() };
    saveStore();
    renderPlayerSelect();
    renderMyBuilds(); renderSquad(); renderLineup();
  }

  // Every saved build that differs from today's AI build → the AI build (the doctrine moved,
  // e.g. the Speed 96 rule); the player's ★ skills are untouched. Asks once.
  function useRecommendationForAll() {
    const stale = players.filter((p) => store.builds[p.id] && REC.recs[p.id] && !sameBuild(store.builds[p.id], recBuild(p.id)));
    if (!stale.length) { flash($("#mineUseAll"), "All up to date"); return; }
    if (!confirm(`Replace ${stale.length} saved build${stale.length > 1 ? "s" : ""} (${stale.map((p) => p.name).slice(0, 6).join(", ")}${stale.length > 6 ? "…" : ""}) with today's Recommended by AI builds? Your ★ skills stay.`)) return;
    stale.forEach((p) => { store.builds[p.id] = { ...recBuild(p.id), skills: store.builds[p.id].skills, savedAt: Date.now() }; });
    saveStore();
    renderPlayerSelect();
    renderMyBuilds(); renderSquad(); renderLineup();
    flash($("#mineUseAll"), `${stale.length} updated`);
  }
  $("#mineUseAll").addEventListener("click", useRecommendationForAll);

  function renderMyBuilds() {
    if (!REC) return;
    const q = mineState.q.trim().toLowerCase();
    const list = players
      .filter((p) => mineState.group === "ALL" || POSITION_GROUP[p.position] === mineState.group)
      .filter((p) => styleMatch(p, mineState.style))
      .filter((p) => !mineState.onlyMine || store.builds[p.id])
      .filter((p) => !q || `${p.name} ${p.team} ${p.position} ${styleText(p)}`.toLowerCase().includes(q))
      .sort((a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position) || b.overall - a.overall);
    const total = Object.keys(store.builds).filter((id) => byId[id]).length;
    $("#mineMeta").innerHTML = `${total} of ${players.length} players have your build · ratings use ${recContextHtml()} for both columns`;
    if (!players.length && gated()) { $("#mineRows").innerHTML = `<tr><td colspan="7">${gateHtml("save and compare your builds")}</td></tr>`; return; }
    $("#mineRows").innerHTML = list.map((p) => {
      const r = REC.recs[p.id];
      const rb = recBuild(p.id);
      const mine = store.builds[p.id];
      const line = (b) => categoriesFor(p).map((c) => b.levels[c.key] || 0).join("-");
      const rOvr = ctxRating(p, rb);
      let status = `<span class="badge">Not started</span>`;
      let mOvr = "—";
      let delta = "";
      let diffs = "";
      if (mine) {
        mOvr = ctxRating(p, mine);
        const d = mOvr - rOvr;
        delta = `<span class="delta ${d > 0 ? "is-up" : d < 0 ? "is-down" : ""}">${d > 0 ? "+" : ""}${d}</span>`;
        const changes = [];
        if (!sameBuild(mine, rb)) changes.push("levels");
        const b2 = booster2Of(p, mine);
        if (!p.booster2Fixed && (b2?.id ?? null) !== (r.booster2 ?? null)) changes.push("booster");
        if ([...skillsOf(p.id)].sort().join() !== [...rb.skills].sort().join()) changes.push("skills");
        status = changes.length ? `<span class="badge badge--amber">Tweaked: ${changes.join(", ")}</span>` : `<span class="badge badge--green">Same as recommended</span>`;
        const b2name = b2?.name || "—";
        diffs = `<small>${esc(b2name)} · ${skillsOf(p.id).length} skills</small>`;
      }
      return `
        <tr>
          <td><div class="mine-who">${cardImg(p, "mine-img")}<div><button type="button" class="linkish linkish--strong" data-open-player="${p.id}">${esc(p.name)}</button><small>${p.position} · ${esc(p.team || "")}</small></div></div></td>
          <td><code>${line(rb)}</code><small>${esc(r.booster.name)}</small></td>
          <td class="num">${rOvr}</td>
          <td>${mine ? `<code>${line(mine)}</code>${diffs}` : "<em>—</em>"}</td>
          <td class="num">${mOvr} ${delta}</td>
          <td>${status}${pro.isCreator && pro.builds[p.id] ? ` <span class="badge badge--violet" title="Also published as a public ${esc(pro.name)} build">Public</span>` : ""}</td>
          <td class="actions">
            <button type="button" class="btn btn--icon btn--solid" data-mine-edit="${p.id}">${mine ? "Tweak" : "Start from recommended"}</button>
            ${mine ? `<button type="button" class="btn btn--icon" data-rec-use="${p.id}">Reset to recommended</button>` : ""}
          </td>
        </tr>`;
    }).join("") || `<tr><td colspan="7"><p class="empty-state">No players match.</p></td></tr>`;
  }

  function bindFilter(prefix, state, render) {
    $(`#${prefix}Search`).addEventListener("input", (e) => { state.q = e.target.value; render(); });
    $(`#${prefix}Groups`).addEventListener("click", (e) => {
      const b = e.target.closest("[data-group]");
      if (!b) return;
      state.group = b.dataset.group;
      $(`#${prefix}Groups`).querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-selected", c === b));
      render();
    });
    bindStyleFilter(prefix, state, render);
  }
  // My Squad tiles open into the AI build sheet; remember which are open across re-renders.
  $("#squadGrid").addEventListener("toggle", (e) => {
    const d = e.target.closest?.("[data-rec]");
    if (!d) return;
    const id = d.dataset.rec;
    if (d.open) {
      squadState.open.add(id);
      // The sheet is built on first open, not for all 55 tiles up front.
      if (!d.querySelector(":scope > .rec-card__body") && byId[id] && REC?.recs[id]) d.insertAdjacentHTML("beforeend", recSheetHtml(byId[id], REC.recs[id]));
    } else squadState.open.delete(id);
  }, true);
  $("#squadExpand").addEventListener("click", () => {
    document.querySelectorAll("#squadGrid [data-rec]").forEach((d) => { d.open = true; squadState.open.add(d.dataset.rec); });
  });
  $("#squadCollapse").addEventListener("click", () => {
    document.querySelectorAll("#squadGrid [data-rec]").forEach((d) => { d.open = false; });
    squadState.open.clear();
  });
  bindFilter("mine", mineState, renderMyBuilds);
  $("#mineOnly").addEventListener("change", (e) => { mineState.onlyMine = e.target.checked; renderMyBuilds(); });

  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-rec-open]");
    if (open) {
      // The Trainer rates with the same manager and playstyle the build was made for.
      const ctx = recContext();
      store.manager = managerKey(ctx.manager); store.tactic = ctx.tactic; saveStore();
      openInTrainer(open.dataset.recOpen, recBuild(open.dataset.recOpen));
    }
    const use = e.target.closest("[data-rec-use]");
    if (use) useRecommendation(use.dataset.recUse);
    const edit = e.target.closest("[data-mine-edit]");
    if (edit) {
      const id = edit.dataset.mineEdit;
      openInTrainer(id, store.builds[id] || recBuild(id));
    }
  });
  $("#trainSkillReset").addEventListener("click", () => {
    const p = byId[view.playerId];
    delete store.playerSkills[p.id];
    delete store.skillSource[p.id];
    REC = makeRecommender();
    const list = REC.recs[p.id]?.aiSkills || [];
    // Explicit choice: keep exactly the AI picks (an untouched list would be refilled
    // from the squad notes on the next refresh).
    setSkills(p.id, list, { ...Object.fromEntries(list.map((n) => [n, "rec"])), __touched: true });
    saveStore();
    renderTrainer(); renderSquad(); renderMyBuilds();
  });
  $("#trainLoadRec").addEventListener("click", () => {
    const p = byId[view.playerId];
    view.draft = recBuild(p.id);
    renderTrainer();
  });

  /* ---------------------------------------------------------
     CoinPlayTV builds tab — published by the owner, read by every signed-in account
  --------------------------------------------------------- */

  const proState = { q: "", group: "ALL", style: "", open: new Set() };

  function renderPro() {
    // Public: everyone sees the builds; copying one into a squad needs an account.
    const signedOut = auth.enabled && !auth.signedIn;
    $("#proGate").hidden = !signedOut;
    const all = Object.values(pro.builds);
    const q = proState.q.trim().toLowerCase();
    const list = all
      .filter((b) => proState.group === "ALL" || POSITION_GROUP[b.position] === proState.group)
      .filter((b) => styleMatch(b.player, proState.style))
      .filter((b) => !q || `${b.player.name} ${b.player.team} ${b.position} ${styleText(b.player)} ${b.note}`.toLowerCase().includes(q))
      .sort((a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position) || b.updatedAt - a.updatedAt);
    $("#proMeta").textContent = pro.error ? "" : pro.loaded ? `${all.length} build${all.length === 1 ? "" : "s"} by ${pro.name}` : "Loading…";
    $("#proGrid").innerHTML = list.map((b) => {
      const p = b.player;
      Object.assign(DATA.labels, p.labels || {});
      const cats = categoriesFor(p);
      const res = compute(p, b.build, b.manager, b.tactic);
      const rating = res.ratings[b.position];
      const b2 = booster2Of(p, b.build);
      const mgr = managerObj(b.manager);
      const owned = !!byId[p.id];
      const statKeys = KB.STAT_GROUPS.flatMap((g) => g.stats).filter((k) => (isGK(p) || !k.startsWith("gk")) && res.final[k] != null);
      const trained = new Set(cats.filter((c) => b.build.levels[c.key]).flatMap((c) => c.stats));
      return `
        <details class="rec-card pro-card" data-group="${POSITION_GROUP[b.position]}" data-pro="${p.id}" ${proState.open.has(p.id) ? "open" : ""}>
          <summary class="rec-card__head">
            ${cardImg(p, "rec-card__img")}
            <div class="rec-card__who">
              <h3>${esc(p.name)}</h3>
              <p>${esc(p.team || "")} · ${p.height} cm · Lv cap ${b.build.levelCap || p.levelCap}</p>
              <div class="kb-card__badges">
                <span class="badge badge--violet">${esc(pro.name)}</span>
                ${owned ? `<span class="badge badge--green">in your squad</span>` : ""}
                ${owned && store.builds[p.id] ? `<span class="badge">★ you have a build</span>` : ""}
              </div>
            </div>
            <div class="rec-card__ovr"><b>${rating}</b><span>${b.position} · card ${p.overall}</span></div>
            <p class="rec-card__line"><code>${cats.map((c) => b.build.levels[c.key] || 0).join("-")}</code> · ${esc(b2?.name || "no booster")} · ${b.build.skills.length} skills</p>
          </summary>
          <div class="rec-card__body">
          ${b.note ? `<section class="rec-sec pro-note"><h4>${esc(pro.name)} says</h4><p>${esc(b.note).replace(/\n/g, "<br>")}</p></section>` : ""}
          <section class="rec-sec">
            <h4>Role</h4>
            <p><b>${b.position} — ${esc(styleText(p))}</b></p>
            <p class="rec-muted">Rated with ${mgrPhoto(mgr, "mgr-photo mgr-photo--inline")}${esc(mgr?.name || "no manager")} at ${esc(b.tactic)}.</p>
          </section>
          <section class="rec-sec">
            <h4>Build <span class="rec-muted">${pointsUsed(b.build)}/${budgetFor(b.build.levelCap || p.levelCap)} pts</span></h4>
            <div class="rec-levels">${cats.map((c) => `<span class="${b.build.levels[c.key] ? "" : "is-zero"}"><b>${b.build.levels[c.key] || 0}</b><i>${c.label.replace("Lower Body Strength", "Lower Body").replace("Aerial Strength", "Aerial")}</i></span>`).join("")}</div>
          </section>
          <section class="rec-sec">
            <h4>Boosters</h4>
            <p>${esc(p.booster1?.name || "—")} <span class="rec-muted">(slot 1, fixed)</span> + <b>${esc(b2?.name || "—")}</b>${b2 ? ` — ${Object.keys(b2.stats).map(statLabel).join(", ")}` : ""}</p>
          </section>
          <section class="rec-sec">
            <h4>Final stats</h4>
            <div class="rec-targets">${statKeys.map((k) => `<span class="rec-t ${trained.has(k) ? "is-hit" : ""}"><i>${statLabel(k)}</i><b class="tier-bg-${statTier(res.final[k])}">${res.final[k]}</b></span>`).join("")}</div>
          </section>
          <section class="rec-sec">
            <h4>Additional skills <span class="rec-muted">${b.build.skills.length}/5</span></h4>
            <ul class="rec-skills">${b.build.skills.map((n) => `<li><b>${esc(n)}</b></li>`).join("") || `<li class="rec-muted">None.</li>`}</ul>
          </section>
          <div class="rec-card__actions">
            ${signedOut
              ? `<button type="button" class="btn btn--icon btn--solid" data-auth-open>Sign in to copy this build</button>`
              : `<button type="button" class="btn btn--icon btn--solid" data-pro-use="${p.id}">${owned ? (store.builds[p.id] ? "Replace my build" : "Use as my build") : "Add card + build to my squad"}</button>`}
            <a class="btn btn--icon" href="https://efhub.com/players/${p.id}" target="_blank" rel="noopener">eFHUB ↗</a>
          </div>
          </div>
        </details>`;
    }).join("") || `<p class="empty-state">${pro.error ? `Couldn't load the builds (${esc(pro.error)}).` : !pro.loaded ? "Loading builds…" : all.length ? "No builds match." : `No ${esc(pro.name)} builds published yet.`}</p>`;
  }

  // Copy a published build into this account's squad (adding the card if it's missing)
  // and open it in the Trainer.
  function usePro(id) {
    const b = pro.builds[id];
    if (!b) return;
    const p = b.player;
    if (byId[id] && store.builds[id] && !confirm(`Replace your saved build for ${p.name} with the ${pro.name} build?`)) return;
    if (!byId[id]) {
      store.removed = store.removed.filter((x) => x !== id);
      store.customPlayers[id] = { ...p, custom: true, addedAt: Date.now() };
      rebuildPlayers();
    }
    const build = { ...emptyBuild(byId[id]), ...structuredClone(b.build) };
    store.builds[id] = { ...build, savedAt: Date.now() };
    setSkills(id, build.skills, { ...Object.fromEntries(build.skills.map((n) => [n, "mine"])), __touched: true });
    saveStore();
    refreshAll();
    openInTrainer(id, store.builds[id]);
  }

  bindFilter("pro", proState, renderPro);
  $("#proGrid").addEventListener("toggle", (e) => {
    const d = e.target.closest?.("[data-pro]");
    if (!d) return;
    if (d.open) proState.open.add(d.dataset.pro); else proState.open.delete(d.dataset.pro);
  }, true);
  document.addEventListener("click", (e) => {
    const use = e.target.closest("[data-pro-use]");
    if (use) usePro(use.dataset.proUse);
  });

  /* ---------------------------------------------------------
     Public cards tab — every card in eFHUB's sitemap (data/public/cards.json, weekly by
     .github/workflows/public-cards.yml) with its Recommended by AI build precomputed
     without a manager (data/public/builds.json, tools/build_public.js). Kept apart from
     every profile's squad: nothing here touches the store until "Add to my squad".
  --------------------------------------------------------- */

  const PUB_NEW_DAYS = 14;
  const PUB_PAGE = 60;
  const pubState = { q: "", group: "ALL", style: "", sort: "rating", newOnly: false, compare: [], open: new Set(), status: "idle", error: null,
    cards: [], byId: {}, builds: {}, built: null, fetched: null, shown: PUB_PAGE, live: {} };
  const pubIsNew = (p) => !!p.added && (Date.now() - Date.parse(p.added)) / 864e5 <= PUB_NEW_DAYS;

  async function loadPublic() {
    if (pubState.status !== "idle") return;
    pubState.status = "loading";
    renderPublic();
    try {
      const [cards, builds] = await Promise.all(["data/public/cards.json", "data/public/builds.json"].map((u) =>
        fetch(u, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(`${u}: HTTP ${r.status}`); return r.json(); })));
      Object.assign(DATA.labels, cards.labels || {});
      pubState.cards = (cards.players || []).filter((c) => c && c.id && c.stats);
      pubState.byId = Object.fromEntries(pubState.cards.map((c) => [c.id, c]));
      pubState.fetched = cards.fetched;
      pubState.builds = builds.builds || {};
      pubState.built = builds.built;
      pubState.status = "ready";
    } catch (e) {
      pubState.status = "error";
      pubState.error = e.message;
    }
    renderPublic();
  }

  // One card through recommend.js — the precomputed build is manager-less; this is the
  // same card with the profile's manager and playstyle (recContext), or a card whose
  // build isn't in builds.json yet.
  function recommendOne(card, context) {
    const r = window.Recommender({
      players: [card], KB, OVR, norm, skillLabel, categoriesFor, levelCost, cumCost, budgetFor, profAt,
      skillMultiplier, managerProficiency, managerObj, notesFor: () => null, myPicks: () => [], context, MAX_LEVEL,
      boosterPool: DATA.boosterPool, onBench: () => false,
    }).recs[card.id];
    return { role: r.roleLabel, template: r.template, levels: r.levels, booster2: r.booster2, booster: r.booster.name, boosterFixed: r.boosterFixed,
      rating: r.rating, final: r.final, targets: r.targets, skills: r.aiSkills, why: r.aiWhy, notes: r.notes, lock: r.lock, missed: r.missed, waste: r.waste, altPosition: r.altPosition };
  }
  function pubBuild(p) {
    if (pubState.builds[p.id]) return pubState.builds[p.id];
    pubState.live[p.id] ||= recommendOne(p, { manager: "", tactic: "" });
    return pubState.live[p.id];
  }
  function pubVerdict(p, r) {
    const out = [];
    if (budgetFor(p.levelCap) === 0) out.push("Fixed card — eFHUB lists no progression points, so only the booster and skills can change.");
    else if (r.lock) out.push("<b>Lock it.</b> Every high-priority target for the role is met.");
    else {
      const bits = [];
      if (r.missed.length) bits.push(`still short on ${r.missed.map((t) => `${statLabel(t.stat)} (${t.value}/${t.target})`).join(", ")}`);
      const waste = Object.entries(r.waste || {});
      if (waste.length) bits.push(`${waste.map(([k, n]) => `${n} pt${n > 1 ? "s" : ""} of ${statLabel(k)}`).join(", ")} past the useful range (§14 step 4) — the category also feeds stats the role needs, so it's a trade-off`);
      const text = bits.join("; ");
      out.push(`<b>Test a variant.</b> ${text.charAt(0).toUpperCase()}${text.slice(1)}.`);
    }
    const alt = r.altPosition;
    out.push(alt && alt.r > r.rating
      ? `Preferred position: <b>${p.position}</b> for the style (${esc(p.playingStyle || p.playingStyleDefensive || "")}); ${alt.pos} rates higher (${alt.r}) but check style compatibility before moving him.`
      : `Preferred position: <b>${p.position}</b>${alt ? ` (best alternative ${alt.pos} ${alt.r})` : ""}.`);
    return out.map((x) => `<p>${x}</p>`).join("");
  }
  // "With your manager": the card re-run live with the profile's manager and playstyle.
  function pubManagerHtml(p) {
    const ctx = recContext();
    const m = managerObj(ctx.manager);
    if (!m) return `<p class="rec-muted">Pick a manager in the Trainer or Lineup tab to see this card rated with your team booster and playstyle.</p>`;
    const r = recommendOne(p, ctx);
    const cats = categoriesFor(p);
    const base = pubBuild(p);
    const line = (b) => cats.map((c) => b.levels[c.key] || 0).join("-");
    const same = line(r) === line(base) && r.booster === base.booster;
    return `<p><b>${r.rating}</b> at ${p.position} with ${mgrPhoto(m, "mgr-photo mgr-photo--inline")}${esc(m.name)} (${esc(ctx.tactic)}) — <code>${line(r)}</code> · ${esc(r.booster)}${same ? " <span class=\"rec-muted\">(same build as without a manager)</span>" : ""}</p>
      ${same ? "" : `<p class="rec-muted">The manager's +1/+1 and playstyle multiplier move a threshold, so the points shift. Add him to your squad and the Trainer shows both.</p>`}`;
  }

  function renderPublic() {
    const box = $("#pubGrid");
    if (!box) return;
    const signedOut = auth.enabled && !auth.signedIn;
    $("#pubGate").hidden = !signedOut;
    const meta = $("#pubMeta");
    if (pubState.status !== "ready") {
      meta.textContent = pubState.status === "error" ? "" : "Loading…";
      box.innerHTML = `<p class="empty-state">${pubState.status === "error" ? `Couldn't load the public cards (${esc(pubState.error)}).` : "Loading cards…"}</p>`;
      return;
    }
    const q = pubState.q.trim().toLowerCase();
    const list = pubState.cards
      .filter((p) => pubState.group === "ALL" || POSITION_GROUP[p.position] === pubState.group)
      .filter((p) => styleMatch(p, pubState.style))
      .filter((p) => !pubState.newOnly || pubIsNew(p))
      .filter((p) => !q || `${p.name} ${p.team || ""} ${p.position} ${styleText(p)}`.toLowerCase().includes(q));
    const rating = (p) => pubState.builds[p.id]?.rating ?? p.overall ?? 0;
    const SORT = {
      rating: (a, b) => rating(b) - rating(a) || (b.overall || 0) - (a.overall || 0) || a.name.localeCompare(b.name),
      overall: (a, b) => (b.overall || 0) - (a.overall || 0) || rating(b) - rating(a),
      newest: (a, b) => String(b.added || "").localeCompare(String(a.added || "")) || rating(b) - rating(a),
      name: (a, b) => a.name.localeCompare(b.name) || rating(b) - rating(a),
    };
    list.sort(SORT[pubState.sort === "byPos" ? "rating" : pubState.sort] || SORT.rating);
    // Best per position: the top six at every position, grouped.
    const groups = pubState.sort === "byPos"
      ? POS_ORDER.map((pos) => ({ pos, cards: list.filter((p) => p.position === pos).slice(0, 6) })).filter((g) => g.cards.length) : null;
    const fresh = pubState.cards.filter(pubIsNew).length;
    meta.textContent = `${list.length} of ${pubState.cards.length} cards · eFHUB ${pubState.fetched || "—"} · builds ${pubState.built || "—"}, rated without a manager${fresh ? ` · ${fresh} new in the last ${PUB_NEW_DAYS} days` : ""}`;
    renderPubNewBox();
    renderPubCompare();
    $("#pubNew").classList.toggle("is-selected", pubState.newOnly);
    $("#pubSort").value = pubState.sort;
    const shown = groups ? groups.flatMap((g) => g.cards) : list.slice(0, pubState.shown);
    const groupHead = (p) => { const g = groups?.find((x) => x.cards[0] === p); return g ? `<div class="pub-group"><b>${g.pos}</b><span>top ${g.cards.length} by AI build</span></div>` : ""; };
    box.innerHTML = shown.map((p) => groupHead(p) + (() => {
      const r = pubBuild(p);
      const cats = categoriesFor(p);
      const pts = cats.reduce((t, c) => t + cumCost(r.levels[c.key] || 0), 0);
      const att = KB.ATT_STYLES.find((x) => norm(x.name) === norm(p.playingStyle));
      const def = KB.DEF_STYLES.find((x) => norm(x.name) === norm(p.playingStyleDefensive || p.playingStyle));
      const b2 = DATA.boosterPool.find((b) => b.id === r.booster2) || p.booster2Fixed;
      const owned = !!byId[p.id];
      const open = pubState.open.has(p.id);
      return `
        <details class="rec-card" data-group="${POSITION_GROUP[p.position]}" data-pub="${p.id}" ${open ? "open" : ""}>
          <summary class="rec-card__head">
            ${cardImg(p, "rec-card__img")}
            <div class="rec-card__who">
              <h3>${esc(p.name)}</h3>
              <p>${esc(p.team || "")} · ${p.height} cm · Lv cap ${p.levelCap}${p.added ? ` · eFHUB ${esc(p.added)}` : ""}</p>
              <div class="kb-card__badges">
                ${pubIsNew(p) ? `<span class="badge badge--lime">New</span>` : ""}
                ${p.cardType ? `<span class="badge badge--violet">${esc(p.cardType)}</span>` : ""}
                <span class="badge">${esc(r.role)}</span>
                ${r.lock ? `<span class="badge badge--green">Lock</span>` : `<span class="badge badge--amber">Test variant</span>`}
                ${owned ? `<span class="badge badge--green">in your squad</span>` : ""}
              </div>
            </div>
            <div class="rec-card__ovr"><b>${r.rating}</b><span>${p.position} · card ${p.overall ?? "—"}</span></div>
            <p class="rec-card__line"><code>${cats.map((c) => r.levels[c.key] || 0).join("-")}</code> · ${esc(r.booster)} · ${r.skills.length} skills</p>
            <button type="button" class="chip chip--small pub-cmp-btn ${pubState.compare.includes(p.id) ? "is-selected" : ""}" data-pub-cmp="${p.id}" title="Compare side by side (up to three cards)">${pubState.compare.includes(p.id) ? "✓ Compare" : "+ Compare"}</button>
          </summary>
          <div class="rec-card__body">
          <section class="rec-sec">
            <h4>Role</h4>
            <p><b>${p.position} — Attacking: ${esc(att?.name || p.playingStyle || "Basic")} · Defensive: ${esc(p.playingStyleDefensive ? (def?.name || p.playingStyleDefensive) : "—")}</b></p>
            <p class="rec-muted">${esc(r.role)} priorities (§7) · ${esc(p.foot || "")} foot, weak foot ${p.weakFootUsage ?? "—"}/${p.weakFootAccuracy ?? "—"} · ${p.weight ?? "—"} kg</p>
            <div class="rec-style">${styleGuideHtml(p, p.position)}</div>
            ${(r.notes || []).map((n) => `<p class="rec-note">${esc(n)}</p>`).join("")}
          </section>
          <section class="rec-sec">
            <h4>Build <span class="rec-muted">${pts}/${budgetFor(p.levelCap)} pts</span></h4>
            <div class="rec-levels">${cats.map((c) => `<span class="${r.levels[c.key] ? "" : "is-zero"}"><b>${r.levels[c.key] || 0}</b><i>${c.label.replace("Lower Body Strength", "Lower Body").replace("Aerial Strength", "Aerial")}</i></span>`).join("")}</div>
          </section>
          <section class="rec-sec">
            <h4>Boosters</h4>
            <p>${esc(p.booster1?.name || "—")} <span class="rec-muted">(slot 1, fixed)</span> + <b>${esc(r.booster)}</b>${b2 ? ` — ${Object.keys(b2.stats).map(statLabel).join(", ")}` : ""}${r.boosterFixed ? " <span class=\"rec-muted\">(slot 2 is pre-assigned on this card)</span>" : ""}</p>
          </section>
          <section class="rec-sec">
            <h4>Target stats</h4>
            <div class="rec-targets">${r.targets.map((t) => `<span class="rec-t ${t.hit ? "is-hit" : "is-miss"}" title="Target ${t.target}"><i>${statLabel(t.stat)}</i><b class="tier-bg-${statTier(t.value)}">${t.value}</b>${t.hit ? "" : `<em>→${t.target}</em>`}</span>`).join("")}</div>
          </section>
          <section class="rec-sec">
            <h4>Additional skills <span class="rec-muted">${r.skills.length}/5</span></h4>
            <ul class="rec-skills">${r.skills.map((n) => `<li><b>${esc(n)}</b> <span>${esc(r.why?.[n] || "")}</span></li>`).join("")}</ul>
          </section>
          <section class="rec-sec rec-verdict">
            <h4>Final verdict</h4>
            ${pubVerdict(p, r)}
          </section>
          <section class="rec-sec" data-pub-mgr="${p.id}">
            <h4>With your manager</h4>
            ${open ? pubManagerHtml(p) : `<p class="rec-muted">…</p>`}
          </section>
          <div class="rec-card__actions">
            ${signedOut
              ? `<button type="button" class="btn btn--icon btn--solid" data-auth-open>Sign in to add this card</button>`
              : `<button type="button" class="btn btn--icon btn--solid" data-pub-add="${p.id}">${owned ? "Open in Trainer" : "Add to my squad"}</button>`}
            <a class="btn btn--icon" href="https://efhub.com/players/${esc(p.id)}" target="_blank" rel="noopener">eFHUB ↗</a>
          </div>
          </div>
        </details>`;
    })()).join("") + (!groups && list.length > shown.length
      ? `<button type="button" class="btn btn--icon pub-more" data-pub-more>Show ${Math.min(PUB_PAGE, list.length - shown.length)} more of ${list.length}</button>` : "")
      || `<p class="empty-state">${pubState.cards.length ? "No cards match." : "No public cards yet — run tools/fetch_public.py."}</p>`;
  }

  // Copy a public card into this profile's squad (as a custom card, like a pasted one)
  // and open its AI build in the Trainer — the public build is the starting point.
  function addPublic(id) {
    const card = pubState.byId[id];
    if (!card) return;
    if (!byId[id]) {
      const { added, ...rest } = card;
      store.removed = store.removed.filter((x) => x !== id);
      store.customPlayers[id] = { ...rest, labels: Object.fromEntries([...card.skills, ...card.comSkills].map((k) => [k, skillLabel(k)])), custom: true, addedAt: Date.now() };
      saveStore();
      refreshAll();
    }
    openInTrainer(id, store.builds[id] || recBuild(id));
  }

  // New this week: the cards that appeared on eFHUB in the last PUB_NEW_DAYS days, best first.
  function renderPubNewBox() {
    const box = $("#pubNewBox");
    if (!box) return;
    const fresh = pubState.cards.filter(pubIsNew).sort((a, b) => (pubState.builds[b.id]?.rating ?? 0) - (pubState.builds[a.id]?.rating ?? 0));
    if (!fresh.length) { box.innerHTML = `<p class="pub-newbox__none">No new cards on eFHUB since the last refresh (${esc(pubState.fetched || "—")}). The weekly refresh lists them here, best first.</p>`; return; }
    const best = {};
    fresh.forEach((p) => { if (!best[p.position]) best[p.position] = p; });
    box.innerHTML = `<div class="pub-newbox__head"><b>New this week</b><span>${fresh.length} card${fresh.length === 1 ? "" : "s"} in the last ${PUB_NEW_DAYS} days · best per position: ${POS_ORDER.filter((pos) => best[pos]).map((pos) => `${pos} ${esc(shortName(best[pos]))} ${pubState.builds[best[pos].id]?.rating ?? ""}`).join(" · ")}</span>
        <button type="button" class="chip chip--small ${pubState.newOnly ? "is-selected" : ""}" data-pub-newonly>${pubState.newOnly ? "Showing only new" : "Show only new"}</button></div>
      <div class="pub-newbox__list">${fresh.slice(0, 8).map((p) => { const r = pubState.builds[p.id]; return `<button type="button" class="pub-newbox__card" data-pub-jump="${p.id}">${cardImg(p, "pub-newbox__img")}<b>${r?.rating ?? p.overall}</b><span>${esc(shortName(p))}</span><em>${p.position} · ${esc(p.cardType || "")}</em></button>`; }).join("")}</div>`;
  }
  // Compare up to three public cards side by side (their AI builds, no manager).
  function renderPubCompare() {
    const bar = $("#pubCompare");
    if (!bar) return;
    const ids = pubState.compare.filter((id) => pubState.byId[id]);
    pubState.compare = ids;
    bar.hidden = !ids.length;
    if (!ids.length) return;
    bar.innerHTML = `<span class="field__label">Compare</span>
      ${ids.map((id) => `<span class="badge badge--lime">${esc(shortName(pubState.byId[id]))} <button type="button" class="pub-cmp__x" data-pub-cmp="${id}" aria-label="Remove">✕</button></span>`).join("")}
      <button type="button" class="btn btn--icon btn--solid" data-pub-open-cmp ${ids.length < 2 ? "disabled" : ""}>${ids.length < 2 ? "Pick one more" : "Compare side by side"}</button>
      <button type="button" class="btn btn--icon" data-pub-clear-cmp>Clear</button>`;
  }
  function openCompare() {
    const ids = pubState.compare.filter((id) => pubState.byId[id]);
    if (ids.length < 2) return;
    const cards = ids.map((id) => pubState.byId[id]);
    const builds = cards.map((p) => pubBuild(p));
    const gk = cards.every((p) => p.position === "GK");
    const groups = KB.STAT_GROUPS.filter((g) => gk ? g.title === "Goalkeeping" || g.title === "Athleticism" : g.title !== "Goalkeeping");
    const best = (vals, higher = true) => { const m = higher ? Math.max(...vals) : Math.min(...vals); return vals.map((v) => v === m && vals.filter((x) => x === m).length < vals.length); };
    const row = (label, vals, hi) => `<tr><th>${label}</th>${vals.map((v, i) => `<td class="${hi && hi[i] ? "is-best" : ""}">${v}</td>`).join("")}</tr>`;
    const ratings = builds.map((b) => b.rating);
    const cats = categoriesFor(cards[0]);
    $("#bdBody").innerHTML = `
      <h2 id="bdTitle">Compare</h2>
      <p class="rec-muted">Recommended by AI builds, rated without a manager. Green = the best of the ${cards.length} in that row.</p>
      <div class="table-wrap"><table class="kb-table cmp-table">
        <thead><tr><th></th>${cards.map((p) => `<th>${cardImg(p, "cmp-table__img")}<b>${esc(p.name)}</b><small>${esc(p.team || "")} · ${esc(p.cardType || "")}</small></th>`).join("")}</tr></thead>
        <tbody>
          ${row("AI rating", ratings.map((r, i) => `<b>${r}</b> <small>${cards[i].position}</small>`), best(ratings))}
          ${row("Role", builds.map((b) => esc(b.role)))}
          ${row("Styles", cards.map((p) => esc(styleText(p))))}
          ${row("Build", builds.map((b) => `<code>${cats.map((c) => b.levels[c.key] || 0).join("-")}</code>`))}
          ${row("Booster", builds.map((b) => esc(b.booster)))}
          ${row("Height · weight", cards.map((p) => `${p.height} cm · ${p.weight} kg`))}
          ${row("Foot · weak foot", cards.map((p) => `${esc(p.foot || "")} · ${p.weakFootUsage ?? "—"}/${p.weakFootAccuracy ?? "—"}`))}
          ${row("Level cap · points", cards.map((p) => `${p.levelCap} · ${budgetFor(p.levelCap)}`))}
          ${groups.map((g) => `<tr class="cmp-table__group"><th colspan="${cards.length + 1}">${g.title}</th></tr>` + g.stats.map((k) => { const vals = builds.map((b) => b.final[k]); return row(statLabel(k), vals.map((v) => `<span class="tier-bg-${statTier(v)} cmp-table__val">${v}</span>`), best(vals)); }).join("")).join("")}
          ${row("Additional skills", builds.map((b) => b.skills.map(esc).join(", ")))}
          ${row("Native skills", cards.map((p) => p.skills.map((k) => esc(skillLabel(k))).join(", ")))}
        </tbody>
      </table></div>`;
    const dlg = $("#buildDialog");
    if (dlg?.showModal) dlg.showModal(); else dlg?.setAttribute("open", "");
  }
  document.addEventListener("click", (e) => {
    const cmp = e.target.closest("[data-pub-cmp]");
    if (cmp) {
      const id = cmp.dataset.pubCmp;
      const i = pubState.compare.indexOf(id);
      if (i >= 0) pubState.compare.splice(i, 1); else if (pubState.compare.length < 3) pubState.compare.push(id); else { flash(cmp, "3 is the max"); return; }
      document.querySelectorAll(`[data-pub-cmp="${id}"].pub-cmp-btn`).forEach((b) => { const on = pubState.compare.includes(id); b.classList.toggle("is-selected", on); b.textContent = on ? "✓ Compare" : "+ Compare"; });
      renderPubCompare();
    }
    if (e.target.closest("[data-pub-open-cmp]")) openCompare();
    if (e.target.closest("[data-pub-clear-cmp]")) { pubState.compare = []; renderPublic(); }
    if (e.target.closest("[data-pub-newonly]")) { pubState.newOnly = !pubState.newOnly; pubState.shown = PUB_PAGE; renderPublic(); }
    const jump = e.target.closest("[data-pub-jump]");
    if (jump) {
      const id = jump.dataset.pubJump;
      pubState.q = ""; $("#pubSearch").value = ""; pubState.open.add(id); renderPublic();
      document.querySelector(`#pubGrid [data-pub="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  bindFilter("pub", pubState, () => { pubState.shown = PUB_PAGE; renderPublic(); });
  $("#pubNew").addEventListener("click", () => { pubState.newOnly = !pubState.newOnly; pubState.shown = PUB_PAGE; renderPublic(); });
  $("#pubSort").addEventListener("change", (e) => { pubState.sort = e.target.value; pubState.shown = PUB_PAGE; renderPublic(); });
  $("#pubGrid").addEventListener("toggle", (e) => {
    const d = e.target.closest?.("[data-pub]");
    if (!d) return;
    const id = d.dataset.pub;
    if (d.open) {
      pubState.open.add(id);
      const box = d.querySelector("[data-pub-mgr]");
      if (box && pubState.byId[id]) box.innerHTML = `<h4>With your manager</h4>${pubManagerHtml(pubState.byId[id])}`;
    } else pubState.open.delete(id);
  }, true);
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-pub-add]");
    if (add) addPublic(add.dataset.pubAdd);
    if (e.target.closest("[data-pub-more]")) { pubState.shown += PUB_PAGE; renderPublic(); }
  });

  /* ---------------------------------------------------------
     Add / remove players (stored in this browser)
  --------------------------------------------------------- */

  // Runs on an eFHUB player page: reads the card data the page already contains and
  // copies it for pasting into Build Lab. eFHUB pages can't be fetched cross-site.
  const BOOKMARKLET = `(()=>{const m=location.pathname.match(/players\\/(\\d+)/);if(!location.hostname.endsWith("efhub.com")||!m){alert("Open a player page on efhub.com first.");return}const id=m[1];const s=[...document.scripts].map(x=>x.textContent).join("\\n").match(/self\\.__next_f\\.push\\(\\[1,"(?:[^"\\\\]|\\\\.)*"\\]\\)/g)?.map(t=>JSON.parse(t.slice(22,-2))).join("")||"";const grab=k=>{const i=s.indexOf(k);if(i<0)return null;let j=i+k.search(/[{[]/);const st=j;let d=0,q=false,e=false;for(;j<s.length;j++){const c=s[j];if(q){if(e)e=false;else if(c==="\\\\")e=true;else if(c==='"')q=false;continue}if(c==='"')q=true;else if(c==="{"||c==="[")d++;else if(c==="}"||c==="]"){d--;if(!d)break}}return JSON.parse(s.slice(st,j+1))};try{const player=grab('"player":{"id":"'+id+'"');if(!player){alert("Reload this page (F5), then click the bookmark again.");return}const out={v:1,id,player,baseStats:grab('"baseStats":{'),playerSkills:grab('"playerSkills":[')||[],additionalPositions:grab('"additionalPositions":[')||[]};const msg=grab('"messages":{')||{};out.labels={};[...out.playerSkills,...(player.comSkills||[])].forEach(k=>{if(typeof msg[k]==="string")out.labels[k]=msg[k]});const text="EFBLAB:"+JSON.stringify(out);const done=()=>alert(player.name+" copied — paste it into Build Lab → My Squad → Add player.");navigator.clipboard.writeText(text).then(done,()=>prompt("Copy this and paste it into Build Lab:",text))}catch(err){alert("Could not read this page: "+err.message)}})()`;

  let boostsCache = null;
  async function efhubBoosts() {
    if (!boostsCache) boostsCache = fetch("https://efhub.com/data/boosts.json").then((r) => r.json());
    return boostsCache;
  }
  const stripBoost = (b) => b && { id: b.id, name: b.name, stats: Object.fromEntries(Object.entries(b.stats).filter(([, v]) => v)) };

  async function playerFromPaste(text) {
    const raw = text.trim().replace(/^EFBLAB:/, "");
    const d = JSON.parse(raw);
    const p = d.player;
    if (!p || !d.baseStats || !p.id) throw new Error("That doesn't look like a copied eFHUB card.");
    let booster1 = null;
    let booster2Fixed = null;
    try {
      const b = await efhubBoosts();
      const all = [...b.left, ...b.right];
      booster1 = stripBoost(all.find((x) => x.id === p.boostId));
      booster2Fixed = p.boostId2 ? stripBoost(all.find((x) => x.id === p.boostId2)) : null;
    } catch { /* offline: card works without its booster */ }
    const undef = (v) => (v === "$undefined" ? null : v);
    return {
      id: String(p.id), name: p.name, team: p.team, position: p.position,
      additionalPositions: Array.isArray(d.additionalPositions) ? d.additionalPositions : [],
      playingStyle: undef(p.playingStyle), playingStyleDefensive: undef(p.playingStyleDefensive),
      overall: p.overallRating, age: p.age, height: p.height, weight: p.weight, foot: p.preferredFoot,
      weakFootUsage: p.weakFootUsage, weakFootAccuracy: p.weakFootAccuracy, form: p.form, injuryResistance: p.injuryResistance,
      skills: d.playerSkills || [], comSkills: p.comSkills || [], stats: d.baseStats, model: p.playerModel,
      image: p.imageUrl, levelCap: p.levelCap, booster1, booster2Fixed,
      labels: d.labels || {}, custom: true, addedAt: Date.now(),
    };
  }

  function switchProfile(id) {
    if (!root.profiles[id]) return;
    root.active = id;
    store = root.profiles[id];
    view.playerId = null;
    lu.sel = null;
    saveStore({ silent: true }); // which squad is open is a local choice, not synced
    refreshAll();
    route();
  }

  function renderProfileBar() {
    $("#demoBanner").hidden = !(auth.enabled && !auth.signedIn);
  }

  function refreshAll() {
    renderProfileBar();
    rebuildPlayers();
    seedMatchPlans();
    rebuildNativeIndex();
    REC = makeRecommender();
    ensureSkillPlans();
    syncRecControls();
    if (!byId[view.playerId]) view.playerId = null;
    renderPlayerSelect();
    renderSquad(); renderSkills(); renderManagers(); renderStyles(); renderLineup(); renderMyBuilds();
    renderRemoved(); renderPro(); renderPublic();
  }

  function renderRemoved() {
    const all = [...(ownsRepo() ? DATA.players : isMe() ? [] : FRIEND_FILES[store.fileKey]?.players || []), ...Object.values(store.customPlayers)];
    const gone = store.removed.map((id) => all.find((p) => p.id === id)).filter(Boolean);
    $("#removedBox").hidden = !gone.length;
    $("#removedCount").textContent = gone.length;
    $("#removedList").innerHTML = gone.map((p) => `
      <li><span>${esc(p.name)} <small>${p.position} ${p.overall} · ${esc(p.team || "")}</small></span>
        <button type="button" class="btn btn--icon" data-restore="${p.id}">Restore</button></li>`).join("");
  }

  $("#addToggle").addEventListener("click", () => {
    if (gated()) { openAuth(); return; }
    const box = $("#addPanel");
    box.hidden = !box.hidden;
    if (!box.hidden) $("#addPaste").focus();
  });
  $("#addBookmarklet").setAttribute("href", `javascript:${encodeURIComponent(BOOKMARKLET)}`);
  $("#addBookmarklet").addEventListener("click", (e) => { e.preventDefault(); $("#addStatus").textContent = "Drag this button to your bookmarks bar — don't click it here."; });
  $("#addCopyCode").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(`javascript:${BOOKMARKLET}`); flash($("#addCopyCode"), "Copied"); }
    catch { window.prompt("Bookmarklet code:", `javascript:${BOOKMARKLET}`); }
  });
  $("#addSubmit").addEventListener("click", async () => {
    const status = $("#addStatus");
    status.className = "add-status";
    try {
      // One or more cards: every "EFBLAB:" chunk is a card.
      const chunks = $("#addPaste").value.split(/(?=EFBLAB:)/).map((x) => x.trim()).filter(Boolean);
      if (!chunks.length) throw new Error("Paste what the bookmarklet copied.");
      const added = [];
      const skipped = [];
      const base = ownsRepo() ? DATA.players : isMe() ? [] : FRIEND_FILES[store.fileKey]?.players || [];
      for (const chunk of chunks) {
        const p = await playerFromPaste(chunk);
        if (byId[p.id]) { skipped.push(p.name); continue; }
        store.removed = store.removed.filter((id) => id !== p.id);
        if (!base.some((x) => x.id === p.id)) store.customPlayers[p.id] = p;
        added.push(p);
        byId[p.id] = p; // so a duplicate later in the same paste is caught
      }
      saveStore();
      refreshAll();
      $("#addPaste").value = "";
      status.classList.add(added.length ? "is-ok" : "is-err");
      // One new card: open it in the Trainer with its Recommended by AI build loaded.
      if (added.length === 1 && REC?.recs[added[0].id]) setTimeout(() => openInTrainer(added[0].id, recBuild(added[0].id)), 0);
      const perm = isMe()
        ? `run <code>python3 tools/fetch_players.py --add ${added.map((p) => p.id).join(" ")}</code> or send me the IDs`
        : `run <code>python3 tools/fetch_players.py --friend "${esc(store.name)}" &lt;all IDs&gt;</code> or send me the IDs`;
      status.innerHTML = (added.length ? `Added ${added.map((p) => `<b>${esc(p.name)}</b> (${p.position} ${p.overall})`).join(", ")}. Saved in this browser — to make it permanent ${perm}.` : "")
        + (skipped.length ? ` Already in the squad: ${skipped.map(esc).join(", ")}.` : "");
    } catch (err) {
      status.classList.add("is-err");
      status.textContent = err instanceof SyntaxError ? "Couldn't read that — paste exactly what the bookmarklet copied." : err.message;
    }
  });
  document.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-remove-player]");
    if (rm) {
      const p = byId[rm.dataset.removePlayer];
      if (!p || !confirm(`Remove ${p.name} (${p.position} ${p.overall}) from your squad? You can restore it below.`)) return;
      store.removed.push(p.id);
      saveStore();
      refreshAll();
    }
    const rs = e.target.closest("[data-restore]");
    if (rs) {
      store.removed = store.removed.filter((id) => id !== rs.dataset.restore);
      saveStore();
      refreshAll();
    }
  });

  // Small API for cloud.js (optional Firebase sync).
  window.BuildLab = {
    root: () => root,
    activeId: () => root.active,
    onChange: (f) => changeListeners.push(f),
    onDelete: (f) => deleteListeners.push(f),
    putProfile(id, prof) {
      root.profiles[id] = normaliseProfile(prof, id === "me" ? "me" : "friend", prof.name || "Friend");
      if (root.active === id) store = root.profiles[id];
      saveStore({ silent: true });
      refreshAll();
      if (root.active === id) route();
    },
    dropProfile(id) {
      if (id === "me" || !root.profiles[id]) return;
      delete root.profiles[id];
      if (root.active === id) { root.active = "me"; store = root.profiles.me; view.playerId = null; }
      saveStore({ silent: true });
      refreshAll();
      route();
    },
    switchTo: () => {}, // single squad per account
    setRepoSquad(on) {
      try { if (on) localStorage.setItem(OWNER_FLAG, "1"); else localStorage.removeItem(OWNER_FLAG); } catch { /* private mode */ }
      if (repoSquad === on) return;
      repoSquad = on;
      if (!on && root.profiles.me.manager === KB.CURRENT_MANAGER) root.profiles.me.manager = "";
      refreshAll();
      route();
    },
    isRepoSquad: () => repoSquad,
    // Creator builds: cloud.js wires publishing (owner only) and feeds the published list.
    setCreator({ name, isCreator, publish, unpublish }) {
      Object.assign(pro, { name: name || pro.name, isCreator: !!isCreator, publish, unpublish });
      if (view.playerId && byId[view.playerId]) renderPublish(byId[view.playerId]);
      renderPro();
    },
    setCreatorBuilds(map, error = null) {
      pro.builds = map || {};
      pro.loaded = true;
      pro.error = error;
      renderPro();
      if (pro.isCreator) renderMyBuilds();
      if (view.playerId && byId[view.playerId]) renderPublish(byId[view.playerId]);
    },
    clearLocal() { try { localStorage.removeItem(STORE_KEY); localStorage.removeItem(OWNER_FLAG); } catch { /* private mode */ } },
    setAuth(state) {
      Object.assign(auth, state);
      if (!authKnown) { authKnown = true; refreshAll(); route(); }
      renderProfileBar();
      renderSquad();
      renderPro();
      renderPublic();
      if (auth.signedIn && isMe() && !repoSquad && !players.length) $("#addPanel").hidden = false;
    },
  };

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  if (!authKnown) setTimeout(() => { if (!authKnown) { authKnown = true; refreshAll(); route(); } }, 4000);

  seedMatchPlans();
  REC = makeRecommender();
  ensureSkillPlans();
  syncRecControls();
  renderProfileBar();
  renderRemoved();
  renderPlayerSelect();
  renderSquad();
  renderSkills();
  renderManagers();
  renderStyles();
  renderLineup();
  renderPro();
  route();
})();
