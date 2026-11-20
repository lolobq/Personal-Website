/* Shared header (photo square + name bar + buttons) used on every page. */
(function () {
  const S = window.SITE;

  // 9x9 pixel icons. "#" = filled.
  const ICONS = {
    reflections: [
      ".........",
      "###...###",
      "#..#.#..#",
      "#.##.##.#",
      "#..#.#..#",
      "#.##.##.#",
      "#..#.#..#",
      "####.####",
      ".........",
    ],
    email: [
      ".........",
      "#########",
      "##.....##",
      "#.#...#.#",
      "#..#.#..#",
      "#...#...#",
      "#.......#",
      "#########",
      ".........",
    ],
    resume: [
      ".######..",
      ".#....##.",
      ".#.##..#.",
      ".#.....#.",
      ".#.###.#.",
      ".#.....#.",
      ".#.###.#.",
      ".#.....#.",
      ".#######.",
    ],
    linkedin: [
      "#########",
      "#.......#",
      "#.#.....#",
      "#.......#",
      "#.#.###.#",
      "#.#.#.#.#",
      "#.#.#.#.#",
      "#.......#",
      "#########",
    ],
    github: [
      ".........",
      "..#...#..",
      ".#.....#.",
      "#...#...#",
      "#..#....#",
      "#...#...#",
      ".#.....#.",
      "..#...#..",
      ".........",
    ],
  };

  function icon(name) {
    const rows = ICONS[name];
    let rects = "";
    rows.forEach((r, y) =>
      [...r].forEach((c, x) => {
        if (c === "#") rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      })
    );
    return `<svg class="icon" viewBox="0 0 9 9" aria-hidden="true" shape-rendering="crispEdges" fill="currentColor">${rects}</svg>`;
  }

  // Thin line icons (adapted from Feather Icons, MIT license).
  const LINE = {
    about: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
    projects: '<path d="M12 2l10 5-10 5L2 7z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
    speaking: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4M8 22h8"/>',
    contact: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
    reflections: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
    resume: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
  };
  const lineIcon = (id) =>
    `<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${LINE[id]}</svg>`;

  const mailto =
    `mailto:${S.email}` + (S.emailSubject ? `?subject=${encodeURIComponent(S.emailSubject)}` : "");

  const buttons = [
    { id: "about", label: "About", href: "about.html" },
    { id: "resume", label: "Resume", href: "resume.html" },
    { id: "projects", label: "Projects", href: "projects.html" },
    { id: "reflections", label: "Reflections", href: "reflections.html" },
    { id: "speaking", label: "Speaking", href: "speaking.html" },
    { id: "contact", label: "Contact", href: "contact.html" },
  ];

  const header = document.getElementById("site-header");
  if (!header) return;

  const here = location.pathname.split("/").pop() || "index.html";

  header.innerHTML = `
    <div class="bar">
      <a class="who" href="index.html">
        <span class="name">${S.name}</span>
        <span class="tagline">${S.tagline}</span>
      </a>
      <nav class="actions" aria-label="Links">
        ${buttons
          .map(
            (b) =>
              `<a class="nav-link${here === b.href ? " is-current" : ""}" href="${b.href}"${
                b.external ? ' target="_blank" rel="noopener"' : ""
              } >${b.label}</a>`
          )
          .join("")}
      </nav>
    </div>`;

  // Photo and name return to the start of the story (smoothly, if already on the home page).
  const onHome = here === "index.html" || here === "";
  header.querySelectorAll(".who").forEach((el) => {
    el.setAttribute("title", "Back to the start");
    el.addEventListener("click", (e) => {
      if (!onHome) return;
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  });

  // Placeholder portrait: the sprite's head drawn into the photo square.
  const av = document.getElementById("avatar");
  if (av && window.Sprites) window.Sprites.drawAvatar(av);
})();
