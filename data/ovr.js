// Position overall rating, matching the per-position OVR shown on efhub.com.
// Coefficients were read from efhub's public player-page bundle (28 Sep 2026) and
// verified to reproduce the listed OVR of every card in data/players.js.
window.OVR = (() => {
  "use strict";
  const POSITIONS = ["GK", "CB", "LB", "RB", "DMF", "CMF", "LMF", "RMF", "AMF", "LWF", "RWF", "SS", "CF"];
  // One row per input, one column per position (order above). "@height" uses height−111,
  // "@weakFoot" uses floor(59·WFA/3 + 40); every input only counts above 25.
  const ROWS = [
    [186,136,49,49,61,37,12,12,37,49,49,62,99], // @height
    [0,14,61,61,61,98,98,98,171,159,159,173,210], // offensiveAwareness
    [13,27,86,86,122,171,171,171,196,159,159,210,123], // ballControl
    [0,14,61,61,37,98,110,122,122,159,159,123,62], // dribbling
    [0,0,37,37,24,49,73,61,73,86,86,86,37], // tightPossession
    [27,41,61,61,122,208,135,135,196,73,73,99,37], // lowPass
    [40,68,147,147,122,159,196,196,159,98,98,74,12], // loftedPass
    [0,27,24,24,37,73,86,86,184,159,159,284,358], // finishing
    [0,14,24,24,12,12,24,24,12,12,12,12,12], // setPieceTaking
    [0,14,24,24,12,12,24,24,12,12,12,12,12], // curl
    [0,55,24,24,61,24,12,12,24,24,24,25,62], // heading
    [13,286,147,147,220,86,49,49,24,12,12,0,0], // defensiveAwareness
    [0,191,86,86,122,86,24,24,24,12,12,12,12], // ballWinning
    [0,82,37,37,98,37,12,12,12,12,12,12,12], // aggression
    [53,27,24,24,49,73,24,24,73,61,61,99,123], // kickingPower
    [13,136,220,220,61,61,196,196,98,220,220,86,99], // speed
    [40,150,184,184,61,86,159,159,86,159,159,99,123], // acceleration
    [80,204,98,98,122,49,24,24,24,37,37,37,86], // physicalContact
    [0,0,24,24,12,24,61,61,24,73,73,74,86], // balance
    [133,109,37,37,37,12,12,12,12,24,24,37,62], // jump
    [279,0,0,0,0,0,0,0,0,0,0,0,0], // gkAwareness
    [226,0,0,0,0,0,0,0,0,0,0,0,0], // gkReach
    [226,0,0,0,0,0,0,0,0,0,0,0,0], // gkCatching
    [173,0,0,0,0,0,0,0,0,0,0,0,0], // gkClearing
    [173,0,0,0,0,0,0,0,0,0,0,0,0], // gkReflexes
    [0,68,196,196,196,196,147,147,86,49,49,49,37], // stamina
    [4,4,4,4,4,4,4,4,4,4,4,4,4], // @weakFoot
    [0,14,24,24,24,24,24,24,24,24,24,12,12], // defensiveEngagement
  ];
  const INPUTS = ["@height", "offensiveAwareness", "ballControl", "dribbling", "tightPossession", "lowPass", "loftedPass", "finishing", "setPieceTaking", "curl", "heading", "defensiveAwareness", "ballWinning", "aggression", "kickingPower", "speed", "acceleration", "physicalContact", "balance", "jump", "gkAwareness", "gkReach", "gkCatching", "gkClearing", "gkReflexes", "stamina", "@weakFoot", "defensiveEngagement"];

  function rating(position, height, weakFootAccuracy, stats) {
    const col = POSITIONS.indexOf(position);
    if (col < 0) return null;
    let total = 0;
    INPUTS.forEach((key, i) => {
      const v = key === "@height" ? height - 111
        : key === "@weakFoot" ? Math.floor((59 * weakFootAccuracy) / 3 + 40)
        : stats[key] ?? 0;
      total += ROWS[i][col] * (v > 25 ? v - 25 : 0);
    });
    return Math.max(40, Math.floor((total + 500) / 1000));
  }

  return { POSITIONS, rating };
})();
