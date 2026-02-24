document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.querySelector("#menuBtn");
  const sideMenu = document.querySelector("#sideMenu");
  const overlay = document.querySelector("#menuOverlay");
  const navBrand = document.querySelector("#navBrand");

  // --- MENÚ LATERAL ---
  if (menuBtn && sideMenu && overlay) {
    menuBtn.addEventListener("click", () => {
      sideMenu.classList.remove("-translate-x-full");
      overlay.classList.remove("hidden");
    });

    overlay.addEventListener("click", () => {
      sideMenu.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    });
  }

  // --- NAVBAR: solo brillo ---
  if (navBrand) {
    navBrand.addEventListener("click", () => {
      navBrand.classList.add("clicked");

      setTimeout(() => {
        navBrand.classList.remove("clicked");
      }, 600);
    });
  }
});
