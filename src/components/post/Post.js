import React, { useState, useEffect } from "react";
import moment from "moment";
import { generateClient } from "aws-amplify/api";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { listPosts, commentsByPostIdAndCreatedAt } from "../../graphql/queries";
import { createComment } from "../../graphql/mutations";
import { onCreatePost } from "../../graphql/subscriptions";
import { getUrl } from "aws-amplify/storage";
import { fetchUserLike, toggleLike } from "./postLikeUtils";
import "./Post.css";

const client = generateClient();

// posts prop: if provided, skip fetching (used by Profile page)
export default function Posts({ posts: propPosts = null }) {
  const [posts, setPosts] = useState(propPosts || []);

  useEffect(() => {
    if (propPosts !== null) { setPosts(propPosts); return; }

    (async () => {
      try {
        const res = await client.graphql({ query: listPosts, authMode: "userPool" });
        const items = res?.data?.listPosts?.items || [];
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPosts(items);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    })();

    const sub = client
      .graphql({ query: onCreatePost, authMode: "userPool" })
      .subscribe({
        next: ({ value }) => {
          const p = value?.data?.onCreatePost;
          if (p) setPosts((prev) => [p, ...prev]);
        },
        error: (err) => console.error("Sub error:", err),
      });

    return () => sub.unsubscribe();
  }, [propPosts]);

  return (
    <div className="posts">
      {posts.length === 0 && (
        <div className="card posts__empty">
          <p>No posts yet. Be the first to share something!</p>
        </div>
      )}
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  );
}

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

function PostItem({ post }) {
  const { user } = useAuthenticator();
  const attrs = user?.attributes || {};
  const userId = attrs.sub || user?.username || "";

  const authorName = isUUID(post.createdBy) ? "Campus User" : post.createdBy;
  const [imgUrl, setImgUrl] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeId, setLikeId] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  useEffect(() => {
    if (post.image) {
      getUrl({ key: post.image })
        .then(({ url }) => setImgUrl(url.toString()))
        .catch(() => {});
    }
  }, [post.image]);

  useEffect(() => {
    (async () => {
      try {
        const existing = await fetchUserLike(post.id, userId);
        if (existing) { setLiked(true); setLikeId(existing.id); }
        setLikeCount(post.likes?.items?.length ?? 0);
      } catch {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, userId]);

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const result = await toggleLike(post.id, userId, liked ? likeId : null);
      if (result === false) {
        setLiked(false);
        setLikeId(null);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        setLiked(true);
        setLikeId(typeof result === "string" ? result : null);
        setLikeCount((c) => c + 1);
      }
    } catch (err) {
      console.error("Like error:", err);
    } finally {
      setLikeLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const res = await client.graphql({
        query: commentsByPostIdAndCreatedAt,
        variables: { postId: post.id, sortDirection: "DESC", limit: 20 },
        authMode: "userPool",
      });
      setComments(res?.data?.commentsByPostIdAndCreatedAt?.items || []);
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
      const displayName =
        attrs.name ||
        attrs.preferred_username ||
        (attrs.email ? attrs.email.split("@")[0] : null) ||
        "User";
      await client.graphql({
        query: createComment,
        variables: {
          input: {
            postId: post.id,
            content: commentText.trim(),
            createdBy: displayName,
            createdAt: new Date().toISOString(),
          },
        },
        authMode: "userPool",
      });
      setCommentText("");
      loadComments();
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setCommentBusy(false);
    }
  };

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
      {post.image && (
        <div className="post__image-wrap">
          <img
            className="post__image"
            src={imgUrl || ""}
            alt=""
            style={{ opacity: imgUrl ? 1 : 0 }}
          />
        </div>
      )}

      {/* Stats row */}
      {likeCount > 0 && (
        <div className="post__stats">
          <span>👍 {likeCount} {likeCount === 1 ? "like" : "likes"}</span>
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
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || "U")}&background=random&size=64`}
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
            <div key={c.id} className="post__comment">
              <img
                className="avatar"
                style={{ width: 32, height: 32 }}
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.createdBy)}&background=random&size=64`}
                alt={c.createdBy}
              />
              <div className="post__comment-bubble">
                <span className="post__comment-author">{c.createdBy}</span>
                <span className="post__comment-text">{c.content}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
