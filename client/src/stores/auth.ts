import { defineStore } from "pinia";
import { authApi, type PublicUser } from "../api/auth";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") ?? "",
    user: null as PublicUser | null
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    isAdmin: (s) => s.user?.role === "ADMIN"
  },
  actions: {
    setSession(data: { token: string; user: PublicUser }) {
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem("token", data.token);
    },
    async login(username: string, password: string) {
      const data = (await authApi.login({ username, password })) as { token: string; user: PublicUser };
      this.setSession(data);
      return data.user;
    },
    async ensureUser() {
      if (this.token && !this.user) {
        try {
          this.user = (await authApi.me()) as PublicUser;
        } catch {
          this.logout();
        }
      }
    },
    logout() {
      this.token = "";
      this.user = null;
      localStorage.removeItem("token");
    }
  }
});
