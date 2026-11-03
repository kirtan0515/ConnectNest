import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import moment from "moment";
import { useAuth } from "../../auth/AuthContext";
import { useRealtime } from "../../realtime/useRealtime";
import {
  getNotifications,
  markNotificationsRead,
} from "../../services/notificationServices";
import "./NotificationBell.css";

/**
 * Bell + dropdown in the dashboard navbar. Loads the current user's
 * notifications, shows an unread badge, and listens for live
 * "notification.created" pushes addressed to this user.
 */
export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await getNotifications();
      setItems(res.items);
      setUnread(res.unreadCount);
    } catch (err) {
      console.error("Notifications error:", err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live pushes: only count ones addressed to the signed-in user.
  useRealtime("notification.created", (item) => {
    if (!item || item.userId !== user?.userId) return;
    setItems((prev) => [item, ...prev].slice(0, 50));
    setUnread((n) => n + 1);
  });

  // Close on outside click.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    // Opening with unread items marks them read.
    if (next && unread > 0) {
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      try {
        await markNotificationsRead();
      } catch (err) {
        console.error("Mark read error:", err);
        load(); // resync on failure
      }
    }
  };

  const openItem = (n) => {
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="notif" ref={panelRef}>
      <button
        type="button"
        className="notif__btn"
        onClick={toggle}
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-expanded={open}
      >
        <Bell size={22} strokeWidth={1.75} aria-hidden="true" />
        {unread > 0 && (
          <span className="notif__badge" aria-hidden="true">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notif__panel" role="menu">
          <div className="notif__head">Notifications</div>
          {items.length === 0 ? (
            <p className="notif__empty">You're all caught up.</p>
          ) : (
            <ul className="notif__list">
              {items.map((n) => (
                <li key={n.notificationId}>
                  <button
                    type="button"
                    className={`notif__item${n.read ? "" : " unread"}`}
                    onClick={() => openItem(n)}
                  >
                    <span className="notif__msg">{n.message}</span>
                    <span className="notif__time">
                      {n.createdAt ? moment(n.createdAt).fromNow() : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
