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
const historyRef = ref(database, "history");
const teamCards = new Map();
const previousScores = new Map();

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

function createTeamCard(teamId) {
  const card = document.createElement("article");

  card.className = "team-card";
  card.dataset.teamId = teamId;

  card.setAttribute("role", "link");
  card.setAttribute("tabindex", "0");

  function openTeamProfile() {
    window.location.href =
      `team.html?id=${encodeURIComponent(teamId)}`;
  }

  card.addEventListener(
    "click",
    openTeamProfile
  );

  card.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openTeamProfile();
      }
    }
  );

  teamCards.set(teamId, card);

  return card;
}

function updateTeamCard(card, team, position) {
  card.style.setProperty(
    "--team-colour",
    team.colourHex
  );
card.setAttribute(
  "aria-label",
  `View ${team.name} team profile`
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
}

function animateScore(card, team) {
  const oldScore = previousScores.get(team.id);

  if (
    oldScore === undefined ||
    oldScore === team.strokes
  ) {
    return;
  }

  const scoreNumber =
    card.querySelector(".score-block strong");

  if (!scoreNumber) return;

  scoreNumber.style.transition = "none";
  scoreNumber.style.transform = "scale(1.4)";

  requestAnimationFrame(() => {
    scoreNumber.style.transition =
      "transform 450ms cubic-bezier(0.22, 1, 0.36, 1)";

    scoreNumber.style.transform =
      "scale(1)";
  });
}

function renderLeaderboard(teams) {
  const oldPositions = new Map();

  teamCards.forEach((card, teamId) => {
    if (card.isConnected) {
      oldPositions.set(
        teamId,
        card.getBoundingClientRect()
      );
    }
  });

  const activeTeamIds = new Set();

  teams.forEach((team, index) => {
    const position = index + 1;

    activeTeamIds.add(team.id);

    let card = teamCards.get(team.id);

    if (!card) {
      card = createTeamCard(team.id);
    }

    updateTeamCard(
      card,
      team,
      position
    );

    /*
      appendChild moves an existing card
      instead of creating a new one.
    */
    leaderboard.appendChild(card);
  });

  teamCards.forEach((card, teamId) => {
    if (!activeTeamIds.has(teamId)) {
      card.remove();
      teamCards.delete(teamId);
    }
  });

  const movements = [];

  teams.forEach((team) => {
    const card = teamCards.get(team.id);
    const oldPosition = oldPositions.get(team.id);

    if (!card || !oldPosition) return;

    const newPosition =
      card.getBoundingClientRect();

    const moveX =
      oldPosition.left -
      newPosition.left;

    const moveY =
      oldPosition.top -
      newPosition.top;

    if (
      Math.abs(moveX) < 1 &&
      Math.abs(moveY) < 1
    ) {
      return;
    }

    movements.push({
      card,
      moveX,
      moveY
    });
  });

  /*
    Move each card visually back to where
    it used to be.
  */
  movements.forEach((movement) => {
    movement.card.style.transition = "none";

    movement.card.style.transform =
      `translate(${movement.moveX}px, ${movement.moveY}px)`;

    movement.card.style.zIndex = "10";
  });

  /*
    Force the browser to recognise
    the starting positions.
  */
  leaderboard.getBoundingClientRect();

  /*
    Then slide the cards into their
    new ranking positions.
  */
  requestAnimationFrame(() => {
    movements.forEach((movement) => {
      movement.card.style.transition =
        "transform 1200ms cubic-bezier(0.22, 1, 0.36, 1)";

      movement.card.style.transform =
        "translate(0, 0)";

      setTimeout(() => {
        movement.card.style.zIndex = "";
      }, 1250);
    });
  });

  teams.forEach((team) => {
    const card = teamCards.get(team.id);

    if (card) {
      animateScore(card, team);
    }

    previousScores.set(
      team.id,
      team.strokes
    );
  });
}

onValue(
  settingsRef,

  (snapshot) => {
    const settings = snapshot.val();

    if (!settings) {
      set(
        settingsRef,
        defaultSettings
      );

      return;
    }

    const currentHole =
      settings.currentHole ||
      1;

    const totalHoles =
      settings.totalHoles ||
      9;

    const pubs =
      settings.pubs ||
      {};

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
    showError(
      `Settings error: ${error.message}`
    );
  }
);

onValue(
  teamsRef,

  (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      set(
        teamsRef,
        defaultTeams
      );

      return;
    }

    const teams = Object.entries(data)
      .map(([id, team]) =>
        normaliseTeam(id, team)
      )

      .sort(
        (a, b) =>
          a.strokes - b.strokes ||
          b.holesPlayed - a.holesPlayed
      );

    renderLeaderboard(teams);

    lastUpdated.textContent =
      `Last updated ${new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })}`;
  },

  (error) => {
    showError(
      `Teams error: ${error.message}`
    );
  }
);
// PUBLIC RECENT ACTIVITY

const publicActivity =
  document.getElementById("publicActivity");

function getActivityIcon(type) {
  if (type === "penalty") return "⚠️";
  if (type === "challenge") return "🏆";
  if (type === "undo") return "↩️";
  return "🍺";
}

onValue(historyRef, (snapshot) => {
  if (!publicActivity) return;

  const history = snapshot.val() || {};

  const allowedTypes = new Set([
    "strokes",
    "penalty",
    "challenge",
    "undo"
  ]);

  const entries = Object.values(history)
    .filter((entry) =>
      allowedTypes.has(entry.type)
    )
    .sort((a, b) => b.time - a.time)
    .slice(0, 4);

  publicActivity.innerHTML = "";

  if (entries.length === 0) {
    const emptyMessage =
      document.createElement("p");

    emptyMessage.className =
      "activity-empty";

    emptyMessage.textContent =
      "No recent activity yet.";

    publicActivity.appendChild(
      emptyMessage
    );

    return;
  }

  entries.forEach((entry) => {
    const item =
      document.createElement("div");

    item.className =
      `public-activity-item ${entry.type}`;

    const icon =
      document.createElement("span");

    icon.className = "activity-icon";
    icon.textContent =
      getActivityIcon(entry.type);

    const content =
      document.createElement("div");

    content.className =
      "activity-content";

    const text =
      document.createElement("p");

    text.textContent = entry.text;

    const time =
      document.createElement("span");

    time.textContent =
      new Date(entry.time)
        .toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        });

    content.appendChild(text);
    content.appendChild(time);

    item.appendChild(icon);
    item.appendChild(content);

    publicActivity.appendChild(item);
  });
});
// =========================================
// BIRTHDAY EASTER EGG
// =========================================

const easterEggTrophy =
  document.getElementById("easterEggTrophy");

const birthdayEasterEgg =
  document.getElementById("birthdayEasterEgg");

let trophyTapCount = 0;
let trophyTapResetTimer = null;
let easterEggIsRunning = false;


const confettiColours = [
  "#ff4da6", // pink team
  "#ff3b30", // red team
  "#3b82f6", // blue team
  "#facc15", // yellow team
  "#22c55e", // green team
  "#ffd700"  // gold
];


const confettiEmojis = [
  "🎉",
  "🎊",
  "✨",
  "🍺",
  "⛳",
  "🏆"
];


function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}


function clearBirthdayConfetti() {
  birthdayEasterEgg
    .querySelectorAll(
      ".birthday-confetti-piece"
    )
    .forEach((piece) => {
      piece.remove();
    });
}


function createBirthdayConfetti() {
  const fragment =
    document.createDocumentFragment();


  /*
    LOTS of normal confetti pieces
  */

  for (let i = 0; i < 260; i++) {
    const piece =
      document.createElement("span");

    piece.className =
      "birthday-confetti-piece confetti-shape";

    const colour =
      confettiColours[
        i % confettiColours.length
      ];

    piece.style.setProperty(
      "--confetti-colour",
      colour
    );

    piece.style.setProperty(
      "--start-x",
      `${randomBetween(-10, 110)}vw`
    );

    piece.style.setProperty(
      "--end-x",
      `${randomBetween(-25, 125)}vw`
    );

    piece.style.setProperty(
      "--start-y",
      `${randomBetween(-35, -5)}vh`
    );

    piece.style.setProperty(
      "--end-y",
      `${randomBetween(110, 145)}vh`
    );

    piece.style.setProperty(
      "--spin",
      `${randomBetween(360, 1800)}deg`
    );

    piece.style.setProperty(
      "--duration",
      `${randomBetween(3.4, 6.2)}s`
    );

    piece.style.setProperty(
      "--delay",
      `${randomBetween(0, 1.1)}s`
    );

    const size =
      randomBetween(7, 15);

    piece.style.width =
      `${size}px`;

    piece.style.height =
      `${randomBetween(9, 21)}px`;

    fragment.appendChild(piece);
  }


  /*
    Emoji confetti
  */

  for (let i = 0; i < 60; i++) {
    const piece =
      document.createElement("span");

    piece.className =
      "birthday-confetti-piece confetti-emoji";

    piece.textContent =
      confettiEmojis[
        i % confettiEmojis.length
      ];

    piece.style.setProperty(
      "--start-x",
      `${randomBetween(-5, 105)}vw`
    );

    piece.style.setProperty(
      "--end-x",
      `${randomBetween(-20, 120)}vw`
    );

    piece.style.setProperty(
      "--start-y",
      `${randomBetween(-40, -8)}vh`
    );

    piece.style.setProperty(
      "--end-y",
      `${randomBetween(110, 140)}vh`
    );

    piece.style.setProperty(
      "--spin",
      `${randomBetween(360, 1440)}deg`
    );

    piece.style.setProperty(
      "--duration",
      `${randomBetween(4, 6.8)}s`
    );

    piece.style.setProperty(
      "--delay",
      `${randomBetween(0, 1.4)}s`
    );

    piece.style.fontSize =
      `${randomBetween(18, 32)}px`;

    fragment.appendChild(piece);
  }


  birthdayEasterEgg.appendChild(
    fragment
  );
}


function triggerBirthdayEasterEgg() {
  if (easterEggIsRunning) return;

  easterEggIsRunning = true;
  trophyTapCount = 0;

  clearBirthdayConfetti();
  createBirthdayConfetti();

  birthdayEasterEgg.classList.add(
    "birthday-easter-egg-active"
  );

  easterEggTrophy.classList.add(
    "trophy-unlocked"
  );

  birthdayEasterEgg.setAttribute(
    "aria-hidden",
    "false"
  );

  if (
    navigator.vibrate
  ) {
    navigator.vibrate([
      60,
      40,
      90,
      40,
      140
    ]);
  }


  setTimeout(() => {
    birthdayEasterEgg.classList.remove(
      "birthday-easter-egg-active"
    );

    easterEggTrophy.classList.remove(
      "trophy-unlocked"
    );

    birthdayEasterEgg.setAttribute(
      "aria-hidden",
      "true"
    );
  }, 5200);


  setTimeout(() => {
    clearBirthdayConfetti();
    easterEggIsRunning = false;
  }, 7200);
}


function registerTrophyTap() {
  if (easterEggIsRunning) return;

  trophyTapCount += 1;

  easterEggTrophy.classList.remove(
    "trophy-tapped"
  );

  void easterEggTrophy.offsetWidth;

  easterEggTrophy.classList.add(
    "trophy-tapped"
  );


  if (navigator.vibrate) {
    navigator.vibrate(18);
  }


  clearTimeout(
    trophyTapResetTimer
  );


  trophyTapResetTimer =
    setTimeout(() => {
      trophyTapCount = 0;
    }, 10000);


  if (trophyTapCount >= 5) {
    clearTimeout(
      trophyTapResetTimer
    );

    triggerBirthdayEasterEgg();
  }
}


if (easterEggTrophy) {
  easterEggTrophy.addEventListener(
    "click",
    registerTrophyTap
  );

  easterEggTrophy.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        registerTrophyTap();
      }
    }
  );
}
