import { api } from "../api/client";

export const getEvents = async () => {
  const res = await api.get("/events");
  return res?.items ?? [];
};

export const createEvent = async (eventData) => api.post("/events", eventData);

export const getEvent = async (eventId) => api.get(`/events/${eventId}`);

export const updateEvent = async (eventId, data) =>
  api.put(`/events/${eventId}`, data);

export const deleteEvent = async (eventId) => api.del(`/events/${eventId}`);

// --- Week 6: RSVPs ---

/** RSVP to an event (status "going" | "interested"). */
export const rsvpToEvent = async (eventId, status = "going") =>
  api.post(`/events/${eventId}/rsvp`, { status });

/** Cancel the current user's RSVP. */
export const cancelRsvp = async (eventId) =>
  api.post(`/events/${eventId}/rsvp`, { cancel: true });

/** List attendees for an event -> { items, count }. */
export const listAttendees = async (eventId) =>
  api.get(`/events/${eventId}/rsvps`);

/** Events the current user has RSVP'd to -> array. */
export const listMyRsvps = async () => {
  const res = await api.get("/me/rsvps");
  return res?.items ?? [];
};
