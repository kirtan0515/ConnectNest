import React, { useState } from "react";
import { api } from "../../api/client";
import "./CreateEvent.css";

const CreateEvent = ({ onCreated }) => {
  const [form, setForm] = useState({ title: "", description: "", date: "", location: "" });
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
        startsAt: form.date || new Date().toISOString().split("T")[0],
        location: form.location || "",
      });
      setForm({ title: "", description: "", date: "", location: "" });
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
      <h2 className="event-form__title">Create Event</h2>

      {error && <div className="event-form__error">{error}</div>}
      {success && <div style={{ color: "var(--success)", fontSize: 13, fontWeight: 600 }}>✓ Event created!</div>}

      <input
        className="event-form__input"
        type="text"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Event title *"
        required
      />
      <input
        className="event-form__input"
        type="text"
        name="location"
        value={form.location}
        onChange={handleChange}
        placeholder="Location"
      />
      <input
        className="event-form__input"
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
        min={new Date().toISOString().split("T")[0]}
      />
      <textarea
        className="event-form__textarea"
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Event description"
        rows={3}
      />
      <button type="submit" className="btn-primary event-form__submit" disabled={loading}>
        {loading ? "Creating…" : "Create Event"}
      </button>
    </form>
  );
};

export default CreateEvent;
