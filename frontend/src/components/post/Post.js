import React, { useState, useEffect } from "react";
import moment from "moment";
import { Heart, MessageCircle, Share2, SendHorizontal, Trash2 } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../api/client";
import { toggleLike } from "./postLikeUtils";
import { useRealtime } from "../../realtime/useRealtime";
import AuthImage from "../common/AuthImage";
import "./Post.css";

// posts prop: if provided, skip fetching (used by Profile page)
export default function Posts({ posts: propPosts = null }) {
  const [posts, setPosts] = useState(propPosts || []);

  useEffect(() => {
    if (propPosts !== null) {
      setPosts(propPosts);
      return;
    }
    (async () => {
      try {
        const res = await api.get("/posts");
        setPosts(res?.items || []);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    })();
  }, [propPosts]);

  // Live inserts only when this component owns its data (Dashboard feed).
  // Profile passes propPosts and must never be mutated. De-dupe by postId.
  useRealtime("post.created", (item) => {
    if (propPosts !== null) return;
    setPosts((prev) =>
      prev.some((p) => p.postId === item.postId) ? prev : [item, ...prev]
    );
  });

  return (
    <div className="posts">
      {posts.length === 0 && (
        <div className="card posts__empty">
          <p>No posts yet. Be the first to share something!</p>
        </div>
      )}
      {posts.map((post) => (
        <PostItem key={post.postId} post={post} />
      ))}
    </div>
  );
}

function PostItem({ post }) {
  const { user } = useAuth();

  const authorName = post.authorName || "Campus User";
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await toggleLike(post.postId);
      if (res) {
        setLiked(res.liked);
        setLikeCount(res.likeCount);
      }
    } catch (err) {
      console.error("Like error:", err);
    } finally {
      setLikeLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const res = await api.get(`/posts/${post.postId}/comments`);
      const items = res?.items || [];
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setComments(items);
    } catch (err) {
      console.error("Comments error:", err);
    }
  };

  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments((v) => !v);
  };

  const submitComment = async () => {
    if (!commentText.trim() || commentBusy) return;
    setCommentBusy(true);
    try {
      await api.post(`/posts/${post.postId}/comments`, {
        content: commentText.trim(),
      });
      setCommentText("");
      loadComments();
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setCommentBusy(false);
    }
  };

  const deleteComment = async (commentId) => {
    // Optimistic remove; restore the list if the request fails.
    const prev = comments;
    setComments((cs) => cs.filter((c) => c.commentId !== commentId));
    try {
      await api.del(`/posts/${post.postId}/comments/${commentId}`);
    } catch (err) {
      console.error("Delete comment error:", err);
      setComments(prev);
    }
  };

  const myName =
    user?.name || (user?.email ? user.email.split("@")[0] : null) || "U";

  return (
    <div className="post card">
      {/* Header */}
      <div className="post__header">
        <img
          className="avatar post__avatar"
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random&size=80`}
          alt={authorName}
        />
        <div className="post__meta">
          <div className="post__author">{authorName}</div>
          <div className="post__time">{moment(post.createdAt).fromNow()}</div>
        </div>
      </div>

      {/* Body */}
      <div className="post__body">{post.content}</div>

      {/* Image */}
      {post.imageKey && (
        <div className="post__image-wrap">
          <AuthImage imageKey={post.imageKey} alt="" className="post__image" />
        </div>
      )}

      {/* Stats row */}
      {likeCount > 0 && (
        <div className="post__stats">
          <span>{likeCount} {likeCount === 1 ? "like" : "likes"}</span>
        </div>
      )}

      <div className="divider" style={{ margin: "0 16px" }} />

      {/* Actions */}
      <div className="post__actions">
        <button
          className={`post__action-btn${liked ? " liked" : ""}`}
          onClick={handleLike}
          disabled={likeLoading}
        >
          <Heart
            size={18}
            strokeWidth={1.75}
            fill={liked ? "currentColor" : "none"}
            aria-hidden="true"
          />
          Like
        </button>
        <button className="post__action-btn" onClick={toggleComments}>
          <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" />
          Comment
        </button>
        <button className="post__action-btn">
          <Share2 size={18} strokeWidth={1.75} aria-hidden="true" />
          Share
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="post__comments">
          <div className="post__comment-input">
            <img
              className="avatar"
              style={{ width: 32, height: 32 }}
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(myName)}&background=random&size=64`}
              alt=""
            />
            <input
              type="text"
              placeholder="Write a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              disabled={commentBusy}
            />
            <button onClick={submitComment} disabled={commentBusy || !commentText.trim()} aria-label="Post comment">
              <SendHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          {comments.length === 0 && (
            <p className="post__no-comments">No comments yet.</p>
          )}
          {comments.map((c) => (
            <div key={c.commentId} className="post__comment">
              <img
                className="avatar"
                style={{ width: 32, height: 32 }}
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.authorName || "U")}&background=random&size=64`}
                alt={c.authorName}
              />
              <div className="post__comment-bubble">
                <span className="post__comment-author">{c.authorName}</span>
                <span className="post__comment-text">{c.content}</span>
              </div>
              {user?.userId && c.authorId === user.userId && (
                <button
                  type="button"
                  className="post__comment-delete"
                  onClick={() => deleteComment(c.commentId)}
                  aria-label="Delete comment"
                  title="Delete comment"
                >
                  <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
