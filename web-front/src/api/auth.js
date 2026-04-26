import { adminHttp, publicHttp, clearAuthStorage, setAuthStorage } from "./http";

export async function loginAdmin(payload) {
  const { data } = await publicHttp.post("/admin/auth/login", payload);
  setAuthStorage(data);
  return data;
}

export async function fetchAdminMe() {
  const { data } = await adminHttp.get("/admin/auth/me");
  return data;
}

export async function logoutAdmin(refreshToken) {
  const { data } = await adminHttp.post("/admin/auth/logout", { refreshToken });
  clearAuthStorage();
  return data;
}
