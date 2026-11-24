import React, { useState } from "react";
import { api } from "../../api/client";
import { toStartsAtIso } from "../../pages/Events/calendarUtils";
import "./CreateEvent.css";

const toLocalToday = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const CreateEvent = ({ onCreated, initialDate = "", heading = "Create Event" }) => {
  const blank = { title: "", description: "", date: initialDate, time: "18:00", location: "" };
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!form.title.trim()) { setError("Event title is required."); return; }

    try {
      setLoading(true);
      await api.post("/events", {
        title: form.title,
        description: form.description || "",
        startsAt: form.date
          ? toStartsAtIso(form.date, form.time)
          : new Date().toISOString().split("T")[0],
        location: form.location || "",
      });
      setForm(blank);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      if (onCreated) onCreated();
    } catch (err) {
      console.error(err);
      setError("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <h2 className="event-form__title">{heading}</h2>

      {error && <div className="event-form__error">{error}</div>}
      {success && <div style={{ color: "var(--success)", fontSize: 13, fontWeight: 600 }}>✓ Event created!</div>}

      <input
        className="event-form__input"
        type="text"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Event title *"
        aria-label="Event title"
        required
      />
      <input
        className="event-form__input"
        type="text"
        name="location"
        value={form.location}
        onChange={handleChange}
        placeholder="Location"
        aria-label="Location"
      />
      <input
        className="event-form__input"
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
        min={toLocalToday()}
        aria-label="Event date"
      />
      <input
        className="event-form__input"
        type="time"
        name="time"
        value={form.time}
        onChange={handleChange}
        aria-label="Start time"
        disabled={!form.date}
      />
      <textarea
        className="event-form__textarea"
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Event description"
        aria-label="Event description"
        rows={3}
      />
      <button type="submit" className="btn-primary event-form__submit" disabled={loading}>
        {loading ? "Creating…" : "Create Event"}
      </button>
    </form>
  );
};

export default CreateEvent;
