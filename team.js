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
const settingsRef = ref(database, "settings");


const teamMembers = {
  pink: [
    {
      name: "Sam Livo",
      photo: "team-photos/yellow-1.jpg"
    },
    {
      name: "Catherine Mason",
      photo: "team-photos/yellow-2.jpg"
    }
  ],

  red: [
    {
      name: "Maddy Alexander",
      photo: "team-photos/red-1.jpg"
    },
    {
      name: "Eunice Corpuz",
      photo: "team-photos/red-2.jpg"
    }
  ],

  blue: [
    {
      name: "Grace Johnson",
      photo: "team-photos/blue-1.jpg"
    },
    {
      name: "NUFC Alfie",
      photo: "team-photos/blue-2.jpg"
    }
  ],

  yellow: [
    {
      name: "Lydia Morton",
      photo: "team-photos/pink-1.jpg"
    },
    {
      name: "Ben hartridge",
      photo: "team-photos/pink-2.jpg"
    }
  ],

  green: [
    {
      name: "Zack Rudd",
      photo: "team-photos/green-1.jpg"
    },
    {
      name: "Madie Charlton",
      photo: "team-photos/green-2.jpg"
    }
  ]
};


const params = new URLSearchParams(
  window.location.search
);

const teamId = params.get("id");

const teamIntro =
  document.getElementById("teamIntro");

const teamIntroName =
  document.getElementById("teamIntroName");

const teamIntroMembers =
  document.getElementById("teamIntroMembers");
const teamProfileName =
  document.getElementById("teamProfileName");

const teamProfileDot =
  document.getElementById("teamProfileDot");

const teamProfilePosition =
  document.getElementById("teamProfilePosition");

const teamProfileScore =
  document.getElementById("teamProfileScore");

const teamProfilePenalties =
  document.getElementById("teamProfilePenalties");

const teamProfileChallenges =
  document.getElementById("teamProfileChallenges");

const teamProfileProgress =
  document.getElementById("teamProfileProgress");
const teamStreakCard =
  document.getElementById("teamStreakCard");

const teamStreakFlames =
  document.getElementById("teamStreakFlames");

const teamStreakLabel =
  document.getElementById("teamStreakLabel");

const teamStreakCount =
  document.getElementById("teamStreakCount");
const teamProfileMembers =
  document.getElementById("teamProfileMembers");

const teamHoleScores =
  document.getElementById("teamHoleScores");


let allTeams = {};
let settings = {};
let teamIntroHasRun = false;


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
    ),

    holeScores:
      team.holeScores ||
      {}
  };
}


function getSortedTeams() {
  return Object.entries(allTeams)
    .map(([id, team]) =>
      normaliseTeam(id, team)
    )
    .sort(
      (a, b) =>
        a.strokes - b.strokes ||
        b.holesPlayed - a.holesPlayed
    );
}


function getPosition(team) {
  const sortedTeams =
    getSortedTeams();

  const index =
    sortedTeams.findIndex(
      (item) =>
        item.id === team.id
    );

  return index + 1;
}


function positionLabel(position) {
  if (position === 1) {
    return "🥇 1st Place";
  }

  if (position === 2) {
    return "🥈 2nd Place";
  }

  if (position === 3) {
    return "🥉 3rd Place";
  }

  return `${position}th Place`;
}


function renderHoleScores(team) {
  const totalHoles =
    Number(settings.totalHoles || 9);

  const currentHole =
    Number(settings.currentHole || 1);

  const pubs =
    settings.pubs || {};

  teamHoleScores.innerHTML = "";

  for (
    let hole = 1;
    hole <= totalHoles;
    hole++
  ) {
    const score =
      team.holeScores?.[hole];

    const pubName =
      pubs[hole] ||
      `Pub ${hole}`;

    const row =
      document.createElement("article");

    row.className =
      "team-hole-score-row";


    if (hole < currentHole) {
      row.classList.add("completed-hole");
    }

    if (hole === currentHole) {
      row.classList.add("current-hole");
    }

    if (hole > currentHole) {
      row.classList.add("upcoming-hole");
    }


    const number =
      document.createElement("div");

    number.className =
      "team-hole-number";

    number.textContent =
      hole;


    const main =
      document.createElement("div");

    main.className =
      "team-hole-main";


    const name =
      document.createElement("h3");

    name.textContent =
      pubName;


    const status =
      document.createElement("p");

    if (hole === currentHole) {
      status.textContent =
        "📍 Current pub";
    } else if (score !== undefined) {
      status.textContent =
        "Completed";
    } else {
      status.textContent =
        "Upcoming";
    }


    const value =
      document.createElement("strong");

    if (score !== undefined) {
      value.textContent =
        score;
    } else {
      value.textContent =
        "—";
    }


    main.appendChild(name);
    main.appendChild(status);

    row.appendChild(number);
    row.appendChild(main);
    row.appendChild(value);

    teamHoleScores.appendChild(row);
  }
}


function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}


function renderTeamMembers() {
  const members =
    teamMembers[teamId] || [];

  teamProfileMembers.innerHTML =
    members
      .map((member) => `
        <article class="team-profile-polaroid">

          <div class="team-profile-photo-wrap">

            <img
              src="${member.photo}"
              alt="${member.name}"
              class="team-profile-photo"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';"
            />

            <div class="team-profile-photo-fallback">
              ${getInitials(member.name)}
            </div>

          </div>

          <p>
            ${member.name}
          </p>

        </article>
      `)
      .join("");
}
function runTeamIntro(team) {
  if (
    teamIntroHasRun ||
    !teamIntro ||
    !teamIntroName ||
    !teamIntroMembers
  ) {
    return;
  }

  teamIntroHasRun = true;

  const members =
    teamMembers[teamId] || [];

  teamIntroName.textContent =
    team.name;

  teamIntroMembers.innerHTML =
    members
      .map((member, index) => `
        <article
          class="team-intro-polaroid team-intro-polaroid-${index + 1}"
        >
          <div class="team-intro-photo-wrap">
            <img
              src="${member.photo}"
              alt="${member.name}"
              class="team-intro-photo"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';"
            />

            <div class="team-intro-photo-fallback">
              ${getInitials(member.name)}
            </div>
          </div>

          <p>
            ${member.name}
          </p>
        </article>
      `)
      .join("");

  teamIntro.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "team-intro-running"
  );

  requestAnimationFrame(() => {
    teamIntro.classList.add(
      "team-intro-active"
    );
  });

  setTimeout(() => {
    teamIntro.classList.add(
      "team-intro-finished"
    );

    document.body.classList.remove(
      "team-intro-running"
    );

    document.body.classList.add(
      "team-intro-complete"
    );

    teamIntro.setAttribute(
      "aria-hidden",
      "true"
    );
  }, 2100);
}
function getCurrentWinStreak(team) {
  const normalisedTeams =
    Object.entries(allTeams)
      .map(([id, teamData]) =>
        normaliseTeam(id, teamData)
      );

  if (normalisedTeams.length === 0) {
    return 0;
  }

  const totalHoles =
    Number(settings.totalHoles || 9);

  const completedHoleWinners = [];


  for (
    let hole = 1;
    hole <= totalHoles;
    hole++
  ) {
    const everyTeamHasScore =
      normalisedTeams.every(
        (currentTeam) =>
          currentTeam.holeScores?.[hole] !== undefined
      );

    if (!everyTeamHasScore) {
      break;
    }


    const lowestScore =
      Math.min(
        ...normalisedTeams.map(
          (currentTeam) =>
            Number(
              currentTeam.holeScores[hole]
            )
        )
      );


    const winners =
      normalisedTeams
        .filter(
          (currentTeam) =>
            Number(
              currentTeam.holeScores[hole]
            ) === lowestScore
        )
        .map(
          (currentTeam) =>
            currentTeam.id
        );


    completedHoleWinners.push(
      winners
    );
  }


  let streak = 0;


  for (
    let index =
      completedHoleWinners.length - 1;

    index >= 0;

    index--
  ) {
    const winners =
      completedHoleWinners[index];

    if (
      winners.includes(team.id)
    ) {
      streak += 1;
    } else {
      break;
    }
  }


  return streak;
}


function renderTeamStreak(team) {
  const streak =
    getCurrentWinStreak(team);


  if (
    !teamStreakCard ||
    streak < 2
  ) {
    if (teamStreakCard) {
      teamStreakCard.hidden = true;
    }

    return;
  }


  teamStreakCard.hidden = false;


  if (streak === 2) {
    teamStreakFlames.textContent =
      "🔥";

    teamStreakLabel.textContent =
      "ON FIRE";
  } else if (streak === 3) {
    teamStreakFlames.textContent =
      "🔥🔥🔥";

    teamStreakLabel.textContent =
      "UNSTOPPABLE";
  } else {
    teamStreakFlames.textContent =
      "🔥🔥🔥🔥";

    teamStreakLabel.textContent =
      "ABSOLUTELY FLYING";
  }


  teamStreakCount.textContent =
    `${streak} HOLE WIN STREAK`;
}
function renderTeam() {
  if (!teamId) {
    teamProfileName.textContent =
      "Team not found";

    teamHoleScores.innerHTML = `
      <p class="loading">
        No team was selected.
      </p>
    `;

    return;
  }


  const rawTeam =
    allTeams[teamId];

  if (!rawTeam) {
    return;
  }


  const team =
    normaliseTeam(
      teamId,
      rawTeam
    );


  const position =
    getPosition(team);


  document.documentElement.style.setProperty(
    "--profile-team-colour",
    team.colourHex
  );
runTeamIntro(team);

  document.title =
    `${team.name} | Pub Golf`;


  teamProfileName.textContent =
    team.name;


  renderTeamMembers();


  teamProfileDot.style.background =
    team.colourHex;


  teamProfileDot.style.boxShadow =
    `0 0 22px ${team.colourHex}`;


  teamProfilePosition.textContent =
    positionLabel(position);


  teamProfileScore.textContent =
    team.strokes;


  teamProfilePenalties.textContent =
    `+${team.penalties}`;


  teamProfileChallenges.textContent =
    team.challenges;


  teamProfileProgress.textContent =
    `${team.holesPlayed}/9 PLAYED`;
renderTeamStreak(team);

  renderHoleScores(team);
}


onValue(
  teamsRef,

  (snapshot) => {
    allTeams =
      snapshot.val() || {};

    renderTeam();
  }
);


onValue(
  settingsRef,

  (snapshot) => {
    settings =
      snapshot.val() || {};

    renderTeam();
  }
);
