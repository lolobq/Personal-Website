# Lauren Bourque — portfolio

A static site (plain HTML, CSS and JavaScript, no build step). The garden, the sculptor and the statue are drawn in code on a pixel canvas.

## Run it locally

    python3 -m http.server 8000
    # then open http://localhost:8000

## Edit content

Everything you'd change lives in `js/content.js`:

- `SITE` — name, tagline, photo, email, resume PDF, LinkedIn, GitHub, and the sculptor's colors
- `CARDS` — the story cards, in order (they alternate above/below the sculptor automatically)
- `POSTS` — Reflections blog posts, newest first

Images go in `assets/` (e.g. `assets/progress/stage-day.jpg`) and are referenced by path.

## Files

- `index.html` — the garden scene
- `reflections.html` — blog list and individual posts (`?post=slug`)
- `resume.html` — embedded PDF from `assets/resume.pdf`
- `js/scene.js` — canvas scene, scroll-driven carving, story cards, time of day
- `js/sprites.js` — the sculptor and statue sprites
