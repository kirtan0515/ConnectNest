import React, { useEffect, useState, useRef } from "react";
import { getUrl, uploadData, list, remove } from "aws-amplify/storage";
import "./Files.css";

const Files = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const result = await list({ path: "uploads/" });
      const items = result?.items || [];
      // Fetch signed URLs for each
      const withUrls = await Promise.all(
        items.map(async (item) => {
          try {
            const { url } = await getUrl({ path: item.path });
            return { ...item, signedUrl: url.toString() };
          } catch {
            return { ...item, signedUrl: null };
          }
        })
      );
      setFiles(withUrls);
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      await uploadData({
        path: `uploads/${Date.now()}_${file.name}`,
        data: file,
        options: {
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes) setProgress(Math.round((transferredBytes / totalBytes) * 100));
          },
        },
      }).result;
      await fetchFiles();
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (path) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      await remove({ path });
      setFiles((prev) => prev.filter((f) => f.path !== path));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const getFileName = (path) => path.split("/").pop().replace(/^\d+_/, "");
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
          <p>Click to upload a file</p>
          <span>Any file type supported</span>
        </div>
        <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />

        {uploading && (
          <div className="files-upload__progress">
            <div className="files-upload__bar" style={{ width: `${progress}%` }} />
            <span>{progress}%</span>
          </div>
        )}
      </div>

      <div className="files-list">
        {files.length === 0 && !uploading && (
          <div className="card files-empty">No files uploaded yet.</div>
        )}
        {files.map((file) => {
          const name = getFileName(file.path);
          return (
            <div key={file.path} className="file-card card">
              <div className="file-card__icon">{getFileIcon(name)}</div>
              <div className="file-card__info">
                <div className="file-card__name">{name}</div>
                <div className="file-card__size">
                  {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ""}
                </div>
              </div>
              <div className="file-card__actions">
                {file.signedUrl && (
                  <a href={file.signedUrl} target="_blank" rel="noopener noreferrer" className="btn-outline file-btn">
                    Open
                  </a>
                )}
                <button className="btn-ghost file-btn danger" onClick={() => handleDelete(file.path)}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Files;
