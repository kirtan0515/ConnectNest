import React, { useEffect, useState } from "react";
import { generateClient } from "@aws-amplify/api";
import { listPosts } from "../../graphql/queries";
import { createPost } from "../../graphql/mutations";
import { uploadData, getUrl } from "@aws-amplify/storage";

const client = generateClient(); // ✅ Correct API initialization

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ content: "", image: null });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const postData = await client.graphql({ query: listPosts });
      setPosts(postData.data.listPosts.items);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.content) return;

    try {
      let imageUrl = null;
      if (newPost.image) {
        const filename = `images/${Date.now()}-${newPost.image.name}`;
        await uploadData(filename, newPost.image);
        imageUrl = await getUrl(filename);
      }

      const input = { content: newPost.content, image: imageUrl };
      await client.graphql({ query: createPost, variables: { input } });
      fetchPosts();
      setNewPost({ content: "", image: null });
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">News Feed</h2>
      <div className="p-4 bg-gray-200 rounded">
        <textarea
          placeholder="What's on your mind?"
          value={newPost.content}
          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          className="border p-2 rounded w-full mt-2"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setNewPost({ ...newPost, image: e.target.files[0] })}
          className="mt-2"
        />
        <button onClick={handleCreatePost} className="mt-2 p-2 bg-blue-500 text-white rounded">
          Post
        </button>
      </div>

      {posts.map((post) => (
        <div key={post.id} className="border p-2 rounded mt-2">
          <p>{post.content}</p>
          {post.image && <img src={post.image} alt="Post" className="w-full mt-2" />}
        </div>
      ))}
    </div>
  );
};

export default Feed;
