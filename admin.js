import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  set,
  get
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

const adminTeams = document.getElementById("adminTeams");
const holeTitle = document.getElementById("adminHoleTitle");
const pubName = document.getElementById("adminPubName");

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

let teamsData = {};
let settingsData = defaultSettings;

onValue(settingsRef, (snapshot) => {
  settingsData = snapshot.val() || defaultSettings;
  renderHoleControls();
});

onValue(teamsRef, (snapshot) => {
  teamsData = snapshot.val() || {};
  renderTeams();
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

      <div class="button-row">
        <button data-action="challenge" data-team="${teamId}" data-value="3">-3 challenge</button>
        <button data-action="challenge" data-team="${teamId}" data-value="2">-2</button>
        <button data-action="challenge" data-team="${teamId}" data-value="1">-1</button>
      </div>

      <div class="button-row">
        <button data-action="penalty" data-team="${teamId}" data-value="1">+1 penalty</button>
        <button data-action="penalty" data-team="${teamId}" data-value="2">+2</button>
        <button data-action="penalty" data-team="${teamId}" data-value="3">+3</button>
      </div>

      <div class="button-row">
        <button data-action="hole" data-team="${teamId}">Hole done</button>
      </div>

      <label>
        Team name
        <input data-action="rename" data-team="${teamId}" value="${team.name}" />
      </label>
    `;

    adminTeams.appendChild(card);
  });
}

adminTeams.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const teamId = button.dataset.team;
  const action = button.dataset.action;
  const value = Number(button.dataset.value || 0);

  const team = teamsData[teamId];
  if (!team) return;

  const currentStrokes = team.strokes ?? team.totalStrokes ?? team.score ?? 0;
  const currentPenalties = team.penalties ?? team.penaltyStrokes ?? 0;
  const currentChallenges = team.challenges ?? team.challengeBonus ?? 0;
  const currentHoles = team.holesPlayed ?? 0;

  if (action === "penalty") {
    await update(ref(database, `teams/${teamId}`), {
      strokes: currentStrokes + value,
      penalties: currentPenalties + value
    });
  }

  if (action === "challenge") {
    await update(ref(database, `teams/${teamId}`), {
      strokes: currentStrokes - value,
      challenges: currentChallenges - value
    });
  }

  if (action === "hole") {
    await update(ref(database, `teams/${teamId}`), {
      holesPlayed: Math.min(currentHoles + 1, 9)
    });
  }
});

adminTeams.addEventListener("change", async (event) => {
  const input = event.target;
  if (input.dataset.action !== "rename") return;

  const teamId = input.dataset.team;
  await update(ref(database, `teams/${teamId}`), {
    name: input.value.trim() || "Unnamed Team"
  });
});

document.getElementById("savePubName").addEventListener("click", async () => {
  const currentHole = settingsData.currentHole || 1;
  await update(ref(database, `settings/pubs`), {
    [currentHole]: pubName.value.trim() || `Pub ${currentHole}`
  });
});

document.getElementById("previousHole").addEventListener("click", async () => {
  const currentHole = settingsData.currentHole || 1;
  await update(settingsRef, {
    currentHole: Math.max(currentHole - 1, 1)
  });
});

document.getElementById("nextHole").addEventListener("click", async () => {
  const currentHole = settingsData.currentHole || 1;
  const totalHoles = settingsData.totalHoles || 9;
  await update(settingsRef, {
    currentHole: Math.min(currentHole + 1, totalHoles)
  });
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
});
