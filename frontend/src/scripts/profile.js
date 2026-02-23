document.addEventListener("DOMContentLoaded", () => {
  const userBox = document.querySelector("#profile-user");
  const logoutBtn = document.querySelector("#logoutBtn");

  const user = JSON.parse(localStorage.getItem("user"));
  const stats = JSON.parse(localStorage.getItem("stats"));

  // Si no hay usuario → redirigir automáticamente
  if (!user) {
    window.location.href = "/login";
    return;
  }

  // Mostrar perfil
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

  // Rating
  document.querySelector("#stat-rating").textContent = `${s.rating} Elo`;

  // Estadísticas generales
  document.querySelector("#stat-games").textContent = `Partidas jugadas: ${s.totalGames}`;
  document.querySelector("#stat-wins").textContent = `Victorias: ${s.wins}`;
  document.querySelector("#stat-losses").textContent = `Derrotas: ${s.losses}`;
  document.querySelector("#stat-draws").textContent = `Tablas: ${s.draws}`;

  // Puzzles
  document.querySelector("#stat-puzzles-solved").textContent = `Puzzles resueltos: ${s.puzzlesSolved}`;
  document.querySelector("#stat-puzzles-failed").textContent = `Puzzles fallados: ${s.puzzlesFailed}`;

  // Barra de progreso
  const totalPuzzles = s.puzzlesSolved + s.puzzlesFailed;
  const progress = totalPuzzles > 0 ? (s.puzzlesSolved / totalPuzzles) * 100 : 0;
  document.querySelector("#puzzle-progress").style.width = progress + "%";

  // Fechas
  document.querySelector("#created-at").textContent =
    "Cuenta creada: " + new Date(s.createdAt).toLocaleDateString();

  document.querySelector("#last-login").textContent =
    "Último inicio de sesión: " + new Date(s.lastLogin).toLocaleString();

  // Logout
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    localStorage.removeItem("stats");
    window.location.href = "/login";
  });
});
