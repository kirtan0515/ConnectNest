import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../api/client";
import "./Chats.css";

// Single global chatroom. Messages are stored as posts under this groupId and
// polled every few seconds (subscriptions were removed with Amplify/AppSync).
const ROOM_ID = "chat-general";
const POLL_MS = 4000;

const Chats = () => {
  const { user } = useAuth();
  const displayName =
    user?.name || (user?.email ? user.email.split("@")[0] : null) || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/posts?groupId=${ROOM_ID}`);
      const items = res?.items || [];
      items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(items);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await api.post("/posts", { content: text.trim(), groupId: ROOM_ID });
      setText("");
      load();
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chats-page">
      <div className="chats-page__header">
        <h1>Messages</h1>
        <p>General campus chat</p>
      </div>

      <div className="chat-window card">
        <div className="chat-window__messages">
          {messages.length === 0 && (
            <div className="chat-empty">No messages yet. Say hello!</div>
          )}
          {messages.map((msg) => {
            const isMe = msg.authorId === user?.userId;
            const sender = msg.authorName || "User";
            return (
              <div key={msg.postId} className={`chat-msg${isMe ? " chat-msg--me" : ""}`}>
                {!isMe && (
                  <img
                    className="avatar chat-msg__avatar"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(sender)}&background=random&size=64`}
                    alt={sender}
                    style={{ width: 32, height: 32 }}
                  />
                )}
                <div className="chat-msg__body">
                  {!isMe && <span className="chat-msg__sender">{sender}</span>}
                  <div className="chat-msg__bubble">{msg.content}</div>
                  <span className="chat-msg__time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="chat-window__input">
          <div className="chat-input-avatar">{initials}</div>
          <input
            type="text"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={sending}
          />
          <button onClick={sendMessage} disabled={sending || !text.trim()} className="btn-primary chat-send-btn">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chats;
