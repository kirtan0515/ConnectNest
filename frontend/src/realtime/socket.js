// Guarded native-WebSocket singleton for live updates.
//
// A single connection is shared across all subscribers. It authenticates by
// passing the Cognito id token as a ?token= query param (API Gateway WebSocket
// APIs can't send Authorization headers from the browser). On close/error it
// reconnects with capped exponential backoff + jitter, refreshing the token on
// each attempt. Every public entry point is wrapped so a throw can never crash
// the app: when wsUrl is blank or the user isn't signed in, it simply no-ops.

import config from "../config";
import { getIdToken } from "../auth/auth";

const MAX_BACKOFF_MS = 30000;

let socket = null;
let connecting = false;
let shouldReconnect = false;
let reconnectAttempts = 0;
let reconnectTimer = null;
const handlers = new Set();

function dispatch(data) {
  let message;
  try {
    message = JSON.parse(data);
  } catch {
    return; // ignore malformed frames
  }
  if (!message || typeof message !== "object") return;
  handlers.forEach((handler) => {
    try {
      handler(message);
    } catch {
      // A bad subscriber must not take down the socket or other subscribers.
    }
  });
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect() {
  if (!shouldReconnect || handlers.size === 0) return;
  if (reconnectTimer) return;
  // Capped exponential backoff with jitter: 1s, 2s, 4s ... max 30s.
  const base = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** reconnectAttempts);
  const delay = base / 2 + Math.random() * (base / 2);
  reconnectAttempts += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

async function connect() {
  try {
    if (!config.wsUrl) return; // live updates disabled
    if (connecting) return;
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    if (handlers.size === 0) return;

    connecting = true;
    shouldReconnect = true;

    let token;
    try {
      token = await getIdToken();
    } catch {
      // Not signed in / session invalid — try again later without crashing.
      connecting = false;
      scheduleReconnect();
      return;
    }
    if (!token) {
      connecting = false;
      scheduleReconnect();
      return;
    }

    const ws = new WebSocket(`${config.wsUrl}?token=${encodeURIComponent(token)}`);
    socket = ws;

    ws.onopen = () => {
      connecting = false;
      reconnectAttempts = 0; // reset backoff on a healthy connection
    };
    ws.onmessage = (event) => {
      if (typeof event.data === "string") dispatch(event.data);
    };
    ws.onerror = () => {
      // onclose follows; reconnect is scheduled there.
    };
    ws.onclose = () => {
      connecting = false;
      if (socket === ws) socket = null;
      scheduleReconnect();
    };
  } catch {
    // Any unexpected failure must not propagate to the app.
    connecting = false;
    scheduleReconnect();
  }
}

/**
 * Subscribe a handler to incoming { type, item } frames. Lazily opens the
 * shared connection. Returns an unsubscribe function; when the last subscriber
 * leaves, the socket is closed and reconnection stops.
 */
export function subscribe(handler) {
  if (typeof handler !== "function") return () => {};
  handlers.add(handler);
  connect();
  return function unsubscribe() {
    handlers.delete(handler);
    if (handlers.size === 0) close();
  };
}

/** Stop reconnecting and close the socket (called when no subscribers remain). */
export function close() {
  try {
    shouldReconnect = false;
    reconnectAttempts = 0;
    clearReconnectTimer();
    const ws = socket;
    socket = null;
    connecting = false;
    if (ws) {
      ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
      try {
        ws.close();
      } catch {
        // ignore
      }
    }
  } catch {
    // never throw
  }
}
