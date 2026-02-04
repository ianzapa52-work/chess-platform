document.addEventListener("DOMContentLoaded", () => {
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

    localStorage.setItem("user", JSON.stringify({ email: email.value }));
    window.location.href = "/profile";
  });
});
