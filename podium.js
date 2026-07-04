import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  onValue
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

const podiumStage =
  document.getElementById("podiumStage");

const lowerPlaces =
  document.getElementById("lowerPlaces");


function normaliseTeam(id, team) {
  return {
    id,

    name:
      team.name ||
      `Team ${id}`,

    colourHex:
      team.colourHex ||
      "#94a3b8",

    strokes: Number(
      team.strokes ??
      team.totalStrokes ??
      team.score ??
      0
    ),

    holesPlayed: Number(
      team.holesPlayed ??
      0
    ),

    penalties: Number(
      team.penalties ??
      team.penaltyStrokes ??
      0
    ),

    challenges: Number(
      team.challenges ??
      team.challengeBonus ??
      0
    )
  };
}


function sortTeams(teams) {
  return teams.sort(
    (a, b) =>
      a.strokes - b.strokes ||
      b.holesPlayed - a.holesPlayed
  );
}


function podiumCard(team, place) {
  const medals = {
    1: "🥇",
    2: "🥈",
    3: "🥉"
  };

  const labels = {
    1: "1ST",
    2: "2ND",
    3: "3RD"
  };

  return `
    <article
      class="podium-team podium-place-${place}"
      style="--team-colour: ${team.colourHex}"
    >

      <div class="podium-medal">
        ${medals[place]}
      </div>

      <div class="podium-team-dot"></div>

      <h3>
        ${team.name}
      </h3>

      <div class="podium-score">
        <strong>
          ${team.strokes}
        </strong>

        <span>
          strokes
        </span>
      </div>

      <p class="podium-progress">
        ${team.holesPlayed}/9 holes played
      </p>

      <div class="podium-block">
        <span>
          ${labels[place]}
        </span>
      </div>

    </article>
  `;
}


function lowerPlaceCard(team, place) {
  return `
    <article
      class="lower-place-card"
      style="--team-colour: ${team.colourHex}"
    >

      <div class="lower-place-number">
        ${place}
      </div>

      <div class="lower-place-main">

        <div class="lower-place-name">

          <span class="lower-team-dot"></span>

          <h3>
            ${team.name}
          </h3>

        </div>

        <p>
          ${team.holesPlayed}/9 holes played
        </p>

      </div>

      <div class="lower-place-score">

        <strong>
          ${team.strokes}
        </strong>

        <span>
          strokes
        </span>

      </div>

    </article>
  `;
}


function renderPodium(teams) {
  const first = teams[0];
  const second = teams[1];
  const third = teams[2];

  /*
    Display order is:

    2nd    1st    3rd

    so the winner sits in the middle.
  */

  podiumStage.innerHTML = `
    ${second ? podiumCard(second, 2) : ""}
    ${first ? podiumCard(first, 1) : ""}
    ${third ? podiumCard(third, 3) : ""}
  `;

  const remainingTeams =
    teams.slice(3, 5);

  lowerPlaces.innerHTML =
    remainingTeams
      .map((team, index) =>
        lowerPlaceCard(
          team,
          index + 4
        )
      )
      .join("");
}


onValue(
  teamsRef,

  (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      podiumStage.innerHTML = `
        <p class="loading">
          No teams found yet.
        </p>
      `;

      lowerPlaces.innerHTML = "";

      return;
    }

    const teams =
      sortTeams(
        Object.entries(data)
          .map(([id, team]) =>
            normaliseTeam(id, team)
          )
      );

    renderPodium(teams);
  },

  (error) => {
    podiumStage.innerHTML = `
      <p class="loading">
        Could not load podium:
        ${error.message}
      </p>
    `;
  }
);
