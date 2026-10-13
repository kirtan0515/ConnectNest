import React, { useState, useRef } from "react";
import { useAuth } from "../../auth/AuthContext";
import { api, uploadFile } from "../../api/client";
import "./share.css";

export default function Share({ onPosted }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const fileRef = useRef();

  const displayName =
    user?.name || (user?.email ? user.email.split("@")[0] : null) || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const pictureUrl = "";

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handlePost = async () => {
    if (busy || (!content.trim() && !file)) return;
    setBusy(true);
    let imageKey = null;

    if (file) {
      try {
        imageKey = await uploadFile(file, "posts");
      } catch (err) {
        console.error("Upload failed:", err);
        setFeedback("Upload error. Try again.");
        setBusy(false);
        return;
      }
    }

    try {
      await api.post("/posts", { content, imageKey });
      setContent("");
      removeFile();
      setFeedback("Posted!");
      setTimeout(() => setFeedback(""), 3000);
      if (onPosted) onPosted();
    } catch (err) {
      console.error("createPost failed:", err);
      setFeedback("Error posting. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="share card">
      <div className="share__top">
        {pictureUrl
          ? <img src={pictureUrl} alt={displayName} className="avatar share__avatar" />
          : <div className="share__initials">{initials}</div>
        }
        <input
          className="share__input"
          type="text"
          placeholder={`What's on your mind, ${displayName.split(" ")[0]}?`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={busy}
          onKeyDown={(e) => e.key === "Enter" && handlePost()}
        />
      </div>

      {preview && (
        <div className="share__preview">
          <img src={preview} alt="preview" />
          <button className="share__remove-img" onClick={removeFile} title="Remove">✕</button>
        </div>
      )}

      <div className="divider" />

      <div className="share__actions">
        <button className="share__action-btn" onClick={() => fileRef.current?.click()} disabled={busy}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
          Photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />

        <button className="share__action-btn" disabled>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
          Video
        </button>

        <button
          className="share__post-btn btn-primary"
          onClick={handlePost}
          disabled={busy || (!content.trim() && !file)}
        >
          {busy ? "Posting…" : "Post"}
        </button>
      </div>

      {feedback && <div className="share__feedback">{feedback}</div>}
    </div>
  );
}
