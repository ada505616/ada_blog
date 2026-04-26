import { defineStore } from "pinia";
import { fetchAdminMe, loginAdmin, logoutAdmin } from "../api/auth";
import {
  clearAuthStorage,
  getStoredAccessToken,
  getStoredAdmin,
  getStoredRefreshToken
} from "../api/http";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    accessToken: getStoredAccessToken(),
    refreshToken: getStoredRefreshToken(),
    admin: getStoredAdmin(),
    sessions: [],
    loading: false
  }),
  getters: {
    isAuthenticated(state) {
      return Boolean(state.accessToken);
    }
  },
  actions: {
    async login(form) {
      this.loading = true;

      try {
        const data = await loginAdmin(form);
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.admin = data.admin;
        return data;
      } finally {
        this.loading = false;
      }
    },
    async fetchMe() {
      const data = await fetchAdminMe();
      this.admin = data.admin;
      this.sessions = data.sessions || [];
      return data;
    },
    async logout() {
      const token = getStoredRefreshToken();

      try {
        if (token) {
          await logoutAdmin(token);
        }
      } finally {
        this.reset();
      }
    },
    reset() {
      this.accessToken = null;
      this.refreshToken = null;
      this.admin = null;
      this.sessions = [];
      clearAuthStorage();
    }
  }
});
