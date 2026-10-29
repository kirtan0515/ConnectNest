import { api } from "../api/client";

/**
 * Central activity feed — a single request that returns the three sections
 * the Activity dashboard renders. Each list defaults to [] so pages can map
 * over them without guarding.
 */
export const getActivity = async () => {
  const res = await api.get("/activity");
  return {
    recentEvents: res?.recentEvents ?? [],
    recentPosts: res?.recentPosts ?? [],
    activeGroups: res?.activeGroups ?? [],
  };
};
