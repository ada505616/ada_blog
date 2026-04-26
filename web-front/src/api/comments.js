import { adminHttp, publicHttp } from "./http";

export async function fetchArticleComments(articleId) {
  const { data } = await publicHttp.get(`/articles/${articleId}/comments`);
  return data;
}

export async function createComment(articleId, payload) {
  const { data } = await publicHttp.post(`/articles/${articleId}/comments`, payload);
  return data;
}

export async function fetchAdminComments(params = {}) {
  const { data } = await adminHttp.get("/admin/comments", { params });
  return data;
}

export async function auditComment(id, status) {
  const { data } = await adminHttp.put(`/admin/comments/${id}/audit`, { status });
  return data;
}

export async function deleteComment(id) {
  const { data } = await adminHttp.delete(`/admin/comments/${id}`);
  return data;
}
