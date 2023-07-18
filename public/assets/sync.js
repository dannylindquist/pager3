const errorText = document.getElementById("errorText");
let url = "";
let eventsource = null;

async function testConnection(testUrl) {
  try {
    const res = await fetch(`${testUrl}/v1/doc/index.html`);
    return res.status === 200;
  } catch (err) {
    return false;
  }
}

function clearNumber() {
  fetch(`${url}/v1/message/Pager/clear`);
}

function setNumber(value) {
  fetch(`${url}/v1/message/Pager/trigger`, {
    method: "post",
    headers: {
      "content-type": "application/json",
      accept: "*/*",
    },
    body: JSON.stringify([
      {
        name: "Message",
        text: {
          text: value,
        },
      },
    ]),
  });
}

/**
 * @type {{
 *  state: 'idle' | 'showing';
 *  timer?: number;
 *  shownIndex: number | null;
 *  shownValue: string | null;
 *  values: string[];
 *  showValue: () => void;
 *  startCycle: () => void;
 * }}
 */
const displayState = {
  state: "idle",
  timer: null,
  shownIndex: null,
  shownValue: null,
  values: [],
  showValue() {
    if (typeof this.shownIndex !== "number" && this.values.length) {
      this.shownIndex = 0;
      this.shownValue = this.values[this.shownIndex];
    } else if (typeof this.shownIndex === "number" && this.values.length) {
      const nextIndex =
        this.shownIndex + 1 >= this.values.length ? 0 : this.shownIndex + 1;
      this.shownIndex = nextIndex;
      this.shownValue = this.values[nextIndex];
    }
    setNumber(this.shownValue);
  },
  clearValue() {
    clearInterval(this.timer);
    clearNumber();
    this.shownIndex = null;
    this.shownValue = null;
    this.state = "idle";
  },
  startCycle() {
    if (this.state === "idle") {
      if (this.values.length) {
        this.state = "showing";
        this.showValue();
        this.timer = setInterval(() => {
          this.showValue();
        }, 5000);
      }
    } else {
      // all values have been removed
      if (!this.values.length) {
        this.clearValue();
        return;
      }
      /**
       * Values updated. We need to:
       * 1. Check if the currently shown value is still valid
       * 2. Correct shown index if it's moved
       */
      const currentAvailable = this.values.indexOf(this.shownValue);
      // shown value has moved
      if (currentAvailable >= 0) {
        this.shownIndex = currentAvailable;
        return;
      } else {
        // shown value has been deleted.
        // clear interval and show what is in the current location
        clearInterval(this.timer);
        this.shownIndex =
          this.values.length > this.shownIndex ? this.shownIndex : 0;
        setNumber((this.shownValue = this.values[this.shownIndex]));
        this.timer = setInterval(() => {
          this.showValue();
        }, 5000);
      }
    }
  },
};

const syncForm = document.getElementById("sync-form");
syncForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formInfo = new FormData(e.target);
  const location = formInfo.get("location");
  if (!location) {
    errorText.innerText = "Please choose location";
    errorText.classList.remove("hidden");
    return;
  }
  const server = formInfo.get("endpoint") || "localhost";
  const port = formInfo.get("port") || 1025;
  const testUrl = `http://${server}:${port}`;

  if (!(await testConnection(testUrl))) {
    errorText.innerText = "connection failed: validate config";
    errorText.classList.remove("hidden");
    return;
  }
  url = testUrl;
  errorText.classList.add("hidden");

  eventsource = new EventSource(`/stream/${location}`);

  eventsource.addEventListener("error", (error) => {
    console.log(error);
  });

  eventsource.addEventListener("message", (event) => {
    displayState.values = JSON.parse(event.data);
    displayState.startCycle();
  });

  eventsource.addEventListener("open", (event) => {
    console.log("opened event lister");
  });
});
