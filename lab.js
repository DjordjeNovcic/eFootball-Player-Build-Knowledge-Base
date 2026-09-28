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
  const statTier = (v) => (v >= 90 ? "elite" : v >= 80 ? "good" : v >= 70 ? "ok" : "low");

  const players = DATA.players;
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  const playerNativeNames = (p) => new Set(p.skills.map((k) => norm(skillLabel(k))));

  function cardImg(p, cls) {
    return `<img class="${cls}" src="${esc(p.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`;
  }

  /* ---------------------------------------------------------
     Persistence (per-viewer, this browser only)
  --------------------------------------------------------- */

  function loadStore() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      return { builds: s.builds || {}, manager: s.manager ?? KB.CURRENT_MANAGER, lineups: s.lineups || [], activeLineup: s.activeLineup };
    } catch {
      return { builds: {}, manager: KB.CURRENT_MANAGER, lineups: [] };
    }
  }
  const store = loadStore();
  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* private mode */ }
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

  function managerObj(name = store.manager) {
    return KB.MANAGERS.find((m) => m.name === name) || null;
  }

  function compute(p, build, managerName = store.manager) {
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
    const final = { ...trained };
    const boostOf = {};
    const add = (stats) => Object.entries(stats || {}).forEach(([k, v]) => {
      final[k] += v;
      boostOf[k] = (boostOf[k] || 0) + v;
    });
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

  const TABS = ["squad", "train", "lineup", "skills", "managers", "styles", "sandbox"];
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
    if (active === "train") openTrainer(arg && byId[arg] ? arg : view.playerId || defaultPlayerId());
    if (active === "lineup") renderLineup();
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
      .filter((p) => !q || `${p.name} ${p.team} ${p.position} ${styleText(p)} ${p.id}`.toLowerCase().includes(q))
      .sort((a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position) || b.overall - a.overall);

    const counts = players.reduce((c, p) => ((c[POSITION_GROUP[p.position]] = (c[POSITION_GROUP[p.position]] || 0) + 1), c), {});
    $("#squadMeta").textContent =
      `${players.length} cards · GK ${counts.GK || 0} · DEF ${counts.DEF || 0} · MID ${counts.MID || 0} · FWD ${counts.FWD || 0} · stats from eFHUB, ${DATA.fetched}`;

    root.innerHTML = list.map((p) => {
      const note = KB.SQUAD_NOTES[p.id];
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
            <p class="squad-card__boost">${esc(p.booster1?.name || "No booster")}${p.booster2Fixed ? " + " + esc(p.booster2Fixed.name) : ""}</p>
            ${note ? `<p class="squad-card__note">${esc(note.role)}</p>` : ""}
            <div class="squad-card__foot">
              ${savedBadge}
              <span class="squad-card__pts">Lv cap ${p.levelCap} · ${budgetFor(p.levelCap)} pts</span>
            </div>
            <div class="squad-card__actions">
              <button type="button" class="btn btn--icon btn--solid" data-open-player="${p.id}">Train</button>
              <a class="btn btn--icon" href="https://efhub.com/players/${p.id}" target="_blank" rel="noopener">eFHUB ↗</a>
            </div>
          </div>
        </article>`;
    }).join("") || `<p class="empty-state">No cards match.</p>`;
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
    $("#trainManager").innerHTML = `<option value="">No manager</option>` +
      KB.MANAGERS.map((m) => `<option value="${esc(m.name)}">${esc(m.name)} — ${m.boost.map(statLabel).join(" +1, ")} +1</option>`).join("");
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
    $("#trainManager").value = store.manager || "";
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
    const note = KB.SQUAD_NOTES[p.id];

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

    // Position ratings
    const fam = Object.fromEntries(p.additionalPositions.map((a) => [a.position, a.familiarity]));
    $("#trainPositions").innerHTML = POS_ORDER.map((pos) => {
      const cls = pos === p.position ? "is-primary" : fam[pos] ? "is-extra" : "";
      return `<button type="button" class="pos-cell ${cls} ${pos === view.position ? "is-current" : ""}" data-pos="${pos}">
        <span>${pos}</span><b>${res.ratings[pos]}</b></button>`;
    }).join("");

    // Stats
    const showGK = isGK(p);
    $("#trainStats").innerHTML = KB.STAT_GROUPS.filter((g) => showGK || g.title !== "Goalkeeping").map((g) => `
      <div class="stat-block">
        <h4 class="stat-group__title">${g.title}</h4>
        ${g.stats.map((k) => {
          const base = p.stats[k];
          const trainedGain = res.trained[k] - base;
          const boost = res.boostOf[k] || 0;
          const fin = res.final[k];
          const th = showGK ? [] : (KB.THRESHOLDS[k] || []);
          const thHtml = th.map((t) => `<span class="th ${fin >= t.at ? "th--hit" : "th--miss"}" title="${esc(t.note)}">${t.at}${fin >= t.at ? " ✓" : ` −${t.at - fin}`}</span>`).join("");
          const waste = res.wasted[k] ? `<span class="th th--waste" title="Points past the 99 training cap are lost">${res.wasted[k]} over 99</span>` : "";
          return `
            <div class="stat-line">
              <span class="stat-line__label">${statLabel(k)}</span>
              <span class="stat-line__bar"><i style="width:${Math.min(100, (base / 105) * 100)}%"></i><i class="gain" style="width:${Math.min(100, ((trainedGain + boost) / 105) * 100)}%"></i></span>
              <span class="stat-line__delta">${trainedGain ? `+${trainedGain}` : ""}${boost ? ` <em>+${boost}</em>` : ""}</span>
              <span class="stat-line__val tier-${statTier(fin)}">${fin}</span>
              <span class="stat-line__th">${thHtml}${waste}</span>
            </div>`;
        }).join("")}
      </div>`).join("");

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
  $("#trainManager").addEventListener("change", (e) => { store.manager = e.target.value; saveStore(); renderTrainer(); });
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
  $("#trainReset").addEventListener("click", () => {
    const p = byId[view.playerId];
    view.draft = { ...emptyBuild(p), booster2: view.draft.booster2 };
    renderTrainer();
  });
  $("#trainSnapshot").addEventListener("click", () => {
    const p = byId[view.playerId];
    const snap = KB.SQUAD_NOTES[p.id]?.snapshot;
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
    $("#trainManager").value = store.manager || "";
    renderTrainer();
    renderSquad();
    renderLineup();
  });
  $("#trainDelete").addEventListener("click", () => {
    if (!store.builds[view.playerId]) return;
    delete store.builds[view.playerId];
    saveStore();
    renderPlayerSelect();
    $("#trainPlayer").value = view.playerId;
    $("#trainManager").value = store.manager || "";
    renderTrainer();
    renderSquad();
    renderLineup();
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
    const blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), ...store }, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "build-lab-backup.json" });
    document.body.appendChild(a); a.click(); a.remove();
  });
  $("#trainImport").addEventListener("click", () => $("#trainImportFile").click());
  $("#trainImportFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      Object.assign(store.builds, parsed.builds || {});
      const known = new Set(store.lineups.map((l) => l.id));
      (parsed.lineups || []).forEach((l) => { if (!known.has(l.id)) store.lineups.push(l); });
      saveStore();
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
  players.forEach((p) => p.skills.forEach((k) => { (nativeIndex[norm(skillLabel(k))] ||= []).push(p); }));

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

  function renderManagers() {
    const head = `<tr><th>Manager</th><th>Team booster</th>${KB.TACTICS.map((t) => `<th class="num">${t}</th>`).join("")}</tr>`;
    const rows = KB.MANAGERS.map((m) => `
      <tr class="${m.name === KB.CURRENT_MANAGER ? "is-current" : ""}">
        <td><b>${esc(m.name)}</b>${m.name === KB.CURRENT_MANAGER ? ` <span class="badge badge--lime">current</span>` : ""}</td>
        <td>${m.boost.map((k) => `${statLabel(k)} +1`).join("<br>")}</td>
        ${m.prof.map((v) => `<td class="num ${v >= 89 ? "hot" : v >= 70 ? "warm" : ""}">${v ?? "N/A"}</td>`).join("")}
      </tr>`).join("");
    $("#mgrTable").innerHTML = `<thead>${head}</thead><tbody>${rows}</tbody>`;

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
  function proficiency(p, pos) {
    if (p.position === pos) return "primary";
    return p.additionalPositions.some((a) => a.position === pos) ? "extra" : "none";
  }

  const uid = () => `l_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  function newLineup(name = "My XI") {
    return { id: uid(), name, formation: "4-2-2-2", manager: KB.CURRENT_MANAGER, tactic: "Long Ball Counter",
      xi: Array(11).fill(null), bench: [], subs: [], notes: "" };
  }
  function activeLineup() {
    if (!store.lineups.length) store.lineups.push(newLineup());
    let l = store.lineups.find((x) => x.id === store.activeLineup);
    if (!l) { l = store.lineups[0]; store.activeLineup = l.id; }
    return l;
  }
  const lu = { sel: null, q: "" }; // sel = { area: "xi"|"bench", i }

  function slotRating(p, pos, l) {
    const build = store.builds[p.id] || emptyBuild(p);
    return compute(p, build, l.manager).ratings[pos];
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
    const slots = slotsFor(l.formation);
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
    if (!m) return null;
    const slots = slotsFor(l.formation);
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
    const slots = slotsFor(l.formation);
    while (l.xi.length < 11) l.xi.push(null);
    l.xi.length = 11;

    $("#luSelect").innerHTML = store.lineups.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join("");
    $("#luSelect").value = l.id;
    $("#luName").value = l.name;
    $("#luFormation").innerHTML = Object.keys(FORMATIONS).map((f) => `<option>${f}</option>`).join("");
    $("#luFormation").value = l.formation;
    $("#luManager").innerHTML = `<option value="">No manager</option>` + KB.MANAGERS.map((m) => `<option value="${esc(m.name)}">${esc(m.name)}</option>`).join("");
    $("#luManager").value = l.manager || "";
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
        <div><b class="${prof >= 89 ? "is-hot" : ""}">${prof ?? "—"}</b><span>${esc(l.tactic)} proficiency</span></div>
      </div>
      ${m ? `<p class="lu-line">Team booster: ${m.boost.map((k) => `${statLabel(k)} +1`).join(", ")} — included in the ratings.</p>` : ""}
      ${link ? `<div class="lu-link ${link.cp.length && link.km.length ? "is-on" : ""}">
          <span class="field__label">Link-up · ${esc(link.m.linkUp)}</span>
          <p>Center Piece (${esc(link.m.centerPiece.join(" "))}): ${link.cp.length ? link.cp.map((p) => esc(p.name)).join(", ") : "<em>not in XI</em>"}</p>
          <p>Key Man (${esc(link.m.keyMan.join(" "))}): ${link.km.length ? link.km.map((p) => esc(p.name)).join(", ") : "<em>not in XI</em>"}</p>
          <p class="lu-link__state">${link.cp.length && link.km.length ? "Active" : "Inactive — both roles must be fielded"}</p>
        </div>` : ""}`;
    const warns = lineupWarnings(l);
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
      .map((p) => ({ p, r: pos ? slotRating(p, pos, l) : p.overall }))
      .sort((a, b) => b.r - a.r);
    box.innerHTML = `
      <div class="picker__head">
        <span class="field__label">${pos ? `Pick ${pos}` : "Pick a substitute"}</span>
        <div class="panel__actions">
          ${current ? `<button type="button" class="btn btn--icon btn--danger" data-lu="clear">Remove</button>` : ""}
          <button type="button" class="btn btn--icon" data-lu="cancel">Close</button>
        </div>
      </div>
      <input type="text" id="luSearch" placeholder="Search…" value="${esc(lu.q)}" aria-label="Search players">
      <div class="picker__list">${rows.map(({ p, r }) => {
        const where = l.xi.includes(p.id) ? "XI" : l.bench.includes(p.id) ? "Bench" : "";
        const prof = pos ? proficiency(p, pos) : "primary";
        const fit = pos ? styleFit(p, pos) : [];
        return `<button type="button" class="pick ${p.id === current ? "is-current" : ""}" data-pick="${p.id}">
          <b class="pick__r pick__r--${prof}">${r}</b>
          <span class="pick__name">${esc(p.name)}<small>${p.position} ${p.overall} · ${esc(styleText(p))}</small></span>
          <span class="pick__tags">
            ${pos && prof === "none" ? `<span class="badge badge--ember">no ${pos}</span>` : ""}
            ${fit.some((f) => !f.ok) ? `<span class="badge badge--amber">style off</span>` : ""}
            ${store.builds[p.id] ? `<span class="badge">★ build</span>` : ""}
            ${where ? `<span class="badge badge--lime">${where}</span>` : ""}
          </span></button>`;
      }).join("")}</div>`;
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
    if (!b) return;
    const i = Number(b.dataset.slot);
    lu.sel = lu.sel?.area === "xi" && lu.sel.i === i ? null : { area: "xi", i };
    renderLineup();
  });
  $("#luBench").addEventListener("click", (e) => {
    const b = e.target.closest("[data-bench]");
    if (!b) return;
    const i = Number(b.dataset.bench);
    lu.sel = lu.sel?.area === "bench" && lu.sel.i === i ? null : { area: "bench", i };
    renderLineup();
  });
  $("#luPicker").addEventListener("click", (e) => {
    const l = activeLineup();
    const pick = e.target.closest("[data-pick]");
    const act = e.target.closest("[data-lu]");
    if (pick) { placePlayer(l, pick.dataset.pick); saveLineup(); renderLineup(); }
    if (act?.dataset.lu === "cancel") { lu.sel = null; renderLineup(); }
    if (act?.dataset.lu === "clear") {
      if (lu.sel.area === "xi") l.xi[lu.sel.i] = null; else l.bench.splice(lu.sel.i, 1);
      lu.sel = null; saveLineup(); renderLineup();
    }
  });
  $("#luPicker").addEventListener("input", (e) => {
    if (e.target.id !== "luSearch") return;
    lu.q = e.target.value;
    const pos = e.target.selectionStart;
    renderPicker(activeLineup(), slotsFor(activeLineup().formation));
    const s = $("#luSearch"); s.focus(); s.setSelectionRange(pos, pos);
  });
  $("#luSelect").addEventListener("change", (e) => { store.activeLineup = e.target.value; lu.sel = null; saveLineup(); renderLineup(); });
  $("#luName").addEventListener("change", (e) => { activeLineup().name = e.target.value.trim() || "Untitled"; saveLineup(); renderLineup(); });
  $("#luFormation").addEventListener("change", (e) => { activeLineup().formation = e.target.value; lu.sel = null; saveLineup(); renderLineup(); });
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
    const slots = slotsFor(l.formation);
    const text = [
      `${l.name} — ${l.formation} · ${l.tactic}${l.manager ? ` · ${l.manager}` : ""}`,
      ...l.xi.map((id, i) => `${slots[i][0].padEnd(4)} ${byId[id] ? `${byId[id].name} (${slotRating(byId[id], slots[i][0], l)})` : "—"}`),
      `Bench: ${l.bench.map((id) => byId[id]?.name).filter(Boolean).join(", ") || "—"}`,
      ...l.subs.map((s) => `${s.minute ?? "?"}' ${byId[s.out]?.name || "?"} → ${byId[s.in]?.name || "?"}${s.note ? ` (${s.note})` : ""}`),
    ].join("\n");
    try { await navigator.clipboard.writeText(text); flash($("#luCopy"), "Copied"); }
    catch { window.prompt("Copy lineup:", text); }
  });

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */

  renderPlayerSelect();
  renderSquad();
  renderSkills();
  renderManagers();
  renderStyles();
  renderLineup();
  route();
})();
