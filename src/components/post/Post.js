import "./Post.css";
import { useEffect, useState } from "react";
import moment from "moment";
import { generateClient } from "aws-amplify/api";
import { listPosts } from "../../graphql/queries";
import { onCreatePost } from "../../graphql/subscriptions";

const client = generateClient();

const Post = ({ post }) => {
  const [likes, setLikes] = useState(post.likes || 0);

  const handleLike = () => {
    setLikes((prev) => prev + 1);
    // 🔧 Later: Implement `updatePost` mutation here
  };

  return (
    <div className="post">
      <div className="container">
        <div className="user">
          <div className="userInfo">
            <img
              src={`https://ui-avatars.com/api/?name=${post.createdBy}&background=random`}
              alt="avatar"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-avatar.png"; // optional fallback
              }}
            />
            <div className="details">
              <span className="name">{post.createdBy}</span>
              <span className="date">{moment(post.createdAt).fromNow()}</span>
            </div>
          </div>
        </div>
        <div className="content">
          <p>{post.content}</p>
          {post.image && <img src={post.image} alt="post" />}
        </div>
        <div className="info">
          <div className="item" onClick={handleLike}>
            ❤️ {likes} Likes
          </div>
          <div className="item">💬 Comments</div>
          <div className="item">🔗 Share</div>
        </div>
      </div>
    </div>
  );
};

const Posts = () => {
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    try {
      const res = await client.graphql({
        query: listPosts,
        authMode: "userPool",
      });
      setPosts(res.data.listPosts.items);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  useEffect(() => {
    fetchPosts();

    const subscription = client.graphql({
      query: onCreatePost,
      authMode: "userPool",
    }).subscribe({
      next: ({ data }) => {
        const newPost = data.onCreatePost;
        setPosts((prev) => [newPost, ...prev]);
      },
      error: (err) => {
        console.error("Subscription error:", err);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="posts">
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
};

export default Posts;
