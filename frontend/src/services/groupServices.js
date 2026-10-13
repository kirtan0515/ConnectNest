import { api } from "../api/client";

/** Groups the current user belongs to -> array. */
export const listMyGroups = async () => {
  const res = await api.get("/me/groups");
  return res?.items ?? [];
};
