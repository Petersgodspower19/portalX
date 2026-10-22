import axios from "axios";
const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;
const base = "/api/v1/results";

async function request(method, path, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Your session has expired. Please sign in again.");
  try {
    return await axios({ method, url: `${backendUrl}${base}${path}`, ...options,
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    let data = error.response?.data;
    if (typeof Blob !== "undefined" && data instanceof Blob) {
      try { data = JSON.parse(await data.text()); } catch { data = null; }
    }
    const detail = data?.detail;
    const message = Array.isArray(detail) ? detail.map((item) => item.msg).join(", ")
      : typeof detail === "string" ? detail
      : typeof data?.message === "string" ? data.message
      : "Could not complete this request. Please try again.";
    const failure = new Error(message);
    failure.status = error.response?.status;
    throw failure;
  }
}

export const getAllPendingResults = async () => (await request("get", "/pending")).data;
export const getResultsForClass = async (class_id, term_id) =>
  (await request("get", "/class", { params: { class_id, term_id } })).data;

export const downloadClassResultTemplate = async (class_id, term_id, format = "xlsx") => {
  const response = await request("get", `/template/class/${encodeURIComponent(class_id)}`, {
    params: { term_id, format }, responseType: "blob",
  });
  return response.data;
};

export const uploadClassResults = async (class_id, term_id, file, reason) => {
  const data = new FormData();
  data.append("term_id", term_id);
  data.append("file", file);
  if (reason?.trim()) data.append("reason", reason.trim());
  return (await request("post", `/upload/class/${encodeURIComponent(class_id)}`, { data })).data;
};

export const getClassSubmission = async (class_id, term_id) => {
  try {
    return (await request("get", `/submissions/class/${encodeURIComponent(class_id)}`, { params: { term_id } })).data;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
};
export const submitClassResults = async (class_id, term_id) =>
  (await request("post", `/submissions/class/${encodeURIComponent(class_id)}/submit`, { params: { term_id } })).data;
export const approveClassResults = async (class_id, term_id) =>
  (await request("post", `/submissions/class/${encodeURIComponent(class_id)}/approve`, { params: { term_id } })).data;
export const rejectClassResults = async (class_id, term_id, reason) =>
  (await request("post", `/submissions/class/${encodeURIComponent(class_id)}/reject`, {
    params: { term_id }, data: { reason: reason.trim() },
  })).data;

export const lockTerm = async (term_id) =>
  (await request("post", `/terms/${encodeURIComponent(term_id)}/lock`)).data;
export const unlockTerm = async (term_id, unlock_reason) =>
  (await request("post", `/terms/${encodeURIComponent(term_id)}/unlock`, { data: { unlock_reason: unlock_reason.trim() } })).data;
export const getStudentResults = async (term_id) =>
  (await request("get", "/me", { params: { term_id } })).data;
export const downloadMyResultsAsPdf = async (term_id) =>
  (await request("get", "/me/pdf", { params: { term_id }, responseType: "blob" })).data;
export const verifyResultsAuthenticity = async (token) => {
  const response = await axios.get(`${backendUrl}${base}/verify/${encodeURIComponent(token)}`);
  return response.data;
};
