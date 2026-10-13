import { api } from "../api/client";

/** Deactivate (reversible) — hides the account and logs out. */
export const deactivateAccount = () => api.post("/account/deactivate", {});

/** Reactivate a deactivated / pending-deletion account. */
export const reactivateAccount = () => api.post("/account/reactivate", {});

/** Request soft deletion (30-day grace, then permanent purge). */
export const deleteAccount = () => api.post("/account/delete", {});
