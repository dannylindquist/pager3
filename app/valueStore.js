export class ValueStore {
  values = {
    woodinville: [],
    bothell: [],
    kenmore: [],
  };
  listeners = [];
  constructor() {
    this.listeners = [];
  }
  subscribe(location, listener) {
    if (!(location in this.values)) {
      throw new Error("not a valid location");
    }
    const entry = {
      location,
      listener,
    };
    this.listeners.push(entry);
    listener(this.values[location] || []);
    return () => {
      this.listeners = this.listeners.filter((item) => item !== entry);
    };
  }
  /**
   *
   * @param {string} location
   * @param {string} value
   */
  add(location, value) {
    if (location in this.values) {
      const upperValue = value.toUpperCase();
      if (!this.values[location].includes(upperValue)) {
        this.values[location].push(upperValue);
        this.emitUpdate(location);
      }
    }
  }
  emitUpdate(location) {
    this.listeners.forEach((entry) => {
      if (entry.location === location.toLowerCase()) {
        entry.listener(this.values[location]);
      }
    });
  }
  remove(location, value) {
    if (location in this.values) {
      const upperValue = value.toUpperCase();
      const initialLength = this.values[location].length;
      console.log("removing", value, this.values[location]);
      this.values[location] = this.values[location].filter(
        (x) => x !== upperValue
      );
      const postRemoveLength = this.values[location].length;
      if (initialLength !== postRemoveLength) {
        this.emitUpdate(location);
      }
    }
  }
}
