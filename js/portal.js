// Game catalog. Each game is a self-contained HTML file in /games.
const GAMES = [
  {
    id: "parkour",
    title: "Block Parkour",
    emoji: "🟩",
    file: "games/parkour.html",
    category: "Adventure",
    plays: "1.2M",
    grad: ["#11998e", "#38ef7d"],
    badge: "hot",
    desc: "Leap across floating blocks and reach the golden goal. A classic Roblox-style obby.",
  },
  {
    id: "racer",
    title: "Speed Racer 3D",
    emoji: "🏎️",
    file: "games/racer.html",
    category: "Racing",
    plays: "980K",
    grad: ["#fc4a1a", "#f7b733"],
    badge: "hot",
    desc: "Drift a blocky car around the track, hit every checkpoint and beat the clock.",
  },
  {
    id: "stacker",
    title: "Tower Stacker",
    emoji: "🧱",
    file: "games/stacker.html",
    category: "Arcade",
    plays: "2.4M",
    grad: ["#f857a6", "#ff5858"],
    badge: "hot",
    desc: "Time your taps to stack blocks as high as you can without toppling over.",
  },
  {
    id: "blaster",
    title: "Block Blaster",
    emoji: "🎯",
    file: "games/blaster.html",
    category: "Shooter",
    plays: "1.6M",
    grad: ["#6a11cb", "#2575fc"],
    badge: "new",
    desc: "First-person target practice. Blast the blocks before time runs out.",
  },
  {
    id: "skyjump",
    title: "Sky Jump",
    emoji: "☁️",
    file: "games/skyjump.html",
    category: "Arcade",
    plays: "740K",
    grad: ["#00c6ff", "#0072ff"],
    badge: "new",
    desc: "Bounce ever higher up endless floating platforms. Don't look down!",
  },
  {
    id: "maze",
    title: "Cube Maze",
    emoji: "🌀",
    file: "games/maze.html",
    category: "Adventure",
    plays: "510K",
    grad: ["#8e2de2", "#4a00e0"],
    badge: null,
    desc: "Roll your block through a 3D maze and find the exit before the timer ends.",
  },
];

const CATEGORIES = ["All", "Adventure", "Racing", "Arcade", "Shooter"];

const grid = document.getElementById("grid");
const chips = document.getElementById("chips");
const searchInput = document.getElementById("search");
const countEl = document.getElementById("count");

let activeCategory = "All";
let query = "";

function cssGrad(g) {
  return `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
}

function makeCard(game) {
  const badge = game.badge
    ? `<div class="badge ${game.badge}">${game.badge === "hot" ? "🔥 Hot" : "✨ New"}</div>`
    : "";
  return `
    <a class="card" href="${game.file}" aria-label="Play ${game.title}">
      ${badge}
      <div class="thumb" style="background:${cssGrad(game.grad)}">
        <div class="emoji">${game.emoji}</div>
        <div class="play-overlay">
          <div class="play-btn">▶ Play</div>
        </div>
      </div>
      <div class="meta">
        <div class="title">${game.title}</div>
        <div class="sub">${game.category} · 👤 ${game.plays}</div>
      </div>
    </a>`;
}

function render() {
  const filtered = GAMES.filter((g) => {
    const matchCat = activeCategory === "All" || g.category === activeCategory;
    const matchQuery =
      !query ||
      g.title.toLowerCase().includes(query) ||
      g.category.toLowerCase().includes(query) ||
      g.desc.toLowerCase().includes(query);
    return matchCat && matchQuery;
  });

  countEl.textContent = `${filtered.length} game${filtered.length === 1 ? "" : "s"}`;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty">No games found for "<b>${query}</b>" 🕹️<br>Try another search.</div>`;
    return;
  }
  grid.innerHTML = filtered.map(makeCard).join("");
}

function renderChips() {
  chips.innerHTML = CATEGORIES.map(
    (c) => `<button class="chip ${c === activeCategory ? "active" : ""}" data-cat="${c}">${c}</button>`
  ).join("");
}

chips.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  activeCategory = btn.dataset.cat;
  renderChips();
  render();
});

searchInput.addEventListener("input", (e) => {
  query = e.target.value.trim().toLowerCase();
  render();
});

// Hero "Play featured" -> first hot game
document.getElementById("hero-play").addEventListener("click", () => {
  const featured = GAMES.find((g) => g.badge === "hot") || GAMES[0];
  window.location.href = featured.file;
});

renderChips();
render();
