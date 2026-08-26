# Player Build Base

A small, dependency-free eFootball player build planner. Pick a position, tune every
stat slider, choose a playing style and up to 6 skills, and watch a live player card
(with radar chart and overall rating) update as you go. Save builds locally, export
them as JSON, or re-import them later.

No backend, no build step — plain HTML/CSS/JS, everything persists to the browser's
`localStorage`. Not affiliated with KONAMI; this is just a fan-made companion tool.

## Run it locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Deploy

Serve `index.html` from any static host. For GitHub Pages: Settings → Pages →
Deploy from a branch → `main` / `/ (root)`.
