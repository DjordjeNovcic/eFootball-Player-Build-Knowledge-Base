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
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => {
    const k = String(s || "").toLowerCase().replace(/^the /, "").replace(/[^a-z0-9]/g, "");
    return { offensivewingback: "offensivefullback", offensivegoalkeeper: "attackinggk" }[k] || k;
  };
  const statLabel = (k) => KB.STAT_LABELS[k] || k;
  const skillLabel = (k) => DATA.labels[k] || k;
  const levelCost = (lvl) => Math.ceil(lvl / 4); // cost of reaching `lvl` (1–4:1, 5–8:2, …)
  const cumCost = (lvl) => { let t = 0; for (let i = 1; i <= lvl; i++) t += levelCost(i); return t; };
  const budgetFor = (cap) => Math.max(0, (cap - 1) * 2);
  const isGK = (p) => p.position === "GK";
  const categoriesFor = (p) => KB.CATEGORIES.filter((c) => !c.gk || isGK(p));
  const styleText = (p) => [p.playingStyle, p.playingStyleDefensive].filter(Boolean).join(" · ") || "—";
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

  const statTier = (v) => (v >= 90 ? "elite" : v >= 80 ? "good" : v >= 70 ? "ok" : v >= 60 ? "low" : "poor");

  // The working squad: generated cards + cards added in this browser − removed ones.
  // Mutated in place by rebuildPlayers() so every view keeps its reference.
  const players = [];
  const byId = {};
  const playerNativeNames = (p) => new Set(p.skills.map((k) => norm(skillLabel(k))));

  function cardImg(p, cls) {
    return `<img class="${cls}" src="${esc(p.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`;
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
      lineups: [], activeLineup: null, positions: {}, customPlayers: {}, removed: [], ownedManagers: [], ...extra };
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
    // Squads generated into data/friends.js appear automatically.
    Object.entries(FRIEND_FILES).forEach(([slug, f]) => {
      const id = `file:${slug}`;
      if (!root.profiles[id]) root.profiles[id] = blankProfile("friend", f.name, { fileKey: slug });
    });
    if (!root.profiles[root.active]) root.active = "me";
    return root;
  }
  const root = loadRoot();
  let store = root.profiles[root.active];
  const isMe = () => root.active === "me";
  const notesFor = (id) => (isMe() ? KB.SQUAD_NOTES[id] : null);

  function rebuildPlayers() {
    const removed = new Set(store.removed);
    const base = isMe() ? DATA.players : FRIEND_FILES[store.fileKey]?.players || [];
    const all = [...base, ...Object.values(store.customPlayers).filter((c) => !base.some((p) => p.id === c.id))];
    all.forEach((p) => { if (p.labels) Object.assign(DATA.labels, p.labels); });
    players.length = 0;
    Object.keys(byId).forEach((k) => delete byId[k]);
    all.filter((p) => !removed.has(p.id)).forEach((p) => { players.push(p); byId[p.id] = p; });
  }
  rebuildPlayers();
  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(root)); } catch { /* private mode */ }
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

  // Managers: the user's seven (with Link-up data, §22) plus every eFHUB manager card.
  // Keys: "kb:<name>" / "ef:<id>"; older saves stored the bare name.
  const ALL_MANAGERS = [
    ...KB.MANAGERS.map((m) => ({ ...m, key: `kb:${m.name}` })),
    ...(window.EF_MANAGERS || []).map((m) => ({ ...m, key: `ef:${m.id}`, linkUp: null, centerPiece: null, keyMan: null, affinity: null })),
  ];
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
    if (isMe()) return ALL_MANAGERS.filter((m) => m.key.startsWith("kb:"));
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

  const TABS = ["squad", "recommended", "mybuilds", "train", "lineup", "skills", "managers", "styles", "sandbox"];
  const view = { playerId: null, draft: null, position: null };

  function route() {
    const [tab, arg] = location.hash.replace(/^#/, "").split("/");
    const active = TABS.includes(tab) ? tab : "squad";
    document.querySelectorAll("[data-tab]").forEach((el) => el.classList.toggle("is-active", el.dataset.tab === active));
    document.querySelectorAll("[data-tab-link]").forEach((el) => {
      const on = el.dataset.tabLink === active;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-selected", String(on));
    });
    if (active === "train") {
      $("#trainEmpty").hidden = players.length > 0;
      $("#trainBody").hidden = players.length === 0;
      if (players.length) openTrainer(arg && byId[arg] ? arg : byId[view.playerId] ? view.playerId : defaultPlayerId());
    }
    if (active === "lineup") renderLineup();
    if (active === "recommended") renderRecommended();
    if (active === "mybuilds") renderMyBuilds();
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

  const squadState = { q: "", group: "ALL" };

  function renderSquad() {
    const root = $("#squadGrid");
    const q = squadState.q.trim().toLowerCase();
    const list = players
      .filter((p) => squadState.group === "ALL" || POSITION_GROUP[p.position] === squadState.group)
      .filter((p) => !q || `${p.name} ${p.team} ${positionList(p).map((x) => x.pos).join(" ")} ${styleText(p)} ${p.id}`.toLowerCase().includes(q))
      .sort((a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position) || b.overall - a.overall);

    const counts = players.reduce((c, p) => ((c[POSITION_GROUP[p.position]] = (c[POSITION_GROUP[p.position]] || 0) + 1), c), {});
    $("#squadMeta").textContent =
      `${players.length} card${players.length === 1 ? "" : "s"} · GK ${counts.GK || 0} · DEF ${counts.DEF || 0} · MID ${counts.MID || 0} · FWD ${counts.FWD || 0} · stats from eFHUB, ${DATA.fetched}`;

    root.innerHTML = list.map((p) => {
      const note = notesFor(p.id);
      const saved = store.builds[p.id];
      let savedBadge = "";
      if (saved) {
        const r = compute(p, saved).ratings[p.position];
        savedBadge = `<span class="badge badge--lime">Build saved · ${r}</span>`;
      } else if (note?.snapshot) {
        savedBadge = `<span class="badge">Snapshot ${esc(note.snapshot.date)}</span>`;
      }
      return `
        <article class="squad-card" data-group="${POSITION_GROUP[p.position]}">
          <div class="squad-card__media">${cardImg(p, "squad-card__img")}
            <div class="squad-card__ovr"><b>${p.overall}</b><span>${p.position}</span></div>
          </div>
          <div class="squad-card__body">
            <h3 class="squad-card__name">${esc(p.name)}</h3>
            <p class="squad-card__team">${esc(p.team || "")} · ${p.height} cm · ${esc(p.foot || "")}</p>
            <p class="squad-card__style">${esc(styleText(p))}</p>
            ${styleExpectShort(p) ? `<p class="squad-card__expect" title="${esc(stylesOf(p).filter((x) => x.guide).map((x) => `${x.name}: ${x.guide.expect} ${x.guide.use}`).join("\n\n"))}">${esc(styleExpectShort(p))}</p>` : ""}
            <p class="squad-card__pos">${positionList(p).map(({ pos, prof }) => `<span class="pp pp--${prof}">${pos}</span>`).join("")}${positionsEdited(p) ? `<span class="pp-edited" title="Edited in Trainer">✎</span>` : ""}</p>
            <p class="squad-card__boost">${esc(p.booster1?.name || "No booster")}${p.booster2Fixed ? " + " + esc(p.booster2Fixed.name) : ""}</p>
            ${note ? `<p class="squad-card__note">${esc(note.role)}</p>` : ""}
            <div class="squad-card__foot">
              ${p.custom ? `<span class="badge badge--amber" title="Added in this browser">Added here</span>` : ""}
              ${savedBadge}
              <span class="squad-card__pts">Lv cap ${p.levelCap} · ${budgetFor(p.levelCap)} pts</span>
            </div>
            <div class="squad-card__actions">
              <button type="button" class="btn btn--icon btn--solid" data-open-player="${p.id}">Train</button>
              <a class="btn btn--icon" href="https://efhub.com/players/${p.id}" target="_blank" rel="noopener">eFHUB ↗</a>
              <button type="button" class="btn btn--icon btn--danger squad-card__remove" data-remove-player="${p.id}" aria-label="Remove ${esc(p.name)} from squad" title="Remove from squad">✕</button>
            </div>
          </div>
        </article>`;
    }).join("") || (players.length ? `<p class="empty-state">No cards match.</p>`
      : `<p class="empty-state">No cards in ${esc(store.name)}'s squad yet — click <b>+ Add player</b> above.</p>`);
  }

  $("#squadSearch").addEventListener("input", (e) => { squadState.q = e.target.value; renderSquad(); });
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
    $("#trainManager").value = managerKey(store.manager);
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

    // Header card
    $("#trainHead").innerHTML = `
      <div class="train-head__media">${cardImg(p, "train-head__img")}</div>
      <div class="train-head__info">
        <p class="train-head__eyebrow">${p.position}${p.additionalPositions.length ? " · also " + p.additionalPositions.map((a) => a.position).join(", ") : ""} · ${esc(p.team || "")}</p>
        <h2 class="train-head__name">${esc(p.name)}</h2>
        <p class="train-head__style">${esc(styleText(p))}</p>
        <p class="train-head__meta">${p.height} cm · ${p.weight} kg · ${esc(p.foot || "")} foot · age ${p.age}</p>
        ${note ? `<p class="train-head__note">${esc(note.role)}</p>` : ""}
      </div>
      <div class="train-head__ovr">
        <span class="train-head__ovr-num">${res.ratings[view.position]}</span>
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
    $("#trainSkillCount").textContent = `${b.skills.length}/${SKILL_CAP}`;
    $("#trainSkills").innerHTML = addable.map((s) => {
      const has = native.has(norm(s.name));
      const sel = b.skills.includes(s.name);
      const full = b.skills.length >= SKILL_CAP && !sel;
      return `<button type="button" class="chip ${sel ? "is-selected" : ""} ${has || full ? "is-disabled" : ""} ${s.avoid ? "chip--warn" : ""}"
        data-skill="${esc(s.name)}" ${has ? "disabled" : ""} title="${esc(has ? "Already native on this card" : s.avoid || s.note || s.tested || s.official || "")}">${esc(s.name)}${has ? " ✓" : ""}</button>`;
    }).join("");
    $("#trainNative").innerHTML = p.skills.map((k) => {
      const kb = KB.SKILLS.find((s) => norm(s.name) === norm(skillLabel(k)));
      return `<span class="tag ${kb?.pool === "excl" ? "tag--excl" : ""}" title="${esc(kb?.note || kb?.tested || kb?.official || "")}">${esc(skillLabel(k))}</span>`;
    }).join("") + (p.comSkills.length ? `<span class="tag tag--ai">AI: ${p.comSkills.map((k) => esc(skillLabel(k))).join(", ")}</span>` : "");

    // Position ratings — laid out like the pitch (attack on top)
    const tile = (pos) => {
      const prof = profAt(p, pos);
      return `<button type="button" class="pmap__tile is-${prof} ${pos === view.position ? "is-current" : ""}" data-pos="${pos}" title="${pos} · ${PROF_LABEL[prof]} proficiency">
        <span>${pos}</span><b>${res.ratings[pos]}</b></button>`;
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
            <div class="srow">
              <span class="srow__label">${statLabel(k)}${hit.length ? `<i class="hit" title="${hit.map((t) => `${t.at} ✓ ${esc(t.note)}`).join(" · ")}">✓${hit[hit.length - 1].at}</i>` : ""}</span>
              <span class="srow__bar">
                <i class="seg seg--base" style="width:${pct(base)}%"></i>
                <i class="seg seg--train" style="left:${pct(base)}%;width:${pct(trained) - pct(base)}%"></i>
                <i class="seg seg--boost" style="left:${pct(trained)}%;width:${pct(fin) - pct(trained)}%"></i>
                ${ticks}
              </span>
              <span class="srow__pills">${trained > base ? `<span class="pill pill--train">+${trained - base}</span>` : ""}${boost ? `<span class="pill pill--boost">+${boost}</span>` : ""}</span>
              <span class="srow__val tier-bg-${statTier(fin)}">${fin}</span>
              <span class="srow__need">${need}</span>
            </div>`;
        }).join("")}
      </section>`).join("");

    // Warnings (KB hard rules)
    const warns = [];
    if (left > 0) warns.push(`<b>${left} point${left > 1 ? "s" : ""} unspent.</b> §12 hard rule: spend every point — park leftovers in Aerial Strength or Defending.`);
    if (left < 0) warns.push(`<b>${-left} points over budget</b> for level cap ${cap}.`);
    const wastedTotal = Object.values(res.wasted).reduce((a, v) => a + v, 0);
    if (wastedTotal) warns.push(`${wastedTotal} stat point(s) lost above the 99 training cap (${Object.keys(res.wasted).map(statLabel).join(", ")}).`);
    b.skills.forEach((n) => {
      const s = KB.SKILLS.find((x) => x.name === n);
      if (s?.avoid) warns.push(`<b>${esc(n)}</b>: ${esc(s.avoid)}`);
    });
    $("#trainWarnings").innerHTML = warns.map((w) => `<li>${w}</li>`).join("");
    $("#trainWarnings").hidden = !warns.length;

    const savedFlag = store.builds[p.id];
    $("#trainSaveState").textContent = savedFlag ? `Saved ${new Date(savedFlag.savedAt).toLocaleString()}` : "Not saved";
  }

  $("#trainPlayer").addEventListener("change", (e) => go("train", e.target.value));
  $("#trainManager").addEventListener("change", (e) => { store.manager = e.target.value; saveStore(); renderTrainer(); renderSquad(); });
  $("#trainTactic").addEventListener("change", (e) => { store.tactic = e.target.value; saveStore(); renderTrainer(); renderSquad(); });
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
    const list = view.draft.skills;
    const i = list.indexOf(n);
    if (i >= 0) list.splice(i, 1); else if (list.length < SKILL_CAP) list.push(n);
    renderTrainer();
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
    if (snap.skills) view.draft.skills = snap.skills.filter((n) => !playerNativeNames(p).has(norm(n))).slice(0, SKILL_CAP);
    renderTrainer();
  });
  $("#trainSave").addEventListener("click", () => {
    store.builds[view.playerId] = { ...structuredClone(view.draft), savedAt: Date.now() };
    saveStore();
    renderPlayerSelect();
    $("#trainPlayer").value = view.playerId;
    $("#trainManager").value = managerKey(store.manager);
    renderTrainer();
    renderSquad();
    renderLineup();
    renderMyBuilds();
  });
  $("#trainDelete").addEventListener("click", () => {
    if (!store.builds[view.playerId]) return;
    delete store.builds[view.playerId];
    saveStore();
    renderPlayerSelect();
    $("#trainPlayer").value = view.playerId;
    $("#trainManager").value = managerKey(store.manager);
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
      `Additional skills: ${b.skills.join(", ") || "—"}`,
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
    const me = isMe();
    const list = me ? profileManagers() : ALL_MANAGERS.filter((m) => m.key.startsWith("ef:") && store.ownedManagers.includes(m.key));
    const current = managerKey(me ? KB.CURRENT_MANAGER : store.manager);
    $("#mgrMeta").textContent = me
      ? "Seven owned cards · team booster is a flat +1/+1 on the whole squad (§17)"
      : `${list.length} owned by ${store.name} · pick them from eFHUB's ${ALL_MANAGERS.filter((m) => m.key.startsWith("ef:")).length} manager cards below`;
    const head = `<tr><th>Manager</th><th>Team booster</th>${KB.TACTICS.map((t) => `<th class="num">${t}</th>`).join("")}${me ? "" : "<th></th>"}</tr>`;
    const row = (m, owned) => `
      <tr class="${m.key === current ? "is-current" : ""}">
        <td><b>${esc(m.name)}</b>${m.key === current ? ` <span class="badge badge--lime">current</span>` : ""}</td>
        <td>${m.boost.map((k) => `${statLabel(k)} +1`).join("<br>") || "—"}</td>
        ${m.prof.map((v) => `<td class="num ${v >= 89 ? "hot" : v >= 70 ? "warm" : ""}">${v ?? "N/A"}</td>`).join("")}
        ${me ? "" : `<td class="actions">${owned
          ? `<button type="button" class="btn btn--icon" data-mgr-current="${esc(m.key)}">Set current</button> <button type="button" class="btn btn--icon btn--danger" data-mgr-toggle="${esc(m.key)}">Remove</button>`
          : `<button type="button" class="btn btn--icon btn--solid" data-mgr-toggle="${esc(m.key)}">+ Owned</button>`}</td>`}
      </tr>`;
    $("#mgrTable").innerHTML = `<thead>${head}</thead><tbody>${list.map((m) => row(m, true)).join("") || `<tr><td colspan="9"><em>No managers yet — add ${esc(store.name)}'s cards from the list below.</em></td></tr>`}</tbody>`;
    $("#mgrPickerBox").hidden = me;
    $("#mgrLinkBox").hidden = !me;
    if (!me) {
      const q = mgrState.q.trim().toLowerCase();
      const pool = ALL_MANAGERS.filter((m) => m.key.startsWith("ef:") && !store.ownedManagers.includes(m.key))
        .filter((m) => !q || `${m.name} ${m.boost.map(statLabel).join(" ")}`.toLowerCase().includes(q));
      $("#mgrPool").innerHTML = `<thead>${head}</thead><tbody>${pool.map((m) => row(m, false)).join("")}</tbody>`;
      return;
    }

    $("#mgrLinks").innerHTML = KB.MANAGERS.map((m) => {
      const cp = playersFitting(m.centerPiece);
      const km = playersFitting(m.keyMan);
      const live = cp.length && km.length;
      return `
        <article class="kb-card">
          <header class="kb-card__head">
            <h3>${esc(m.name)}</h3>
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
    "4-4-2": [...BACK4, ["LMF", 12, 55], ["CMF", 37, 50], ["CMF", 63, 50], ["RMF", 88, 55], ["CF", 37, 84], ["CF", 63, 84]],
    "4-1-4-1": [...BACK4, ["DMF", 50, 38], ["LMF", 12, 58], ["CMF", 37, 56], ["CMF", 63, 56], ["RMF", 88, 58], ["CF", 50, 86]],
    "3-4-3": [...BACK3, ["LMF", 11, 52], ["DMF", 38, 44], ["DMF", 62, 44], ["RMF", 89, 52], ["LWF", 17, 79], ["CF", 50, 86], ["RWF", 83, 79]],
    "3-5-2": [...BACK3, ["LMF", 10, 56], ["CMF", 32, 51], ["DMF", 50, 41], ["CMF", 68, 51], ["RMF", 90, 56], ["CF", 37, 85], ["CF", 63, 85]],
    "5-3-2": [["LB", 8, 32], ["CB", 29, 20], ["CB", 50, 18], ["CB", 71, 20], ["RB", 92, 32], ["CMF", 27, 51], ["DMF", 50, 43], ["CMF", 73, 51], ["CF", 37, 84], ["CF", 63, 84]],
  };
  const TEAM_TACTICS = ["Possession", "Quick Counter", "Long Ball Counter", "Out Wide", "Long Ball"];
  const BENCH_MAX = 12;
  const slotsFor = (f) => [["GK", 50, 6], ...(FORMATIONS[f] || FORMATIONS["4-3-3"])];
  const OUTFIELD_ROLES = ["CB", "LB", "RB", "DMF", "CMF", "LMF", "RMF", "AMF", "LWF", "RWF", "SS", "CF"];

  // Per-lineup slot layout [role, x, y]; starts from the formation preset and can be
  // edited by dragging markers or picking a role.
  function layoutOf(l) {
    if (!Array.isArray(l.layout) || l.layout.length !== 11) l.layout = slotsFor(l.formation).map((s) => [...s]);
    return l.layout;
  }
  const isEdited = (l) => JSON.stringify(layoutOf(l)) !== JSON.stringify(slotsFor(l.formation));

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
    return { id: uid(), name, formation: "4-2-2-2", manager: isMe() ? KB.CURRENT_MANAGER : store.manager, tactic: store.tactic || "Long Ball Counter",
      xi: Array(11).fill(null), bench: [], subs: [], notes: "" };
  }
  function activeLineup() {
    if (!store.lineups.length) store.lineups.push(newLineup());
    let l = store.lineups.find((x) => x.id === store.activeLineup);
    if (!l) { l = store.lineups[0]; store.activeLineup = l.id; }
    return l;
  }
  const lu = { sel: null, q: "", mode: "players", justDragged: false }; // sel = { area: "xi"|"bench", i }

  function slotRating(p, pos, l) {
    const build = store.builds[p.id] || emptyBuild(p);
    return compute(p, build, l.manager, l.tactic).ratings[pos];
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
    [...l.xi, ...l.bench].filter(Boolean).forEach((id) => { const n = norm(byId[id]?.name); (names[n] ||= []).push(id); });
    Object.values(names).filter((ids) => ids.length > 1).forEach((ids) =>
      w.push(`<b>${esc(byId[ids[0]].name)}</b> is selected ${ids.length}× (different cards of the same player).`));
    const destroyerCBs = l.xi.filter((id, i) => byId[id] && slots[i][0] === "CB" &&
      [byId[id].playingStyle, byId[id].playingStyleDefensive].some((s) => norm(s) === "destroyer"));
    if (destroyerCBs.length > 1) w.push(`<b>${destroyerCBs.length} Destroyer CBs</b> — both can step out at once; pair a Destroyer with Build Up / Covering Role (§18).`);
    return w;
  }

  function linkUpStatus(l) {
    const m = managerObj(l.manager);
    if (!m || !m.centerPiece) return null; // eFHUB-only managers carry no Link-up data
    const slots = layoutOf(l);
    const find = ([style, positions]) => {
      const set = positions.split("/");
      return l.xi.map((id, i) => ({ p: byId[id], pos: slots[i][0] }))
        .filter(({ p, pos }) => p && set.includes(pos) &&
          (norm(p.playingStyle) === norm(style) || norm(p.playingStyleDefensive) === norm(style)))
        .map(({ p }) => p);
    };
    return { m, cp: find(m.centerPiece), km: find(m.keyMan) };
  }

  function renderLineup() {
    if (!$("#luPitch")) return;
    const l = activeLineup();
    const slots = layoutOf(l);
    while (l.xi.length < 11) l.xi.push(null);
    l.xi.length = 11;

    $("#luSelect").innerHTML = store.lineups.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join("");
    $("#luSelect").value = l.id;
    $("#luName").value = l.name;
    $("#luFormation").innerHTML = Object.keys(FORMATIONS).map((f) => `<option>${f}</option>`).join("");
    $("#luFormation").value = l.formation;
    $("#luLayoutState").textContent = isEdited(l) ? `${l.formation} · edited` : l.formation;
    $("#luResetLayout").hidden = !isEdited(l);
    $("#luModes").querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("is-on", b.dataset.mode === lu.mode));
    $("#luPitch").classList.toggle("is-editing", lu.mode === "positions");
    $("#luModeHint").textContent = lu.mode === "positions"
      ? "Drag a marker to move it — its role follows the pitch zone. Tap a marker to set the role by hand."
      : "Drag a player onto another slot or the bench to swap. Tap a slot to pick from the squad.";
    const mgrs = profileManagers();
    const cur = managerObj(l.manager);
    $("#luManager").innerHTML = `<option value="">No manager</option>` + (cur && !mgrs.includes(cur) ? managerOption(cur) : "") + mgrs.map(managerOption).join("");
    $("#luManager").value = managerKey(l.manager);
    $("#luTactic").innerHTML = TEAM_TACTICS.map((t) => `<option>${t}</option>`).join("");
    $("#luTactic").value = l.tactic;

    // Pitch
    const ratings = [];
    $("#luPitch").innerHTML = `<div class="pitch__lines" aria-hidden="true"><i class="pitch__half"></i><i class="pitch__circle"></i><i class="pitch__box pitch__box--own"></i><i class="pitch__box pitch__box--opp"></i></div>` +
      slots.map(([pos, x, y], i) => {
        const p = byId[l.xi[i]];
        const sel = lu.sel?.area === "xi" && lu.sel.i === i;
        if (!p) {
          return `<button type="button" class="slot slot--empty ${sel ? "is-selected" : ""}" style="left:${x}%;bottom:${y}%" data-slot="${i}" aria-label="Pick ${pos}">
            <span class="slot__ovr">+</span><span class="slot__pos">${pos}</span></button>`;
        }
        const r = slotRating(p, pos, l);
        ratings.push(r);
        const prof = proficiency(p, pos);
        const bad = styleFit(p, pos).some((f) => !f.ok);
        return `<button type="button" class="slot slot--${prof} ${sel ? "is-selected" : ""} ${bad ? "slot--style" : ""}" style="left:${x}%;bottom:${y}%" data-slot="${i}"
            title="${esc(p.name)} — ${pos} ${r}${store.builds[p.id] ? " (saved build)" : " (untrained)"}">
          <span class="slot__ovr">${r}${store.builds[p.id] ? "<sup>★</sup>" : ""}</span>
          <span class="slot__name">${esc(shortName(p))}</span>
          <span class="slot__pos">${pos}</span></button>`;
      }).join("");

    // Bench
    const benchCells = l.bench.map((id, i) => {
      const p = byId[id];
      if (!p) return "";
      const sel = lu.sel?.area === "bench" && lu.sel.i === i;
      return `<button type="button" class="bench-cell ${sel ? "is-selected" : ""}" data-bench="${i}">
        <b>${p.overall}</b><span>${esc(p.name)}</span><em>${p.position}</em></button>`;
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
    const tIdx = KB.TACTICS.indexOf(l.tactic);
    const prof = m && tIdx >= 0 ? m.prof[tIdx] : null;
    const link = linkUpStatus(l);
    $("#luSummary").innerHTML = `
      <div class="lu-kpis">
        <div><b>${avg}</b><span>avg XI rating</span></div>
        <div><b>${ratings.length}/11</b><span>starters</span></div>
        <div><b class="${prof >= 89 ? "is-hot" : ""}">${prof ?? "—"}</b><span>${esc(l.tactic)} proficiency${prof != null ? ` · +${((skillMultiplier(prof) - 1) * 100).toFixed(1)}%` : ""}</span></div>
      </div>
      ${m ? `<p class="lu-line">Team booster: ${m.boost.map((k) => `${statLabel(k)} +1`).join(", ")}, plus the proficiency multiplier — both included in the ratings.</p>` : ""}
      ${link ? `<div class="lu-link ${link.cp.length && link.km.length ? "is-on" : ""}">
          <span class="field__label">Link-up · ${esc(link.m.linkUp)}</span>
          <p>Center Piece (${esc(link.m.centerPiece.join(" "))}): ${link.cp.length ? link.cp.map((p) => esc(p.name)).join(", ") : "<em>not in XI</em>"}</p>
          <p>Key Man (${esc(link.m.keyMan.join(" "))}): ${link.km.length ? link.km.map((p) => esc(p.name)).join(", ") : "<em>not in XI</em>"}</p>
          <p class="lu-link__state">${link.cp.length && link.km.length ? "Active" : "Inactive — both roles must be fielded"}</p>
        </div>` : ""}`;
    const warns = lineupWarnings(l);
    if (m && prof == null) warns.unshift(`<b>${esc(m.name)}</b> has no ${esc(l.tactic)} proficiency (N/A) — pick another team playstyle.`);
    else if (m && prof < PROF_MIN) warns.unshift(`${esc(l.tactic)} proficiency ${prof} is below 70 — the in-game penalty isn't modelled, ratings assume 70.`);
    $("#luWarnings").innerHTML = warns.map((x) => `<li>${x}</li>`).join("");
    $("#luWarnings").hidden = !warns.length;

    renderPicker(l, slots);
    renderSubs(l, slots);
    $("#luNotes").value = l.notes || "";
  }

  function renderPicker(l, slots) {
    const box = $("#luPicker");
    if (!lu.sel) {
      box.innerHTML = `<p class="empty-state">Tap a position on the pitch or a bench slot to pick a player.</p>`;
      return;
    }
    const pos = lu.sel.area === "xi" ? slots[lu.sel.i][0] : null;
    const current = lu.sel.area === "xi" ? l.xi[lu.sel.i] : l.bench[lu.sel.i];
    const q = lu.q.trim().toLowerCase();
    const rows = players
      .filter((p) => !q || `${p.name} ${p.team} ${p.position}`.toLowerCase().includes(q))
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

  $("#luPitch").addEventListener("click", (e) => {
    const b = e.target.closest("[data-slot]");
    if (!b || lu.justDragged) return;
    const i = Number(b.dataset.slot);
    lu.sel = lu.sel?.area === "xi" && lu.sel.i === i ? null : { area: "xi", i };
    renderLineup();
  });
  $("#luBench").addEventListener("click", (e) => {
    const b = e.target.closest("[data-bench]");
    if (!b || lu.justDragged) return;
    const i = Number(b.dataset.bench);
    lu.sel = lu.sel?.area === "bench" && lu.sel.i === i ? null : { area: "bench", i };
    renderLineup();
  });
  $("#luPicker").addEventListener("click", (e) => {
    const l = activeLineup();
    const pick = e.target.closest("[data-pick]");
    const act = e.target.closest("[data-lu]");
    if (pick) { placePlayer(l, pick.dataset.pick); saveLineup(); renderLineup(); }
    const role = e.target.closest("[data-role]");
    if (role && lu.sel?.area === "xi") { layoutOf(l)[lu.sel.i][0] = role.dataset.role; saveLineup(); renderLineup(); return; }
    if (act?.dataset.lu === "cancel") { lu.sel = null; renderLineup(); }
    if (act?.dataset.lu === "others") { lu.showOthers = !lu.showOthers; renderPicker(l, layoutOf(l)); }
    if (act?.dataset.lu === "clear") {
      if (lu.sel.area === "xi") l.xi[lu.sel.i] = null; else l.bench.splice(lu.sel.i, 1);
      lu.sel = null; saveLineup(); renderLineup();
    }
  });
  $("#luPicker").addEventListener("input", (e) => {
    if (e.target.id !== "luSearch") return;
    lu.q = e.target.value;
    const pos = e.target.selectionStart;
    renderPicker(activeLineup(), layoutOf(activeLineup()));
    const s = $("#luSearch"); s.focus(); s.setSelectionRange(pos, pos);
  });
  $("#luSelect").addEventListener("change", (e) => { store.activeLineup = e.target.value; lu.sel = null; saveLineup(); renderLineup(); });
  $("#luName").addEventListener("change", (e) => { activeLineup().name = e.target.value.trim() || "Untitled"; saveLineup(); renderLineup(); });
  $("#luFormation").addEventListener("change", (e) => {
    const l = activeLineup();
    l.formation = e.target.value;
    l.layout = null;
    lu.sel = null; saveLineup(); renderLineup();
  });
  $("#luResetLayout").addEventListener("click", () => { activeLineup().layout = null; saveLineup(); renderLineup(); });
  $("#luModes").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]");
    if (!b) return;
    lu.mode = b.dataset.mode;
    renderLineup();
  });
  $("#luManager").addEventListener("change", (e) => { activeLineup().manager = e.target.value; saveLineup(); renderLineup(); });
  $("#luTactic").addEventListener("change", (e) => { activeLineup().tactic = e.target.value; saveLineup(); renderLineup(); });
  $("#luNotes").addEventListener("change", (e) => { activeLineup().notes = e.target.value; saveLineup(); });
  $("#luNew").addEventListener("click", () => {
    const l = newLineup(`Lineup ${store.lineups.length + 1}`);
    store.lineups.push(l); store.activeLineup = l.id; lu.sel = null; saveLineup(); renderLineup();
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
    const text = [
      `${l.name} — ${l.formation} · ${l.tactic}${l.manager ? ` · ${l.manager}` : ""}`,
      ...l.xi.map((id, i) => `${slots[i][0].padEnd(4)} ${byId[id] ? `${byId[id].name} (${slotRating(byId[id], slots[i][0], l)})` : "—"}`),
      `Bench: ${l.bench.map((id) => byId[id]?.name).filter(Boolean).join(", ") || "—"}`,
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
        layoutOf(l)[d.src.i] = [roleAt(x, y), x, y];
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
  // the chosen manager/playstyle for a friend.
  const recContext = () => (isMe() ? { manager: KB.CURRENT_MANAGER, tactic: "Long Ball Counter" } : { manager: store.manager, tactic: store.tactic });
  const recContextLabel = () => { const c = recContext(); return `${managerObj(c.manager)?.name || "no manager"} at ${c.tactic}`; };
  let REC = null; // filled at init (needs the multiplier table above)
  const makeRecommender = () => window.Recommender({
    players, KB, OVR, norm, skillLabel, categoriesFor, levelCost, cumCost, budgetFor, profAt,
    skillMultiplier, managerProficiency, managerObj, notesFor, context: recContext(), MAX_LEVEL, boosterPool: DATA.boosterPool,
  });
  const recState = { q: "", group: "ALL" };
  const mineState = { q: "", group: "ALL", onlyMine: false };

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
  const ctxRating = (p, build, pos = p.position) => compute(p, build, recContext().manager, recContext().tactic).ratings[pos];
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

  function renderRecommended() {
    if (!REC) return;
    const q = recState.q.trim().toLowerCase();
    const list = players
      .filter((p) => recState.group === "ALL" || POSITION_GROUP[p.position] === recState.group)
      .filter((p) => !q || `${p.name} ${p.team} ${p.position} ${styleText(p)}`.toLowerCase().includes(q))
      .sort((a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position) || REC.recs[b.id].rating - REC.recs[a.id].rating);
    $("#recMeta").textContent = `${list.length} builds · rated with ${recContextLabel()}`;
    $("#recGrid").innerHTML = list.map((p) => {
      const r = REC.recs[p.id];
      const cats = categoriesFor(p);
      const pts = cats.reduce((t, c) => t + cumCost(r.levels[c.key] || 0), 0);
      const att = KB.ATT_STYLES.find((s) => norm(s.name) === norm(p.playingStyle));
      const def = KB.DEF_STYLES.find((s) => norm(s.name) === norm(p.playingStyleDefensive || p.playingStyle));
      const b = r.booster;
      const slot1 = Object.keys(p.booster1?.stats || {});
      const mine = store.builds[p.id];
      return `
        <article class="rec-card" data-group="${POSITION_GROUP[p.position]}">
          <header class="rec-card__head">
            ${cardImg(p, "rec-card__img")}
            <div class="rec-card__who">
              <h3>${esc(p.name)}</h3>
              <p>${esc(p.team || "")} · ${p.height} cm · Lv cap ${p.levelCap}</p>
              <div class="kb-card__badges">
                ${lineupRole(p.id) ? `<span class="badge badge--lime">${lineupRole(p.id).label} in lineup</span>` : ""}
                <span class="badge">#${r.depth.rank}/${r.depth.of} ${p.position}</span>
                ${r.lock ? `<span class="badge badge--green">Lock</span>` : `<span class="badge badge--amber">Test variant</span>`}
                ${mine ? `<span class="badge">★ you have a build</span>` : ""}
              </div>
            </div>
            <div class="rec-card__ovr"><b>${r.rating}</b><span>${p.position} · card ${p.overall}</span></div>
          </header>

          <section class="rec-sec">
            <h4>Role</h4>
            <p><b>${p.position} — Attacking: ${esc(att?.name || p.playingStyle || "Basic")} · Defensive: ${esc(p.playingStyleDefensive ? (def?.name || p.playingStyleDefensive) : "—")}</b></p>
            <p class="rec-muted">${esc(r.roleLabel)} priorities (§7).</p>
            <div class="rec-style">${styleGuideHtml(p, p.position)}</div>
            ${r.notes.map((n) => `<p class="rec-note">${esc(n)}</p>`).join("")}
          </section>

          <section class="rec-sec">
            <h4>Build <span class="rec-muted">${pts}/${budgetFor(p.levelCap)} pts</span></h4>
            <div class="rec-levels">${cats.map((c) => `<span class="${r.levels[c.key] ? "" : "is-zero"}"><b>${r.levels[c.key] || 0}</b><i>${c.label.replace("Lower Body Strength", "Lower Body").replace("Aerial Strength", "Aerial")}</i></span>`).join("")}</div>
          </section>

          <section class="rec-sec">
            <h4>Booster</h4>
            <p><b>${esc(b.name)}</b> — ${Object.keys(b.stats).map(statLabel).join(", ")}${r.boosterFixed ? " <span class=\"rec-muted\">(fixed on this card)</span>" : ""}</p>
            <p class="rec-muted">${r.boosterFixed ? "Slot 2 is pre-assigned on this card." : `Picked last, on the finished build (§11)${slot1.length ? ` — slot 1 (${esc(p.booster1.name)}) already covers ${slot1.map(statLabel).join(", ")}` : ""}${r.boosterOverlap ? `; overlaps ${r.boosterOverlap} of them` : ""}.`}</p>
          </section>

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
        </article>`;
    }).join("") || `<p class="empty-state">No players match.</p>`;
  }

  function useRecommendation(id) {
    const p = byId[id];
    if (store.builds[id] && !confirm(`Replace your saved build for ${p.name} with the recommended one?`)) return;
    store.builds[id] = { ...recBuild(id), savedAt: Date.now() };
    saveStore();
    renderPlayerSelect();
    renderRecommended(); renderMyBuilds(); renderSquad(); renderLineup();
  }

  function renderMyBuilds() {
    if (!REC) return;
    const q = mineState.q.trim().toLowerCase();
    const list = players
      .filter((p) => mineState.group === "ALL" || POSITION_GROUP[p.position] === mineState.group)
      .filter((p) => !mineState.onlyMine || store.builds[p.id])
      .filter((p) => !q || `${p.name} ${p.team} ${p.position}`.toLowerCase().includes(q))
      .sort((a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position) || b.overall - a.overall);
    const total = Object.keys(store.builds).filter((id) => byId[id]).length;
    $("#mineMeta").textContent = `${total} of ${players.length} players have your build · ratings use ${recContextLabel()} for both columns`;
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
        if ([...mine.skills].sort().join() !== [...rb.skills].sort().join()) changes.push("skills");
        status = changes.length ? `<span class="badge badge--amber">Tweaked: ${changes.join(", ")}</span>` : `<span class="badge badge--green">Same as recommended</span>`;
        const b2name = b2?.name || "—";
        diffs = `<small>${esc(b2name)} · ${mine.skills.length} skills</small>`;
      }
      return `
        <tr>
          <td><button type="button" class="linkish linkish--strong" data-open-player="${p.id}">${esc(p.name)}</button><small>${p.position} · ${esc(p.team || "")}</small></td>
          <td><code>${line(rb)}</code><small>${esc(r.booster.name)}</small></td>
          <td class="num">${rOvr}</td>
          <td>${mine ? `<code>${line(mine)}</code>${diffs}` : "<em>—</em>"}</td>
          <td class="num">${mOvr} ${delta}</td>
          <td>${status}</td>
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
  }
  bindFilter("rec", recState, renderRecommended);
  bindFilter("mine", mineState, renderMyBuilds);
  $("#mineOnly").addEventListener("change", (e) => { mineState.onlyMine = e.target.checked; renderMyBuilds(); });

  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-rec-open]");
    if (open) openInTrainer(open.dataset.recOpen, recBuild(open.dataset.recOpen));
    const use = e.target.closest("[data-rec-use]");
    if (use) useRecommendation(use.dataset.recUse);
    const edit = e.target.closest("[data-mine-edit]");
    if (edit) {
      const id = edit.dataset.mineEdit;
      openInTrainer(id, store.builds[id] || recBuild(id));
    }
  });
  $("#trainLoadRec").addEventListener("click", () => {
    const p = byId[view.playerId];
    view.draft = recBuild(p.id);
    renderTrainer();
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
    saveStore();
    refreshAll();
    route();
  }

  function renderProfileBar() {
    $("#profileSelect").innerHTML = Object.entries(root.profiles).map(([id, p]) =>
      `<option value="${esc(id)}">${esc(id === "me" ? "My squad" : `${p.name}'s squad`)}${id.startsWith("file:") ? " (repo)" : ""}</option>`).join("");
    $("#profileSelect").value = root.active;
    $("#profileRename").hidden = isMe();
    $("#profileDelete").hidden = isMe();
    document.body.classList.toggle("is-friend", !isMe());
    $("#squad-heading").textContent = isMe() ? "MY SQUAD" : `${store.name.toUpperCase()}'S SQUAD`;
    $("#friendBanner").hidden = isMe();
    $("#friendBannerName").textContent = store.name;
  }

  function refreshAll() {
    renderProfileBar();
    rebuildPlayers();
    rebuildNativeIndex();
    REC = makeRecommender();
    if (!byId[view.playerId]) view.playerId = null;
    renderPlayerSelect();
    renderSquad(); renderSkills(); renderManagers(); renderStyles(); renderLineup(); renderRecommended(); renderMyBuilds();
    renderRemoved();
  }

  function renderRemoved() {
    const all = [...(isMe() ? DATA.players : FRIEND_FILES[store.fileKey]?.players || []), ...Object.values(store.customPlayers)];
    const gone = store.removed.map((id) => all.find((p) => p.id === id)).filter(Boolean);
    $("#removedBox").hidden = !gone.length;
    $("#removedCount").textContent = gone.length;
    $("#removedList").innerHTML = gone.map((p) => `
      <li><span>${esc(p.name)} <small>${p.position} ${p.overall} · ${esc(p.team || "")}</small></span>
        <button type="button" class="btn btn--icon" data-restore="${p.id}">Restore</button></li>`).join("");
  }

  $("#addToggle").addEventListener("click", () => {
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
      const base = isMe() ? DATA.players : FRIEND_FILES[store.fileKey]?.players || [];
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

  $("#profileSelect").addEventListener("change", (e) => switchProfile(e.target.value));
  $("#profileNew").addEventListener("click", () => {
    const name = (window.prompt("Friend's name:") || "").trim();
    if (!name) return;
    const id = `f_${Date.now().toString(36)}`;
    root.profiles[id] = blankProfile("friend", name);
    switchProfile(id);
    go("squad");
    $("#addPanel").hidden = false;
  });
  $("#profileRename").addEventListener("click", () => {
    const name = (window.prompt("Rename squad:", store.name) || "").trim();
    if (!name) return;
    store.name = name;
    saveStore();
    renderProfileBar();
  });
  $("#profileDelete").addEventListener("click", () => {
    if (isMe()) return;
    const fromFile = root.active.startsWith("file:");
    if (!confirm(`Delete ${store.name}'s squad and all its builds and lineups from this browser?${fromFile ? " (The squad itself comes from data/friends.js and will come back empty.)" : ""}`)) return;
    delete root.profiles[root.active];
    switchProfile("me");
  });

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */

  REC = makeRecommender();
  renderProfileBar();
  renderRemoved();
  renderPlayerSelect();
  renderSquad();
  renderSkills();
  renderManagers();
  renderStyles();
  renderLineup();
  route();
})();
