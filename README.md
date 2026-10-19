# aaravmohanty.com

My personal site. Plain HTML, CSS, and JavaScript. No framework, no build step,
no dependencies to install.

## Layout

Everything that ships lives in `dist/`.

```
dist/
  index.html            home: the quote intro, the globe, then the page itself
  projects/index.html   ten projects, filterable
  experience/index.html internships, research, school, clubs
  outside/index.html    music, books, games, Saturdays
  404.html

  base.css              design tokens, type, header/footer, command palette
  main.css              home, projects, experience
  journal.css           the outside page

  site.js               shared: cursor light, clock, reveals, command palette
  main.js               the home intro + globe, and the project filters
  journal.js            the outside page toys

  og.jpg                social card
  world.geo.json        country outlines for the globe
  covers/ photos/ places/   images
```

## Editing

- **Copy and layout** live directly in the four `index.html` files.
- **Project list** is in `dist/projects/index.html`. Each `<article class="case-study">`
  carries `data-tags` (`ai`, `backend`, `fullstack`), which is what the filter
  buttons at the top of the page read. If you add one, bump the counts in
  `.project-filters` and add it to `COMMANDS` in `dist/site.js` so it shows up
  in the ⌘K menu.
- **Places on the globe** are the `locations` array near the top of `dist/main.js`.
  A location with an `image` gets a ring around it and opens a photo card.
- **Colors, type, spacing** are CSS custom properties at the top of `dist/base.css`.
- After editing any asset, bump the `?v=` on the `<link>` and `<script>` tags so
  browsers pick it up.

## Swapping in your own photos

The globe's photo cards live in the `locations` array in `dist/main.js`.
Seven already use my own shots; the rest are still Wikimedia placeholders.

To replace one:

1. Put the full-size photo in `incoming/`, named after the one it replaces
   (`india.jpg`, `hawaii.jpg`, and so on, matching the filenames in
   `dist/places/`).
2. `npm run photos` — resizes to 1400px on the long edge, re-encodes as
   JPEG, and writes it into `dist/places/`.
3. In `dist/main.js`, delete the `credit:` and `source:` fields from that
   location. Without them the card stops showing a Wikimedia line, which
   is what you want for a photo you took. Update `alt:` while you're there.

`incoming/` is gitignored, so the originals never get committed.

## Running it

```bash
npm run dev      # serves dist/ at http://localhost:4321
npm run check    # verifies every internal link and #anchor resolves
```

`npm run check` is worth running before you push. It catches a renamed section
id or a moved image faster than clicking around does.

## Deploying

`dist/` is a static folder, so any host works. Pick one:

| Host | What to set |
| --- | --- |
| **Vercel** | Import the repo. Framework preset **Other**. `vercel.json` handles the rest. |
| **Netlify** | Import the repo. `netlify.toml` sets the publish directory. |
| **Cloudflare Pages** | Build command empty, output directory `dist`. Reads `_headers` and `_redirects`. |
| **GitHub Pages** | Enable Pages with source **GitHub Actions**. `.github/workflows/deploy-pages.yml` publishes on every push to `main`. |

Before going live on a new domain, search and replace `https://aaravmohanty.com`
in the four `index.html` files, `robots.txt`, and `sitemap.xml`. Those strings
are only used for canonical URLs, social cards, and the sitemap.

## Notes

- The intro runs once per browser session, tracked under `aarav-intro-v7` in
  `sessionStorage`. Clear it (or open a new tab) to see it again. `Esc`, a click,
  or the Skip button all end it early, and `prefers-reduced-motion` skips it
  entirely.
- `⌘K` / `Ctrl+K` (or just `/`) opens the quick jump menu on every page.
- Photos of places are from Wikimedia Commons and credited in the card that
  opens when you click a circled dot on the globe.
