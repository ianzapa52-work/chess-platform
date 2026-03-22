// @ts-check

window.addEventListener("DOMContentLoaded", () => {
  /** @type {HTMLButtonElement | null} */
  const saveBtn = document.querySelector(".save-btn");

  /** @type {HTMLSelectElement | null} */
  const themeSelect = /** @type {HTMLSelectElement | null} */ (
    document.getElementById("theme-select")
  );

  // Cargar tema guardado
  if (themeSelect) {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      themeSelect.value = savedTheme;

      if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
    }
  }

  // Guardar cambios
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (themeSelect) {
        const selectedTheme = themeSelect.value;

        localStorage.setItem("theme", selectedTheme);

        if (selectedTheme === "dark") {
          document.body.classList.add("dark-mode");
        } else {
          document.body.classList.remove("dark-mode");
        }
      }

      alert("Cambios guardados correctamente.");
      window.location.href = "/";
    });
  }
});
