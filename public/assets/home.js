/**
 * @type {HTMLFormElement}
 */
const numberEntryForm = document.getElementById("number-entry");
const location = document.getElementById("location").innerText.toLowerCase();
const currentValueBlock = document.getElementById("current-value-block");
const currentValue = document.getElementById("current-value");

let values = [];
function renderValues() {
  if (values.length === 0) {
    currentValueBlock.innerHTML = "None";
  } else {
    const html = values
      .map(
        (value) => `
    <div class="flex items-center border rounded border-gray-700 pl-2 bg-gray-900">
        <div class="flex-1">${value}</div>
        <form action="/message" method="DELETE" class="block" style="margin:0;" data-delete-form>
            <input type="hidden" name="value" value='${value}' />
            <button class="block rounded p-2" type="submit"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-white">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          </button>
        </form>
    </div>
    `
      )
      .join("");
    currentValueBlock.innerHTML = html;
  }
}

numberEntryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const value = data.get("value");
  if (!value) {
    return;
  }
  console.log(Object.fromEntries(data.entries()));
  const res = await fetch("/message", {
    body: JSON.stringify(Object.fromEntries(data.entries())),
    method: "post",
    headers: {
      "content-type": "application/json",
    },
  });
  numberEntryForm.reset();
});

const events = new EventSource(`/stream/${location}`);

events.addEventListener("error", (error) => {
  console.log(error);
});

events.addEventListener("message", (event) => {
  values = JSON.parse(event.data);
  renderValues();
});

events.addEventListener("open", (event) => {
  console.log("opened event lister");
});

currentValueBlock.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const formObject = Object.fromEntries(formData.entries());
  console.log("delete", formObject);
  await fetch(form.action, {
    method: "DELETE",
    body: JSON.stringify(formObject),
    headers: {
      "content-type": "application/json",
    },
  });
});
