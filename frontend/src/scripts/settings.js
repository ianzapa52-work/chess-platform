// @ts-check

window.addEventListener("load", () => {
  const saveBtn = document.querySelector(".save-btn");

  if (!saveBtn) return;

  saveBtn.addEventListener("click", () => {
    alert("Cambios guardados correctamente.");
    window.location.href = "/";
  });
});
