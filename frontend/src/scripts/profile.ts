// @ts-nocheck
const initProfile = () => {
    const profileContainer = document.getElementById("profile-user");
    if (!profileContainer) {
        setTimeout(initProfile, 100);
        return;
    }

    let userData;
    try {
        const stored = localStorage.getItem("user");
        userData = (stored && stored !== "null") ? JSON.parse(stored) : {
            name: "NUEVO REY",
            email: "jugador@welikechess.com",
            avatar: "/avatars/w_king_avatar.png",
            rating: 1200,
            wins: 0,
            losses: 0,
            draws: 0,
            puzzlesSolved: 0,
            streak: 0,
            ranking: "---"
        };
    } catch (e) {
        userData = { name: "USUARIO", email: "invitado@chess.com", avatar: "/avatars/w_king_avatar.png" };
    }

    // 1. Datos Básicos del Perfil
    document.getElementById("profile-username").textContent = userData.name || "USUARIO";
    document.getElementById("profile-email").textContent = userData.email || "";
    document.getElementById("current-avatar").src = userData.avatar || "/avatars/w_king_avatar.png";
    document.getElementById("stat-rating").textContent = userData.rating || 1200;
    document.getElementById("stat-ranking").textContent = `#${userData.ranking || '---'}`;

    // 2. Rendimiento en Combate
    const wins = userData.wins || 0;
    const losses = userData.losses || 0;
    const draws = userData.draws || 0;
    
    document.getElementById("stat-wins").textContent = wins;
    document.getElementById("stat-losses").textContent = losses;
    document.getElementById("stat-draws").textContent = draws;

    // 3. Win Rate
    const total = wins + losses + draws;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const lossRate = total > 0 ? Math.round((losses / total) * 100) : 0;

    document.getElementById("win-rate-percent").textContent = `${winRate}%`;
    document.getElementById("bar-wins").style.width = `${winRate}%`;
    document.getElementById("bar-losses").style.width = `${lossRate}%`;

    // 4. Puzzles
    const puzzles = userData.puzzlesSolved || 0;
    const nextGoal = 500;
    document.getElementById("stat-puzzles-solved").textContent = puzzles;
    document.getElementById("puzzle-milestone-text").textContent = `${puzzles % nextGoal} / ${nextGoal}`;
    document.getElementById("puzzle-progress").style.width = `${(puzzles % nextGoal / nextGoal) * 100}%`;

    // 5. Racha
    document.getElementById("stat-streak").textContent = `${userData.streak || 0} Victorias`;

    // --- MENÚ DE AVATAR ---
    const avatarBtn = document.getElementById("openAvatarMenu");
    const avatarMenu = document.getElementById("avatarMenu");
    const scrollContainer = document.getElementById("avatarScrollContainer");

    if (avatarBtn && avatarMenu && scrollContainer) {
        avatarBtn.onclick = (e) => {
            e.stopPropagation();
            avatarMenu.classList.toggle("hidden");
        };

        if (scrollContainer.innerHTML.trim() === "") {
            const avatars = [
                "b_king_avatar.png", "b_queen_avatar.png", "b_bishop_avatar.png", 
                "b_horse_avatar.png", "b_rook_avatar.png", "b_pawn_avatar.png",
                "w_king_avatar.png", "w_queen_avatar.png", "w_bishop_avatar.png", 
                "w_horse_avatar.png", "w_rook_avatar.png", "w_pawn_avatar.png"
            ];
            
            scrollContainer.innerHTML = avatars.map(img => {
                const isActive = userData.avatar?.includes(img) ? 'active' : '';
                return `<img src="/avatars/${img}" data-file="${img}" class="${isActive}" />`;
            }).join("");
        }

        scrollContainer.onclick = (e) => {
            if (e.target.tagName === "IMG") {
                const fileName = e.target.dataset.file;
                const newPath = `/avatars/${fileName}`;
                scrollContainer.querySelectorAll('img').forEach(img => img.classList.remove('active'));
                e.target.classList.add('active');
                
                userData.avatar = newPath;
                localStorage.setItem("user", JSON.stringify(userData));
                document.getElementById("current-avatar").src = newPath;
                setTimeout(() => avatarMenu.classList.add("hidden"), 300);
            }
        };

        document.addEventListener('click', (e) => {
            if (!avatarMenu.contains(e.target) && e.target !== avatarBtn) {
                avatarMenu.classList.add("hidden");
            }
        });
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("user");
            window.location.href = "/login";
        });
    }

    profileContainer.style.opacity = "1";
};

// Reiniciar cada vez que Astro cargue la página
document.addEventListener('astro:page-load', initProfile);
if (document.readyState !== 'loading') initProfile();
