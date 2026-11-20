/* The garden scene: pixel canvas, scroll-driven sculpting, story cards. */
(function () {
  const Sp = window.Sprites;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ───────────────────────── helpers ─────────────────────────
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
  function hash(x, y, s = 0) {
    let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) + 0x6d2b79f5), ((s >>> 0) % 100000) / 100000);
  }
  function hex2rgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    const A = hex2rgb(a), B = hex2rgb(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  function px(g, x, y, c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }
  function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  function disc(g, cx, cy, r, c) {
    g.fillStyle = c;
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.floor(Math.sqrt(r * r + r * 0.8 - dy * dy));
      if (w >= 0) g.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
    }
  }
  function ellipse(g, cx, cy, rx, ry, c) {
    g.fillStyle = c;
    for (let dy = -ry; dy <= ry; dy++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / ((ry + 0.4) * (ry + 0.4)))));
      g.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
    }
  }
  function line(g, x0, y0, x1, y1, fn) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, i = 0;
    const n = Math.max(dx, -dy) || 1;
    for (;;) {
      fn(x0, y0, i / n); i++;
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  // ───────────────────────── time of day ─────────────────────────
  const TIMES = {
    morning: {
      label: "Morning", sky: ["#7f86c9", "#b996bb", "#e6a9a6", "#f6c4a8", "#fcdcbb", "#fff0d6"],
      sun: { x: 0.18, y: 0.42, r: 7, c: "#fff1c9", glow: "#fde2b8" },
      cloud: "#fff7ef", cloudShade: "#f0cfc4", tint: null, star: false,
    },
    day: {
      label: "Day", sky: ["#2a76c2", "#4592d3", "#66afe0", "#8fc9ea", "#b8def0", "#e2f0ec"],
      sun: { x: 0.8, y: 0.2, r: 6, c: "#fffbe0", glow: "#d9f2f8" },
      cloud: "#ffffff", cloudShade: "#d3e9f2", tint: null, star: false,
    },
    sunset: {
      label: "Sunset", sky: ["#262158", "#4f377a", "#8f4a84", "#cf6370", "#ef8c6e", "#f7b47a", "#fcd99a"],
      sun: { x: 0.74, y: 0.78, r: 10, c: "#ffe2a0", glow: "#f9bf86" },
      cloud: "#f7b9a0", cloudShade: "#b8698a", tint: "rgba(255,120,80,0.14)", star: false,
    },
    night: {
      label: "Night", sky: ["#05081e", "#0b1134", "#131b47", "#1d285c", "#2b3a76", "#3d4d8a"],
      sun: { x: 0.78, y: 0.22, r: 5, c: "#eef0ff", glow: "#3a4890", moon: true },
      cloud: "#3a4682", cloudShade: "#28316a", tint: "rgba(16,24,72,0.52)", star: true,
    },
  };
  const ORDER = ["morning", "day", "sunset", "night"];
  function autoTime() {
    const h = new Date().getHours();
    if (h >= 5 && h < 9) return "morning";
    if (h >= 9 && h < 17) return "day";
    if (h >= 17 && h < 20) return "sunset";
    return "night";
  }
  let timeKey = autoTime();
  try { const saved = localStorage.getItem("garden-time"); if (TIMES[saved]) timeKey = saved; } catch (e) {}

  // ───────────────────────── canvas + layout ─────────────────────────
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  const header = document.getElementById("site-header");
  const root = document.documentElement;

  let W, H, scale, cx, fy, hY;
  let L = {}; // layout of actors
  let skyLayer, groundLayer, actors, actx, clouds = [];

  const SLAB_W = 20, SLAB_H = 36;
  const statue = Sp.statueMap();
  let slabThresh = [], slabRaw = [], statueTone = [], rubble = [];

  function buildSlab() {
    const r = rng(7);
    slabThresh = []; slabRaw = []; statueTone = [];
    const ox = 3, oy = 1;
    for (let y = 0; y < SLAB_H; y++) {
      slabThresh.push([]); slabRaw.push([]); statueTone.push([]);
      for (let x = 0; x < SLAB_W; x++) {
        const ty = y / (SLAB_H - 4);
        slabThresh[y].push(0.03 + 0.6 * ty + 0.26 * r());
        const n = hash(x, y, 3);
        let c = n < 0.15 ? "#a9a193" : n > 0.9 ? "#d3ccbf" : "#bdb5a6";
        if (x === 0 || x === 1) c = "#d3ccbf";
        if (x >= SLAB_W - 2) c = "#958d7f";
        if (y === 0) c = "#e2dccf";
        if ((x + y * 3) % 23 === 0 && y > 2) c = "#958d7f"; // little cracks
        slabRaw[y].push(c);
        const sx = x - ox, sy = y - oy;
        const t = sx >= 0 && sy >= 0 && sx < statue.w && sy < statue.h ? statue.tones[sy][sx] : -1;
        statueTone[y].push(t);
      }
    }
    rubble = [];
    for (let i = 0; i < 46; i++) {
      rubble.push({
        dx: Math.round((r() - 0.5) * (SLAB_W + 18)),
        dy: Math.round(r() * 3) - 1,
        c: Sp.STONE[1 + Math.floor(r() * 3)],
        big: r() < 0.25,
        t: (i / 46) * 0.95 + 0.02,
      });
    }
  }
  buildSlab();

  function layout() {
    const headerH = header.getBoundingClientRect().bottom;
    const sceneH = window.innerHeight - headerH;
    scale = clamp(Math.floor(sceneH / 150), 2, 6);
    W = Math.ceil(window.innerWidth / scale);
    H = Math.ceil(window.innerHeight / scale);
    canvas.width = W; canvas.height = H;
    canvas.style.width = W * scale + "px";
    canvas.style.height = H * scale + "px";
    canvas.style.top = "0px";

    cx = Math.floor(W / 2);
    fy = Math.floor((headerH + sceneH / 2) / scale) + 18; // figure centered below the header // feet line, so the figure is centered
    hY = fy - 30; // horizon

    L.sx = cx - 17; L.sy = fy - Sp.H;
    L.slabX = L.sx + 15; L.slabY = fy - SLAB_H;

    const figTop = (fy - SLAB_H) * scale;
    const figBottom = (fy + 2) * scale;
    root.style.setProperty("--header-h", headerH + "px");
    root.style.setProperty("--fig-top", figTop + "px");
    root.style.setProperty("--fig-bottom", figBottom + "px");
    root.style.setProperty("--fig-half", 30 * scale + "px");

    actors = document.createElement("canvas");
    actors.width = W; actors.height = H;
    actx = actors.getContext("2d");
    buildBackground();
  }

  // ───────────────────────── background ─────────────────────────
  function gradientBands(cols, steps) {
    const out = [];
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1) * (cols.length - 1);
      const k = Math.min(cols.length - 2, Math.floor(t));
      out.push(mix(cols[k], cols[k + 1], t - k));
    }
    return out;
  }

  function buildSky(T) {
    skyLayer = document.createElement("canvas");
    skyLayer.width = W; skyLayer.height = H;
    const g = skyLayer.getContext("2d");
    const bands = gradientBands(T.sky, 14);
    const top = hY + 4;
    for (let y = 0; y < top; y++) {
      const f = (y / top) * (bands.length - 1);
      const k = Math.min(bands.length - 2, Math.floor(f));
      const frac = f - k;
      for (let x = 0; x < W; x++) px(g, x, y, frac > bayer(x, y) ? bands[k + 1] : bands[k]);
    }
    if (T.star) {
      for (let y = 0; y < top - 8; y++)
        for (let x = 0; x < W; x++) {
          const h = hash(x, y, 11);
          if (h < 0.004) px(g, x, y, "#ffffff");
          else if (h < 0.01) px(g, x, y, "#8f9ad6");
        }
    }
    const s = T.sun;
    const sx = Math.round(W * s.x), sy = Math.round(hY * s.y);
    disc(g, sx, sy, s.r + 3, s.glow);
    disc(g, sx, sy, s.r, s.c);
    if (s.moon) disc(g, sx + 3, sy - 2, s.r - 1, T.sky[0]);

    // clouds: a hazy far layer and a brighter near layer, lit from above
    const r = rng(42 + ORDER.indexOf(timeKey));
    clouds = [];
    const n = Math.max(4, Math.round(W / 60));
    for (let i = 0; i < n; i++) {
      const near = i % 2 === 0;
      const cw = (near ? 20 : 12) + Math.floor(r() * (near ? 22 : 12)), ch = near ? 11 : 7;
      const c = document.createElement("canvas");
      c.width = cw + 4; c.height = ch + 3;
      const cg = c.getContext("2d");
      const puffs = [];
      for (let p = 0; p < 3 + Math.floor(r() * 4); p++) {
        const pr = (near ? 2 : 1) + Math.floor(r() * (near ? 4 : 3));
        puffs.push([2 + pr + Math.floor(r() * Math.max(1, cw - pr * 2)), ch - pr, pr]);
      }
      for (const [x, y, pr] of puffs) disc(cg, x, y, pr, T.cloudShade);
      for (const [x, y, pr] of puffs) disc(cg, x - 1, y - 1, Math.max(1, pr - 1), T.cloud);
      for (const [x, y, pr] of puffs) { px(cg, x - 1, y - pr, T.cloudLight || "#ffffff"); px(cg, x - 2, y - pr + 1, T.cloudLight || "#ffffff"); }
      cg.fillStyle = T.cloudShade; cg.fillRect(2, ch, cw, 1);
      clouds.push({ img: c, x: r() * W, y: 3 + Math.floor(r() * Math.max(4, hY * (near ? 0.5 : 0.35))), v: near ? 0.03 + r() * 0.03 : 0.008 + r() * 0.01, alpha: near ? 1 : 0.7 });
    }
    clouds.sort((a, b) => a.v - b.v);
    // wispy high streaks
    L.wisps = Array.from({ length: Math.max(2, Math.round(W / 120)) }, () => ({ x: r() * W, y: 4 + Math.floor(r() * hY * 0.4), w: 18 + Math.floor(r() * 30), v: 0.006 + r() * 0.008 }));
    L.sun = { x: sx, y: sy, r: s.r };
  }

  // ground palette
  const G = {
    grass: "#76b657", grassFar: "#6aa64f", grassDark: "#5a9645", grassLight: "#94cc6c",
    leaf: "#4f8f3a", leafDark: "#3a6f2d", leafLight: "#73b24f", leafDeep: "#2c5626",
    trunk: "#8a6a46", trunkDark: "#6b4f33",
    stone: "#cbbfa8", stoneGap: "#a39780", stoneEdge: "#8d826c",
    water: "#4f9cc2", waterDeep: "#3b7fa6", waterEdge: "#2f6788", shimmer: "#cdeef8",
    rim: "#9a968c", rimLight: "#c4c0b4", rimDark: "#6f6b62",
    glass: "#bfe3da", glassLight: "#e3f5ef", frame: "#f3f1ea", frameDark: "#55705f",
    treeFar: "#8fb48a", treeFarDark: "#79a074",
    hedge: "#4c8a3b", hedgeLight: "#66a54b", hedgeDark: "#376b2c",
    pot: "#c4703f", potLight: "#dd8c57", potDark: "#97532d",
    wood: "#9c6b3f", woodDark: "#6e4a2b",
  };
  const FLOWERS = ["#f28bb3", "#b591e3", "#f6d55c", "#ffffff", "#f57d6a"];

  // Italian Renaissance garden palette
  Object.assign(G, {
    gravel: "#ddd5c3", gravel2: "#d0c7b3", gravelLight: "#ebe5d8", gravelDark: "#b9af9a",
    box: "#3d7533", boxLight: "#5a9844", boxDark: "#2b5a26",
    villa: "#f5f0e8", villaShade: "#e0d6c8", villaDark: "#c7bba9",
    roof: "#d0653a", roofLight: "#e07e4c", roofDark: "#a54b27",
    arch: "#ecc6b4", archDark: "#c8968a", slate: "#4d5763",
    pool: "#41b4b6", poolLight: "#7fd6d1", poolDeep: "#2e989d",
    rimStone: "#f0eadf", rimShade: "#c9c0af",
    cypress: "#2f5a2e", cypressLight: "#467c3d", cypressDark: "#203f27",
    tree: "#5d8c53", treeDark: "#497343", treeLight: "#77a568",
    lawn: "#78b457", citrus: "#f29a2e", travertine: "#e6dccb", travertineGap: "#c7bba6",
  });

  function buildGround(T) {
    groundLayer = document.createElement("canvas");
    groundLayer.width = W; groundLayer.height = H;
    const g = groundLayer.getContext("2d");
    const r = rng(1234);
    L.pools = []; L.fountains = [];

    // distant woodland
    for (let x = -10; x < W + 10; x += 4 + Math.floor(r() * 6)) disc(g, x, hY - 7 - Math.floor(r() * 6), 5 + Math.floor(r() * 6), G.treeDark);
    for (let x = -10; x < W + 10; x += 6 + Math.floor(r() * 7)) {
      const y = hY - 6 - Math.floor(r() * 5), rr = 3 + Math.floor(r() * 5);
      disc(g, x, y, rr, G.tree);
      px(g, x - 1, y - rr + 1, G.treeLight); px(g, x - 2, y - rr + 2, G.treeLight);
    }
    // the villa sits off to the right so the quote and cards never hide it
    const VX = cx + Math.max(46, Math.round(W * 0.3));
    // cypresses
    cypress(g, VX - 42, hY - 1, 44); cypress(g, VX + 42, hY - 1, 40);
    for (let x = 6 + Math.floor(r() * 10); x < W; x += 22 + Math.floor(r() * 26)) {
      if (Math.abs(x - VX) < 52) continue;
      cypress(g, x, hY - 1, 24 + Math.floor(r() * 18));
    }
    // white garden walls with piers and finials
    gardenWall(g, -2, VX - 33, hY + 1);
    gardenWall(g, VX + 33, W + 2, hY + 1);
    // the villa with its arched loggia
    villa(g, VX, hY + 1);

    // gravel everywhere
    for (let y = hY + 1; y < H; y++)
      for (let x = 0; x < W; x++) {
        const h = hash(x, y, 5);
        px(g, x, y, h < 0.025 ? G.gravelDark : h < 0.2 ? G.gravel2 : h > 0.95 ? G.gravelLight : G.gravel);
      }
    // hedges along the wall
    for (const [a, b] of [[-2, VX - 33], [VX + 33, W + 2]]) {
      rect(g, a, hY - 2, b - a, 4, G.box);
      rect(g, a, hY - 2, b - a, 1, G.boxLight);
      rect(g, a, hY + 1, b - a, 1, G.boxDark);
    }

    const PATH = 17; // half-width of the central gravel walk
    // back row: parterres with pools and flowers
    beds(g, hY + 4, 9, 40, PATH + 1, PATH + 1, (k) => (k % 2 === 0 ? "pool" : "flowers"));
    // citrus pots along the terrace edge
    for (let k = 0; k < 20; k++) {
      const off = PATH + 3 + k * 46;
      if (off > W) break;
      citrusPot(g, cx - off, hY + 4); citrusPot(g, cx + off, hY + 4);
    }
    // middle row: the pool beside her (with fountain) and flower beds
    beds(g, fy - 10, 12, 44, 29, 32, (k, side) => (side < 0 ? (k % 2 === 0 ? "fountain" : "flowers") : k % 2 === 0 ? "flowers" : "pool"));
    // front rows
    let row = 0;
    for (let y = fy + 14; y < H + 4; y += 34, row++) {
      beds(g, y, 22, 60, PATH + 1, PATH + 1, (k) => ((k + row) % 3 === 0 ? "topiary" : (k + row) % 3 === 1 ? "flowers" : "pool"));
      if (row === 0) { citrusPot(g, cx - PATH - 4, y + 2, 1); citrusPot(g, cx + PATH + 4, y + 2, 1); }
    }

    // travertine pavers where she works
    for (let y = fy - 2; y <= fy + 3; y++)
      for (let x = cx - 24; x <= cx + 28; x++)
        px(g, x, y, (x - cx + (y % 2) * 3) % 6 === 0 || y === fy + 1 ? G.travertineGap : hash(x, y, 6) < 0.1 ? G.villaShade : G.travertine);
    rect(g, cx - 24, fy + 4, 53, 1, G.gravelDark);
    citrusPot(g, L.slabX + SLAB_W + 7, fy + 1);
    toolbox(g, L.sx - 6, fy);

    if (T.tint) {
      g.globalCompositeOperation = "source-atop";
      g.fillStyle = T.tint;
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "source-over";
    }
  }

  // Lay out hedge-bordered beds outward from the path on both sides.
  function beds(g, y, h, bw, startL, startR, kindFn) {
    for (const side of [-1, 1]) {
      for (let k = 0; k < 20; k++) {
        const start = side < 0 ? startL : startR;
        const x0 = side < 0 ? cx - start - (k + 1) * bw - k * 6 : cx + start + k * (bw + 6);
        if (x0 > W || x0 + bw < 0) break;
        const kind = kindFn(k, side);
        const inner = hedgeBox(g, x0, y, bw, h);
        if (kind === "pool" || kind === "fountain") {
          pool(g, inner.x, inner.y, inner.w, inner.h);
          if (kind === "fountain") fountain(g, inner.x + Math.round(inner.w / 2), inner.y + inner.h - 2);
        } else if (kind === "flowers") {
          plantBed(g, inner, k * 7 + (side < 0 ? 3 : 11) + y);
        } else {
          rect(g, inner.x, inner.y, inner.w, inner.h, G.lawn);
          for (let yy = inner.y; yy < inner.y + inner.h; yy++) for (let xx = inner.x; xx < inner.x + inner.w; xx++) if (hash(xx, yy, 31) < 0.12) px(g, xx, yy, G.leafLight);
          const pal = PALETTES[(k + y) % PALETTES.length];
          for (let xx = inner.x + 1; xx < inner.x + inner.w - 1; xx += 2) spike(g, xx, inner.y + 4, 4 + (xx % 3), pal[(xx >> 1) % 2], pal[1]);
          for (let xx = inner.x + 1; xx < inner.x + inner.w - 1; xx += 2) mound(g, xx, inner.y + inner.h - 2, pal[(xx >> 1) % 3]);
          for (let xx = inner.x + 4; xx < inner.x + inner.w - 3; xx += 9) topiary(g, xx, inner.y + inner.h - 2);
        }
      }
    }
  }

  // Layered, colorful plantings: tall spikes at the back, flowering mounds in front, shadows for depth.
  const PALETTES = [
    ["#9a7fd1", "#b9a2e8", "#f2c94c"],   // lavender + yellow
    ["#e8607a", "#f59ab0", "#ffffff"],   // roses
    ["#f08a3c", "#f6c14b", "#d94f3d"],   // marigold / poppy
    ["#5a7fd8", "#8fb0f0", "#f4f0ff"],   // delphinium blue
    ["#d873c4", "#f2a6df", "#f6d55c"],   // foxglove pink
  ];
  Object.assign(G, { soil: "#6f5a3f", soilDark: "#57452f" });
  function mound(g, x, y, c) {
    px(g, x - 1, y + 1, G.leafDeep); px(g, x, y + 1, G.leafDeep); px(g, x + 1, y + 1, G.leafDeep);
    px(g, x - 1, y, G.leafDark); px(g, x, y, G.leaf); px(g, x + 1, y, G.leafDark);
    px(g, x, y - 1, G.leaf);
    px(g, x, y - 1, c); px(g, x - 1, y - 1 + (x % 2), c);
  }
  function spike(g, x, base, h, c, c2) {
    rect(g, x, base - h + 3, 1, h - 3, G.leafDark);
    px(g, x - 1, base - 2, G.leaf); px(g, x + 1, base - 3, G.leaf);
    for (let i = 0; i < 3; i++) px(g, x, base - h + i, i === 0 ? c2 : c);
    px(g, x + 1, base - h + 1, c2);
  }
  function plantBed(g, r, seed) {
    rect(g, r.x, r.y, r.w, r.h, G.soil);
    rect(g, r.x, r.y, r.w, 1, G.soilDark);
    const palA = PALETTES[seed % PALETTES.length], palB = PALETTES[(seed + 2) % PALETTES.length];
    // back row: tall flower spikes
    for (let x = r.x + 1; x < r.x + r.w - 1; x += 2) {
      const h = 4 + Math.floor(hash(x, seed, 21) * 3);
      spike(g, x, r.y + Math.min(4, r.h - 1), Math.min(h, r.y + 4 - (r.y - 3)), palA[hash(x, seed, 22) < 0.6 ? 0 : 1], palA[1]);
    }
    // middle and front rows: flowering mounds in alternating colors
    for (let y = r.y + 4, row = 0; y < r.y + r.h - 1; y += 3, row++) {
      for (let x = r.x + 1 + (row % 2); x < r.x + r.w - 1; x += 3) {
        const pal = (Math.floor((x - r.x) / 6) + row) % 2 ? palA : palB;
        mound(g, x, y, pal[Math.floor(hash(x, y, seed) * 3)]);
      }
    }
  }

  function hedgeBox(g, x, y, w, h) {
    rect(g, x, y, w, h, G.boxDark);
    rect(g, x, y, w, h - 1, G.box);
    rect(g, x, y, w, 1, G.boxLight);
    for (let i = x; i < x + w; i += 3) px(g, i, y + 1, G.boxLight);
    return { x: x + 2, y: y + 2, w: w - 4, h: h - 4 };
  }

  function pool(g, x, y, w, h) {
    if (w < 4 || h < 3) return;
    rect(g, x, y, w, h, G.rimStone);
    rect(g, x, y + h - 1, w, 1, G.rimShade);
    const ix = x + 1, iy = y + 1, iw = w - 2, ih = h - 2;
    for (let yy = iy; yy < iy + ih; yy++)
      for (let xx = ix; xx < ix + iw; xx++) {
        const t = (yy - iy) / Math.max(1, ih - 1);
        px(g, xx, yy, t + (bayer(xx, yy) - 0.5) * 0.5 < 0.25 ? G.poolDeep : t < 0.75 ? G.pool : G.poolLight);
      }
    L.pools.push({ x: ix, y: iy, w: iw, h: ih });
  }

  function fountain(g, x, by) {
    rect(g, x - 5, by - 1, 11, 2, G.rimStone);
    rect(g, x - 5, by, 11, 1, G.rimShade);
    rect(g, x - 1, by - 5, 3, 4, G.villaShade);
    px(g, x - 1, by - 5, G.rimStone);
    rect(g, x - 3, by - 6, 7, 1, G.rimStone);
    rect(g, x - 2, by - 5, 5, 1, G.rimShade);
    rect(g, x, by - 9, 1, 3, G.villaShade);
    rect(g, x - 2, by - 10, 5, 1, G.rimStone);
    px(g, x, by - 11, G.rimStone); px(g, x, by - 12, G.villaShade);
    // two little stone lions guarding it
    for (const s of [-1, 1]) {
      const lx = x + s * 8;
      rect(g, lx - 1, by - 3, 3, 2, G.villa); px(g, lx + s, by - 4, G.villa); px(g, lx + s, by - 4, G.villaShade);
      rect(g, lx - 1, by - 1, 3, 1, G.rimShade);
    }
    L.fountains.push({ x, by });
  }

  function citrusPot(g, x, base, big = 0) {
    const pw = 5 + big;
    rect(g, x - Math.floor(pw / 2) - 1, base - 6, pw + 2, 1, G.potLight);
    rect(g, x - Math.floor(pw / 2), base - 5, pw, 4, G.pot);
    rect(g, x + Math.ceil(pw / 2) - 2, base - 5, 2, 4, G.potDark);
    rect(g, x - Math.floor(pw / 2) + 1, base - 1, pw - 2, 1, G.potDark);
    rect(g, x, base - 8, 1, 2, G.trunkDark);
    const cy = base - 11 - big, rr = 3 + big;
    disc(g, x, cy, rr, G.leafDark);
    disc(g, x - 1, cy - 1, rr - 1, G.leaf);
    px(g, x - 2, cy - 2, G.leafLight);
    for (let i = 0; i < 5 + big * 2; i++) px(g, x + Math.round((hash(x, i, 3) - 0.5) * rr * 2), cy + Math.round((hash(i, x, 4) - 0.5) * rr * 2), G.citrus);
  }

  function cypress(g, x, base, h) {
    for (let i = 0; i < h; i++) {
      const t = i / h;
      const w = Math.max(0, Math.round(3.2 * Math.sin(Math.PI * Math.pow(1 - t, 0.55)) + (hash(x, i, 2) < 0.3 ? 1 : 0)));
      const y = base - i;
      rect(g, x - w, y, w * 2 + 1, 1, G.cypress);
      if (w > 0) { px(g, x - w, y, G.cypressLight); px(g, x + w, y, G.cypressDark); }
      if (hash(x, i, 9) < 0.2 && w > 1) px(g, x - w + 1, y, G.cypressLight);
    }
    px(g, x, base - h, G.cypress);
  }

  function gardenWall(g, x0, x1, by) {
    rect(g, x0, by - 9, x1 - x0, 9, G.villa);
    rect(g, x0, by - 9, x1 - x0, 1, G.villaDark);
    rect(g, x0, by - 8, x1 - x0, 1, G.villaShade);
    for (let x = x1 - 2; x > x0; x -= 26) {
      rect(g, x - 2, by - 12, 5, 12, G.villa);
      rect(g, x + 2, by - 12, 1, 12, G.villaShade);
      rect(g, x - 3, by - 13, 7, 1, G.villaDark);
      disc(g, x, by - 15, 1, G.villa);
      px(g, x, by - 17, G.villaShade);
    }
  }

  function villa(g, x, by) {
    const hw = 32, wh = 21, rh = 6, top = by - wh;
    rect(g, x - hw, top, hw * 2 + 1, wh, G.villa);
    rect(g, x + hw - 5, top, 6, wh, G.villaShade);
    rect(g, x - hw, top, hw * 2 + 1, 1, G.villaDark);
    rect(g, x - hw, top + 1, hw * 2 + 1, 1, G.villaShade);
    // hipped terracotta roof
    for (let i = 0; i < rh; i++) {
      const inset = (rh - 1 - i) * 2, y = top - rh + i;
      for (let xx = x - hw - 2 + inset; xx <= x + hw + 2 - inset; xx++)
        px(g, xx, y, i === rh - 1 ? G.roofDark : (xx + i) % 3 === 0 ? G.roofDark : (xx % 2 ? G.roof : G.roofLight));
    }
    // three-arched loggia
    for (let k = 0; k < 3; k++) {
      const ax = x - 13 + k * 9;
      for (let y = top + 5; y < by - 1; y++) {
        const j = y - (top + 5);
        const inset = j === 0 ? 2 : j === 1 ? 1 : 0;
        for (let xx = ax + inset; xx < ax + 7 - inset; xx++)
          px(g, xx, y, j < 3 ? G.archDark : k === 1 && xx >= ax + 2 && xx <= ax + 4 && y > by - 9 ? G.slate : G.arch);
      }
    }
    // balustrade
    rect(g, x - 15, by - 5, 31, 1, G.villa);
    for (let xx = x - 14; xx <= x + 14; xx += 2) rect(g, xx, by - 4, 1, 3, G.villa);
    rect(g, x - 15, by - 2, 31, 1, G.villaShade);
    // windows and doors on the wings
    for (const wx of [x - 25, x + 22]) {
      rect(g, wx - 1, top + 7, 5, 12, G.villaShade);
      rect(g, wx, top + 8, 3, 11, G.slate);
      px(g, wx + 1, top + 8, "#6d7884");
    }
    rect(g, x - hw - 1, by - 1, hw * 2 + 3, 1, G.villaDark);
    // urns on the terrace
    for (const ux of [x - 30, x + 30]) { rect(g, ux - 1, by - 4, 3, 3, G.pot); px(g, ux, by - 5, G.leaf); }
  }

  function topiary(g, x, base) {
    for (let i = 0; i < 7; i++) {
      const w = Math.floor((7 - i) / 2.5);
      rect(g, x - w, base - i - 1, w * 2 + 1, 1, i === 0 ? G.boxDark : G.box);
      px(g, x - w, base - i - 1, G.boxLight);
    }
  }

  function toolbox(g, x, base) {
    rect(g, x - 3, base - 4, 7, 4, G.wood);
    rect(g, x - 3, base - 4, 7, 1, G.woodDark);
    rect(g, x - 3, base - 1, 7, 1, G.woodDark);
    rect(g, x - 1, base - 6, 3, 1, G.woodDark);
    px(g, x - 1, base - 5, G.woodDark); px(g, x + 1, base - 5, G.woodDark);
    px(g, x + 3, base - 6, "#b8bcc4"); px(g, x + 3, base - 5, "#8a8f99");
  }

  function buildBackground() {
    const T = TIMES[timeKey];
    buildSky(T);
    buildGround(T);
  }

  // ───────────────────────── scroll state ─────────────────────────
  let progress = 0, shownProgress = 0, lastScrollAt = -1e9, lastStrikeFrame = 0;
  const chips = [];
  const butterflies = [];
  let nextButterfly = performance.now() + 1200;
  const fireflies = Array.from({ length: 14 }, (_, i) => ({ s: i * 97.3, x: 0, y: 0 }));

  function readScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    if (p !== progress) lastScrollAt = performance.now();
    progress = p;
    updateStory(p);
  }

  // ───────────────────────── actors ─────────────────────────
  function drawSlab(g, p) {
    const filled = [];
    for (let y = 0; y < SLAB_H; y++) {
      filled.push([]);
      for (let x = 0; x < SLAB_W; x++) {
        let c = null;
        const plinth = y >= SLAB_H - 3 && x >= 1 && x < SLAB_W - 1;
        const st = statueTone[y][x];
        const t = slabThresh[y][x];
        if (plinth) c = p > 0.9 ? (y === SLAB_H - 3 ? Sp.STONE[0] : x > SLAB_W - 4 ? Sp.STONE[3] : Sp.STONE[2]) : slabRaw[y][x];
        else if (st >= 0) c = p >= t + 0.06 ? Sp.STONE[st] : slabRaw[y][x];
        else if (p < t) c = slabRaw[y][x];
        filled[y].push(c);
      }
    }
    const isF = (x, y) => x >= 0 && y >= 0 && x < SLAB_W && y < SLAB_H && filled[y][x];
    g.fillStyle = "#3a332c";
    for (let y = -1; y <= SLAB_H; y++)
      for (let x = -1; x <= SLAB_W; x++)
        if (!isF(x, y) && (isF(x + 1, y) || isF(x - 1, y) || isF(x, y + 1) || isF(x, y - 1)))
          g.fillRect(L.slabX + x, L.slabY + y, 1, 1);
    for (let y = 0; y < SLAB_H; y++)
      for (let x = 0; x < SLAB_W; x++)
        if (filled[y][x]) { g.fillStyle = filled[y][x]; g.fillRect(L.slabX + x, L.slabY + y, 1, 1); }

    // where the chisel is working now: highest remaining rough pixel near the frontier
    let target = null;
    for (let y = 0; y < SLAB_H - 3 && !target; y++)
      for (let x = 0; x < SLAB_W; x++) {
        const t = slabThresh[y][x] + (statueTone[y][x] >= 0 ? 0.06 : 0);
        if (p < t && t - p < 0.12) { target = y; break; }
      }
    return target ?? Math.round((SLAB_H - 4) * clamp(p, 0, 1));
  }

  function drawRubble(g, p) {
    for (const rb of rubble) {
      if (p < rb.t) continue;
      const x = L.slabX + SLAB_W / 2 + rb.dx, y = fy + rb.dy;
      if (x > L.sx && x < L.sx + 12) continue; // not on her feet
      px(g, x, y, rb.c);
      if (rb.big) { px(g, x + 1, y, rb.c); px(g, x, y - 1, Sp.STONE[0]); }
    }
  }

  function arm(g, sx, sy, hx, hy, shirt, skin) {
    line(g, sx, sy, hx, hy, (x, y, t) => {
      const c = t < 0.3 ? shirt : skin;
      px(g, x, y, c); px(g, x, y + 1, c);
    });
  }

  function drawSculptor(g, now, p, targetRow) {
    const pal = Sp.palette();
    const sx = L.sx, sy = L.sy;
    const done = p > 0.975;
    const swinging = !done && now - lastScrollAt < 260 && !reduceMotion;
    const frame = swinging ? Math.floor(now / 130) % 2 : 1;

    // hand positions
    let hy = clamp(L.slabY + targetRow, sy + 8, sy + 23);
    let ch = { x: L.slabX - 4, y: hy }; // chisel hand
    let mh = frame === 0 ? { x: ch.x - 5, y: ch.y - 5 } : { x: ch.x - 3, y: ch.y - 1 };
    if (done) { ch = { x: sx + 11, y: sy + 21 }; mh = { x: sx + 8, y: sy + 22 }; }

    // strike → chips
    if (swinging && frame === 1 && lastStrikeFrame === 0) {
      for (let i = 0; i < 4 + Math.floor(Math.random() * 3); i++)
        chips.push({ x: ch.x + 4, y: ch.y, vx: 0.1 + Math.random() * 0.6, vy: -0.4 - Math.random() * 0.9,
          c: Sp.STONE[1 + Math.floor(Math.random() * 3)], life: 120 });
    }
    lastStrikeFrame = swinging ? frame : 1;

    // far arm (to the chisel) behind the body
    arm(g, sx + 9, sy + 14, ch.x, ch.y, pal.d, pal.s);
    const blink = Math.floor(now / 100) % 45 === 0;
    Sp.drawBody(g, sx, sy, { blink });
    // chisel
    if (!done) {
      rect(g, ch.x + 1, ch.y, 3, 1, "#b8bcc4");
      px(g, ch.x + 1, ch.y, "#6b4a2b");
    } else {
      rect(g, ch.x, ch.y + 1, 1, 3, "#b8bcc4");
    }
    // near arm (mallet)
    arm(g, sx + 7, sy + 15, mh.x, mh.y, pal.D, pal.S);
    // mallet
    if (!done) {
      line(g, mh.x, mh.y + 2, mh.x, mh.y - 1, (x, y) => px(g, x, y, G.woodDark));
      rect(g, mh.x - 1, mh.y - 3, 4, 2, G.wood);
      rect(g, mh.x - 1, mh.y - 2, 4, 1, G.woodDark);
    } else {
      rect(g, mh.x, mh.y + 1, 1, 3, G.woodDark);
      rect(g, mh.x - 1, mh.y + 4, 3, 2, G.wood);
    }
  }

  function updateChips() {
    for (let i = chips.length - 1; i >= 0; i--) {
      const c = chips[i];
      c.vy += 0.07; c.x += c.vx; c.y += c.vy; c.life--;
      if (c.y >= fy + 1) { c.y = fy + 1; c.vx *= 0.5; c.vy = 0; }
      if (c.life <= 0) chips.splice(i, 1);
    }
  }

  function updateButterflies(now) {
    if (now > nextButterfly && butterflies.length < 2 && !reduceMotion) {
      const fromLeft = Math.random() < 0.5;
      butterflies.push({
        x: fromLeft ? -6 : W + 6, dir: fromLeft ? 1 : -1,
        base: hY - 20 + Math.random() * (fy - hY + 26), amp: 3 + Math.random() * 6,
        speed: 0.18 + Math.random() * 0.22, ph: Math.random() * 6,
        c: ["#f08a24", "#6cb6ff", "#f6d55c", "#f6f2ff", "#e88fd0"][Math.floor(Math.random() * 5)],
      });
      nextButterfly = now + 3500 + Math.random() * 6000;
    }
    for (let i = butterflies.length - 1; i >= 0; i--) {
      const b = butterflies[i];
      b.x += b.speed * b.dir; b.ph += 0.03;
      if (b.x < -10 || b.x > W + 10) butterflies.splice(i, 1);
    }
  }

  function drawButterfly(g, b, now) {
    const fr = Sp.BUTTERFLY[Math.floor(now / 140 + b.ph * 3) % 2];
    const x0 = Math.round(b.x) - 2, y0 = Math.round(b.base + Math.sin(b.ph) * b.amp + Math.sin(b.ph * 3.1) * 1.5);
    fr.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch === "A") px(g, x0 + x, y0 + y, b.c);
        else if (ch === "B") px(g, x0 + x, y0 + y, "#2b2233");
      })
    );
  }

  // ───────────────────────── render loop ─────────────────────────
  // ───────────────────────── living sky, water and light ─────────────────────────
  const birds = [];
  let nextBirds = performance.now() + 2500;
  function drawSkyLife(now, t, T) {
    const S = L.sun;
    // pulsing glow and slow rays around the sun / moon
    if (S) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.3);
      const gr = ctx.createRadialGradient(S.x, S.y, S.r, S.x, S.y, S.r * 6 + pulse * 3);
      gr.addColorStop(0, timeKey === "night" ? "rgba(190,200,255,0.30)" : "rgba(255,246,210,0.45)");
      gr.addColorStop(1, "rgba(255,246,210,0)");
      ctx.fillStyle = gr;
      ctx.fillRect(S.x - S.r * 8, S.y - S.r * 8, S.r * 16, S.r * 16);
      if (timeKey !== "night") {
        ctx.save();
        ctx.globalAlpha = 0.12 + pulse * 0.06;
        ctx.strokeStyle = "#fff6d8";
        ctx.lineWidth = 1;
        for (let k = 0; k < 10; k++) {
          const a = t * 0.08 + (k * Math.PI) / 5;
          const r0 = S.r + 3, r1 = S.r + 9 + (k % 2) * 6 + pulse * 2;
          ctx.beginPath();
          ctx.moveTo(Math.round(S.x + Math.cos(a) * r0) + 0.5, Math.round(S.y + Math.sin(a) * r0) + 0.5);
          ctx.lineTo(Math.round(S.x + Math.cos(a) * r1) + 0.5, Math.round(S.y + Math.sin(a) * r1) + 0.5);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    // twinkling stars
    if (T.star) {
      for (let k = 0; k < 40; k++) {
        const x = Math.floor(hash(k, 1, 77) * W), y = Math.floor(hash(k, 2, 77) * (hY - 10));
        const tw = Math.sin(t * (1.5 + (k % 5) * 0.4) + k);
        if (tw > 0.6) { px(ctx, x, y, "#ffffff"); if (tw > 0.93) { px(ctx, x - 1, y, "#9fb0ff"); px(ctx, x + 1, y, "#9fb0ff"); px(ctx, x, y - 1, "#9fb0ff"); px(ctx, x, y + 1, "#9fb0ff"); } }
      }
    }
    // wisps
    ctx.save();
    ctx.globalAlpha = timeKey === "night" ? 0.15 : 0.35;
    ctx.fillStyle = T.cloudLight || "#ffffff";
    for (const w of L.wisps || []) {
      w.x += reduceMotion ? 0 : w.v;
      if (w.x > W + 4) w.x = -w.w;
      ctx.fillRect(Math.round(w.x), w.y, w.w, 1);
      ctx.fillRect(Math.round(w.x) + 6, w.y + 2, Math.round(w.w * 0.6), 1);
    }
    ctx.restore();
    // clouds (far → near)
    for (const c of clouds) {
      if (!reduceMotion) c.x += c.v;
      if (c.x > W + 4) c.x = -c.img.width;
      ctx.globalAlpha = c.alpha;
      ctx.drawImage(c.img, Math.round(c.x), Math.round(c.y + Math.sin(t * 0.3 + c.v * 300) * 0.6));
    }
    ctx.globalAlpha = 1;
    // a small flock of birds now and then (not at night)
    if (!reduceMotion && timeKey !== "night" && now > nextBirds && birds.length === 0) {
      const y0 = 6 + Math.random() * hY * 0.4, dir = Math.random() < 0.5 ? 1 : -1, n = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) birds.push({ x: (dir > 0 ? -8 : W + 8) - dir * i * 6, y: y0 + Math.abs(i - (n >> 1)) * 3, dir, ph: Math.random() * 6 });
      nextBirds = now + 9000 + Math.random() * 9000;
    }
    for (let i = birds.length - 1; i >= 0; i--) {
      const b = birds[i];
      b.x += 0.22 * b.dir; b.ph += 0.12;
      const up = Math.sin(b.ph) > 0;
      const x = Math.round(b.x), y = Math.round(b.y + Math.sin(b.ph * 0.3) * 1.5);
      const c = timeKey === "sunset" ? "#3a2440" : "#2f3a4f";
      px(ctx, x, y, c);
      px(ctx, x - 1, y + (up ? -1 : 0), c); px(ctx, x + 1, y + (up ? -1 : 0), c);
      px(ctx, x - 2, y + (up ? -1 : 1), c); px(ctx, x + 2, y + (up ? -1 : 1), c);
      if (b.x < -20 || b.x > W + 20) birds.splice(i, 1);
    }
  }

  function drawCloudShadows(t) {
    if (timeKey === "night") return;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, hY + 2, W, H); ctx.clip();
    ctx.fillStyle = "rgba(25,45,35,0.07)";
    for (let k = 0; k < 3; k++) {
      const span = W + 120;
      const x = ((t * (3 + k) + k * span / 3) % span) - 60;
      const y = hY + 12 + k * ((H - hY) / 3);
      ctx.beginPath(); ctx.ellipse(x, y, 34 + k * 8, 7 + k * 2, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawWater(now, t) {
    const night = timeKey === "night";
    const gloss = night ? "rgba(170,185,255,0.35)" : "rgba(235,255,255,0.45)";
    (L.pools || []).forEach((pl, pi) => {
      // a glossy highlight band sweeping slowly across each pool
      const span = pl.w + pl.h * 2 + 10;
      const off = ((t * 6 + pi * 17) % span) - pl.h;
      ctx.fillStyle = gloss;
      for (let yy = 0; yy < pl.h; yy++) {
        const x0 = Math.round(off + yy);
        for (let dx = 0; dx < 3; dx++) {
          const x = x0 + dx * (dx === 2 ? 2 : 1);
          if (x >= 0 && x < pl.w) ctx.fillRect(pl.x + x, pl.y + yy, 1, 1);
        }
      }
      // ripples drifting across
      ctx.fillStyle = night ? "#8e9fd8" : "#d6f4f2";
      const n = Math.max(1, Math.round(pl.w / 10));
      for (let k = 0; k < n; k++) {
        const sx = pl.x + Math.floor((k * 17 + pi * 7 + t * 3 * (1 + (k % 3))) % Math.max(1, pl.w - 2));
        const sy = pl.y + ((k * 3 + pi) % Math.max(1, pl.h));
        ctx.fillRect(sx, sy, Math.min(2, pl.x + pl.w - sx), 1);
      }
      // sparkles that flash and fade
      const tick = Math.floor(now / 160);
      for (let k = 0; k < Math.max(1, Math.round(pl.w / 16)); k++) {
        if (hash(tick, k, pi) > 0.55) continue;
        const sx = pl.x + Math.floor(hash(tick, k, pi + 9) * pl.w), sy = pl.y + Math.floor(hash(tick, k, pi + 3) * pl.h);
        px(ctx, sx, sy, "#ffffff");
        if (hash(tick, k, pi + 5) < 0.3) { px(ctx, sx - 1, sy, gloss); px(ctx, sx + 1, sy, gloss); }
      }
    });
    // fountains: a jet from the top, spilling over both basins, with rings where it lands
    (L.fountains || []).forEach((f) => {
      if (reduceMotion) return;
      const light = night ? "#b9c6ff" : "#f2feff", mid = night ? "#8e9fd8" : "#a6e6ec";
      const flick = Math.floor(t * 8) % 2;
      for (let i = 0; i < 4 + flick; i++) px(ctx, f.x, f.by - 13 - i, i % 2 ? mid : light);
      for (let k = 0; k < 10; k++) {
        const ph = (t * 1.1 + k / 10) % 1, side = k % 2 ? 1 : -1;
        px(ctx, Math.round(f.x + side * ph * 3), Math.round(f.by - 17 + ph * ph * 7 - ph * 2 + 0), ph < 0.5 ? light : mid);
        const ph2 = (t * 1.3 + k / 10 + 0.37) % 1;
        px(ctx, Math.round(f.x + side * (3 + ph2 * 3)), Math.round(f.by - 6 + ph2 * ph2 * 7), ph2 < 0.6 ? light : mid);
      }
      // expanding rings in the pool
      for (let k = 0; k < 2; k++) {
        const ph = (t * 0.7 + k * 0.5) % 1;
        const rx = 7 + Math.round(ph * 6), ry = 1 + Math.round(ph * 1.5);
        ctx.globalAlpha = 0.6 * (1 - ph);
        ctx.fillStyle = light;
        for (let a = 0; a < Math.PI * 2; a += 0.35) {
          const x = Math.round(f.x + Math.cos(a) * rx), y = Math.round(f.by + 1 + Math.sin(a) * ry);
          ctx.fillRect(x, y, 1, 1);
        }
        ctx.globalAlpha = 1;
      }
    });
  }

  // drifting pollen / petals catching the light
  const motes = Array.from({ length: 16 }, (_, i) => ({ s: i * 13.7 }));
  function drawMotes(t) {
    if (reduceMotion || timeKey === "night") return;
    const c = timeKey === "sunset" ? "rgba(255,214,150,0.8)" : timeKey === "morning" ? "rgba(255,230,235,0.85)" : "rgba(255,255,240,0.8)";
    ctx.fillStyle = c;
    for (const m of motes) {
      const x = Math.round(((m.s * 23 + t * (2 + (m.s % 3))) % (W + 20)) - 10 + Math.sin(t * 0.8 + m.s) * 4);
      const y = Math.round(hY - 20 + ((m.s * 17) % (H - hY + 10)) + Math.sin(t * 0.6 + m.s * 2) * 6);
      if (Math.sin(t * 1.7 + m.s) > -0.3) ctx.fillRect(x, y, 1, 1);
    }
  }

  // soft bloom + warm light + vignette for a glossier finish
  let bloom, bctx;
  function drawGlow(T, t) {
    const bw = Math.max(8, Math.round(W / 4)), bh = Math.max(8, Math.round(H / 4));
    if (!bloom || bloom.width !== bw || bloom.height !== bh) {
      bloom = document.createElement("canvas"); bloom.width = bw; bloom.height = bh; bctx = bloom.getContext("2d");
    }
    bctx.imageSmoothingEnabled = true;
    bctx.clearRect(0, 0, bw, bh);
    bctx.drawImage(canvas, 0, 0, bw, bh);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = timeKey === "night" ? 0.14 : 0.2;
    ctx.drawImage(bloom, 0, 0, W, H);
    ctx.globalCompositeOperation = "soft-light";
    const S = L.sun || { x: W * 0.8, y: 10 };
    const lg = ctx.createRadialGradient(S.x, S.y, 0, S.x, S.y, Math.max(W, H) * 0.9);
    lg.addColorStop(0, timeKey === "night" ? "rgba(150,170,255,0.35)" : "rgba(255,236,190,0.55)");
    lg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
    const vg = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.45, W / 2, H * 0.55, Math.max(W, H) * 0.8);
    vg.addColorStop(0, "rgba(20,18,40,0)");
    vg.addColorStop(1, "rgba(20,18,40,0.22)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    ctx.imageSmoothingEnabled = false;
  }

  function frame(now) {
    // ease the drawn progress toward the scroll position for smoothness
    shownProgress += (progress - shownProgress) * (reduceMotion ? 1 : 0.25);
    if (Math.abs(progress - shownProgress) < 0.0005) shownProgress = progress;
    const p = shownProgress;
    const T = TIMES[timeKey];

    const t = reduceMotion ? 0 : now / 1000;
    ctx.drawImage(skyLayer, 0, 0);
    drawSkyLife(now, t, T);
    ctx.drawImage(groundLayer, 0, 0);
    drawCloudShadows(t);
    drawWater(now, t);

    // actors on their own layer so night/sunset can tint them
    actx.clearRect(0, 0, W, H);
    drawRubble(actx, p);
    const targetRow = drawSlab(actx, p);
    drawSculptor(actx, now, p, targetRow);
    updateChips();
    for (const c of chips) px(actx, Math.round(c.x), Math.round(c.y), c.c);
    updateButterflies(now);
    if (timeKey !== "night") for (const b of butterflies) drawButterfly(actx, b, now);
    if (T.tint) {
      actx.globalCompositeOperation = "source-atop";
      actx.fillStyle = T.tint;
      actx.fillRect(0, 0, W, H);
      actx.globalCompositeOperation = "source-over";
    }
    ctx.drawImage(actors, 0, 0);

    // fireflies at night
    if (timeKey === "night") {
      for (const f of fireflies) {
        const t = now / 1000;
        const x = Math.round((f.s * 7.1 + Math.sin(t * 0.4 + f.s) * 18 + t * 2) % W);
        const y = Math.round(hY - 6 + ((f.s * 3.7) % (fy - hY + 20)) + Math.sin(t * 0.9 + f.s) * 4);
        const on = Math.sin(t * 2 + f.s) > 0.1;
        if (!on) continue;
        ctx.fillStyle = "rgba(230,255,140,0.25)";
        ctx.fillRect(x - 1, y - 1, 3, 3);
        px(ctx, x, y, "#f2ffb0");
      }
    }
    drawMotes(t);
    drawGlow(T, t);
    requestAnimationFrame(frame);
  }

  // ───────────────────────── story cards ─────────────────────────
  const stage = document.getElementById("story");
  const quote = document.getElementById("quote");
  const hint = document.getElementById("scroll-hint");
  const spacer = document.getElementById("scroll-space");
  const CARDS = window.CARDS || [];
  const N = CARDS.length;
  const S = window.SITE;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const mailto = `mailto:${S.email}` + (S.emailSubject ? `?subject=${encodeURIComponent(S.emailSubject)}` : "");

  spacer.style.height = `${N * 130 + 30}vh`;

  const cardEls = CARDS.map((c, i) => {
    const el = document.createElement("article");
    el.className = `card pixel-box ${i % 2 === 0 ? "side-left" : "side-right"}${c.cta ? " card-cta" : ""}`;
    el.setAttribute("aria-hidden", "true");
    const imgs = (c.images || [])
      .map((im) =>
        im.src
          ? `<img src="${esc(im.src)}" alt="${esc(im.alt || "")}" loading="lazy">`
          : `<div class="ph" role="img" aria-label="${esc(im.alt || "Photo placeholder")}"><span>${esc(im.alt || "Photo")}</span></div>`
      )
      .join("");
    const links = (c.links || [])
      .map((l) => `<a class="btn btn-link" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} →</a>`)
      .join("");
    el.innerHTML = `
      ${c.kicker ? `<p class="kicker">${esc(c.kicker)}</p>` : ""}
      <h2>${esc(c.title)}</h2>
      ${(c.body || []).map((b) => `<p>${esc(b)}</p>`).join("")}
      ${imgs ? `<div class="gallery">${imgs}</div>` : ""}
      ${links ? `<div class="links">${links}</div>` : ""}
      ${c.cta ? `<a class="btn btn-big" href="${mailto}">Contact me</a>` : ""}`;
    stage.appendChild(el);
    return el;
  });

  function updateStory(p) {
    const started = window.scrollY > 6;
    quote.classList.toggle("is-gone", started);
    hint.classList.toggle("is-gone", started);
    cardEls.forEach((el, i) => {
      const q = p * (N - 0.2) - i - 0.2; // each card: enter -0.2..0.2, rest, exit 0.8..1.2 (overlaps the next one entering)
      // rises from below the screen, rests beside the sculptor, then exits upward
      let y; // in vh
      if (q <= -0.2) y = 100;
      else if (q < 0.2) y = 100 * (1 - ease((q + 0.2) / 0.4));
      else if (q < 0.8 || i === N - 1) y = 0;
      else if (q < 1.2) y = -100 * ease((q - 0.8) / 0.4);
      else y = -100;
      el.style.setProperty("--y", `${y.toFixed(2)}vh`);
      el.style.opacity = String(clamp(1 - Math.abs(y) / 85, 0, 1));
      const visible = Math.abs(y) < 50;
      el.setAttribute("aria-hidden", visible ? "false" : "true");
      el.classList.toggle("is-active", visible);
      el.style.visibility = Math.abs(y) >= 99 ? "hidden" : "visible";
    });
  }

  hint.addEventListener("click", () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: (max * 0.45) / (N - 0.2), behavior: reduceMotion ? "auto" : "smooth" });
  });

  // time of day toggle
  const tbtn = document.getElementById("time-toggle");
  function setTimeLabel() { tbtn.querySelector("span").textContent = TIMES[timeKey].label; }
  tbtn.addEventListener("click", () => {
    timeKey = ORDER[(ORDER.indexOf(timeKey) + 1) % ORDER.length];
    try { localStorage.setItem("garden-time", timeKey); } catch (e) {}
    document.body.dataset.time = timeKey;
    setTimeLabel();
    buildBackground();
  });
  document.body.dataset.time = timeKey;
  setTimeLabel();

  // quote typewriter
  function typeQuote() {
    const textEl = quote.querySelector(".q-text");
    const full = textEl.dataset.text;
    if (reduceMotion) { textEl.textContent = full; quote.classList.add("is-typed"); return; }
    let i = 0;
    const step = () => {
      i++;
      textEl.textContent = full.slice(0, i);
      if (i < full.length) setTimeout(step, full[i - 1] === "," ? 220 : 34);
      else quote.classList.add("is-typed");
    };
    setTimeout(step, 500);
  }

  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", () => { layout(); readScroll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); readScroll(); });
  layout();
  readScroll();
  typeQuote();
  requestAnimationFrame(frame);

  // for screenshots / debugging
  window.__garden = { setTime: (k) => { timeKey = k; document.body.dataset.time = k; setTimeLabel(); buildBackground(); } };
})();

/* Background music: off until the visitor turns it on (browsers block autoplay). */
(function () {
  const btn = document.getElementById("music-toggle");
  const audio = document.getElementById("bg-music");
  if (!btn || !audio) return;
  const label = btn.querySelector("span");
  audio.volume = 0.45;
  const set = (on) => {
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    label.textContent = on ? "Music on" : "Music off";
  };
  btn.addEventListener("click", async () => {
    if (audio.paused) {
      try { await audio.play(); set(true); }
      catch (e) { btn.classList.add("is-missing"); label.textContent = "Music unavailable"; }
    } else { audio.pause(); set(false); }
  });
  audio.addEventListener("error", () => { btn.classList.add("is-missing"); set(false); label.textContent = "Music unavailable"; });
})();
