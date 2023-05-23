import fitty from "https://unpkg.com/fitty@2.3.6/dist/fitty.module.js";
const location = document.getElementById("location").innerText.toLowerCase();
const shownNumber = document.getElementById("shown-number");

fitty(shownNumber, {
  maxSize: 1000,
});

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
    shownNumber.innerText = this.shownValue;
  },
  clearValue() {
    clearInterval(this.timer);
    shownNumber.innerText = "";
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
        shownNumber.innerText = this.shownValue = this.values[this.shownIndex];
        this.timer = setInterval(() => {
          this.showValue();
        }, 5000);
      }
    }
    console.log(this);
  },
};

const events = new EventSource(`/stream/${location}`);

events.addEventListener("error", (error) => {
  console.log(error);
});

events.addEventListener("message", (event) => {
  displayState.values = JSON.parse(event.data);
  displayState.startCycle();
});

events.addEventListener("open", (event) => {
  console.log("opened event lister");
});
