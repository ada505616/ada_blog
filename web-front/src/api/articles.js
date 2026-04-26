import { adminHttp, publicHttp } from "./http";

export async function fetchPublicArticles(params = {}) {
  const { data } = await publicHttp.get("/articles", { params });
  return data;
}

export async function fetchPublicArticle(slug) {
  const { data } = await publicHttp.get(`/articles/${slug}`);
  return data;
}

export async function fetchAdminArticles(params = {}) {
  const { data } = await adminHttp.get("/admin/articles", { params });
  return data;
}

export async function fetchAdminArticle(id) {
  const { data } = await adminHttp.get(`/admin/articles/${id}`);
  return data;
}

export async function createArticle(payload) {
  const { data } = await adminHttp.post("/admin/articles", payload);
  return data;
}

export async function updateArticle(id, payload) {
  const { data } = await adminHttp.put(`/admin/articles/${id}`, payload);
  return data;
}

export async function publishArticle(id) {
  const { data } = await adminHttp.post(`/admin/articles/${id}/publish`);
  return data;
}

export async function deleteArticle(id) {
  const { data } = await adminHttp.delete(`/admin/articles/${id}`);
  return data;
}
