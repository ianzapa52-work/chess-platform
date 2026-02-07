document.addEventListener("DOMContentLoaded", () => {
  const guestBox = document.querySelector("#profile-guest");
  const userBox = document.querySelector("#profile-user");
  const logoutBtn = document.querySelector("#logoutBtn");

  const user = JSON.parse(localStorage.getItem("user"));
  const stats = JSON.parse(localStorage.getItem("stats"));

  // Si no hay usuario: mostrar estado invitado
  if (!user) {
    guestBox.classList.remove("hidden");
    logoutBtn.disabled = true;
    logoutBtn.classList.add("opacity-50", "cursor-not-allowed");
    return;
  }

  // Si hay usuario: mostrar perfil completo
  userBox.classList.remove("hidden");

  // Datos básicos
  document.querySelector("#profile-username").textContent = user.name ?? "Usuario";
  document.querySelector("#profile-email").textContent = user.email;

  // Si no hay estadísticas, crearlas
  if (!stats) {
    const defaultStats = {
      rating: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      totalGames: 0,
      puzzlesSolved: 0,
      puzzlesFailed: 0,
      createdAt: Date.now(),
      lastLogin: Date.now()
    };
    localStorage.setItem("stats", JSON.stringify(defaultStats));
  }

  const s = JSON.parse(localStorage.getItem("stats"));

  // Estadísticas generales
  document.querySelector("#stat-rating").textContent = `Rating: ${s.rating}`;
  document.querySelector("#stat-games").textContent = `Partidas jugadas: ${s.totalGames}`;
  document.querySelector("#stat-wins").textContent = `Victorias: ${s.wins}`;
  document.querySelector("#stat-losses").textContent = `Derrotas: ${s.losses}`;
  document.querySelector("#stat-draws").textContent = `Tablas: ${s.draws}`;

  // Puzzles
  document.querySelector("#stat-puzzles-solved").textContent = `Puzzles resueltos: ${s.puzzlesSolved}`;
  document.querySelector("#stat-puzzles-failed").textContent = `Puzzles fallados: ${s.puzzlesFailed}`;

  // Logout
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    localStorage.removeItem("stats");
    window.location.href = "/login";
  });
});
