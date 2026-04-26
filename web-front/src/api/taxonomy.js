import { adminHttp, publicHttp } from "./http";

export async function fetchCategories() {
  const { data } = await publicHttp.get("/categories");
  return data;
}

export async function fetchTags() {
  const { data } = await publicHttp.get("/tags");
  return data;
}

export async function fetchAdminCategories() {
  const { data } = await adminHttp.get("/admin/categories");
  return data;
}

export async function createCategory(payload) {
  const { data } = await adminHttp.post("/admin/categories", payload);
  return data;
}

export async function updateCategory(id, payload) {
  const { data } = await adminHttp.put(`/admin/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id) {
  const { data } = await adminHttp.delete(`/admin/categories/${id}`);
  return data;
}

export async function fetchAdminTags() {
  const { data } = await adminHttp.get("/admin/tags");
  return data;
}

export async function createTag(payload) {
  const { data } = await adminHttp.post("/admin/tags", payload);
  return data;
}

export async function updateTag(id, payload) {
  const { data } = await adminHttp.put(`/admin/tags/${id}`, payload);
  return data;
}

export async function deleteTag(id) {
  const { data } = await adminHttp.delete(`/admin/tags/${id}`);
  return data;
}
