import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set
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

const leaderboard = document.getElementById("leaderboard");
const currentHoleTitle = document.getElementById("currentHoleTitle");
const currentPubName = document.getElementById("currentPubName");
const progressFill = document.getElementById("progressFill");

const teamsRef = ref(database, "teams");
const settingsRef = ref(database, "settings");

const defaultTeams = {
  teamPink: {
    name: "Team Pink",
    colour: "pink",
    totalStrokes: 0,
    challengeBonus: 0,
    penaltyStrokes: 0,
    holesPlayed: 0
  },
  teamRed: {
    name: "Team Red",
    colour: "red",
    totalStrokes: 0,
    challengeBonus: 0,
    penaltyStrokes: 0,
    holesPlayed: 0
  },
  teamBlue: {
    name: "Team Blue",
    colour: "blue",
    totalStrokes: 0,
    challengeBonus: 0,
    penaltyStrokes: 0,
    holesPlayed: 0
  },
  teamYellow: {
    name: "Team Yellow",
    colour: "yellow",
    totalStrokes: 0,
    challengeBonus: 0,
    penaltyStrokes: 0,
    holesPlayed: 0
  },
  teamGreen: {
    name: "Team Green",
    colour: "green",
    totalStrokes: 0,
    challengeBonus: 0,
    penaltyStrokes: 0,
    holesPlayed: 0
  }
};

const defaultSettings = {
  currentHole: 1,
  totalHoles: 9,
  pubs: {
    hole1: "Pub 1",
    hole2: "Pub 2",
    hole3: "Pub 3",
    hole4: "Pub 4",
    hole5: "Pub 5",
    hole6: "Pub 6",
    hole7: "Pub 7",
    hole8: "Pub 8",
    hole9: "Pub 9"
  }
};

onValue(settingsRef, (snapshot) => {
  const settings = snapshot.val();

  if (!settings) {
    set(settingsRef, defaultSettings);
    return;
  }

  const currentHole = settings.currentHole || 1;
  const totalHoles = settings.totalHoles || 9;
  const pubName = settings.pubs?.[`hole${currentHole}`] || `Pub ${currentHole}`;

  currentHoleTitle.textContent = `Hole ${currentHole} of ${totalHoles}`;
  currentPubName.textContent = pubName;

  const progressPercent = (currentHole / totalHoles) * 100;
  progressFill.style.width = `${progressPercent}%`;
});

onValue(teamsRef, (snapshot) => {
  const data = snapshot.val();

  if (!data) {
    set(teamsRef, defaultTeams);
    return;
  }

  const teams = Object.entries(data)
    .map(([id, team]) => ({
      id,
      ...team,
      totalStrokes: team.totalStrokes ?? team.score ?? 0,
      challengeBonus: team.challengeBonus ?? 0,
      penaltyStrokes: team.penaltyStrokes ?? 0,
      holesPlayed: team.holesPlayed ?? 0
    }))
    .sort((a, b) => a.totalStrokes - b.totalStrokes);

  leaderboard.innerHTML = "";

  teams.forEach((team, index) => {
    const card = document.createElement("div");
    card.className = `team-card ${team.colour || ""}`;

    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

    card.innerHTML = `
      <div class="rank">${medal}</div>

      <div class="team-info">
        <h3>${team.name}</h3>
        <p>${team.totalStrokes} strokes</p>
        <span>${team.holesPlayed}/9 holes played</span>
      </div>

      <div class="breakdown">
        <span>Challenge: ${team.challengeBonus}</span>
        <span>Penalties: +${team.penaltyStrokes}</span>
      </div>
    `;

    leaderboard.appendChild(card);
  });
});
