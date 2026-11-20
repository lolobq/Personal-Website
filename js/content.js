/*
 * ─────────────────────────────────────────────────────────────
 *  SITE CONTENT — edit this file to update the website.
 *  Everything marked TODO is a placeholder waiting for the real thing.
 * ─────────────────────────────────────────────────────────────
 */

window.SITE = {
  name: "Lauren Bourque",
  tagline: "Engineer & Entrepreneur",

  // Square photo in the top-left corner. Put the file in /assets and set the path,
  // e.g. "assets/lauren.jpg". Leave empty to show the pixel portrait instead.
  photo: "assets/lauren.jpg",

  email: "lolobq47@gmail.com",
  emailSubject: "Hi Lauren, saw your portfolio",

  resumePdf: "assets/resume.pdf",
  linkedin: "https://www.linkedin.com/in/lauren-bourque/",
  github: "https://github.com/lolobq",

  // Colors for the pixel sculptor (and the statue's shape) so they can match you.
  sprite: {
    hair: "#6b4228",
    hairShade: "#45291a",
    hairLight: "#a8774a",
    skin: "#f3c9ad",
    skinShade: "#dfa186",
    top: "#3f72c2",
    topShade: "#2c5596",
    jeans: "#5d80ad",
    jeansShade: "#45648e",
    shoes: "#4a2f25",
    lips: "#c46a6a",
  },
};

/*
 * STORY CARDS — shown one at a time, in order, as the visitor scrolls.
 * They alternate above / below the sculptor automatically.
 *
 * Fields (all optional except title):
 *   kicker   small label above the title
 *   title    headline
 *   body     one or more paragraphs (array of strings)
 *   images   [{ src, alt }]  — src "" shows a placeholder tile
 *   links    [{ label, href }]
 *   cta      true for the big "contact me" finale card
 */
window.CARDS = [
  {
    kicker: "Prologue",
    title: "Everyone wants to show you what they've built, but no one wants to show you how they got there.",
    body: ["Let me take you along my journey."],
  },
  {
    kicker: "Chapter 1 · The athlete",
    title: "I always wanted to be a bodybuilder.",
    body: [
      "So after tearing my labrum and getting major hip surgery in January, I decided I'd step on stage for my first contest.",
    ],
    images: [
      { src: "", alt: "Progress photo: post-surgery" }, // TODO
      { src: "", alt: "Progress photo: mid prep" }, // TODO
      { src: "", alt: "Progress photo: stage day" }, // TODO
    ],
    links: [{ label: "See the health tracker I built", href: "#" }], // TODO
  },
  {
    kicker: "Chapter 2 · The founder",
    title: "I've always wanted to be an entrepreneur.",
    body: [
      "So I'm building a stealth AI startup.",
      "Beta launching January 2027.",
    ],
  },
  {
    kicker: "What's next",
    title: "Let's sculpt together.",
    body: ["The statue's never really finished. If you're building something worth chiseling at, I'd love to hear about it."],
    cta: true,
  },
];

/*
 * ABOUT, PROJECTS, SPEAKING pages. body/description are arrays of paragraphs.
 */
window.ABOUT = {
  title: "About me",
  body: [
    "I'm a software engineer and startup co-founder in Charlotte, NC. By day I build production financial systems at Wells Fargo; the rest of the time I'm building an AI platform that helps people learn to communicate.",
    "Placeholder: replace this with your own about text.", // TODO
  ],
};

window.PROJECTS = [
  // TODO: add real projects. links: [{ label, href }]
  { title: "A stealth AI startup", tag: "Founder · 2026", description: ["Beta launching January 2027."], links: [] },
  { title: "Health tracker", tag: "Side project", description: ["The app I built to track my contest prep after hip surgery."], links: [{ label: "See it", href: "#" }] },
];

window.TALKS = [
  // TODO: add real talks. { title, event, date, description, links }
  { title: "Innovation panels & podcasts", event: "Wells Fargo and beyond", date: "", description: ["Sharing career advice and lessons on innovation with audiences of 300+."], links: [] },
];

/*
 * REFLECTIONS — blog posts. Newest first.
 * body is an array of paragraphs.
 */
window.POSTS = [
  {
    slug: "welcome",
    title: "Why a sculptor?",
    date: "2026-11-20",
    excerpt: "A placeholder post. Replace it with your first reflection.",
    body: [
      "This is a placeholder post so the Reflections page has something to show.",
      "Write your posts in js/content.js, newest first. Each one gets its own page.",
    ],
  },
];
