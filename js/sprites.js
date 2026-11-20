/* Original pixel sprites: the sculptor (Lauren), her statue, butterflies. */
(function () {
  // Sculptor body, facing right, arms drawn separately in code.
  // H hair  h hair shade  S skin  s skin shade  W eye white  E eye  R lips
  // D top  d top shade  J jeans  j jeans shade  B shoes
  const BODY = [
    "....hcHHHh....",
    "...hHHcHHHH...",
    "..hHcHHHHcHH..",
    ".hHHHHHHHHSHh.",
    ".hHcHHHHSSSSH.",
    "hHHHHHHSSSSSH.",
    "hHHHcHHSSWES..",
    "hHcHHHHSSSSS..",
    "hHHHHHHsSSSSS.",
    "hHHcHHHHsSRS..",
    "hHHHHcHHsSS...",
    "hhHHHHHcHs....",
    ".hHcHHHDsD....",
    ".hhHcDDDDDD...",
    "..hhDDDDDDDD..",
    "...DDDDDDDDD..",
    "...DDDDDDDDD..",
    "...dDDDDDDDd..",
    "...dDDDDDDDd..",
    "....DDDDDDD...",
    "....jJJJJJj...",
    "....JJJJJJJ...",
    "....JJJjJJJ...",
    "....JJj.JJj...",
    "....JJj.JJj...",
    "....JJj.JJj...",
    "....JJj.JJj...",
    "....JJj.JJj...",
    "....JJj.JJj...",
    "....JJj.JJj...",
    "...BBBB.BBBB..",
    "...BBBB.BBBBB.",
  ].map((r) => r.padEnd(14, "."));

  const W = 14,
    H = BODY.length; // 32

  function palette() {
    const s = (window.SITE && window.SITE.sprite) || {};
    return {
      H: s.hair, h: s.hairShade, c: s.hairLight, S: s.skin, s: s.skinShade, W: "#ffffff", E: "#2b2233",
      R: s.lips, D: s.top, d: s.topShade, J: s.jeans, j: s.jeansShade, B: s.shoes,
    };
  }

  const OUTLINE = "#2b2233";

  // Precompute outline cells around the body.
  function outlineCells(rows) {
    const out = [];
    const h = rows.length, w = rows[0].length;
    const filled = (x, y) => x >= 0 && y >= 0 && x < w && y < h && rows[y][x] !== ".";
    for (let y = -1; y <= h; y++)
      for (let x = -1; x <= w; x++) {
        if (filled(x, y)) continue;
        if (filled(x + 1, y) || filled(x - 1, y) || filled(x, y + 1) || filled(x, y - 1)) out.push([x, y]);
      }
    return out;
  }
  const BODY_OUTLINE = outlineCells(BODY);

  function drawBody(g, ox, oy, opts = {}) {
    const pal = palette();
    g.fillStyle = OUTLINE;
    for (const [x, y] of BODY_OUTLINE) g.fillRect(ox + x, oy + y, 1, 1);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let c = BODY[y][x];
        if (c === ".") continue;
        if (opts.blink && (c === "W" || c === "E")) c = "s";
        g.fillStyle = pal[c];
        g.fillRect(ox + x, oy + y, 1, 1);
      }
  }

  // Statue = the body, mirrored to face the sculptor, with arms at its sides,
  // rendered in stone tones with light from the upper left.
  const STONE = ["#f1ece2", "#d9d2c4", "#bbb3a3", "#968e7f", "#6b6458"];
  const STONE_TONE = { D: 1, d: 2, J: 2, j: 3, c: 0, S: 0, s: 1, W: 0, E: 4, R: 2, H: 1, h: 2, T: 1, t: 2, A: 0, P: 2, B: 3, X: 1, x: 0 };

  function statueMap() {
    const rows = BODY.map((r) => r.split(""));
    for (let y = 13; y <= 20; y++) {
      rows[y][2] = y >= 19 ? "x" : "X";
      rows[y][12] = y >= 19 ? "x" : "X";
    }
    const mirrored = rows.map((r) => r.slice().reverse());
    const h = mirrored.length, w = mirrored[0].length;
    const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mirrored[y][x] !== ".";
    const tones = [];
    for (let y = 0; y < h; y++) {
      tones.push([]);
      for (let x = 0; x < w; x++) {
        const c = mirrored[y][x];
        if (c === ".") { tones[y].push(-1); continue; }
        let t = STONE_TONE[c] ?? 1;
        if (!inside(x + 1, y) && t < 4) t++; // shadow on the right edge
        if (!inside(x, y - 1) && t > 0 && c !== "E") t--; // highlight on top edges
        tones[y].push(t);
      }
    }
    return { w, h, tones };
  }

  function drawAvatar(canvas) {
    const g = canvas.getContext("2d");
    const n = canvas.width;
    g.fillStyle = "#a6dbef";
    g.fillRect(0, 0, n, n);
    g.fillStyle = "#7cbc5a";
    g.fillRect(0, n - 5, n, 5);
    // head + shoulders, centered
    drawBody(g, Math.floor((n - W) / 2) + 1, 4);
  }

  // Butterfly frames (5x3). A = wing, B = body.
  const BUTTERFLY = [
    ["AA.AA", "AABAA", ".A.A."],
    [".....", ".ABA.", "..B.."],
  ];

  window.Sprites = {
    BODY, W, H, palette, drawBody, statueMap, STONE, OUTLINE, drawAvatar, BUTTERFLY,
  };
})();
