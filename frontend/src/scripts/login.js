document.addEventListener("DOMContentLoaded", () => {
  const kingIcon = document.querySelector("#kingIcon");
  const loginCard = document.querySelector("#loginCard");

  // Efecto dorado SOLO en el rey
  if (kingIcon) {
    kingIcon.addEventListener("mouseenter", () => {
      kingIcon.classList.add("drop-shadow-[0_0_12px_gold]");
    });

    kingIcon.addEventListener("mouseleave", () => {
      kingIcon.classList.remove("drop-shadow-[0_0_12px_gold]");
    });
  }

  // Efecto dorado SOLO en la tarjeta
  if (loginCard) {
    loginCard.addEventListener("mouseenter", () => {
      loginCard.classList.add("ring-2", "ring-yellow-400", "shadow-yellow-400");
    });

    loginCard.addEventListener("mouseleave", () => {
      loginCard.classList.remove("ring-2", "ring-yellow-400", "shadow-yellow-400");
    });
  }

  // Validación del formulario
  const form = document.querySelector("#loginForm");
  const email = document.querySelector("#email");
  const password = document.querySelector("#password");
  const emailError = document.querySelector("#emailError");
  const passwordError = document.querySelector("#passwordError");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let valid = true;

    if (!email.value.includes("@")) {
      emailError.classList.remove("hidden");
      valid = false;
    } else {
      emailError.classList.add("hidden");
    }

    if (password.value.trim() === "") {
      passwordError.classList.remove("hidden");
      valid = false;
    } else {
      passwordError.classList.add("hidden");
    }

    if (!valid) return;

    window.location.href = "/profile";
  });
});
