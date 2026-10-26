import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { listMyGroups } from "../../services/groupServices";
import "./CampusNetwork.css";

/**
 * CampusNetwork — the dashboard's signature "Your Campus Network" hero.
 *
 * Adapts the connecting-nodes render loop from
 * components/canvas/AuthNetworkCanvas.js (hexA / drawAvatar / draw / link
 * building / pulses / cleanup) but rewrites build() to seed from the user's
 * REAL groups (GET /me/groups via listMyGroups()) and plumbs its own data.
 * The AuthNetworkCanvas source is left untouched; this is a separate component.
 *
 * The canvas is purely decorative (aria-hidden); all informational content
 * lives in the accessible overlay DOM (the page's single <h1> + a stat strip).
 *
 * Motion: static single frame under prefers-reduced-motion AND on phones
 * (viewport <= 768px) to protect low-end scroll performance; animated on
 * tablet+. The motion-vs-static decision is frozen at mount (see comment in
 * the effect) — layout still tracks resize every frame, only animate-or-not
 * is fixed.
 */

// Group palette as JS hex literals — canvas fillStyle cannot take CSS vars.
// MUST stay in sync with the --group-1..4 tokens in Dashboard.css (same four
// values, same index-cycling rule). Change both together if ever edited.
export const GROUP_HEX = ["#FF9F68", "#8EC9FF", "#C8B8FF", "#B8E986"];

const MIN_OUTER = 6; // min outer nodes so a lonely user still sees a web
const MAX_OUTER = 23; // cap so total nodes (incl. center) stays <= 24

export default function CampusNetwork() {
  const { user } = useAuth();
  const canvasRef = useRef(null);
  const [groups, setGroups] = useState([]);

  const displayName =
    user?.name || (user?.email ? user.email.split("@")[0] : null) || "User";
  const firstName = displayName.split(" ")[0];
  const youInitials = displayName.slice(0, 2).toUpperCase();

  // Fetch the user's real groups once; failure is non-fatal (padded web shows).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const items = await listMyGroups();
        if (alive) setGroups(Array.isArray(items) ? items : []);
      } catch (e) {
        console.error(e);
        if (alive) setGroups([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Build + run the canvas render loop. Re-runs when groups resolve/change.
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    // Motion-or-static decision is evaluated ONCE here (at mount / groups
    // change), NOT on every resize. We deliberately do not add a
    // matchMedia("(max-width:768px)") change-listener to restart the loop:
    // the low-end devices we protect load at phone width and stay there; a
    // desktop user dragging across 768px is on a capable machine and a
    // persisting calm animation is harmless. The per-frame draw() still
    // re-reads clientWidth/clientHeight, so LAYOUT always tracks resize.
    const prefersReduced = !!(
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    const isPhone = !!(
      window.matchMedia && window.matchMedia("(max-width: 768px)").matches
    );
    const reduce = prefersReduced || isPhone;

    const state = {
      pulses: [],
      lastPulse: 0,
      people: null,
      links: null,
      raf: 0,
    };

    const hexA = (hex, a) => {
      const n = parseInt(hex.slice(1), 16);
      return (
        "rgba(" +
        ((n >> 16) & 255) +
        "," +
        ((n >> 8) & 255) +
        "," +
        (n & 255) +
        "," +
        Math.max(0, Math.min(1, a)) +
        ")"
      );
    };

    // Seed the web from real groups. center "You" + one node per group,
    // padded to MIN_OUTER neutral peers, capped at MAX_OUTER group nodes.
    const build = (groupList, youIni) => {
      const safeGroups = Array.isArray(groupList) ? groupList : [];
      const renderedGroups = safeGroups.slice(0, MAX_OUTER);
      const padCount = Math.max(0, MIN_OUTER - renderedGroups.length);
      const outerCount = renderedGroups.length + padCount;
      const N = 1 + outerCount;
      const P = [];

      // Center "You" avatar (coral).
      P.push({
        ox: 0, oy: 0, depth: 1, ph: 0, col: "#FF9F68",
        person: true, ini: "", you: true, x: 0, y: 0, r: 20, flashT: -99,
      });

      let k = 1;
      // Real group nodes — tinted by group, labeled with the group initial.
      for (let i = 0; i < renderedGroups.length; i++) {
        const g = renderedGroups[i];
        const rr = Math.sqrt(k / N) * (0.9 + Math.random() * 0.2);
        const a = k * 2.39996;
        P.push({
          ox: Math.cos(a) * rr,
          oy: Math.sin(a) * rr,
          depth: 0.35 + Math.random() * 0.65,
          ph: Math.random() * 10,
          col: GROUP_HEX[i % 4],
          person: false,
          you: false,
          ini: (g.name || "?").charAt(0).toUpperCase(),
          x: 0, y: 0, r: 14, flashT: -99,
        });
        k++;
      }
      // Padding peers — generic muted person glyphs (cosmetic, never counted).
      for (let pad = 0; pad < padCount; pad++) {
        const rr = Math.sqrt(k / N) * (0.9 + Math.random() * 0.2);
        const a = k * 2.39996;
        P.push({
          ox: Math.cos(a) * rr,
          oy: Math.sin(a) * rr,
          depth: 0.35 + Math.random() * 0.65,
          ph: Math.random() * 10,
          col: GROUP_HEX[pad % 4],
          person: true,
          muted: true,
          you: false,
          ini: "",
          x: 0, y: 0, r: 14, flashT: -99,
        });
        k++;
      }

      // links: each node to its 2 nearest neighbors
      const links = [];
      const seen = {};
      for (let i = 0; i < N; i++) {
        const d = [];
        for (let j = 0; j < N; j++) {
          if (i === j) continue;
          const dx = P[i].ox - P[j].ox;
          const dy = P[i].oy - P[j].oy;
          d.push([dx * dx + dy * dy, j]);
        }
        d.sort((m, n) => m[0] - n[0]);
        for (let q = 0; q < Math.min(2, d.length); q++) {
          const j = d[q][1];
          const key = i < j ? i + "-" + j : j + "-" + i;
          if (!seen[key]) {
            seen[key] = 1;
            links.push([i, j]);
          }
        }
      }
      state.people = P;
      state.links = links;
    };

    const drawAvatar = (ctx, p, al, ini) => {
      ctx.fillStyle = hexA(p.col, p.muted ? al * 0.5 : al);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();
      ctx.strokeStyle = "#0D2A2C";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(13,42,44,0.88)";
      if (ini) {
        ctx.font = '600 ' + Math.round(p.r * 0.78) + 'px "Hanken Grotesk", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ini, p.x, p.y + 0.5);
      } else {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r - 1, 0, 6.2832);
        ctx.clip();
        ctx.beginPath();
        ctx.arc(p.x, p.y - p.r * 0.2, p.r * 0.33, 0, 6.2832);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + p.r * 0.72, p.r * 0.6, p.r * 0.5, 0, 0, 6.2832);
        ctx.fill();
        ctx.restore();
      }
    };

    const draw = (now) => {
      const c = canvasRef.current;
      if (!c || !state.people) return;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const t = now / 1000;
      const youIni = youInitials;
      const P = state.people;

      // Layout clamps so neither outer nodes nor the "You" node + label clip.
      const SPREAD = 1.25;
      const edgeMargin = 20;
      const labelReserve = 44;
      const cx = w / 2;

      const Rdesktop = Math.min(w, h) * 0.36;
      const Rh = (w / 2 - edgeMargin) / SPREAD;
      const Rv = h / 2 - labelReserve;
      const R = Math.max(0, Math.min(Rdesktop, Rh, Rv));
      const cy = Math.min(h * 0.5, h - labelReserve);

      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        let x = cx + p.ox * R * SPREAD;
        let y = cy + p.oy * R;
        if (!reduce && !p.you) {
          x += Math.sin(t * 0.4 + p.ph) * 8;
          y += Math.cos(t * 0.35 + p.ph * 1.3) * 6;
        }
        p.x = x;
        p.y = y;
        p.r = p.you ? 22 : 9 + 7 * p.depth;
      }

      // links
      ctx.lineWidth = 1.2;
      for (let n = 0; n < state.links.length; n++) {
        const a = P[state.links[n][0]];
        const b = P[state.links[n][1]];
        ctx.strokeStyle =
          "rgba(234,244,241," +
          (0.1 + 0.12 * Math.min(a.depth, b.depth)) +
          ")";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // pulses (only when animating)
      if (!reduce && t - state.lastPulse > 0.75) {
        let a, b;
        if (youIni && Math.random() < 0.5) {
          a = 0;
          b = 1 + Math.floor(Math.random() * (P.length - 1));
        } else {
          const l = state.links[Math.floor(Math.random() * state.links.length)];
          a = l[0];
          b = l[1];
          if (Math.random() < 0.5) {
            const s = a;
            a = b;
            b = s;
          }
        }
        state.pulses.push({ a, b, t0: t, done: false });
        state.lastPulse = t;
        if (state.pulses.length > 8) state.pulses.shift();
      }
      state.pulses = state.pulses.filter((q) => t - q.t0 < 3.2);
      for (let n = 0; n < state.pulses.length; n++) {
        const q = state.pulses[n];
        const a = P[q.a];
        const b = P[q.b];
        const age = t - q.t0;
        let gr = Math.min(1, age / 0.9);
        gr = 1 - Math.pow(1 - gr, 3);
        if (gr >= 1 && !q.done) {
          q.done = true;
          a.flashT = t;
          b.flashT = t;
        }
        const fade = age < 2 ? 1 : Math.max(0, 1 - (age - 2) / 1.2);
        const ex = a.x + (b.x - a.x) * gr;
        const ey = a.y + (b.y - a.y) * gr;
        ctx.strokeStyle = "rgba(255,159,104," + 0.8 * fade + ")";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        if (gr < 1) {
          ctx.fillStyle = "#FF9F68";
          ctx.beginPath();
          ctx.arc(ex, ey, 3.5, 0, 6.2832);
          ctx.fill();
        }
      }

      // avatars (back-to-front)
      const order = P.slice().sort((a, b) => a.depth - b.depth);
      for (let i = 0; i < order.length; i++) {
        const p = order[i];
        const fl = Math.max(0, 1 - (t - p.flashT) / 1.0);
        if (fl > 0) {
          ctx.strokeStyle = "rgba(255,159,104," + fl + ")";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + 4 + (1 - fl) * 10, 0, 6.2832);
          ctx.stroke();
        }
        if (p.you) {
          ctx.strokeStyle = "rgba(255,159,104,0.5)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(
            p.x,
            p.y,
            p.r + 9 + (reduce ? 0 : Math.sin(t * 2) * 2),
            0,
            6.2832
          );
          ctx.stroke();
        }
        drawAvatar(
          ctx,
          p,
          p.you ? 1 : 0.5 + 0.5 * p.depth,
          p.you ? youIni : p.person ? "" : p.ini
        );
      }

      // "You" label
      ctx.font = '600 13px "Hanken Grotesk", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#EAF4F1";
      ctx.fillText("You", P[0].x, P[0].y + P[0].r + 14);
    };

    build(groups, youInitials);

    if (reduce) {
      // Static single frame, then stop (battery-friendly, satisfies 2.3.3).
      draw(0);
      return () => {};
    }

    const loop = (now) => {
      draw(now);
      state.raf = requestAnimationFrame(loop);
    };
    state.raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(state.raf);
    };
  }, [groups, youInitials]);

  const handleEventsJump = () => {
    const el = document.getElementById("cn-events");
    if (!el) return;
    const reduce = !!(
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    el.focus({ preventScroll: true });
  };

  const groupCount = groups.length;

  return (
    <div className="cn-hero__canvas">
      <canvas ref={canvasRef} aria-hidden="true" className="cn-hero__canvas-el" />
      <div className="cn-hero__overlay">
        <h1 className="cn-hero__greeting">Your campus, {firstName}</h1>
        <ul className="cn-hero__stats">
          <li className="cn-hero__stat">
            <span className="cn-hero__stat-num">{groupCount}</span>
            <span className="cn-hero__stat-label">
              {groupCount === 1 ? "group" : "groups"}
            </span>
          </li>
          <li className="cn-hero__stat">
            <button
              type="button"
              className="cn-hero__events-link"
              onClick={handleEventsJump}
            >
              Upcoming events
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
