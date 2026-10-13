import React, { useEffect, useState } from "react";
import { getDownloadUrl } from "../../services/fileServices";

/**
 * Renders an image stored in the uploads bucket. Takes the object key, resolves
 * it to a short-lived presigned URL on mount, and renders an <img>. Renders
 * nothing when the key is absent or the URL cannot be resolved.
 */
export default function AuthImage({ imageKey, alt = "", className = "", style }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let active = true;
    if (!imageKey) {
      setUrl(null);
      return;
    }
    (async () => {
      try {
        const resolved = await getDownloadUrl(imageKey);
        if (active) setUrl(resolved);
      } catch (err) {
        console.error("AuthImage load error:", err);
        if (active) setUrl(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [imageKey]);

  if (!imageKey || !url) return null;

  return <img src={url} alt={alt} className={className} style={style} />;
}
