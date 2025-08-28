# Freelancer Toolkit

Ship more. Earn more. Stress less.

I built this to remove the three biggest time-drains for freelancers: writing tailored proposals, responding to clients with the right tone fast, and generating safe contracts you can actually use. It’s full-stack, production-minded, and AI-native. Everything runs with real integrations, strict validation, and deployment-ready configs.

> Goal: A tool freelancers would pay for. Designed to show I move fast, think like an owner, and ship complete products under tight deadlines.

---

## Why this matters

- Win more jobs by applying faster with better proposals.
- Respond to clients in seconds with the right tone (and audio when needed).
- Send strong, friendly contracts with built-in risk analysis.

This isn’t a demo that “could” work. It runs, scales, and handles the real-world edge cases I’ve hit freelancing.

---

## What’s shipped (MVP, production-ready)

- Smart Proposal Generator
  - Input: job URL (scraped with Playwright) or job text
  - Skill presets: Frontend (React/Angular/Next.js), Backend (FastAPI/Django/Node+Express), DevOps, AI (NLP/RAG/CV)
  - Manual skills toggle to merge with presets (de-duplicated)
  - Output: proposal, pricing strategy, timeline, success tips
  - Structured extraction: title, budget, timeline, platform, skills, location

- Client Mood-Aware Voice Responder
  - Input: client message
  - Mood detection: urgent/frustrated/excited/professional
  - Languages: auto/en/de/ar
  - Output: response text + ElevenLabs audio URL + negotiation advice
  - Dev playback fixes: audio content-type validation, AudioContext resume, format hints

- AI Contract Generator
  - Input: project details or proposal
  - Output: clean Markdown contract + risk analysis (score, level, flags, recommendations)
  - Frontend: preview/raw toggles, copy Markdown, download .md
  - Client-side risk UX: colored badges and icons (Shield/Alert)

Production thinking:

- Versioned API: /api/v1 only
- CORS, absolute URLs, and env-driven settings done right
- Docker single-container image that serves both frontend (Nginx) and backend (Uvicorn), reverse-proxying /api and /audio
- Health checks, CI (lint, type-check, tests), E2E smoke for Playwright, and OpenAPI docs with inline examples
- Debug logs gated by DEBUG env (no noisy prod logs)

---

## Tech stack

- Frontend: React + Vite + TypeScript, Tailwind CSS, Radix UI, Zustand, Vitest
- Backend: FastAPI (Python),
  httpx/requests, Pydantic v2, Playwright
- AI: Gemini (text), ElevenLabs (TTS)
- Ops: Docker, Nginx, Supervisor, GitHub Actions CI, Azure/Container ready

---

## Architecture (monorepo)

- frontend: Vite SPA. Proxies /api and /audio to backend in dev.
- backend: FastAPI with versioned routers and OpenAPI swagger. Static /audio mount.
- deploy/Dockerfile (root): Nginx serves frontend; proxies /api and /audio to Uvicorn.

---

## API (v1) overview

- Swagger UI: /api/v1/docs
- ReDoc: /api/v1/redoc
- OpenAPI: /api/v1/openapi.json
- See docs/API.md for full details and examples.

Endpoints:

- POST /api/v1/proposal/generate
- POST /api/v1/voice/generate
- POST /api/v1/voice/generate-response
- POST /api/v1/contract/generate
- GET /health

---

## Quickstart (local)

1. Clone and prepare

```bash
git clone <repo-url>
cd freelancer-toolkit/freelancer-toolkit
cp .env.example .env
# Fill GEMINI_API_KEY, ELEVENLABS_API_KEY, PUBLIC_BASE_URL, etc.
```

2. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
# First time Playwright setup if needed (already in Docker image)
# python -m playwright install chromium
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. Frontend (Vite)

```bash
cd ../frontend
npm install
npm run dev
# Dev proxy handles /api and /audio to http://localhost:8000
```

4. Visit the app

- http://localhost:5173
- http://localhost:8000/api/v1/docs (Swagger)

Notes:

- DEBUG=true in .env shows detailed logs for dev only.
- PUBLIC_BASE_URL=http://localhost:8000 to make returned audio URLs absolute.

---

## One-image Docker (Nginx + Uvicorn)

Build:

```bash
# from freelancer-toolkit/freelancer-toolkit (root)
docker build -t freelancer-toolkit:latest .
```

Run:

```bash
docker run -p 8080:80 \
  -e GEMINI_API_KEY=... \
  -e ELEVENLABS_API_KEY=... \
  -e PUBLIC_BASE_URL=http://localhost:8080 \
  -e CORS_ORIGINS='["http://localhost:8080","http://localhost:5173"]' \
  freelancer-toolkit:latest

# UI: http://localhost:8080
# API: http://localhost:8080/api/v1
# Docs: http://localhost:8080/api/v1/docs
```

Azure (Container Apps / Web App for Containers):

- Push the image to ACR.
- Create a container app/web app using the image.
- Set env vars (see below).
- Expose port 80, probe /api/v1/health or /health.

---

## Environment variables

See .env.example for all variables. Key ones:

Frontend (Vite, build-time):

- VITE_API_BASE_URL=/api (dev) or https://api.yourdomain.com/api
- VITE_APP_NAME=Freelancer Toolkit

Backend (runtime):

- GEMINI_API_KEY (required)
- ELEVENLABS_API_KEY (required)
- ELEVENLABS_VOICE_ID (optional; defaults to multilingual voice)
- ELEVENLABS_MODEL_ID=eleven_multilingual_v2
- PUBLIC_BASE_URL (required for absolute audio URLs)
- FRONTEND_URL (for CORS; set your deployed frontend)
- CORS_ORIGINS=["https://yourdomain.com"]
- ENVIRONMENT=development|staging|production
- DEBUG=true|false
- AUDIO_STORAGE_PATH=/app/audio_files
- DATABASE_URL (optional)

---

## UX that respects the clock (speed > perfect)

- Proposal presets + manual skills = 10-second setup for relevant proposals.
- Mood-aware replies so you can answer fast without sounding robotic.
- Risk-aware contracts that can be shipped to clients now, not “after I do X.”

---

## Error handling and stability

- External API failures surface as clean 502s; UI shows actionable toasts.
- Scraper fallback: If scraping fails, user can paste text and still generate.
- Audio validation: Preflight HEAD/GET to ensure content-type is audio/\* before play.
- Logs behind DEBUG in dev only; keep prod clean.
- Health endpoint: /health for container probes.

---

## CI / Code Quality

- Frontend CI: install, lint, test (Vitest), build
- Backend CI: flake8, black, isort, mypy, pytest
- E2E Smoke: Playwright launches Chromium and validates selectors
- OpenAPI: versioned schema and inline request/response examples

---

## Roadmap (short)

- Proposal “win rate” learning loop (track conversions, refine prompts).
- Contract clause library + template versioning.
- Multi-voice TTS profiles per mood (ElevenLabs voice mapping).
- Payment clause presets by region; optional lawyer referral button.

---

## Pricing thoughts

- Solo plan: $12–$19/mo (usage limits + standard voices)
- Pro plan: $29–$49/mo (higher limits, multiple voice profiles, clause library)
- Team plan: $99+/mo (workspaces, shared templates, usage analytics)

---
