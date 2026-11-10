# Mosaic Fellowship — Man Matters Companion
# A full-stack 90-day routine OS for the Man Matters Builder Round

## Stack
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS 3
- **Backend**: Express + SQLite (Node built-in `node:sqlite`) + JWT + bcryptjs
- **Database**: SQLite (file-based, single-service deploy)
- **AI**: Provider chain: 3 × Gemini `gemini-2.5-flash` → NVIDIA Nemotron 550B → deterministic rules fallback
- **Build**: `tsc -b && vite build` → static `web/dist/` served by Express

## Local Development

### 1. Backend
```bash
cd server
npm install          # installs deps
npm run seed         # seeds demo data (demo@manmatters.in / demo1234)
npm run dev          # runs src/index.js with --watch
```
API runs at `http://localhost:4000`

### 2. Frontend
```bash
cd web
npm install          # installs Vite + Tailwind + dependencies
npm run dev          # runs vite at http://localhost:5173
```
The Vite dev proxy forwards `/api` → `http://localhost:4000`

### 3. Full stack (both at once)
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd web && npm run dev
```

### 4. One-off build
```bash
cd web && npm run build   # tsc -b && vite build → web/dist/
```
The server will serve `web/dist` in production (see `server/index.js` line 31–38).

### 5. Seed / reset
```bash
cd server && npm run seed   # re-seeds demo users, products, check-ins, photos
```

## Images

All imagery is local and filename-addressed:

- `web/public/products/<slug>.jpg` — 13 product cards. Use square 1:1 so every crop is consistent.
- `web/public/avatars/<name>.jpg` — optional customer portraits. The UI falls back to a monogram.
- `web/public/progress/crown-week-0X.jpg` — demo progress frames.
- `web/public/videos/` — hero films and their posters.

Ready-to-paste Gemini prompts, exact filenames and aspect ratios live in
[IMAGE_PROMPTS.md](IMAGE_PROMPTS.md). A missing file returns a 404 and degrades
to the branded fallback instead of a broken image.

## Demo Credentials
| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **Demo user** | `demo@manmatters.in` | `demo1234` | Week 5, real check-ins, active routine, 3 photos |
| **New signup** | Any valid email | Any 8+ char password | Onboarding → Dashboard → full routine |

## AI Provider Chain
The server at `server/src/services/ai.js` chains three Gemini keys, then falls back to NVIDIA Nemotron 550B, then to a deterministic rule-engine coach. Each Gemini key is tried with retry/backoff; a 503 "high demand" triggers the next key. `thinkingBudget: 0` is set for Gemini calls. NVIDIA works with `enable_thinking: false`.

```
Chain: gemini:gemini-2.5-flash → gemini:gemini-2.5-flash → gemini:gemini-2.5-flash → nvidia:nvidia/nemotron-3-ultra-550b-a55b → rules
```

## API Endpoints (selected)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/public/site` | No | Brand + stats + research patterns |
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login returning user |
| GET | `/api/app/overview` | Yes | Overview + today's schedule + stats |
| GET | `/api/app/routine` | Yes | 13-week routine + items + weeks |
| GET | `/api/app/progress` | Yes | Series, heatmap, score, photos, refills |
| GET | `/api/app/assistant` | Yes | SSE chat + status + weekly review |
| POST | `/api/app/photos` | Yes | Upload a standardised progress photo |
| GET | `/api/public/products` | No | Filtered product catalogue |
| GET | `/api/ai/status` | No | Returns 3 Gemini + 1 NVIDIA + rules fallback |

## Deployment (Render single-service)
1. Push this repo to GitHub.
2. Create a new **Web Service** on Render.
3. Set:
   - **Build Command**: `cd server && npm install && cd .. && cd web && npm install && npm run build`
   - **Start Command**: `cd server && node src/index.js`
   - **Environment**: Add `GEMINI_KEY_1`, `GEMINI_KEY_2`, `GEMINI_KEY_3`, `NVIDIA_NEMOTOR_KEY` as secret env vars (see `.env.example` below).
   - **Plan**: Free or Starter (SQLite fits the free tier).
4. On first run, `ensureSeeded()` will create the demo user. Set `DEMO_CREDENTIALS=1` env var or visit `/signup` to create a fresh account.

### `.env` (local, not committed)
```
GEMINI_KEY_1=your_gemini_key_1
GEMINI_KEY_2=your_gemini_key_2
GEMINI_KEY_3=your_gemini_key_3
NVIDIA_NEMOTOR_KEY=your_nvidia_nemotron_key
PORT=4000
```

## Project Structure
```
mosaic_product/
├─ server/              # Express + SQLite backend
│  ├─ src/              # routes, services, data, seed
│  ├─ package.json
│  └─ .env (local only)
├─ web/                 # React + Vite frontend
│  ├─ src/              # pages, components, lib
│  ├─ tailwind.config.js
│  ├─ tsconfig.json
│  └─ vite.config.ts
├─ scripts/             # build-doc.mjs (generates Part1 docx)
├─ Dockerfile (to add)
├─ render.yaml (to add)
└─ README.md (this file)