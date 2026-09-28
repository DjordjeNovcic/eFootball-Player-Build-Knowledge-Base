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
      return { builds: s.builds || {}, manager: s.manager ?? KB.CURRENT_MANAGER, tab: s.tab };
    } catch {
      return { builds: {}, manager: KB.CURRENT_MANAGER };
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

  function managerObj() {
    return KB.MANAGERS.find((m) => m.name === store.manager) || null;
  }

  function compute(p, build) {
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
    const add = (stats, src) => Object.entries(stats || {}).forEach(([k, v]) => {
      final[k] += v;
      boostOf[k] = (boostOf[k] || 0) + v;
    });
    if (p.booster1) add(p.booster1.stats, "b1");
    const b2 = booster2Of(p, build);
    if (b2) add(b2.stats, "b2");
    const mgr = managerObj();
    if (mgr) add(Object.fromEntries(mgr.boost.map((k) => [k, 1])), "mgr");
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

  const TABS = ["squad", "train", "skills", "managers", "styles", "sandbox"];
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
      saveStore();
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
     Init
  --------------------------------------------------------- */

  renderPlayerSelect();
  renderSquad();
  renderSkills();
  renderManagers();
  renderStyles();
  route();
})();
