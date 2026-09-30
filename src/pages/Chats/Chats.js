import React, { useEffect, useState, useRef } from "react";
import { generateClient } from "aws-amplify/api";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { listChatMessages } from "../../graphql/queries";
import { createChatMessage } from "../../graphql/mutations";
import { onCreateChatMessage } from "../../graphql/subscriptions";
import "./Chats.css";

const client = generateClient();
const ROOM_ID = "general"; // single global chatroom for now

const Chats = () => {
  const { user } = useAuthenticator();
  const attrs = user?.attributes || {};
  const displayName =
    attrs.name ||
    attrs.preferred_username ||
    (attrs.email ? attrs.email.split("@")[0] : null) ||
    "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    // Initial load
    (async () => {
      try {
        const res = await client.graphql({
          query: listChatMessages,
          variables: { filter: { chatroomID: { eq: ROOM_ID } }, limit: 100 },
          authMode: "userPool",
        });
        const items = res?.data?.listChatMessages?.items || [];
        items.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(items);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    })();

    // Subscribe to new messages
    const sub = client
      .graphql({ query: onCreateChatMessage, authMode: "userPool" })
      .subscribe({
        next: ({ value }) => {
          const msg = value?.data?.onCreateChatMessage;
          if (msg && msg.chatroomID === ROOM_ID) {
            setMessages((prev) => [...prev, msg]);
          }
        },
        error: (err) => console.error("Chat sub error:", err),
      });

    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await client.graphql({
        query: createChatMessage,
        variables: {
          input: {
            sender: displayName,
            content: text.trim(),
            chatroomID: ROOM_ID,
            timestamp: new Date().toISOString(),
          },
        },
        authMode: "userPool",
      });
      setText("");
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
            const isMe = msg.sender === displayName;
            return (
              <div key={msg.id} className={`chat-msg${isMe ? " chat-msg--me" : ""}`}>
                {!isMe && (
                  <img
                    className="avatar chat-msg__avatar"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender)}&background=random&size=64`}
                    alt={msg.sender}
                    style={{ width: 32, height: 32 }}
                  />
                )}
                <div className="chat-msg__body">
                  {!isMe && <span className="chat-msg__sender">{msg.sender}</span>}
                  <div className="chat-msg__bubble">{msg.content}</div>
                  <span className="chat-msg__time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
