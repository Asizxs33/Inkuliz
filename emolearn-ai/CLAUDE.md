# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EmoLearn AI** — A biometric-enhanced learning platform for Kazakh Sign Language education. Monorepo with a React/Vite client and an Express/Node server.

Production URLs: `https://inkuliz.vercel.app` / `https://inkuliz.kz`

## Commands

### Client (`/client`)
```bash
cd client
npm install
npm run dev      # Vite dev server on port 5173
npm run build    # tsc -b && vite build
npm run preview  # Preview production build
```

### Server (`/server`)
```bash
cd server
npm install
npm run dev      # tsx watch src/index.ts (hot reload) on port 3001
npm run build    # tsc → dist/
npm start        # node dist/index.js
```

### Database (`/server`)
```bash
npx drizzle-kit generate   # Generate migration from schema changes
npx drizzle-kit push       # Push schema directly to DB (dev only)
npx drizzle-kit studio     # Visual DB browser
```

Run client and server simultaneously. The client dev server proxies `/api` and `/socket.io` to `localhost:3001`.

There are **no automated tests** in this project.

## Environment Variables

`.env` lives in the monorepo root (`emolearn-ai/.env`). The server loads it via `dotenv` from `../` relative to `server/`. Validated at startup in `server/src/env.ts` — missing required vars throw immediately.

```
DATABASE_URL=        # Neon PostgreSQL connection string
JWT_SECRET=          # JWT signing secret
OPENAI_API_KEY=      # OpenAI API key (AI tutoring)
TELEGRAM_BOT_TOKEN=  # Telegram bot token (notifications)
TELEGRAM_CHAT_ID=    # Telegram chat ID
CLIENT_URL=          # Production client URL (for CORS)
PORT=3001            # Optional, defaults to 3001
```

## Architecture

### Structure
```
emolearn-ai/
├── client/          # React 18 + TypeScript + Vite SPA
│   └── src/
│       ├── pages/       # Route-level components
│       ├── components/  # Shared UI + GlobalBiometrics overlay
│       ├── lib/         # ML utilities (emotionDetector, gestureRecognizer, rppg)
│       └── store/       # Zustand stores (userStore, biometricStore, lessonStore)
├── server/          # Express + Socket.IO + Drizzle ORM
│   └── src/
│       ├── routes/      # 8 Express routers under /api/*
│       ├── db/          # schema.ts + index.ts (Neon connection)
│       ├── services/    # OpenAI, Telegram, predictions
│       ├── socket/      # Socket.IO event handlers (handlers.ts)
│       └── env.ts       # Env var validation (throws on missing vars)
└── vercel.json      # Deployment config
```

### Routing & Auth

- `App.tsx` wraps all protected routes individually in `ProtectedLayout`
- `ProtectedLayout` checks `isLoggedIn` from `userStore`; mounts `GlobalBiometrics` only for the `student` role
- `RoleRedirect` at `/` sends students to `/dashboard`, teachers to `/teacher`
- Roles: `student` (default) and `teacher` — no route guards beyond the role redirect; teachers can technically access student routes
- Auth state stored in Zustand + `localStorage` via `persist` middleware (key: `emolearn-user-storage`)
- JWT tokens are 7-day, sent as `Authorization: Bearer <token>`

### Adding a New Server Route

1. Create `server/src/routes/<name>.ts` exporting a named `<name>Router`
2. Import and register it in `server/src/index.ts`: `app.use('/api/<name>', <name>Router)`
3. If the route needs CORS from a new origin, add it to the `allowedOrigins` array in `index.ts`

### Real-time (Socket.IO)

Used for:
- Live chat (`/live-chat`) with gesture support
- Streaming biometric data from client to server
- WebRTC peer-to-peer signaling

All Socket.IO events are set up in `server/src/socket/handlers.ts` via `setupSocket(io)`.

### ML Pipeline (client-side)

All ML runs in the browser for privacy:
1. **Emotion** — `lib/emotionDetector.ts` via face-api.js; models loaded from CDN
2. **Heart rate** — `lib/rppg.ts` rPPG algorithm from webcam video (no physical sensors)
3. **Gesture** — `lib/gestureRecognizer.ts` (MediaPipe Hands) with 15-frame smoothing buffer
4. `GlobalBiometrics.tsx` — persistent overlay aggregating all three; periodically POSTs to `/api/biometrics`

Sleep detection uses EAR (Eye Aspect Ratio) angle thresholds to detect drowsiness. Alerts are sent via Telegram when thresholds are exceeded.

### Database (Drizzle ORM + Neon PostgreSQL)

Schema in `server/src/db/schema.ts`. All IDs are UUIDs. Key tables and relations:
- `users` — email/password, role (`student`/`teacher`), university, course
- `classes` — owned by a teacher; students join via `invite_code`
- `classStudents` — M2M between `classes` and `users`
- `biometricSessions` → `emotionLogs` — per-session aggregates and per-timestamp emotion/BPM/cognitive rows
- `studentProgress` → `lessons` + `users` — tracks completion, score, time_spent
- `signWords` — Kazakh/Russian word pairs with `landmarks` JSONB for gesture matching, `image_url`, category, difficulty
- `alerts` — link teacher and student for drowsiness/stress notifications

Analytics endpoints may return mock data when no real biometric logs exist yet.

### Deployment (Vercel)

`vercel.json` defines:
- `server/src/index.ts` → `@vercel/node` serverless function
- `client/` → `@vercel/static-build` (outputs to `dist/`)
- `/api/*` and `/socket.io/*` → rewritten to the server function
- `/*` → `client/index.html` (SPA fallback)

## Key Patterns & Gotchas

- Client imports use `@/` alias → `src/` (configured in `vite.config.ts`)
- Server imports require explicit `.js` extension (ESM): `import ... from './routes/auth.js'`
- Audio files must be imported through Vite (not direct URLs) for correct MIME types and Safari compatibility; use `.m4a` format for Apple devices
- CORS `allowedOrigins` array lives in `server/src/index.ts` and must include both production domains and `localhost:5173`
- Content is bilingual: Kazakh (`kz`) and Russian (`ru`)
