# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EmoLearn AI** — A biometric-enhanced learning platform for Kazakh Sign Language education. All code lives under `emolearn-ai/`, a monorepo with a React/Vite client and an Express/Node server.

Production URLs: `https://inkuliz.vercel.app` / `https://inkuliz.kz`

## Commands

All commands must be run from the correct subdirectory.

### Client (`emolearn-ai/client`)
```bash
cd emolearn-ai/client
npm run dev      # Vite dev server on port 5173
npm run build    # tsc -b && vite build
npm run preview  # Preview production build
```

### Server (`emolearn-ai/server`)
```bash
cd emolearn-ai/server
npm run dev      # tsx watch src/index.ts (hot reload) on port 3001
npm run build    # tsc → dist/
npm start        # node dist/index.js
```

Run client and server simultaneously. The client dev server proxies `/api` and `/socket.io` to `localhost:3001`.

### Database (`emolearn-ai/server`)
```bash
cd emolearn-ai/server
npx drizzle-kit generate   # Generate migration from schema changes
npx drizzle-kit push       # Push schema directly to DB (dev only)
npx drizzle-kit studio     # Visual DB browser
```

There are **no automated tests** in this project.

## Environment Variables

`.env` lives at `emolearn-ai/.env`. The server loads it via `dotenv` from `../` relative to `server/`. Validated at startup in `server/src/env.ts` — missing required vars throw immediately.

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
│       ├── pages/       # Route-level components (14 pages)
│       ├── components/  # Shared UI + GlobalBiometrics overlay
│       ├── lib/         # ML utilities (emotionDetector, gestureRecognizer, rppg)
│       └── store/       # Zustand stores (userStore, biometricStore, lessonStore, themeStore)
├── server/          # Express + Socket.IO + Drizzle ORM
│   └── src/
│       ├── routes/      # 12 Express routers under /api/*
│       ├── db/          # schema.ts + index.ts (Neon connection)
│       ├── services/    # OpenAI, Telegram, predictions
│       ├── socket/      # Socket.IO event handlers (handlers.ts)
│       └── env.ts       # Env var validation (throws on missing vars)
└── vercel.json      # Deployment config
```

### Routing & Auth

- `App.tsx` wraps protected routes in `ProtectedLayout`
- `ProtectedLayout` checks `isLoggedIn` from `userStore`; mounts `GlobalBiometrics` only for the `student` role
- `RoleRedirect` at `/` sends students to `/dashboard`, teachers to `/teacher`
- Roles: `student` (default) and `teacher` — no strict route guards beyond the role redirect
- Auth state persisted in Zustand + `localStorage` (key: `emolearn-user-storage`)
- JWT tokens are 7-day, sent as `Authorization: Bearer <token>`

### Adding a New Server Route

1. Create `server/src/routes/<name>.ts` exporting a named `<name>Router`
2. Import and register in `server/src/index.ts`: `app.use('/api/<name>', <name>Router)`
3. If the route needs CORS from a new origin, add to `allowedOrigins` in `index.ts`

### Real-time (Socket.IO)

All Socket.IO events are set up in `server/src/socket/handlers.ts` via `setupSocket(io)`.

Key event groups:
- `biometric:update` — stream emotion/BPM/cognitive data from student to teacher
- `class_chat:*` — class-scoped chat
- `live_chat_message` — live room with sign ↔ text
- `webrtc:*` — mesh multi-peer signaling (offer, answer, ice-candidate); each signal includes `targetId` to route to a specific socket
- `notification:send/receive` — in-app notifications
- `test:submitted` — emitted to `user:{teacher_id}` room when a student submits a test

WebRTC uses a full-mesh topology: when a user joins `live_room`, the server sends `webrtc:existing-users` with all current peer socket IDs, and the joiner creates offers to each. Signals are routed directly to `targetId` rather than broadcast.

### ML Pipeline (client-side, privacy-first)

All ML runs in the browser:
1. **Emotion** — `lib/emotionDetector.ts` via face-api.js (models loaded from CDN); EAR (Eye Aspect Ratio) for drowsiness detection
2. **Heart rate** — `lib/rppg.ts` rPPG algorithm from webcam video (no physical sensors)
3. **Gesture** — `lib/gestureRecognizer.ts` (MediaPipe Hands, 21 landmarks) with 15-frame smoothing; falls back to ML classifier in `lib/mlClassifier.ts`

`GlobalBiometrics.tsx` is a persistent overlay that aggregates all three data streams, periodically POSTs to `/api/biometrics`, streams via Socket.IO to teacher dashboards, and triggers Telegram alerts when drowsiness/stress thresholds are exceeded.

### Database (Drizzle ORM + Neon PostgreSQL)

Schema in `server/src/db/schema.ts`. All IDs are UUIDs. Key tables:
- `users` — email/password (bcrypted), role (`student`/`teacher`), university, course
- `classes` — owned by a teacher; students join via `invite_code`
- `classStudents` — M2M between `classes` and `users`
- `biometricSessions` → `emotionLogs` — per-session aggregates and per-timestamp emotion/BPM/cognitive rows
- `studentProgress` → `lessons` + `users` — tracks completion, score, time_spent
- `signWords` — Kazakh/Russian word pairs with `landmarks` JSONB for gesture matching
- `alerts` — link teacher and student for drowsiness/stress notifications
- `tests` / `testResults` — teacher-created tests with JSONB questions; student answers auto-scored; `teacher_comment` column for per-result feedback
- `assignments` — links a test to a class with a deadline; students see assigned tests with overdue detection
- `bookmarks` — user + signWord M2M with unique constraint; synced cross-device via `/api/bookmarks`
- `gestureModels` — per-user custom gesture training data (JSONB landmarks) synced via `/api/gestures`

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
- Audio files must be imported through Vite (not direct URL strings) for correct MIME types and Safari compatibility; use `.m4a` format for Apple devices
- CORS `allowedOrigins` in `server/src/index.ts` must include both production domains and `localhost:5173`
- Content is bilingual: Kazakh (`kz`) and Russian (`ru`)
- Dark mode uses `darkMode: 'class'` in Tailwind; CSS variables defined in `globals.css` under `:root` (light) and `.dark` (dark); `themeStore.ts` toggles the class on `document.documentElement` and persists to `localStorage` under key `feelflow-theme`
- `drizzle-kit` may fail with `bad interpreter` error on some systems — use `node node_modules/drizzle-kit/bin.cjs push` as a fallback
- Sleep/drowsiness alarm uses `play()`/`pause()` (not volume toggling) for iOS Safari compatibility; threshold is 20 consecutive seconds of drowsy state
- `GlobalBiometrics.tsx` uses `useRef` to track `isSleeping` state inside animation loops to avoid stale closure issues
