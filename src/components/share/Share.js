import "./share.css";
import { useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/api";
import { createPost } from "../../graphql/mutations";
import { uploadData, getUrl } from "aws-amplify/storage";

const client = generateClient();

const Share = () => {
  const { user } = useAuthenticator();
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);

  const handlePost = async () => {
    if (!content.trim() && !file) return;

    let imageUrl = null;

    if (file) {
      const fileName = `${Date.now()}_${file.name}`;
      try {
        await uploadData({ key: fileName, data: file }).result;
        const url = await getUrl({ key: fileName });
        imageUrl = url.url;
      } catch (err) {
        console.error("Image upload failed:", err);
      }
    }

    const input = {
      content,
      createdBy: user.username,
      createdAt: new Date().toISOString(),
      likes: 0,
      image: imageUrl,
    };

    try {
      await client.graphql({
        query: createPost,
        variables: { input },
        authMode: "userPool", // ✅ correct value as string
      });

      setContent("");
      setFile(null);
    } catch (err) {
      console.error("Failed to create post:", err);
    }
  };

  return (
    <div className="share">
      <div className="container">
        <input
          type="text"
          placeholder={`What's on your mind, ${user.username}?`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={handlePost}>Share</button>
      </div>
    </div>
  );
};

export default Share;
