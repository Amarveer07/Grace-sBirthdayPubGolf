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

const teamsGallery = document.getElementById("teamsGallery");
const teamsRef = ref(database, "teams");

const teamOrder = ["pink", "red", "blue", "yellow", "green"];

/*
  Later, upload photos to your GitHub repo in a folder called:

  team-photos

  Example file names:
  team-photos/pink-1.jpg
  team-photos/pink-2.jpg
  team-photos/red-1.jpg

  Then edit the names below.
*/

const teamMembers = {
  pink: [
    { name: "Member 1", photo: "team-photos/pink-1.jpg" },
    { name: "Member 2", photo: "team-photos/pink-2.jpg" },
    { name: "Member 3", photo: "team-photos/pink-3.jpg" }
  ],
  red: [
    { name: "Member 1", photo: "team-photos/red-1.jpg" },
    { name: "Member 2", photo: "team-photos/red-2.jpg" },
    { name: "Member 3", photo: "team-photos/red-3.jpg" }
  ],
  blue: [
    { name: "Member 1", photo: "team-photos/blue-1.jpg" },
    { name: "Member 2", photo: "team-photos/blue-2.jpg" },
    { name: "Member 3", photo: "team-photos/blue-3.jpg" }
  ],
  yellow: [
    { name: "Member 1", photo: "team-photos/yellow-1.jpg" },
    { name: "Member 2", photo: "team-photos/yellow-2.jpg" },
    { name: "Member 3", photo: "team-photos/yellow-3.jpg" }
  ],
  green: [
    { name: "Member 1", photo: "team-photos/green-1.jpg" },
    { name: "Member 2", photo: "team-photos/green-2.jpg" },
    { name: "Member 3", photo: "team-photos/green-3.jpg" }
  ]
};

function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

onValue(teamsRef, (snapshot) => {
  const teams = snapshot.val();

  if (!teams) {
    teamsGallery.innerHTML = `<p class="loading">No teams found yet.</p>`;
    return;
  }

  const sortedTeams = Object.entries(teams).sort((a, b) => {
    return teamOrder.indexOf(a[0]) - teamOrder.indexOf(b[0]);
  });

  teamsGallery.innerHTML = "";

  sortedTeams.forEach(([teamId, team]) => {
    const members = teamMembers[teamId] || [];
    const colour = team.colourHex || "#94a3b8";

    const card = document.createElement("section");
    card.className = "team-gallery-card";
    card.style.setProperty("--team-colour", colour);

    card.innerHTML = `
      <div class="gallery-team-header">
        <span class="team-dot"></span>
        <h2>${team.name}</h2>
      </div>

      <div class="member-grid">
        ${members.map((member) => `
          <article class="member-card">
            <div class="member-photo-wrap">
              <img 
                src="${member.photo}" 
                alt="${member.name}" 
                class="member-photo"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';"
              />
              <div class="photo-fallback">${getInitials(member.name)}</div>
            </div>
            <p>${member.name}</p>
          </article>
        `).join("")}
      </div>
    `;

    teamsGallery.appendChild(card);
  });
});
