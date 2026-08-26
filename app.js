(() => {
  "use strict";

  /* ---------------------------------------------------------
     Domain data
  --------------------------------------------------------- */

  const POSITION_GROUPS = [
    { group: "Goalkeeper", options: ["GK"] },
    { group: "Defenders", options: ["CB", "LB", "RB"] },
    { group: "Midfielders", options: ["DMF", "CMF", "LMF", "RMF", "AMF"] },
    { group: "Forwards", options: ["LWF", "RWF", "SS", "CF"] },
  ];

  const POSITION_STYLES = {
    GK: ["Offensive Goalkeeper", "Defensive Goalkeeper"],
    CB: ["Build Up", "Extra Frontman", "Foxhound", "Cover Specialist"],
    LB: ["Attacking Fullback", "Defensive Fullback", "Overlap"],
    RB: ["Attacking Fullback", "Defensive Fullback", "Overlap"],
    DMF: ["Anchor Man", "Orchestrator", "The Destroyer"],
    CMF: ["Box-to-Box", "Orchestrator", "Hole Player"],
    LMF: ["Roaming Flank", "Cross Specialist", "Prolific Winger"],
    RMF: ["Roaming Flank", "Cross Specialist", "Prolific Winger"],
    AMF: ["Creative Playmaker", "Classic No.10", "Hole Player"],
    LWF: ["Prolific Winger", "Cross Specialist", "Speedster", "Roaming Flank"],
    RWF: ["Prolific Winger", "Cross Specialist", "Speedster", "Roaming Flank"],
    SS: ["Creative Playmaker", "Hole Player", "Dummy Runner", "Fox in the Box"],
    CF: ["Goal Poacher", "Fox in the Box", "Dummy Runner", "Target Man", "Deep-Lying Forward"],
  };

  const OUTFIELD_STAT_GROUPS = [
    { title: "Attacking", stats: [["offensiveAwareness", "Off. Awareness"], ["finishing", "Finishing"], ["heading", "Heading"]] },
    { title: "Dribbling", stats: [["ballControl", "Ball Control"], ["dribbling", "Dribbling"], ["tightPossession", "Tight Possession"]] },
    { title: "Passing", stats: [["lowPass", "Low Pass"], ["loftedPass", "Lofted Pass"], ["curl", "Curl"], ["setPieceTaking", "Set Piece Taking"]] },
    { title: "Physical", stats: [["speed", "Speed"], ["acceleration", "Acceleration"], ["kickingPower", "Kicking Power"], ["jumping", "Jumping"], ["physicalContact", "Phys. Contact"], ["balance", "Balance"], ["stamina", "Stamina"]] },
    { title: "Defending", stats: [["defensiveAwareness", "Def. Awareness"], ["ballWinning", "Ball Winning"], ["aggression", "Aggression"], ["defensiveEngagement", "Def. Engagement"]] },
  ];

  const GK_STAT_GROUPS = [
    { title: "Goalkeeping", stats: [["gkAwareness", "GK Awareness"], ["gkCatching", "GK Catching"], ["gkParrying", "GK Parrying"], ["gkReflexes", "GK Reflexes"], ["gkCoverage", "GK Coverage"], ["jumping", "Jumping"]] },
  ];

  const RADAR_AXES_OUTFIELD = [
    { label: "OFF", keys: ["offensiveAwareness", "finishing", "heading"] },
    { label: "DRB", keys: ["ballControl", "dribbling", "tightPossession"] },
    { label: "PAS", keys: ["lowPass", "loftedPass", "curl", "setPieceTaking"] },
    { label: "PHY", keys: ["kickingPower", "physicalContact", "jumping", "balance", "stamina"] },
    { label: "SPD", keys: ["speed", "acceleration"] },
    { label: "DEF", keys: ["defensiveAwareness", "ballWinning", "aggression", "defensiveEngagement"] },
  ];

  const RADAR_AXES_GK = [
    { label: "AWR", keys: ["gkAwareness"] },
    { label: "CAT", keys: ["gkCatching"] },
    { label: "PAR", keys: ["gkParrying"] },
    { label: "REF", keys: ["gkReflexes"] },
    { label: "COV", keys: ["gkCoverage"] },
    { label: "JMP", keys: ["jumping"] },
  ];

  const SKILLS = [
    "Long Range Drive", "Long Range Shooting", "Chip Shot Control", "Heel Trick", "First-time Shot", "Rabona",
    "Marseille Turn", "Sombrero Flick", "Scissors Feint", "Flip Flap", "Double Touch", "Cut Behind & Turn", "Sole Control",
    "No Look Pass", "Through Passing", "Long Ball", "Pinpoint Crossing", "Outside Curler", "Rising Shots", "Acrobatic Finishing",
    "Weighted Pass", "Low Punt Trajectory", "One-touch Pass", "Long Throw", "Man Marking", "Interception", "Aerial Superiority",
    "Offensive Header", "Blocker", "Acrobatic Clear", "Track Back", "Captaincy", "Super-sub", "Fighting Spirit", "Speed Merchant",
    "Gamesmanship", "Injury Resilience",
  ];

  const SKILL_CAP = 6;
  const STAT_MIN = 30;
  const STAT_MAX = 99;
  const STAT_DEFAULT = 60;
  const STORAGE_KEY = "efootball-player-builds-v1";

  /* ---------------------------------------------------------
     State
  --------------------------------------------------------- */

  const state = {
    position: "CF",
    playstyle: "",
    stats: {},
    skills: [],
  };

  const els = {
    position: document.getElementById("position"),
    playstyle: document.getElementById("playstyle"),
    statGroups: document.getElementById("statGroups"),
    skillChips: document.getElementById("skillChips"),
    skillCap: document.getElementById("skillCap"),
    buildName: document.getElementById("buildName"),
    form: document.getElementById("buildForm"),
    livePreviewOverall: document.getElementById("livePreviewOverall"),
    card: document.getElementById("playerCard"),
    cardOvr: document.getElementById("cardOvr"),
    cardPos: document.getElementById("cardPos"),
    cardName: document.getElementById("cardName"),
    cardStyle: document.getElementById("cardStyle"),
    cardSkills: document.getElementById("cardSkills"),
    radar: document.getElementById("radar"),
    savedGrid: document.getElementById("savedGrid"),
    emptyState: document.getElementById("emptyState"),
    randomizeBtn: document.getElementById("randomizeBtn"),
    importBtn: document.getElementById("importBtn"),
    importFile: document.getElementById("importFile"),
    clearAllBtn: document.getElementById("clearAllBtn"),
  };

  /* ---------------------------------------------------------
     Helpers
  --------------------------------------------------------- */

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `b_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  function isGoalkeeper(pos) { return pos === "GK"; }
  function statGroupsFor(pos) { return isGoalkeeper(pos) ? GK_STAT_GROUPS : OUTFIELD_STAT_GROUPS; }
  function radarAxesFor(pos) { return isGoalkeeper(pos) ? RADAR_AXES_GK : RADAR_AXES_OUTFIELD; }

  function defaultStatsFor(pos) {
    const stats = {};
    statGroupsFor(pos).forEach((g) => g.stats.forEach(([key]) => { stats[key] = STAT_DEFAULT; }));
    return stats;
  }

  function overallFor(pos, stats) {
    const keys = statGroupsFor(pos).flatMap((g) => g.stats.map(([key]) => key));
    return Math.round(avg(keys.map((k) => stats[k] ?? STAT_DEFAULT)));
  }

  function tierFor(overall) {
    if (overall >= 90) return "special";
    if (overall >= 80) return "gold";
    if (overall >= 70) return "silver";
    return "bronze";
  }

  /* ---------------------------------------------------------
     Rendering — form controls
  --------------------------------------------------------- */

  function renderPositionSelect() {
    els.position.innerHTML = POSITION_GROUPS.map((g) => {
      const opts = g.options.map((p) => `<option value="${p}">${p}</option>`).join("");
      return `<optgroup label="${g.group}">${opts}</optgroup>`;
    }).join("");
    els.position.value = state.position;
  }

  function renderPlaystyleSelect() {
    const styles = POSITION_STYLES[state.position] || [];
    els.playstyle.innerHTML = styles.map((s) => `<option value="${s}">${s}</option>`).join("");
    if (!styles.includes(state.playstyle)) state.playstyle = styles[0] || "";
    els.playstyle.value = state.playstyle;
  }

  function renderStatGroups() {
    const groups = statGroupsFor(state.position);
    els.statGroups.innerHTML = groups.map((g) => `
      <div class="stat-group">
        <h3 class="stat-group__title">${g.title}</h3>
        ${g.stats.map(([key, label]) => `
          <div class="stat-row">
            <span class="stat-row__label">${label}</span>
            <input type="range" min="${STAT_MIN}" max="${STAT_MAX}" step="1"
                   value="${state.stats[key] ?? STAT_DEFAULT}" data-stat="${key}">
            <span class="stat-row__val" data-stat-val="${key}">${state.stats[key] ?? STAT_DEFAULT}</span>
          </div>
        `).join("")}
      </div>
    `).join("");

    els.statGroups.querySelectorAll("input[type=range]").forEach((input) => {
      input.addEventListener("input", () => {
        const key = input.dataset.stat;
        state.stats[key] = Number(input.value);
        els.statGroups.querySelector(`[data-stat-val="${key}"]`).textContent = input.value;
        updateCardPreview();
      });
    });
  }

  function renderSkillChips() {
    els.skillCap.textContent = String(SKILL_CAP);
    els.skillChips.innerHTML = SKILLS.map((s) => `<button type="button" class="chip" data-skill="${s}">${s}</button>`).join("");
    els.skillChips.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const skill = chip.dataset.skill;
        const idx = state.skills.indexOf(skill);
        if (idx >= 0) {
          state.skills.splice(idx, 1);
        } else if (state.skills.length < SKILL_CAP) {
          state.skills.push(skill);
        }
        syncSkillChips();
        updateCardPreview();
      });
    });
    syncSkillChips();
  }

  function syncSkillChips() {
    const atCap = state.skills.length >= SKILL_CAP;
    els.skillChips.querySelectorAll(".chip").forEach((chip) => {
      const selected = state.skills.includes(chip.dataset.skill);
      chip.classList.toggle("is-selected", selected);
      chip.classList.toggle("is-disabled", atCap && !selected);
    });
  }

  function onPositionChange(newPos, resetStats) {
    const wasGk = isGoalkeeper(state.position);
    state.position = newPos;
    if (resetStats || wasGk !== isGoalkeeper(newPos)) {
      state.stats = defaultStatsFor(newPos);
    }
    renderPlaystyleSelect();
    renderStatGroups();
    updateCardPreview();
  }

  /* ---------------------------------------------------------
     Radar chart (inline SVG)
  --------------------------------------------------------- */

  function polar(cx, cy, angleDeg, r) {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function renderRadar(pos, stats) {
    const axes = radarAxesFor(pos);
    const n = axes.length;
    const cx = 100, cy = 100, maxR = 72;
    const step = 360 / n;

    const rings = [0.33, 0.66, 1].map((frac) => {
      const pts = axes.map((_, i) => polar(cx, cy, i * step, maxR * frac).join(",")).join(" ");
      return `<polygon points="${pts}" fill="none" stroke="var(--line)" stroke-width="1"/>`;
    }).join("");

    const spokes = axes.map((_, i) => {
      const [x, y] = polar(cx, cy, i * step, maxR);
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`;
    }).join("");

    const values = axes.map((axis) => Math.round(avg(axis.keys.map((k) => stats[k] ?? STAT_DEFAULT))));
    const valuePts = axes.map((_, i) => {
      const frac = clamp(values[i], 0, 99) / 99;
      return polar(cx, cy, i * step, maxR * frac).join(",");
    }).join(" ");

    const labels = axes.map((axis, i) => {
      const [x, y] = polar(cx, cy, i * step, maxR + 16);
      return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle"
                style="font-family:'Barlow Condensed',sans-serif; font-size:11px; letter-spacing:0.05em; fill:var(--paper-dim);">${axis.label}</text>`;
    }).join("");

    els.radar.innerHTML = `
      <svg viewBox="0 0 200 200" role="img" aria-label="Stat radar for ${pos}">
        ${rings}
        ${spokes}
        <polygon points="${valuePts}" fill="rgba(212,255,63,0.35)" stroke="var(--lime)" stroke-width="2" stroke-linejoin="round"/>
        ${labels}
      </svg>
    `;
  }

  /* ---------------------------------------------------------
     Card preview
  --------------------------------------------------------- */

  function updateCardPreview() {
    const overall = overallFor(state.position, state.stats);
    const tier = tierFor(overall);
    els.card.dataset.tier = tier;
    els.cardOvr.textContent = overall;
    els.cardPos.textContent = state.position;
    els.cardName.textContent = els.buildName.value.trim() || "New build";
    els.cardStyle.textContent = state.playstyle || "—";
    els.cardSkills.innerHTML = state.skills.map((s) => `<span>${s}</span>`).join("");
    els.livePreviewOverall.textContent = overall;
    renderRadar(state.position, state.stats);
  }

  /* ---------------------------------------------------------
     Saved builds — persistence
  --------------------------------------------------------- */

  function loadBuilds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveBuilds(builds) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
  }

  function renderSavedGrid() {
    const builds = loadBuilds();
    if (!builds.length) {
      els.savedGrid.innerHTML = `<p class="empty-state">No builds saved yet — configure one above and hit <em>Save build</em>.</p>`;
      return;
    }
    els.savedGrid.innerHTML = builds.map((b, i) => `
      <article class="saved-card" style="animation-delay:${Math.min(i, 10) * 0.04}s">
        <div class="saved-card__top">
          <span class="saved-card__ovr">${b.overall}</span>
          <span class="saved-card__pos">${b.position}</span>
        </div>
        <h4 class="saved-card__name">${escapeHtml(b.name)}</h4>
        <p class="saved-card__style">${escapeHtml(b.playstyle || "—")}</p>
        <div class="saved-card__actions">
          <button type="button" class="btn btn--icon" data-action="load" data-id="${b.id}">Load</button>
          <button type="button" class="btn btn--icon" data-action="export" data-id="${b.id}">Export</button>
          <button type="button" class="btn btn--icon btn--danger" data-action="delete" data-id="${b.id}">Delete</button>
        </div>
      </article>
    `).join("");
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  els.savedGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const builds = loadBuilds();
    const build = builds.find((b) => b.id === btn.dataset.id);
    if (!build) return;

    if (btn.dataset.action === "load") {
      state.position = build.position;
      state.stats = { ...defaultStatsFor(build.position), ...build.stats };
      state.skills = [...(build.skills || [])];
      els.buildName.value = build.name;
      renderPositionSelect();
      state.playstyle = build.playstyle;
      renderPlaystyleSelect();
      renderStatGroups();
      syncSkillChips();
      updateCardPreview();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (btn.dataset.action === "export") {
      downloadJson(`${build.name.replace(/\s+/g, "-").toLowerCase()}.json`, build);
    }

    if (btn.dataset.action === "delete") {
      if (!confirm(`Delete build "${build.name}"?`)) return;
      saveBuilds(builds.filter((b) => b.id !== build.id));
      renderSavedGrid();
    }
  });

  /* ---------------------------------------------------------
     Top-level controls
  --------------------------------------------------------- */

  els.position.addEventListener("change", () => onPositionChange(els.position.value, false));

  els.playstyle.addEventListener("change", () => {
    state.playstyle = els.playstyle.value;
    updateCardPreview();
  });

  els.buildName.addEventListener("input", updateCardPreview);

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = els.buildName.value.trim();
    if (!name) return;
    const overall = overallFor(state.position, state.stats);
    const build = {
      id: uid(),
      name,
      position: state.position,
      playstyle: state.playstyle,
      skills: [...state.skills],
      stats: { ...state.stats },
      overall,
    };
    const builds = loadBuilds();
    builds.unshift(build);
    saveBuilds(builds);
    renderSavedGrid();
  });

  els.randomizeBtn.addEventListener("click", () => {
    Object.keys(state.stats).forEach((key) => {
      state.stats[key] = randInt(55, 99);
    });
    renderStatGroups();
    updateCardPreview();
  });

  els.clearAllBtn.addEventListener("click", () => {
    if (!loadBuilds().length) return;
    if (!confirm("Delete all saved builds? This cannot be undone.")) return;
    saveBuilds([]);
    renderSavedGrid();
  });

  els.importBtn.addEventListener("click", () => els.importFile.click());

  els.importFile.addEventListener("change", async () => {
    const file = els.importFile.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming = Array.isArray(parsed) ? parsed : [parsed];
      const valid = incoming.filter((b) => b && typeof b === "object" && b.stats && b.position);
      if (!valid.length) throw new Error("No valid builds found in file.");
      const withIds = valid.map((b) => ({ ...b, id: b.id || uid() }));
      const builds = loadBuilds();
      saveBuilds([...withIds, ...builds]);
      renderSavedGrid();
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      els.importFile.value = "";
    }
  });

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */

  function init() {
    state.stats = defaultStatsFor(state.position);
    renderPositionSelect();
    renderPlaystyleSelect();
    renderStatGroups();
    renderSkillChips();
    updateCardPreview();
    renderSavedGrid();
  }

  init();
})();
