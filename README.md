# Aarav Mohanty

Personal portfolio for my projects, experience, interests, and travels.

## Edit the site

The website is plain HTML, CSS, and JavaScript inside `dist/`.

- Home: `dist/index.html`
- Projects: `dist/projects/index.html`
- Experience: `dist/experience/index.html`
- Outside work: `dist/outside/index.html`
- Shared home, projects, and experience styles: `dist/main.css`
- Outside work styles and interactions: `dist/journal.css` and `dist/journal.js`

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. Import this repository at [vercel.com/new](https://vercel.com/new).
2. Keep the framework preset as **Other**.
3. Vercel will read `vercel.json` and publish the `dist/` folder.
4. Add a custom domain in **Project Settings → Domains**.

Every push to the main branch will create a new production deployment.
