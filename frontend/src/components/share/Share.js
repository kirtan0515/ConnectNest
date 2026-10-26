import React, { useState, useRef } from "react";
import { ImagePlus, Video, X } from "lucide-react";
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
          <button className="share__remove-img" onClick={removeFile} title="Remove" aria-label="Remove image">
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="divider" />

      <div className="share__actions">
        <button className="share__action-btn" onClick={() => fileRef.current?.click()} disabled={busy}>
          <ImagePlus size={18} strokeWidth={1.75} aria-hidden="true" />
          Photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />

        <button className="share__action-btn" disabled>
          <Video size={18} strokeWidth={1.75} aria-hidden="true" />
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
