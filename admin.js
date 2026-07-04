import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  set,
  get,
  push
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0yEVhSU2SJEw7l2d4z0oF2ddyAc3Znto",
  authDomain: "pub-golf-scoreboard.firebaseapp.com",
  databaseURL: "https://pub-golf-scoreboard-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "pub-golf-scoreboard",
  storageBucket: "pub-golf-scoreboard.firebasestorage.app",
  messagingSenderId: "119812269870",
  appId: "1:119812269870:web:4be19e3e1a739d2da87cbf"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const teamsRef = ref(database, "teams");
const settingsRef = ref(database, "settings");
const historyRef = ref(database, "history");
const undoRef = ref(database, "undo/lastAction");

const adminTeams = document.getElementById("adminTeams");
const historyList = document.getElementById("historyList");
const holeTitle = document.getElementById("adminHoleTitle");
const pubName = document.getElementById("adminPubName");
const resetScoresButton = document.getElementById("resetScores");

let teamsData = {};
let settingsData = {};

const teamOrder = ["pink", "red", "blue", "yellow", "green"];

const defaultTeams = {
  pink: {
    name: "Team Pink",
    colourHex: "#ff4da6",
    strokes: 0,
    holesPlayed: 0,
    penalties: 0,
    challenges: 0
  },
  red: {
    name: "Team Red",
    colourHex: "#ff3b30",
    strokes: 0,
    holesPlayed: 0,
    penalties: 0,
    challenges: 0
  },
  blue: {
    name: "Team Blue",
    colourHex: "#3b82f6",
    strokes: 0,
    holesPlayed: 0,
    penalties: 0,
    challenges: 0
  },
  yellow: {
    name: "Team Yellow",
    colourHex: "#facc15",
    strokes: 0,
    holesPlayed: 0,
    penalties: 0,
    challenges: 0
  },
  green: {
    name: "Team Green",
    colourHex: "#22c55e",
    strokes: 0,
    holesPlayed: 0,
    penalties: 0,
    challenges: 0
  }
};

const defaultSettings = {
  currentHole: 1,
  totalHoles: 9,
  pubs: {
    1: "Pub 1",
    2: "Pub 2",
    3: "Pub 3",
    4: "Pub 4",
    5: "Pub 5",
    6: "Pub 6",
    7: "Pub 7",
    8: "Pub 8",
    9: "Pub 9"
  }
};

createUndoButton();

onValue(settingsRef, async (snapshot) => {
  const settings = snapshot.val();

  if (!settings) {
    await set(settingsRef, defaultSettings);
    return;
  }

  settingsData = settings;
  renderHoleControls();
});

onValue(teamsRef, async (snapshot) => {
  const teams = snapshot.val();

  if (!teams) {
    await set(teamsRef, defaultTeams);
    return;
  }

  teamsData = teams;
  renderTeams();
});

onValue(historyRef, (snapshot) => {
  renderHistory(snapshot.val() || {});
});

function createUndoButton() {
  if (!resetScoresButton) return;
  if (document.getElementById("undoLastAction")) return;

  const undoButton = document.createElement("button");
  undoButton.id = "undoLastAction";
  undoButton.className = "undo-button";
  undoButton.textContent = "↩️ Undo Last Action";

  resetScoresButton.parentElement.appendChild(undoButton);

  undoButton.addEventListener("click", undoLastAction);
}

function renderHoleControls() {
  const currentHole = settingsData.currentHole || 1;
  const totalHoles = settingsData.totalHoles || 9;
  const currentPub = settingsData.pubs?.[currentHole] || `Pub ${currentHole}`;

  holeTitle.textContent = `Hole ${currentHole} of ${totalHoles}`;
  pubName.value = currentPub;
}

function renderTeams() {
  adminTeams.innerHTML = "";

  const entries = Object.entries(teamsData).sort((a, b) => {
    return teamOrder.indexOf(a[0]) - teamOrder.indexOf(b[0]);
  });

  entries.forEach(([teamId, team]) => {
    const strokes = Number(team.strokes ?? team.totalStrokes ?? team.score ?? 0);
    const holesPlayed = Number(team.holesPlayed ?? 0);
    const penalties = Number(team.penalties ?? team.penaltyStrokes ?? 0);
    const challenges = Number(team.challenges ?? team.challengeBonus ?? 0);

    const card = document.createElement("section");
    card.className = "admin-team-card";
    card.style.setProperty("--team-colour", team.colourHex || "#94a3b8");

    card.innerHTML = `
      <h3>${team.name}</h3>

      <p class="admin-score">${strokes} strokes</p>
      <p class="admin-small">
        ${holesPlayed}/9 holes played • Challenges: ${challenges} • Penalties: +${penalties}
      </p>

      <div class="quick-score-box">
        <label>Score change</label>
        <input 
          type="text" 
          inputmode="text" 
          id="score-${teamId}" 
          placeholder="e.g. 5 or -2" 
          autocomplete="off"
        />

        <div class="big-action-grid">
          <button data-action="strokes" data-team="${teamId}" data-input="score-${teamId}">
            ➕ Strokes
          </button>

          <button data-action="penalty" data-team="${teamId}" data-input="score-${teamId}">
            ⚠️ Penalty
          </button>

          <button data-action="challenge" data-team="${teamId}" data-input="score-${teamId}">
            🏆 Challenge
          </button>
        </div>
      </div>

      <button class="admin-main-button" data-action="hole" data-team="${teamId}">
        Mark hole completed
      </button>

      <label class="admin-label">
        Team name
        <input data-action="rename" data-team="${teamId}" value="${team.name}" />
      </label>
    `;

    adminTeams.appendChild(card);
  });
}

function getScoreValue(inputId) {
  const input = document.getElementById(inputId);
  const rawValue = input.value.trim();
  const value = Number(rawValue);

  if (!rawValue || !Number.isInteger(value) || value === 0) {
    alert("Enter a whole number, for example 5 or -2.");
    return null;
  }

  return {
    input,
    value
  };
}

async function addHistory(text, type = "info") {
  await push(historyRef, {
    text,
    type,
    time: Date.now()
  });
}

function vibrate() {
  if ("vibrate" in navigator) {
    navigator.vibrate(40);
  }
}

async function saveUndo(action) {
  await set(undoRef, {
    ...action,
    time: Date.now()
  });
}

async function updateTeamWithUndo(
  teamId,
  updates,
  historyText,
  type
) {
  const teamRef =
    ref(database, `teams/${teamId}`);

  const teamSnapshot =
    await get(teamRef);

  const previousTeam =
    teamSnapshot.val();

  if (!previousTeam) return;

  await saveUndo({
    kind: "team",
    teamId,
    previousTeam
  });

  const finalUpdates = {
    ...updates
  };

  /*
    Normal strokes should also be saved
    against the current hole.

    Penalties and challenges still affect
    the total score, but are NOT added to
    the pub scorecard.
  */

  if (
    type === "strokes" &&
    updates.strokes !== undefined
  ) {
    const settingsSnapshot =
      await get(settingsRef);

    const settings =
      settingsSnapshot.val() || {};

    const currentHole =
      Number(settings.currentHole || 1);

    const oldTotal =
      Number(previousTeam.strokes || 0);

    const newTotal =
      Number(updates.strokes || 0);

    const strokeChange =
      newTotal - oldTotal;

    const previousHoleScore =
      Number(
        previousTeam.holeScores?.[currentHole] ||
        0
      );

    finalUpdates[
      `holeScores/${currentHole}`
    ] =
      previousHoleScore + strokeChange;
  }

  await update(
    teamRef,
    finalUpdates
  );

  await addHistory(
    historyText,
    type
  );

  vibrate();
}

async function updateSettingsWithUndo(updates, historyText) {
  const beforeSnapshot = await get(settingsRef);
  const before = beforeSnapshot.val();

  await update(settingsRef, updates);

  await saveUndo({
    kind: "settings",
    before,
    description: historyText
  });

  await addHistory(historyText, "settings");
  vibrate();
}

adminTeams.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const teamId = button.dataset.team;
  const action = button.dataset.action;
  const team = teamsData[teamId];

  if (!team) return;

  const currentStrokes = Number(team.strokes ?? team.totalStrokes ?? team.score ?? 0);
  const currentPenalties = Number(team.penalties ?? team.penaltyStrokes ?? 0);
  const currentChallenges = Number(team.challenges ?? team.challengeBonus ?? 0);
  const currentHoles = Number(team.holesPlayed ?? 0);

  if (action === "strokes") {
    const result = getScoreValue(button.dataset.input);
    if (!result) return;

    const { input, value } = result;

    await updateTeamWithUndo(
      teamId,
      {
        strokes: currentStrokes + value
      },
      `${team.name} ${value > 0 ? "+" : ""}${value} strokes`,
      "strokes"
    );

    input.value = "";
  }

  if (action === "penalty") {
    const result = getScoreValue(button.dataset.input);
    if (!result) return;

    const { input, value } = result;
    const penaltyValue = Math.abs(value);

    await updateTeamWithUndo(
      teamId,
      {
        strokes: currentStrokes + penaltyValue,
        penalties: currentPenalties + penaltyValue
      },
      `${team.name} +${penaltyValue} penalty`,
      "penalty"
    );

    input.value = "";
  }

  if (action === "challenge") {
    const result = getScoreValue(button.dataset.input);
    if (!result) return;

    const { input, value } = result;
    const challengeValue = Math.abs(value);

    await updateTeamWithUndo(
      teamId,
      {
        strokes: currentStrokes - challengeValue,
        challenges: currentChallenges - challengeValue
      },
      `${team.name} -${challengeValue} challenge`,
      "challenge"
    );

    input.value = "";
  }

  if (action === "hole") {
    await updateTeamWithUndo(
      teamId,
      {
        holesPlayed: Math.min(currentHoles + 1, 9)
      },
      `${team.name} completed a hole`,
      "hole"
    );
  }
});

adminTeams.addEventListener("change", async (event) => {
  const input = event.target;
  if (input.dataset.action !== "rename") return;

  const teamId = input.dataset.team;
  const oldName = teamsData[teamId]?.name || "Team";
  const newName = input.value.trim() || "Unnamed Team";

  await updateTeamWithUndo(
    teamId,
    {
      name: newName
    },
    `${oldName} renamed to ${newName}`,
    "rename"
  );
});

document.getElementById("savePubName").addEventListener("click", async () => {
  const currentHole = settingsData.currentHole || 1;
  const newPubName = pubName.value.trim() || `Pub ${currentHole}`;

  const updates = {};
  updates[`pubs/${currentHole}`] = newPubName;

  await updateSettingsWithUndo(
    updates,
    `Hole ${currentHole} renamed to ${newPubName}`
  );
});

document.getElementById("previousHole").addEventListener("click", async () => {
  const currentHole = settingsData.currentHole || 1;
  const newHole = Math.max(currentHole - 1, 1);

  await updateSettingsWithUndo(
    {
      currentHole: newHole
    },
    `Moved to Hole ${newHole}`
  );
});

document.getElementById("nextHole").addEventListener("click", async () => {
  const currentHole = settingsData.currentHole || 1;
  const totalHoles = settingsData.totalHoles || 9;
  const newHole = Math.min(currentHole + 1, totalHoles);

  await updateSettingsWithUndo(
    {
      currentHole: newHole
    },
    `Moved to Hole ${newHole}`
  );
});

document.getElementById("resetScores").addEventListener("click", async () => {
  const confirmed = confirm("Reset all scores and holes played?");
  if (!confirmed) return;

  const snapshot = await get(teamsRef);
  const teams = snapshot.val() || {};

  const resetTeams = {};

  Object.entries(teams).forEach(([teamId, team]) => {
    resetTeams[teamId] = {
      ...team,
      strokes: 0,
      holesPlayed: 0,
      penalties: 0,
      challenges: 0
    };
  });

  await set(teamsRef, resetTeams);

  await saveUndo({
    kind: "allTeams",
    beforeTeams: teams,
    description: "All scores reset"
  });

  await addHistory("All scores reset", "reset");
  vibrate();
});

async function undoLastAction() {
  const snapshot = await get(undoRef);
  const lastAction = snapshot.val();

  if (!lastAction) {
    alert("There is no action to undo.");
    return;
  }

  if (lastAction.kind === "team") {
    await set(ref(database, `teams/${lastAction.teamId}`), lastAction.before);
    await addHistory(`Undo: ${lastAction.description}`, "undo");
  }

  if (lastAction.kind === "settings") {
    await set(settingsRef, lastAction.before);
    await addHistory(`Undo: ${lastAction.description}`, "undo");
  }

  if (lastAction.kind === "allTeams") {
    await set(teamsRef, lastAction.beforeTeams);
    await addHistory("Undo: all scores reset", "undo");
  }

  await set(undoRef, null);
  vibrate();
}
const clearHistoryButton = document.getElementById("clearHistory");

if (clearHistoryButton) {
  clearHistoryButton.addEventListener("click", async () => {
    const confirmed = confirm("Clear the full history log? This will not reset scores.");
    if (!confirmed) return;

    await set(historyRef, null);
    await set(undoRef, null);
  });
}
function renderHistory(history) {
  const entries = Object.values(history)
    .sort((a, b) => b.time - a.time)
    .slice(0, 25);

  historyList.innerHTML = "";

  if (entries.length === 0) {
    historyList.innerHTML = `<p class="admin-small">No history yet.</p>`;
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("div");
    item.className = `history-item ${entry.type || "info"}`;

    const time = new Date(entry.time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

    item.innerHTML = `
      <span>${time}</span>
      <p>${entry.text}</p>
    `;

    historyList.appendChild(item);
  });
}
// EDIT ALL 9 PUB NAMES

function fillAllPubInputs(settings) {
  for (let hole = 1; hole <= 9; hole++) {
    const input = document.getElementById(`pubName${hole}`);

    if (!input) continue;

    input.value =
      settings?.pubs?.[hole] ||
      `Pub ${hole}`;
  }
}

onValue(settingsRef, (snapshot) => {
  const settings = snapshot.val();

  if (!settings) return;

  fillAllPubInputs(settings);
});

const saveAllPubsButton =
  document.getElementById("saveAllPubs");

if (saveAllPubsButton) {
  saveAllPubsButton.addEventListener("click", async () => {
    const updates = {};

    for (let hole = 1; hole <= 9; hole++) {
      const input =
        document.getElementById(`pubName${hole}`);

      const name =
        input.value.trim() ||
        `Pub ${hole}`;

      updates[`pubs/${hole}`] = name;
    }

    await updateSettingsWithUndo(
      updates,
      "All 9 pub names updated"
    );

    alert("All 9 pub names saved!");
  });
}
// FULL EVENT RESET

const fullEventResetButton =
  document.getElementById("fullEventReset");

if (fullEventResetButton) {
  fullEventResetButton.addEventListener("click", async () => {
    const confirmation = prompt(
      'This will clear all scores, progress and history.\n\nType RESET to continue.'
    );

    if (confirmation !== "RESET") {
      return;
    }

    const snapshot = await get(teamsRef);
    const teams = snapshot.val() || {};

    const freshTeams = {};

    Object.entries(teams).forEach(([teamId, team]) => {
      freshTeams[teamId] = {
        ...team,
        strokes: 0,
        holesPlayed: 0,
        penalties: 0,
        challenges: 0
      };
    });

    await set(teamsRef, freshTeams);

    await update(settingsRef, {
      currentHole: 1
    });

    await set(historyRef, null);
    await set(undoRef, null);

    alert("Fresh event ready! Everything has been reset.");
  });
}
