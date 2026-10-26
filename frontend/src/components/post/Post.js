import React, { useState, useEffect } from "react";
import moment from "moment";
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
          {liked
            ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
            : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2zM9 9l4.34-4.34L12 10h9v2l-3 7H9V9zM1 9h4v12H1z"/></svg>
          }
          Like
        </button>
        <button className="post__action-btn" onClick={toggleComments}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg>
          Comment
        </button>
        <button className="post__action-btn">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
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
            <button onClick={submitComment} disabled={commentBusy || !commentText.trim()}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
