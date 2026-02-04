document.addEventListener("DOMContentLoaded", () => {
  const profileData = document.querySelector("#profileData");
  const logoutBtn = document.querySelector("#logoutBtn");

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    profileData.innerHTML = `
      <p class="text-gray-600">No has iniciado sesión.</p>
    `;

    logoutBtn.disabled = true;
    logoutBtn.classList.add("opacity-50", "cursor-not-allowed");

    return;
  }

  profileData.innerHTML = `
    <p><strong>Nombre:</strong> ${user.name ?? "—"}</p>
    <p><strong>Email:</strong> ${user.email}</p>
  `;

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  });
});
