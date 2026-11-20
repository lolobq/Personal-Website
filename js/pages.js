/* Reflections (blog) and Resume pages. */
(function () {
  const h = document.getElementById("site-header");
  if (h) document.documentElement.style.setProperty("--header-h", h.getBoundingClientRect().bottom + "px");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const fmt = (d) => new Date(d + "T12:00:00").toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  const blog = document.getElementById("reflections");
  if (blog) {
    const posts = window.POSTS || [];
    const slug = new URLSearchParams(location.search).get("post");
    const post = posts.find((p) => p.slug === slug);
    if (post) {
      document.title = `${post.title} · Reflections`;
      blog.innerHTML = `<article class="post">
        <a class="btn back" href="reflections.html">← All reflections</a>
        <time datetime="${esc(post.date)}">${fmt(post.date)}</time>
        <h1>${esc(post.title)}</h1>
        ${(post.body || []).map((p) => `<p>${esc(p)}</p>`).join("")}
      </article>`;
    } else {
      blog.innerHTML = `<h1>Reflections</h1>
        <p class="lede">Notes from the workshop: what I'm learning, building and chiseling away at.</p>
        <ul class="post-list">${posts
          .map((p) => `<li><a href="reflections.html?post=${encodeURIComponent(p.slug)}">
            <time datetime="${esc(p.date)}">${fmt(p.date)}</time>
            <h2>${esc(p.title)}</h2><p>${esc(p.excerpt || "")}</p></a></li>`)
          .join("")}</ul>`;
    }
  }

  const resume = document.getElementById("resume");
  if (resume) {
    const pdf = window.SITE.resumePdf;
    resume.innerHTML = `<h1>Resume</h1>
      <div class="resume-actions">
        <a class="btn btn-link" href="${esc(pdf)}" download>Download PDF</a>
        <a class="btn" href="${esc(pdf)}" target="_blank" rel="noopener">Open in new tab</a>
      </div>
      <iframe class="resume-frame" src="${esc(pdf)}#view=FitH" title="Lauren's resume"></iframe>`;
  }
})();

/* About, Projects, Speaking and Contact pages. */
(function () {
  const S = window.SITE;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const paras = (arr) => (arr || []).map((p) => `<p>${esc(p)}</p>`).join("");
  const links = (arr) => (arr && arr.length ? `<div class="links">${arr.map((l) => `<a class="btn" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} →</a>`).join("")}</div>` : "");
  const mailto = `mailto:${S.email}` + (S.emailSubject ? `?subject=${encodeURIComponent(S.emailSubject)}` : "");

  const about = document.getElementById("about");
  if (about) {
    const A = window.ABOUT || {};
    about.innerHTML = `<div class="about-head">${S.photo ? `<img class="about-photo" src="${esc(S.photo)}" alt="Photo of ${esc(S.name)}">` : ""}
      <div><h1>${esc(A.title || "About")}</h1><p class="lede">${esc(S.tagline)}</p></div></div>${paras(A.body)}`;
  }

  const listPage = (el, title, lede, items, meta) => {
    el.innerHTML = `<h1>${title}</h1><p class="lede">${lede}</p><ul class="item-list">${items
      .map((it) => `<li><p class="item-meta">${esc(meta(it))}</p><h2>${esc(it.title)}</h2>${paras(it.description)}${links(it.links)}</li>`)
      .join("")}</ul>`;
  };
  const projects = document.getElementById("projects");
  if (projects) listPage(projects, "Projects", "Things I've built and am building.", window.PROJECTS || [], (it) => it.tag || "");
  const speaking = document.getElementById("speaking");
  if (speaking) listPage(speaking, "Speaking", "Panels, podcasts and talks.", window.TALKS || [], (it) => [it.event, it.date].filter(Boolean).join(" · "));

  const contact = document.getElementById("contact");
  if (contact) {
    contact.innerHTML = `<h1>Let's sculpt together.</h1>
      <p class="lede">The best way to reach me is email. I'm also on LinkedIn and GitHub.</p>
      <div class="contact-actions">
        <a class="btn btn-big" href="${mailto}">Email me</a>
        <a class="btn" href="${esc(S.linkedin)}" target="_blank" rel="noopener">LinkedIn →</a>
        <a class="btn" href="${esc(S.github)}" target="_blank" rel="noopener">GitHub →</a>
      </div>
      <p class="contact-email">${esc(S.email)}</p>`;
  }
})();
