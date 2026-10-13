import React, { useState, useRef } from "react";
import { uploadFile } from "../../api/client";
import "./Files.css";

/**
 * Files upload. Uses presigned S3 PUT URLs from the API.
 *
 * NOTE: listing and deleting existing objects needs additional API endpoints
 * (list + delete backed by S3), which are a planned follow-up. For now this
 * shows files uploaded during the current session.
 */
const Files = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const key = await uploadFile(file, "files");
      setFiles((prev) => [
        { key, name: file.name, size: file.size },
        ...prev,
      ]);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const getFileIcon = (name) => {
    const ext = name.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "🖼️";
    if (["pdf"].includes(ext)) return "📄";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["xls", "xlsx"].includes(ext)) return "📊";
    if (["zip", "rar"].includes(ext)) return "🗜️";
    return "📁";
  };

  return (
    <div className="files-page">
      <div className="files-page__header">
        <h1>Files</h1>
        <p>Upload and share files with your campus community</p>
      </div>

      <div className="files-upload card">
        <div className="files-upload__zone" onClick={() => fileRef.current?.click()}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
          <p>{uploading ? "Uploading…" : "Click to upload a file"}</p>
          <span>Any file type supported</span>
        </div>
        <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
      </div>

      <div className="files-list">
        {files.length === 0 && !uploading && (
          <div className="card files-empty">No files uploaded yet.</div>
        )}
        {files.map((file) => (
          <div key={file.key} className="file-card card">
            <div className="file-card__icon">{getFileIcon(file.name)}</div>
            <div className="file-card__info">
              <div className="file-card__name">{file.name}</div>
              <div className="file-card__size">
                {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ""}
              </div>
            </div>
            <div className="file-card__actions">
              <span className="file-card__uploaded">Uploaded ✓</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Files;
