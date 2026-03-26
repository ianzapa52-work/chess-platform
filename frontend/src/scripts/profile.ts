// @ts-nocheck
const initProfile = () => {
  const profileContainer = document.getElementById("profile-user");
  if (!profileContainer) { setTimeout(initProfile, 50); return; }

  const userData = localStorage.getItem("user");
  if (!userData || userData === "null") { window.location.href = "/login"; return; }

  const user = JSON.parse(userData);
  profileContainer.classList.remove("hidden");
  profileContainer.style.display = "flex";

  // Datos básicos
  document.getElementById("profile-username").textContent = user.name;
  document.getElementById("profile-email").textContent = user.email;
  document.getElementById("current-avatar").src = user.avatar || "/avatars/w_king_avatar.png";

  // Estadísticas (Sincronizadas con Puzzles)
  const stats = JSON.parse(localStorage.getItem("stats") || '{"rating":1200, "totalGames":0, "wins":0, "losses":0, "draws":0, "puzzlesSolved":0, "puzzlesFailed":0}');
  
  const updateText = (id, val) => { if(document.getElementById(id)) document.getElementById(id).textContent = val; };

  updateText("stat-rating", stats.rating);
  updateText("stat-games", stats.totalGames);
  updateText("stat-wins", stats.wins);
  updateText("stat-losses", stats.losses);
  updateText("stat-draws", stats.draws);
  updateText("stat-puzzles-solved", stats.puzzlesSolved);
  updateText("stat-puzzles-failed", `Fallos: ${stats.puzzlesFailed}`);

  // Barra de progreso de Puzzles
  const progressEl = document.getElementById("puzzle-progress");
  if (progressEl) {
    const total = stats.puzzlesSolved + stats.puzzlesFailed;
    const ratio = total > 0 ? (stats.puzzlesSolved / total) * 100 : 0;
    progressEl.style.width = `${ratio}%`;
  }

  // Logout
  document.getElementById("logoutBtn").onclick = () => { localStorage.clear(); window.location.href = "/login"; };

  // Gestión de Avatares (Simplificado)
  const avatarBtn = document.getElementById("openAvatarMenu");
  const avatarMenu = document.getElementById("avatarMenu");
  if (avatarBtn && avatarMenu) {
    avatarBtn.onclick = (e) => { e.stopPropagation(); avatarMenu.classList.toggle("hidden"); };
    
    // Si el menú está vacío, lo llenamos
    if (avatarMenu.innerHTML.trim() === "") {
        const avatars = ["b_king_avatar.png", "w_king_avatar.png", "b_queen_avatar.png", "w_queen_avatar.png"];
        avatarMenu.innerHTML = avatars.map(a => `<img src="/avatars/${a}" data-file="${a}" />`).join("");
    }

    avatarMenu.onclick = (e) => {
      if (e.target.tagName === "IMG") {
        const path = `/avatars/${e.target.dataset.file}`;
        user.avatar = path;
        localStorage.setItem("user", JSON.stringify(user));
        document.getElementById("current-avatar").src = path;
        avatarMenu.classList.add("hidden");
      }
    };
  }
};

document.addEventListener('astro:page-load', initProfile);
if (document.readyState !== 'loading') initProfile();