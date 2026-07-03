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

const adminTeams = document.getElementById("adminTeams");
const historyList = document.getElementById("historyList");
const holeTitle = document.getElementById("adminHoleTitle");
const pubName = document.getElementById("adminPubName");

let teamsData = {};
let settingsData = {};

onValue(settingsRef, (snapshot) => {
  settingsData = snapshot.val() || {
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

  renderHoleControls();
});

onValue(teamsRef, (snapshot) => {
  teamsData = snapshot.val() || {};
  renderTeams();
});

onValue(historyRef, (snapshot) => {
  const history = snapshot.val() || {};
  renderHistory(history);
});

function renderHoleControls() {
  const currentHole = settingsData.currentHole || 1;
  const totalHoles = settingsData.totalHoles || 9;
  const currentPub = settingsData.pubs?.[currentHole] || `Pub ${currentHole}`;

  holeTitle.textContent = `Hole ${currentHole} of ${totalHoles}`;
  pubName.value = currentPub;
}

function renderTeams() {
  adminTeams.innerHTML = "";

  Object.entries(teamsData).forEach(([teamId, team]) => {
    const strokes = team.strokes ?? team.totalStrokes ?? team.score ?? 0;
    const holesPlayed = team.holesPlayed ?? 0;

    const card = document.createElement("section");
    card.className = "admin-team-card";
    card.style.setProperty("--team-colour", team.colourHex || "#94a3b8");

    card.innerHTML = `
      <h3>${team.name}</h3>
      <p class="admin-score">${strokes} strokes</p>
      <p class="admin-small">${holesPlayed}/9 holes played</p>

      <div class="custom-control">
        <label>Add strokes</label>
        <input type="number" min="0" inputmode="numeric" id="strokes-${teamId}" placeholder="e.g. 5">
        <button data-action="strokes" data-team="${teamId}" data-input="strokes-${teamId}">Add</button>
      </div>

      <div class="custom-control">
        <label>Penalty</label>
        <input type="number" min="0" inputmode="numeric" id="penalty-${teamId}" placeholder="e.g. 2">
        <button data-action="penalty" data-team="${teamId}" data-input="penalty-${teamId}">Add penalty</button>
      </div>

      <div class="custom-control">
        <label>Challenge</label>
        <input type="number" min="0" inputmode="numeric" id="challenge-${teamId}" placeholder="e.g. 1">
        <button data-action="challenge" data-team="${teamId}" data-input="challenge-${teamId}">Apply</button>
      </div>

      <button class="admin-main-button" data-action="hole" data-team="${teamId}">Mark hole completed</button>

      <label class="admin-label">
        Team name
        <input data-action="rename" data-team="${teamId}" value="${team.name}" />
      </label>
    `;

    adminTeams.appendChild(card);
  });
}

async function addHistory(text) {
  await push(historyRef, {
    text,
    time: Date.now()
  });
}

adminTeams.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const teamId = button.dataset.team;
  const action = button.dataset.action;
  const team = teamsData[teamId];

  if (!team) return;

  const currentStrokes = team.strokes ?? team.totalStrokes ?? team.score ?? 0;
  const currentPenalties = team.penalties ?? team.penaltyStrokes ?? 0;
  const currentChallenges = team.challenges ?? team.challengeBonus ?? 0;
  const currentHoles = team.holesPlayed ?? 0;

  if (action === "strokes" || action === "penalty" || action === "challenge") {
    const input = document.getElementById(button.dataset.input);
    const value = Number(input.value);

    if (!value || value <= 0) {
      alert("Enter a number bigger than 0.");
      return;
    }

    if (action === "strokes") {
      await update(ref(database, `teams/${teamId}`), {
        strokes: currentStrokes + value
      });

      await addHistory(`${team.name} +${value} strokes`);
    }

    if (action === "penalty") {
      await update(ref(database, `teams/${teamId}`), {
        strokes: currentStrokes + value,
        penalties: currentPenalties + value
      });

      await addHistory(`${team.name} +${value} penalty`);
    }

    if (action === "challenge") {
      await update(ref(database, `teams/${teamId}`), {
        strokes: currentStrokes - value,
        challenges: currentChallenges - value
      });

      await addHistory(`${team.name} -${value} challenge`);
    }

    input.value = "";
  }

  if (action === "hole") {
    await update(ref(database, `teams/${teamId}`), {
      holesPlayed: Math.min(currentHoles + 1, 9)
    });

    await addHistory(`${team.name} completed a hole`);
  }
});

adminTeams.addEventListener("change", async (event) => {
  const input = event.target;
  if (input.dataset.action !== "rename") return;

  const teamId = input.dataset.team;
  const oldName = teamsData[teamId]?.name || "Team";
  const newName = input.value.trim() || "Unnamed Team";

  await update(ref(database, `teams/${teamId}`), {
    name: newName
  });

  await addHistory(`${oldName} renamed to ${newName}`);
});

document.getElementById("savePubName").addEventListener("click", async () => {
  const currentHole = settingsData.currentHole || 1;
  const newPubName = pubName.value.trim() || `Pub ${currentHole}`;

  await update(ref(database, "settings/pubs"), {
    [currentHole]: newPubName
  });

  await addHistory(`Hole ${currentHole} renamed to ${newPubName}`);
});

document.getElementById("previousHole").addEventListener("click", async () => {
  const currentHole = settingsData.currentHole || 1;
  const newHole = Math.max(currentHole - 1, 1);

  await update(settingsRef, {
    currentHole: newHole
  });

  await addHistory(`Moved to Hole ${newHole}`);
});

document.getElementById("nextHole").addEventListener("click", async () => {
  const currentHole = settingsData.currentHole || 1;
  const totalHoles = settingsData.totalHoles || 9;
  const newHole = Math.min(currentHole + 1, totalHoles);

  await update(settingsRef, {
    currentHole: newHole
  });

  await addHistory(`Moved to Hole ${newHole}`);
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
  await addHistory("All scores reset");
});

function renderHistory(history) {
  const entries = Object.values(history)
    .sort((a, b) => b.time - a.time)
    .slice(0, 20);

  historyList.innerHTML = "";

  if (entries.length === 0) {
    historyList.innerHTML = `<p class="admin-small">No history yet.</p>`;
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "history-item";

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
