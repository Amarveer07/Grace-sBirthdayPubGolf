import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
const teamsRef = ref(database, "teams");

const defaultTeams = {
  teamPink: { name: "Team Pink", score: 0, holesPlayed: 0 },
  teamRed: { name: "Team Red", score: 0, holesPlayed: 0 },
  teamBlue: { name: "Team Blue", score: 0, holesPlayed: 0 },
  teamYellow: { name: "Team Yellow", score: 0, holesPlayed: 0 },
  teamGreen: { name: "Team Green", score: 0, holesPlayed: 0 }
};

onValue(teamsRef, (snapshot) => {
  const data = snapshot.val();

  if (!data) {
    set(teamsRef, defaultTeams);
    return;
  }

  const teams = Object.values(data).sort((a, b) => a.score - b.score);

  leaderboard.innerHTML = "";

  teams.forEach((team, index) => {
    const card = document.createElement("div");
    card.className = "team-card";

    card.innerHTML = `
      <div class="rank">#${index + 1}</div>
      <div class="team-info">
        <h2>${team.name}</h2>
        <p>${team.score} strokes</p>
        <span>${team.holesPlayed || 0}/9 holes played</span>
      </div>
    `;

    leaderboard.appendChild(card);
  });
});
