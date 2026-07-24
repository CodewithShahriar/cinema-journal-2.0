# Movie Tracker — Cinema Journal

A polished personal movie tracking application for managing watchlists, tracking watched films, rating and reviewing titles, and saving private notes. This README is crafted for developers, maintainers, and product owners who want a clear, professional overview.
![Movie Tracker demo](public/demo.png)

## Table of Contents
- [Features](#features)
- [Demo](#demo)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment (Vercel)](#deployment-vercel)
- [Health Check & Troubleshooting](#health-check--troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features
- Search movies via TMDB and import basic metadata (title, year, poster, overview, genres)
- Add movies to Watchlist and mark as Watched
- Rate movies, write reviews, and save private notes
- Favorites and cached snapshots to ensure offline-safe display
- Responsive, accessible UI with focus on privacy

## Demo
Open the demo image above or ask the project owner for a live demo URL or preview deployment.

## Architecture & Tech Stack
- Client: React + TypeScript, Vite
- Server functions: TanStack React Start (`createServerFn`) — server-side code runs on the host and uses environment variables for secrets
- Data fetching & caching: TanStack Query (React Query)
- Styling: Tailwind CSS
- External APIs: TMDB (The Movie Database)

Key implementation notes:
- Server functions that call TMDB live on the server and expect `process.env.TMDB_READ_TOKEN` to be available at runtime.
- Images are served from TMDB's image CDN (configured in `src/lib/tmdb.functions.ts`).

## Environment Variables
The only required runtime environment variable for TMDB integration is:

- `TMDB_READ_TOKEN` — TMDB Read Access Token (v4). The server uses this token as a Bearer token in the `Authorization` header.
- `VITE_SUPABASE_URL` — Supabase Project URL, used by the browser client.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable key (the legacy `anon` key also works).

Important: Do not commit tokens to the repository. Add them in your host's environment variable settings (Vercel, Netlify, Render, etc.).

### Supabase database setup

1. In Supabase Dashboard, open **Authentication → Providers → Anonymous** and enable it.
2. Open **SQL Editor**, paste and run [`supabase/migrations/20260724_create_movies.sql`](supabase/migrations/20260724_create_movies.sql).
3. Add the two `VITE_SUPABASE_*` variables above to your deployment environment, then redeploy.

The app creates a private anonymous account for a new visitor and syncs that visitor's movie collection to Supabase. Anonymous accounts are browser-specific; adding regular email or OAuth login later is necessary if users should restore the same collection on a new device.
## Local Development

This section is for developers. If you're a non-technical user, ask the maintainer to provide a preview link.

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
TMDB_READ_TOKEN=your_token_here npm run dev
```

On Windows PowerShell you can run:
```powershell
$env:TMDB_READ_TOKEN = 'your_token_here'
npm run dev
```

The app uses server functions for TMDB requests, so the token must be available to the Node process running the server functions.
## Deployment (Vercel)

To deploy on Vercel:

1. Create a Vercel project linked to this repository.
2. In Project Settings → Environment Variables, add `TMDB_READ_TOKEN` for both Preview and Production scopes.
3. Redeploy.

If the deployed app shows the message "Couldn't reach TMDB. Check your connection and try again.", inspect the server logs for one of the following:
- `TMDB not configured` — the `TMDB_READ_TOKEN` variable is missing at runtime.
- `TMDB request failed: 401` or `403` — invalid token or wrong token type.
- Network egress or DNS errors — the host cannot reach `api.themoviedb.org`.

## Health Check & Troubleshooting
Suggested additions to the codebase (can be implemented as PRs):

- A `/health` server function that performs a lightweight TMDB call and returns a small JSON status (ok / error + HTTP status). This is useful for monitoring.
- Improved non-secret logging in `src/lib/tmdb.functions.ts` to capture TMDB response status codes, without printing tokens.

Quick manual test for token validity (from any machine):
```bash
curl -i -H "Authorization: Bearer YOUR_TMDB_READ_TOKEN" "https://api.themoviedb.org/3/search/movie?query=inception"
```

Expect HTTP 200 and JSON results for a valid token.
## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repository
2. Create a feature branch
3. Open a pull request with a clear description and screenshots

If you're adding environment-sensitive features, include instructions for how to configure environment variables in the PR description.
## License

Specify the project's license here (e.g. MIT). If you'd like, I can add a `LICENSE` file.

---
