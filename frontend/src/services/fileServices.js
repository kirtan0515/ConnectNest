import { api } from "../api/client";

/**
 * Resolve a stored object key to a short-lived presigned GET URL.
 * Returns null when no key is given so callers can skip the request.
 */
export const getDownloadUrl = async (key) => {
  if (!key) return null;
  const res = await api.get(`/uploads/url?key=${encodeURIComponent(key)}`);
  return res?.url ?? null;
};
