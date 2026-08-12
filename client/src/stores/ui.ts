import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", {
  state: () => ({
    message: ""
  }),
  actions: {
    error(message: string) {
      this.message = message;
    },
    clear() {
      this.message = "";
    }
  }
});
