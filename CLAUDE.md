# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Global Intelligence Dashboard: a React 19 + Vite SPA that plots world news on an interactive 3D globe (globe.gl / three.js), backed by a single Vercel serverless function that proxies the NewsData.io API. Deployed on Vercel from `main` (pushing to `main` triggers a production deploy).

## Commands

- `npm run dev` — Vite dev server on port 5174 (strict). It proxies `/api` to `http://localhost:4000`, but no local API server exists in this repo, so the news API only works locally under `vercel dev` (or against a deployed URL via `VITE_API_BASE_URL`).
- `npm run build` — `tsc && vite build`. `tsc` only type-checks the leftover Vite template files `src/main.ts` / `src/counter.ts` (the app itself is `.jsx`, entry `src/main.jsx` via `index.html`). `npx vite build` alone is a faster compile check.
- No test runner or linter is configured.

## Environment

- Server reads the NewsData key from `NEWSDATA_API_KEY`, falling back to `VITE_NEWSDATA_KEY` (the name currently set in Vercel). Only `api/` reads it; no frontend code references it, so it is not bundled into the client.
- Changing a Vercel env var requires a redeploy to take effect.
- `.env` / `.env.*` are gitignored. The GitHub repo is public — keys go in Vercel settings, never in source.
- NewsData free tier is ~200 credits/day; quota exhaustion surfaces in the UI as "NewsData API quota exceeded" and an empty globe.

## Architecture

### Data flow (read these together)

`src/hooks/useNewsData.js` → `api/news.js` → `api/services/newsdataService.js`, results merged into `src/store/useGlobeStore.js`.

- **Single shared article pool.** `useGlobeStore.articles` is append-only via `mergeArticles` (deduped by `link|country_code`). Fetches never replace it. Both the globe markers and the news panel derive from this pool, so marker counts, panel lists and tab counts always agree. Use `articlesForCountry(articles, code)` from the store for per-country views.
- **Load sequence** (`useNewsData`): global feed once on mount → background preload of up to 12 countries (those in the global feed, topped up from a `PRIORITY` list, 3 concurrent) → any other country on first selection. `loadedCountries` + an `inFlight` map ensure each country is fetched at most once per session, so clicking a country never changes its already-displayed numbers.
- **Panel category tabs filter client-side**; they do not trigger fetches.

### Server (`api/`)

- `api/news.js` — Vercel function. Query params: `countryCode` (ISO-2 or `all`), `category`, `page`, `source`, `mode`. Caches in-memory (node-cache, 30 min) and sets `Cache-Control: s-maxage=1800` for Vercel's edge cache.
- `newsdataService.fetchNews` has three paths with very different credit costs:
  - `mode=lite` + country → 1 request (used for all country fetches from the client).
  - `category=all` → 8 parallel per-category requests (used for the global feed).
  - specific category → 1 request, then filtered to that category.
- `normalizeArticles` assigns each article a `country_code` by **text matching** title/description against `ISO_TO_NAME` + `COUNTRY_ALIASES` (global mode: first match wins; country mode: must mention the target, or in lite mode be from the target country's outlets). Articles with no match are dropped. Only countries in `ISO_TO_NAME` can be resolved — `SUPPORTED` in `useNewsData.js` mirrors it and must be kept in sync.
- Categories: NewsData categories are mapped via `CATEGORY_MAP`, then overridden by keyword regexes (conflict > environment > technology > economy). Dashboard categories are defined in `src/lib/constants.js` (`CATEGORIES`, `CATEGORY_COLORS`) and mirrored as Tailwind colors in `tailwind.config.js`.

### Globe (`src/components/Globe/`)

- `GlobeComponent.jsx` — creates the globe.gl instance once (custom `MeshPhongMaterial` sphere, dotted landmass via `hexPolygonsData` from `public/countries.geojson`, starfield + halo sprite added to `globe.scene()`). Natural Earth leaves some `ISO_A2` as `-99` (France, Norway) — handled by `ISO_FALLBACK`. Clicking land dots opens the panel directly; clicking ocean falls back to Nominatim reverse geocoding.
- `MarkerLayer.jsx` — a plain function (not a React component) called on `articles`/`activeLayers` change. Aggregates one marker per country and renders them with `htmlElementsData` (DOM elements, styled by `.gi-marker*` classes in `src/index.css`). Elements are cached in a module-level `Map` and reused; this is safe because passing a new `htmlElement` accessor makes three-globe clear old objects before creating new ones. Country positions come from the hardcoded `COUNTRY_COORDS` (capital cities). Markers on the far side are hidden via `htmlElementVisibilityModifier`.
- `MarkerTooltip.jsx` uses `position: fixed` with viewport coordinates (the globe container is offset by the sidebar).
- `three` must stay deduped with globe.gl's copy (`npm ls three`); a second copy breaks `globeMaterial`.

### Misc

- State is a single Zustand store; components read it via `useGlobeStore()` and non-React code via `useGlobeStore.getState()`.
- `useWebcamTrigger` calls `/api/webcams`, which does not exist in `api/` (the request fails and webcams stay hidden).
- `@deck.gl/*`, `supercluster` and `src/lib/supabaseClient.js` are present but unused; `PanelFilters` (date/source) update store state that nothing consumes yet.
