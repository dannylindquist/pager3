const formEl = document.querySelector("form");
const errorEl = document.getElementById("error");

formEl.addEventListener("submit", async (e) => {
  console.log("hello");
  e.preventDefault();
  const data = new FormData(e.target);
  const entries = Object.fromEntries(data.entries());

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
});
