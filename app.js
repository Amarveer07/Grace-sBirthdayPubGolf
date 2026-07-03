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
const holeTitle = document.getElementById("holeTitle");
const pubName = document.getElementById("pubName");
const progressBar = document.getElementById("progressBar");
const lastUpdated = document.getElementById("lastUpdated");

const teamsRef = ref(database, "teams");
const settingsRef = ref(database, "settings");

const previousScores = new Map();
const previousRanks = new Map();

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

function showError(message) {
  leaderboard.innerHTML = `
    <div class="team-card">
      <div class="team-main">
        <h3>Something went wrong</h3>
        <p class="holes">${message}</p>
      </div>
    </div>
  `;
}

function medalFor(position) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";

  return position;
}

function normaliseTeam(id, team) {
  return {
    id,
    name: team.name || `Team ${id}`,
    colourHex: team.colourHex || "#94a3b8",

    strokes: Number(
      team.strokes ??
      team.totalStrokes ??
      team.score ??
      0
    ),

    holesPlayed: Number(
      team.holesPlayed ?? 0
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

function getCurrentCardPositions() {
  const positions = new Map();

  document
    .querySelectorAll(".team-card[data-team-id]")
    .forEach((card) => {
      positions.set(
        card.dataset.teamId,
        card.getBoundingClientRect()
      );
    });

  return positions;
}

function animateLeaderboard(oldPositions) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) return;

  document
    .querySelectorAll(".team-card[data-team-id]")
    .forEach((card) => {
      const teamId = card.dataset.teamId;
      const oldPosition = oldPositions.get(teamId);

      if (!oldPosition) return;

      const newPosition = card.getBoundingClientRect();

      const moveX = oldPosition.left - newPosition.left;
      const moveY = oldPosition.top - newPosition.top;

      if (moveX === 0 && moveY === 0) return;

      card.animate(
        [
          {
            transform: `translate(${moveX}px, ${moveY}px)`,
            zIndex: 10
          },
          {
            transform: "translate(0, 0)",
            zIndex: 1
          }
        ],
        {
          duration: 650,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)"
        }
      );
    });
}

function animateScoreChange(card, team) {
  const previousScore = previousScores.get(team.id);

  if (
    previousScore === undefined ||
    previousScore === team.strokes
  ) {
    return;
  }

  const score = card.querySelector(".score-block strong");

  if (!score) return;

  score.animate(
    [
      {
        transform: "scale(1)",
        color: "#facc15"
      },
      {
        transform: "scale(1.35)",
        color: "#ffffff"
      },
      {
        transform: "scale(1)",
        color: "#facc15"
      }
    ],
    {
      duration: 500,
      easing: "ease-out"
    }
  );
}

function animateRankChange(card, teamId, newRank) {
  const oldRank = previousRanks.get(teamId);

  if (
    oldRank === undefined ||
    oldRank === newRank
  ) {
    return;
  }

  card.animate(
    [
      {
        boxShadow: "0 0 0 rgba(250, 204, 21, 0)"
      },
      {
        boxShadow: "0 0 34px rgba(250, 204, 21, 0.55)"
      },
      {
        boxShadow: "0 16px 44px rgba(0, 0, 0, 0.32)"
      }
    ],
    {
      duration: 800,
      easing: "ease-out"
    }
  );
}

onValue(
  settingsRef,

  (snapshot) => {
    const settings = snapshot.val();

    if (!settings) {
      set(settingsRef, defaultSettings);
      return;
    }

    const currentHole = settings.currentHole || 1;
    const totalHoles = settings.totalHoles || 9;
    const pubs = settings.pubs || {};

    const currentPub =
      pubs[currentHole] ||
      `Pub ${currentHole}`;

    holeTitle.textContent =
      `Hole ${currentHole} of ${totalHoles}`;

    pubName.textContent =
      `📍 ${currentPub}`;

    progressBar.style.width =
      `${(currentHole / totalHoles) * 100}%`;
  },

  (error) => {
    showError(`Settings error: ${error.message}`);
  }
);

onValue(
  teamsRef,

  (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      set(teamsRef, defaultTeams);
      return;
    }

    const oldPositions = getCurrentCardPositions();

    const teams = Object.entries(data)
      .map(([id, team]) =>
        normaliseTeam(id, team)
      )
      .sort(
        (a, b) =>
          a.strokes - b.strokes ||
          b.holesPlayed - a.holesPlayed
      );

    leaderboard.innerHTML = "";

    teams.forEach((team, index) => {
      const position = index + 1;

      const card = document.createElement("article");

      card.className = "team-card";
      card.dataset.teamId = team.id;

      card.style.setProperty(
        "--team-colour",
        team.colourHex
      );

      card.innerHTML = `
        <div class="position">
          ${medalFor(position)}
        </div>

        <div class="team-main">
          <div class="team-title-row">
            <span class="team-dot"></span>
            <h3>${team.name}</h3>
          </div>

          <p class="holes">
            ${team.holesPlayed}/9 holes played
          </p>

          <p class="holes">
            Challenges: ${team.challenges}
            •
            Penalties: +${team.penalties}
          </p>
        </div>

        <div class="score-block">
          <strong>${team.strokes}</strong>
          <span>strokes</span>
        </div>
      `;

      leaderboard.appendChild(card);

      animateScoreChange(card, team);

      animateRankChange(
        card,
        team.id,
        position
      );
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        animateLeaderboard(oldPositions);
      });
    });

    teams.forEach((team, index) => {
      previousScores.set(
        team.id,
        team.strokes
      );

      previousRanks.set(
        team.id,
        index + 1
      );
    });

    lastUpdated.textContent =
      `Last updated ${new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })}`;
  },

  (error) => {
    showError(`Teams error: ${error.message}`);
  }
);
