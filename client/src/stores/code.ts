import { defineStore } from "pinia";
import { accessApi, type CodeInfo } from "../api/access";
import { testApi } from "../api/test";

export const useCodeStore = defineStore("code", {
  state: () => ({
    accessCode: localStorage.getItem("accessCode") ?? "",
    info: null as CodeInfo | null,
    adminKey: localStorage.getItem("adminKey") ?? ""
  }),
  getters: {
    hasCode: (s) => !!s.accessCode,
    isAdminAuthed: (s) => !!s.adminKey
  },
  actions: {
    async validate(code: string) {
      const data = await accessApi.validate(code);
      this.accessCode = data.accessCode;
      this.info = data;
      localStorage.setItem("accessCode", data.accessCode);
    },
    async refreshInfo() {
      if (!this.accessCode) return;
      try {
        this.info = await testApi.quota();
      } catch {
        // 激活码失效时由拦截器跳转 /access
      }
    },
    setAdminKey(key: string) {
      this.adminKey = key;
      localStorage.setItem("adminKey", key);
    },
    clearAdminKey() {
      this.adminKey = "";
      localStorage.removeItem("adminKey");
    },
    logout() {
      this.accessCode = "";
      this.info = null;
      localStorage.removeItem("accessCode");
    }
  }
});
