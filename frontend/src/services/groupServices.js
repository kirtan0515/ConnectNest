import { api } from "../api/client";

/** Groups the current user belongs to -> array. */
export const listMyGroups = async () => {
  const res = await api.get("/me/groups");
  return res?.items ?? [];
};

/** A single group by id. */
export const getGroup = (groupId) => api.get(`/groups/${groupId}`);

/** Members of a group. */
export const listGroupMembers = (groupId) =>
  api.get(`/groups/${groupId}/members`);

/** Join a group. */
export const joinGroup = (groupId) => api.post(`/groups/${groupId}/join`, {});
