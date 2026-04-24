# AgroCusto — Frontend

Next.js 15 (App Router) + React 19 + Tailwind v4. Deploy target: Vercel.

## Run locally

1. `cp .env.local.example .env.local` and fill in `GEMINI_API_KEY`.
2. `npm install`
3. `npm run dev` → http://localhost:3000

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm start` — serve the production build
- `npm run lint` — typecheck only (`tsc --noEmit`)

## Deploy to Vercel

Import the repo in Vercel. Set `GEMINI_API_KEY` as an environment variable. The server-side route `/api/ai/parse` is the only caller of Gemini — the key is never shipped to the browser.
