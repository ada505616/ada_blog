import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const APP_BASE_URL = import.meta.env.BASE_URL || "/";
const ACCESS_TOKEN_KEY = "ada_blog_access_token";
const REFRESH_TOKEN_KEY = "ada_blog_refresh_token";
const ADMIN_USER_KEY = "ada_blog_admin";

export const publicHttp = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

export const adminHttp = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000
});

let refreshPromise = null;

adminHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

adminHttp.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (!response || response.status !== 401 || config._retry) {
      throw normalizeHttpError(error);
    }

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      clearAuthStorage();
      throw normalizeHttpError(error);
    }

    config._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = publicHttp.post("/admin/auth/refresh", { refreshToken });
      }

      const { data } = await refreshPromise;
      setAuthStorage(data);
      config.headers.Authorization = `Bearer ${data.accessToken}`;
      return adminHttp(config);
    } catch (refreshError) {
      clearAuthStorage();

      if (window.location.pathname.startsWith(`${APP_BASE_URL}admin`) || window.location.pathname.startsWith("/admin")) {
        window.location.href = `${APP_BASE_URL}admin/login`;
      }

      throw normalizeHttpError(refreshError);
    } finally {
      refreshPromise = null;
    }
  }
);

export function normalizeHttpError(error) {
  const message = error?.response?.data?.message || error?.message || "请求失败";
  const status = error?.response?.status || 500;
  return {
    status,
    message,
    raw: error
  };
}

export function setAuthStorage(payload) {
  localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(payload.admin));
}

export function clearAuthStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

export function getStoredAdmin() {
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export { API_BASE_URL, APP_BASE_URL };
