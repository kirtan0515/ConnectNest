import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * StudentNetworkCanvas — landing-page background animation.
 * Ported from Main.dc.html (build / readScroll / spawnPulse / draw).
 *
 * Props:
 *   storyRef  — ref to the "How students connect" section (drives stage 0..2)
 *   lowerRef  — ref to the lower content wrapper (drives the dim/fade)
 *
 * Stage: 0 = scattered hero drift, 1 = clustered "find your people",
 * 2 = clusters pull together with dashed cross-group bridges.
 */
export default function StudentNetworkCanvas({ storyRef, lowerRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const reduce =
      !!(window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    // ---- animation state ----
    const state = {
      s: 0, sT: 0, // stage (smoothed / target)
      dim: 1, dimT: 1,
      mx: 0, my: 0, mxT: 0, myT: 0,
      pulses: [], lastPulse: 0,
      people: null, inner: null, bridges: null, groups: null,
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

    const pill = (ctx, x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(x + r, y + h);
      ctx.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
      ctx.closePath();
    };

    // ---- build (world of avatars) ----
    const build = () => {
      state.groups = [
        { label: "CS study group", color: "#FF9F68" },
        { label: "Robotics club", color: "#8EC9FF" },
        { label: "Open mic night", color: "#C8B8FF" },
        { label: "Intramural soccer", color: "#B8E986" },
      ];
      const letters = "ABCDEFGHJKLMNOPRSTVWYZ";
      const per = 10;
      const people = [];
      for (let g = 0; g < 4; g++) {
        for (let k = 0; k < per; k++) {
          let ux = Math.random();
          let uy = 0.08 + Math.random() * 0.84;
          // keep clear of lower-left hero text area
          if (ux < 0.6 && uy > 0.42) uy = 0.08 + (uy - 0.42) * 0.55;
          const rr = Math.sqrt((k + 0.5) / per);
          const aa = k * 2.39996; // golden angle (phyllotaxis)
          people.push({
            g,
            k,
            ux,
            uy,
            ox: Math.cos(aa) * rr,
            oy: Math.sin(aa) * rr,
            depth: 0.35 + Math.random() * 0.65,
            ph: Math.random() * 10,
            person: Math.random() < 0.42,
            ini:
              letters[Math.floor(Math.random() * letters.length)] +
              letters[Math.floor(Math.random() * letters.length)],
            x: 0,
            y: 0,
            r: 14,
            flashT: -99,
          });
        }
      }

      // inner links: each avatar to its 2 nearest in-group neighbors
      const inner = [];
      const seen = {};
      for (let i = 0; i < people.length; i++) {
        const d = [];
        for (let j = 0; j < people.length; j++) {
          if (i === j || people[j].g !== people[i].g) continue;
          const dx = people[i].ox - people[j].ox;
          const dy = people[i].oy - people[j].oy;
          d.push([dx * dx + dy * dy, j]);
        }
        d.sort((m, n) => m[0] - n[0]);
        for (let q = 0; q < 2; q++) {
          const j = d[q][1];
          const key = i < j ? i + "-" + j : j + "-" + i;
          if (!seen[key]) {
            seen[key] = 1;
            inner.push([i, j]);
          }
        }
      }

      // cross-group bridges among outer members (k >= 5)
      const bridges = [];
      const outer = people.map((p, i) => i).filter((i) => people[i].k >= 5);
      for (let b = 0; b < 12; b++) {
        const i = outer[Math.floor(Math.random() * outer.length)];
        let j = outer[Math.floor(Math.random() * outer.length)];
        if (people[i].g === people[j].g)
          j = outer[(outer.indexOf(j) + per / 2) % outer.length];
        if (people[i].g !== people[j].g) bridges.push([i, j]);
      }

      state.people = people;
      state.inner = inner;
      state.bridges = bridges;
    };

    const spawnPulse = (t, e1) => {
      const P = state.people;
      const a = Math.floor(Math.random() * P.length);
      let b;
      if (e1 > 0.5 && Math.random() < 0.65) {
        const same = P.map((p, i) => i).filter(
          (i) => i !== a && P[i].g === P[a].g
        );
        b = same[Math.floor(Math.random() * same.length)];
      } else {
        b = Math.floor(Math.random() * P.length);
        if (b === a) b = (a + 7) % P.length;
      }
      state.pulses.push({ a, b, t0: t, done: false });
      if (state.pulses.length > 10) state.pulses.shift();
    };

    // ---- scroll → stage/dim (ScrollTrigger, matching reference math) ----
    const readScroll = () => {
      const vh = window.innerHeight || 800;
      const story = storyRef && storyRef.current;
      const lower = lowerRef && lowerRef.current;
      if (story) {
        const r = story.getBoundingClientRect();
        state.sT =
          Math.max(0, Math.min(1, (vh * 0.75 - r.top) / (r.height * 0.8))) * 2;
      }
      if (lower) {
        const lt = lower.getBoundingClientRect().top;
        state.dimT = lt < vh * 0.35 ? 0.18 : 1;
      }
    };

    // ScrollTrigger keeps readScroll in sync with the smooth scroller.
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 0,
      end: "max",
      onUpdate: readScroll,
      onRefresh: readScroll,
    });

    // ---- draw loop ----
    const draw = (now) => {
      const c = canvasRef.current;
      if (!c || !state.people) return;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (
        c.width !== Math.round(w * dpr) ||
        c.height !== Math.round(h * dpr)
      ) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      const ctx = c.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const t = now / 1000;
      state.s += (state.sT - state.s) * 0.06;
      state.dim += (state.dimT - state.dim) * 0.06;
      state.mx += (state.mxT - state.mx) * 0.05;
      state.my += (state.myT - state.my) * 0.05;

      const sm = (v) => {
        v = Math.max(0, Math.min(1, v));
        return v * v * (3 - 2 * v);
      };
      const e1 = sm(state.s);
      const e2 = sm(state.s - 1);

      const wide = w > 900;
      const m = Math.min(w, h);
      const cx0 = wide ? w * 0.68 : w * 0.5;
      const cy0 = wide ? h * 0.53 : h * 0.62;
      const R = m * (wide ? 0.25 : 0.27) * (1 - 0.38 * e2);
      const cR = m * 0.1;

      const gc = state.groups.map((g, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 2 + 0.45;
        return {
          x: cx0 + Math.cos(a) * R * 1.15,
          y: cy0 + Math.sin(a) * R * 0.85,
        };
      });

      const P = state.people;
      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        let sx = p.ux * w;
        let sy = p.uy * h;
        if (!reduce) {
          sx += Math.sin(t * 0.35 + p.ph) * 14;
          sy += Math.cos(t * 0.3 + p.ph * 1.4) * 10;
        }
        const kx = gc[p.g].x + p.ox * cR;
        const ky = gc[p.g].y + p.oy * cR;
        p.x = sx + (kx - sx) * e1 + state.mx * 30 * p.depth;
        p.y = sy + (ky - sy) * e1 + state.my * 20 * p.depth;
        p.r =
          (11 + 8 * p.depth) *
          (wide ? 1 : 0.82) *
          (1 - 0.15 * e1 + 0.15 * e1 * (1 - p.depth + 0.6));
      }

      // inner links
      ctx.lineWidth = 1.2;
      const la = e1 * 0.5 * state.dim;
      if (la > 0.01) {
        for (let n = 0; n < state.inner.length; n++) {
          const a = P[state.inner[n][0]];
          const b = P[state.inner[n][1]];
          ctx.strokeStyle = hexA(state.groups[a.g].color, la);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // cross-group dashed bridges
      const ba = e2 * 0.55 * state.dim;
      if (ba > 0.01) {
        ctx.setLineDash([4, 5]);
        for (let n = 0; n < state.bridges.length; n++) {
          const a = P[state.bridges[n][0]];
          const b = P[state.bridges[n][1]];
          ctx.strokeStyle = "rgba(234,244,241," + ba + ")";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // pulses
      if (
        !reduce &&
        state.dim > 0.5 &&
        t - state.lastPulse > (e1 > 0.5 ? 0.55 : 1.0)
      ) {
        spawnPulse(t, e1);
        state.lastPulse = t;
      }
      state.pulses = state.pulses.filter((q) => t - q.t0 < 3.6);
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
        const fade = age < 2.2 ? 1 : Math.max(0, 1 - (age - 2.2) / 1.4);
        const ex = a.x + (b.x - a.x) * gr;
        const ey = a.y + (b.y - a.y) * gr;
        ctx.strokeStyle =
          "rgba(255,159,104," + 0.75 * fade * state.dim + ")";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        if (gr < 1) {
          ctx.fillStyle = "rgba(255,159,104," + state.dim + ")";
          ctx.beginPath();
          ctx.arc(ex, ey, 3.5, 0, 6.2832);
          ctx.fill();
        }
      }

      // avatars (draw back-to-front by depth)
      const order = P.slice().sort((a, b) => a.depth - b.depth);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < order.length; i++) {
        const p = order[i];
        const col = state.groups[p.g].color;
        const al = (0.45 + 0.55 * p.depth) * state.dim;
        const fl = Math.max(0, 1 - (t - p.flashT) / 1.0);
        if (fl > 0) {
          ctx.strokeStyle = "rgba(255,159,104," + fl * state.dim + ")";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + 4 + (1 - fl) * 10, 0, 6.2832);
          ctx.stroke();
        }
        ctx.fillStyle = hexA(col, al);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
        ctx.strokeStyle = "#0D2A2C";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "rgba(13,42,44," + 0.88 * state.dim + ")";
        if (p.person) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r - 1, 0, 6.2832);
          ctx.clip();
          ctx.beginPath();
          ctx.arc(p.x, p.y - p.r * 0.2, p.r * 0.33, 0, 6.2832);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(
            p.x,
            p.y + p.r * 0.72,
            p.r * 0.6,
            p.r * 0.5,
            0,
            0,
            6.2832
          );
          ctx.fill();
          ctx.restore();
        } else {
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font =
            '600 ' + Math.round(p.r * 0.78) + 'px "Hanken Grotesk", sans-serif';
          ctx.fillText(p.ini, p.x, p.y + 0.5);
        }
      }

      // group labels
      const labA = e1 * (state.dim > 0.5 ? 1 : 0);
      if (labA > 0.05) {
        ctx.font = '600 14px "Hanken Grotesk", sans-serif';
        for (let g = 0; g < 4; g++) {
          const txt = state.groups[g].label;
          const tw = ctx.measureText(txt).width + 24;
          const lx = gc[g].x;
          const ly = gc[g].y - cR - 30;
          ctx.fillStyle = "rgba(18,56,58," + 0.92 * labA + ")";
          pill(ctx, lx - tw / 2, ly - 15, tw, 30, 15);
          ctx.fill();
          ctx.strokeStyle = hexA(state.groups[g].color, 0.7 * labA);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = hexA(state.groups[g].color, labA);
          ctx.fillText(txt, lx, ly + 0.5);
        }
      }
    };

    // ---- listeners ----
    const onMove = (e) => {
      state.mxT = e.clientX / window.innerWidth - 0.5;
      state.myT = e.clientY / window.innerHeight - 0.5;
    };
    const onResize = () => {
      readScroll();
      ScrollTrigger.refresh();
    };

    build();
    readScroll();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);

    const loop = (now) => {
      draw(now);
      state.raf = requestAnimationFrame(loop);
    };
    state.raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(state.raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      st.kill();
    };
  }, [storyRef, lowerRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "block",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
