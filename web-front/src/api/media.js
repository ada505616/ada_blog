import { adminHttp } from "./http";

export async function fetchMediaFiles(params = {}) {
  const { data } = await adminHttp.get("/admin/media-files", { params });
  return data;
}

export async function uploadMedia(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await adminHttp.post("/admin/media-files/upload", formData);
  return data;
}

export async function uploadEditorImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await adminHttp.post("/admin/media-files/editorjs", formData);
  return data;
}

export async function deleteMediaFile(id) {
  const { data } = await adminHttp.delete(`/admin/media-files/${id}`);
  return data;
}
