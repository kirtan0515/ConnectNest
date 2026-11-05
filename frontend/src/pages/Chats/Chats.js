import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useRealtime } from "../../realtime/useRealtime";
import {
  getConversations,
  getMessages,
  sendMessage,
  searchUsers,
} from "../../services/messageServices";
import "./Chats.css";

// Derive the deterministic 1:1 conversation id the backend uses, so an
// optimistic send can match the live echo before the server list refreshes.
const dmId = (a, b) => `dm#${[a, b].sort().join("#")}`;

const Chats = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null); // { conversationId, otherUserId, otherUserName }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [composing, setComposing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const bottomRef = useRef();

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await getConversations());
    } catch (err) {
      console.error("Conversations error:", err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const openConversation = useCallback(
    async (conv) => {
      setComposing(false);
      setActive(conv);
      setParams(conv.otherUserId ? { u: conv.otherUserId } : {});
      try {
        setMessages(await getMessages(conv.conversationId));
        // Clear the unread dot locally once opened.
        setConversations((prev) =>
          prev.map((c) =>
            c.conversationId === conv.conversationId ? { ...c, unread: false } : c
          )
        );
      } catch (err) {
        console.error("Messages error:", err);
      }
    },
    [setParams]
  );

  // Deep link: /chat?u=<userId> opens (or starts) that thread once.
  const deepUser = params.get("u");
  useEffect(() => {
    if (!deepUser || !user?.userId || active) return;
    const existing = conversations.find((c) => c.otherUserId === deepUser);
    if (existing) {
      openConversation(existing);
    } else {
      // New thread with no messages yet.
      setActive({
        conversationId: dmId(user.userId, deepUser),
        otherUserId: deepUser,
        otherUserName: "",
      });
      setMessages([]);
    }
  }, [deepUser, user, conversations, active, openConversation]);

  // Live incoming/outgoing messages for the open thread + list freshness.
  useRealtime("message.created", (msg) => {
    if (active && msg.conversationId === active.conversationId) {
      setMessages((prev) =>
        prev.some((m) => m.messageId === msg.messageId) ? prev : [...prev, msg]
      );
    }
    loadConversations();
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Debounced user search while composing a new message.
  useEffect(() => {
    if (!composing) return undefined;
    const id = setTimeout(async () => {
      try {
        setResults(await searchUsers(query));
      } catch (err) {
        console.error("User search error:", err);
      }
    }, 200);
    return () => clearTimeout(id);
  }, [composing, query]);

  const startWith = (u) => {
    setComposing(false);
    setQuery("");
    setResults([]);
    setActive({
      conversationId: dmId(user.userId, u.userId),
      otherUserId: u.userId,
      otherUserName: u.name,
    });
    setMessages([]);
    setParams({ u: u.userId });
  };

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending || !active) return;
    setSending(true);
    try {
      const msg = await sendMessage(active.otherUserId, content);
      setText("");
      setMessages((prev) =>
        prev.some((m) => m.messageId === msg.messageId) ? prev : [...prev, msg]
      );
      loadConversations();
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  const title = composing
    ? "New message"
    : active
    ? active.otherUserName || "Conversation"
    : "Messages";

  return (
    <div className="chats-page">
      <div className="chats-page__header">
        <h1>Messages</h1>
        <p>Direct messages with people on campus</p>
      </div>

      <div className="dm card">
        {/* Left: conversation list */}
        <aside className="dm__list" aria-label="Conversations">
          <button
            type="button"
            className="dm__new"
            onClick={() => {
              setComposing(true);
              setActive(null);
              setParams({});
            }}
          >
            + New message
          </button>
          {conversations.length === 0 && (
            <p className="dm__empty-list">No conversations yet.</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.conversationId}
              type="button"
              className={`dm__convo${
                active?.conversationId === c.conversationId ? " is-active" : ""
              }`}
              onClick={() => openConversation(c)}
            >
              <span className="dm__avatar" aria-hidden="true">
                {(c.otherUserName || "?").slice(0, 1).toUpperCase()}
              </span>
              <span className="dm__convo-name">
                {c.otherUserName || "Unknown"}
              </span>
              {c.unread && <span className="dm__unread" aria-label="Unread" />}
            </button>
          ))}
        </aside>

        {/* Right: thread or composer */}
        <section className="dm__thread" aria-label={title}>
          <div className="dm__thread-head">{title}</div>

          {composing ? (
            <div className="dm__compose">
              <input
                type="text"
                className="dm__search"
                placeholder="Search people by name or major…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                aria-label="Search people"
              />
              <ul className="dm__results">
                {results.map((u) => (
                  <li key={u.userId}>
                    <button type="button" onClick={() => startWith(u)}>
                      <span className="dm__avatar" aria-hidden="true">
                        {(u.name || "?").slice(0, 1).toUpperCase()}
                      </span>
                      <span>
                        <span className="dm__result-name">{u.name || "Unnamed"}</span>
                        {u.major && <span className="dm__result-major"> · {u.major}</span>}
                      </span>
                    </button>
                  </li>
                ))}
                {query && results.length === 0 && (
                  <li className="dm__no-results">No people found.</li>
                )}
              </ul>
            </div>
          ) : active ? (
            <>
              <div className="dm__messages">
                {messages.length === 0 && (
                  <div className="dm__empty">No messages yet. Say hello!</div>
                )}
                {messages.map((m) => {
                  const isMe = m.senderId === user?.userId;
                  return (
                    <div
                      key={m.messageId}
                      className={`dm__msg${isMe ? " dm__msg--me" : ""}`}
                    >
                      <div className="dm__bubble">{m.content}</div>
                      <span className="dm__time">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="dm__input">
                <input
                  type="text"
                  placeholder="Type a message…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={sending}
                  aria-label="Message"
                />
                <button
                  type="button"
                  className="dm__send"
                  onClick={handleSend}
                  disabled={sending || !text.trim()}
                  aria-label="Send message"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="dm__placeholder">
              Pick a conversation, or start a new message.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Chats;
