import React, { useEffect, useRef } from "react";

/**
 * AuthNetworkCanvas — background for the login/signup left pane.
 * Ported from Login.dc.html (build / draw / drawAvatar).
 *
 * 30 avatars in a loose sunflower web, each linked to its 2 nearest neighbors.
 * A larger coral center "You" avatar with a breathing outer ring and a "You"
 * label; shows the youInitials prop when provided (else a person icon).
 * Connection pulses every 0.75s; when youInitials is set, ~half start from You.
 *
 * Props:
 *   youInitials — string (up to 2 chars) shown in the center avatar, live.
 */
export default function AuthNetworkCanvas({ youInitials = "" }) {
  const canvasRef = useRef(null);
  // Keep the latest initials readable by the draw loop without re-running effect.
  const youRef = useRef(youInitials);
  youRef.current = youInitials;

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const reduce =
      !!(window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    const state = {
      mx: 0, my: 0, mxT: 0, myT: 0,
      pulses: [], lastPulse: 0,
      people: null, links: null,
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

    const build = () => {
      const cols = ["#FF9F68", "#8EC9FF", "#C8B8FF", "#B8E986"];
      const letters = "ABCDEFGHJKLMNOPRSTVWYZ";
      const N = 30;
      const P = [];
      // Center "You" avatar
      P.push({
        ox: 0, oy: 0, depth: 1, ph: 0, col: "#FF9F68",
        person: true, ini: "", you: true, x: 0, y: 0, r: 20, flashT: -99,
      });
      for (let k = 1; k < N; k++) {
        const rr = Math.sqrt(k / N) * (0.9 + Math.random() * 0.2);
        const a = k * 2.39996;
        P.push({
          ox: Math.cos(a) * rr,
          oy: Math.sin(a) * rr,
          depth: 0.35 + Math.random() * 0.65,
          ph: Math.random() * 10,
          col: cols[k % 4],
          person: Math.random() < 0.45,
          you: false,
          ini:
            letters[Math.floor(Math.random() * letters.length)] +
            letters[Math.floor(Math.random() * letters.length)],
          x: 0, y: 0, r: 14, flashT: -99,
        });
      }
      // links: each to its 2 nearest neighbors
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
        for (let q = 0; q < 2; q++) {
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
      ctx.fillStyle = hexA(p.col, al);
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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const t = now / 1000;
      state.mx += (state.mxT - state.mx) * 0.05;
      state.my += (state.myT - state.my) * 0.05;

      const youIni = (youRef.current || "").slice(0, 2).toUpperCase();
      const P = state.people;

      // Base (desktop) layout: cx=w/2, cy=h*0.5, R=min(w,h)*0.36 with x spread *1.25.
      // For short/wide bands (stacked mobile), clamp R and nudge cy up so neither
      // the outer avatars nor the center "You" node + label get clipped. These
      // expressions reduce exactly to the base layout for tall/desktop panes.
      const SPREAD = 1.25;
      const edgeMargin = 20;          // keep outer avatars off the left/right edges
      const labelReserve = 48;        // room below "You" node for its label (r + 16 + text)
      const cx = w / 2;

      const Rdesktop = Math.min(w, h) * 0.36;
      // Horizontal radius so cx +/- R*SPREAD*(~1.1 max ox) stays inside the band.
      const Rh = (w / 2 - edgeMargin) / SPREAD;
      // Vertical radius so the web's top and bottom (plus label) stay inside the band.
      const Rv = h / 2 - labelReserve;
      const R = Math.max(0, Math.min(Rdesktop, Rh, Rv));

      // Keep the center + label fully visible on short bands; equals h*0.5 when tall.
      const cy = Math.min(h * 0.5, h - labelReserve);

      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        let x = cx + p.ox * R * 1.25;
        let y = cy + p.oy * R;
        if (!reduce && !p.you) {
          x += Math.sin(t * 0.4 + p.ph) * 8;
          y += Math.cos(t * 0.35 + p.ph * 1.3) * 6;
        }
        p.x = x + state.mx * 26 * p.depth;
        p.y = y + state.my * 18 * p.depth;
        p.r = p.you ? 24 : 10 + 8 * p.depth;
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

      // pulses
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
      ctx.font = '600 14px "Hanken Grotesk", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#EAF4F1";
      ctx.fillText("You", P[0].x, P[0].y + P[0].r + 16);
    };

    const onMove = (e) => {
      const c = canvasRef.current;
      if (!c) return;
      const r = c.getBoundingClientRect();
      state.mxT = (e.clientX - r.left) / r.width - 0.5;
      state.myT = (e.clientY - r.top) / r.height - 0.5;
    };

    build();
    window.addEventListener("pointermove", onMove, { passive: true });

    const loop = (now) => {
      draw(now);
      state.raf = requestAnimationFrame(loop);
    };
    state.raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(state.raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}
