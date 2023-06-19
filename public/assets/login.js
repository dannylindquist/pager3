const formEl = document.querySelector("form");
const errorEl = document.getElementById("error");

formEl.addEventListener("change", (event) => {
  if (event.target.name === "location") {
    document.querySelector("input[type=password]")?.focus();
  }
});

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const entries = Object.fromEntries(data.entries());

  const spinner = document.getElementById("login-spinner");
  const formButton = e.target.querySelector("button");
  spinner.style.display = "block";
  formButton.disabled = true;
  formEl.disabled = true;
  try {
    const response = await fetch("/login", {
      method: "post",
      body: JSON.stringify(entries),
      headers: {
        "content-type": "application/json",
      },
    });
    if (!response.ok) {
      const message = await response.json();
      errorEl.classList.remove("hidden");
      errorEl.innerText = message.message;
    } else {
      window.location = "/";
    }
  } catch (error) {
    console.error(error);
  } finally {
    formEl.disabled = false;
    spinner.style.display = "none";
    formButton.disabled = false;
  }
});
