// Thin fetch wrapper for the ConnectNest HTTP API.
// Automatically attaches the Cognito id token as a Bearer credential.

import config from "../config";
import { getIdToken } from "../auth/auth";

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };

  // Attach the JWT when the user is signed in. Public calls still work if the
  // route allows it; protected routes will 401 without a token.
  try {
    const token = await getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // No valid session — send the request unauthenticated.
  }

  const res = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data && data.message) || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  del: (path) => request("DELETE", path),
};

/**
 * Upload an image to S3 via a presigned POST policy from the API.
 * The backend enforces allowed image types + a 5 MB cap in the signed policy.
 * Returns the object key you can persist (e.g. on a profile/post).
 */
export async function uploadFile(file, scope = "files") {
  const { url, fields, key, maxBytes } = await api.post("/uploads/presign", {
    fileName: file.name,
    contentType: file.type || "",
    scope,
  });

  // Client-side guard (server enforces the real limit in the signed policy).
  if (maxBytes && file.size > maxBytes) {
    throw new Error("File is too large (max 5 MB).");
  }

  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => form.append(k, v));
  form.append("Content-Type", file.type);
  form.append("file", file); // "file" field must be last for S3 POST

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");

  return key;
}

export default api;
