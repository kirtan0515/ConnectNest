import React, { useEffect, useState } from "react";
import { getUrl, uploadData, list } from "@aws-amplify/storage"; // ✅ Correct Import

const Files = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUrls, setFileUrls] = useState({}); // Store file URLs

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const fileList = await list(""); // ✅ Correct function usage
      setFiles(fileList);
      
      // Fetch URLs for each file
      const urls = {};
      for (const file of fileList) {
        urls[file.key] = await getUrl(file.key);
      }
      setFileUrls(urls);
      
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadData(selectedFile.name, selectedFile); // ✅ Correct function usage
      fetchFiles();
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const openFile = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">File Sharing</h2>
      <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="mt-2" />
      <button onClick={handleUpload} className="mt-2 p-2 bg-blue-500 text-white rounded">
        Upload
      </button>

      <ul className="mt-4">
        {files.map((file) => (
          <li key={file.key} className="border p-2 rounded mt-2">
            <button
              onClick={() => openFile(fileUrls[file.key])}
              className="text-blue-500 underline"
            >
              {file.key}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Files;
