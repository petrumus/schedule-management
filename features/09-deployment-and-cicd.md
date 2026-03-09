# Feature 09: Deployment & CI/CD

## Overview

The application is deployed as a static site on GitHub Pages via GitHub Actions. The build process injects Supabase credentials as environment variables. SPA routing requires a 404.html workaround.

## User Stories

### US-9.1: Automated Deployment
**As** a developer,
**I want** the app to deploy automatically on push to `main`,
**So that** changes are live without manual steps.

**Acceptance Criteria:**
- A GitHub Actions workflow triggers on push to `main`.
- The workflow builds the app with `vite build` and deploys to the `gh-pages` branch.
- Supabase credentials are injected from GitHub Actions secrets as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### US-9.2: SPA Routing on GitHub Pages
**As** a user,
**I want** to navigate directly to any route (e.g. `/calendar`, `/admin`),
**So that** deep links and page refreshes work correctly.

**Acceptance Criteria:**
- The build process copies `index.html` as `404.html` in the `dist/` output.
- GitHub Pages serves the 404.html for unknown paths, which loads the SPA and handles routing client-side.
- Vite config sets `base` to the repository name: `base: '/repo-name/'`.

### US-9.3: Environment Configuration
**As** a developer,
**I want** Supabase credentials to be configurable per environment,
**So that** I can develop locally and deploy to production with different settings.

**Acceptance Criteria:**
- Local development uses a `.env` file (not committed to git).
- Production uses GitHub Actions secrets injected at build time.
- The `.env.example` file documents required variables:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```

### US-9.4: OAuth Redirect Configuration
**As** an admin,
**I want** Google OAuth to redirect correctly to the deployed app,
**So that** authentication works in production.

**Acceptance Criteria:**
- The Supabase Google OAuth redirect URL is set to the GitHub Pages URL in the Supabase dashboard.
- Format: `https://username.github.io/repo-name`
- For local development, `http://localhost:5173` is also added as an allowed redirect.

## GitHub Actions Workflow

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - run: cp dist/index.html dist/404.html

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - uses: actions/deploy-pages@v4
```

## Vite Configuration

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/repo-name/',
})
```

## Files

| File | Description |
|---|---|
| `.github/workflows/deploy.yml` | GitHub Actions deployment workflow |
| `vite.config.js` | Vite config with base path |
| `.env.example` | Template for environment variables |
| `.gitignore` | Must include `.env` |

## Technical Notes

- GitHub Pages uses the new Pages deployment method (actions/deploy-pages) rather than the legacy gh-pages branch push.
- The `base` path in Vite must match the repository name exactly or links/assets will break.
- The 404.html trick works because GitHub Pages serves 404.html for any route it doesn't recognize, and the SPA router then handles the actual routing.
- Secrets in GitHub Actions are available only to the repository's workflows and are not exposed in logs.
