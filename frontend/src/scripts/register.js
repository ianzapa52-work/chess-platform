document.addEventListener("DOMContentLoaded", () => {
  const kingIcon = document.querySelector("#kingIcon");
  const registerCard = document.querySelector("#registerCard");

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
  if (registerCard) {
    registerCard.addEventListener("mouseenter", () => {
      registerCard.classList.add("ring-2", "ring-yellow-400", "shadow-yellow-400");
    });

    registerCard.addEventListener("mouseleave", () => {
      registerCard.classList.remove("ring-2", "ring-yellow-400", "shadow-yellow-400");
    });
  }

  // Validación del formulario
  const form = document.querySelector("#registerForm");
  const name = document.querySelector("#name");
  const email = document.querySelector("#email");
  const password = document.querySelector("#password");

  const nameError = document.querySelector("#nameError");
  const emailError = document.querySelector("#emailError");
  const passwordError = document.querySelector("#passwordError");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let valid = true;

    if (name.value.trim() === "") {
      nameError.classList.remove("hidden");
      valid = false;
    } else {
      nameError.classList.add("hidden");
    }

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

    localStorage.setItem("user", JSON.stringify({
      name: name.value,
      email: email.value
    }));

    window.location.href = "/profile";
  });
});
