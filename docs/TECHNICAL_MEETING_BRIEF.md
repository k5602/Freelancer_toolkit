# Freelancer Toolkit — Technical Meeting Brief

Ship more. Earn more. Stress less.

This document is the concise, production-minded brief for your upcoming technical discussion. It captures high-level architecture, feature flows, key files, operational details, CI/CD, environment configuration, win points, gaps/risks, and a quick demo script.

---

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. High-Level Architecture](#2-high-level-architecture)
  - [2.1 Repository Structure](#21-repository-structure)
  - [2.2 Component Responsibilities](#22-component-responsibilities)
- [3. Feature Deep Dives](#3-feature-deep-dives)
  - [3.1 Smart Proposal Generator](#31-smart-proposal-generator)
  - [3.2 Mood-Aware Voice Responder](#32-mood-aware-voice-responder)
  - [3.3 AI Contract Generator + Risk Analysis](#33-ai-contract-generator--risk-analysis)
- [4. API (v1) Overview](#4-api-v1-overview)
- [5. Backend Implementation Details](#5-backend-implementation-details)
  - [5.1 Routers](#51-routers)
  - [5.2 Models](#52-models)
  - [5.3 Services](#53-services)
  - [5.4 App Bootstrap, CORS, Static Files](#54-app-bootstrap-cors-static-files)
  - [5.5 Error Handling Strategy](#55-error-handling-strategy)
- [6. Frontend Implementation Details](#6-frontend-implementation-details)
  - [6.1 Pages and UX](#61-pages-and-ux)
  - [6.2 Shared Libraries](#62-shared-libraries)
  - [6.3 Developer Experience](#63-developer-experience)
- [7. Build, Deploy, and Operations](#7-build-deploy-and-operations)
  - [7.1 Local Development](#71-local-development)
  - [7.2 Single-Image Docker](#72-single-image-docker)
  - [7.3 Health Checks](#73-health-checks)
- [8. CI/CD and Quality Gates](#8-cicd-and-quality-gates)
- [9. Environment Variables](#9-environment-variables)
- [10. Security, Stability, Observability](#10-security-stability-observability)
- [11. Known Gaps / Quick Fixes](#11-known-gaps--quick-fixes)
- [12. Win Points (What to Highlight)](#12-win-points-what-to-highlight)
- [13. Demo Script (5–7 minutes)](#13-demo-script-57-minutes)
- [14. Interview Q&A Prompts](#14-interview-qa-prompts)
- [15. Short Roadmap](#15-short-roadmap)
- [16. Dependency Reference (Backend & Frontend)](#16-dependency-reference-backend--frontend)

---

## 1. Executive Summary

A full-stack, AI-native toolkit that automates three time-critical freelancer tasks:

- Proposal generation from job URLs or text, with structured extraction and skill presets.
- Mood-aware, multilingual client response generation with voice synthesis.
- Contract generation in Markdown plus risk analysis.

The project is production-minded: versioned API, CORS, Docker single-image deployment (Nginx + Uvicorn), health checks, CI for frontend/backend, and an E2E Playwright smoke. Real integrations: Playwright scrape, Gemini LLM for text and JSON outputs, ElevenLabs TTS with audio validation.

---

## 2. High-Level Architecture

A monorepo with:

- React + Vite SPA frontend (TypeScript, Tailwind, Radix UI, Zustand).
- FastAPI backend (Pydantic v2), with versioned routers (/api/v1).
- Integrations: Playwright scraping, Gemini LLM, ElevenLabs TTS.
- Single Docker image serving SPA via Nginx and proxying to Uvicorn.

Data Flow (typical):
Client -> SPA -> /api/v1/\* -> FastAPI router -> service (LLM/TTS/Scraper) -> response (+ optional static audio)

### 2.1 Repository Structure

- backend/
  - app/main.py (FastAPI app, routers, CORS, static /audio)
  - app/routers/{proposal,voice,voice_mood,contract}.py
  - app/models/{proposal,voice,contract}.py
  - app/services/{scraper.py, perplexity.py (Gemini), elevenlabs.py, nlp.py}
  - requirements.txt, Dockerfile
- frontend/
  - components/{Dashboard,Layout,ProposalGenerator,VoiceResponder,ContractGenerator}.tsx
  - lib/{api,http,clipboard,themeStore}.ts
  - src/App.tsx, vite.config.ts, setupTests.ts
- docs/
  - API.md (v1 endpoints), README.md, DEMO.md
- Dockerfile (root): builds SPA, packages backend, configures Nginx + Supervisor
- .github/workflows: backend-ci, frontend-ci, e2e-playwright, ACR/Azure samples
- scripts/: setup.sh, dev.sh, deploy.sh

### 2.2 Component Responsibilities

- Frontend: Responsible for UX, form validation, state persistence, graceful feedback, audio preflight checks.
- Backend: Input validation, scraping, LLM prompting/response shaping, TTS generation, structured errors, static audio serving.
- Nginx: Serve SPA; reverse proxy /api and /audio to backend.
- CI: Linting, type checks, tests, E2E smoke; container build/publish.

---

## 3. Feature Deep Dives

### 3.1 Smart Proposal Generator

- Inputs: job_url OR job_description (min 10 chars), user_skills (preset + optional manual), target_rate optional.
- Process:
  - If URL provided: Playwright scrapes (Upwork/Freelancer/Mostaql selectors; generic fallback). Extracts title, description, budget, timeline, skills, location.
  - Prompt construction merges scraped context + user skills + target rate.
  - Gemini JSON-mode returns: proposal_text, pricing_strategy, estimated_timeline, success_tips (exactly 3).
  - Robust JSON parse with heuristic fallback if needed.
- Output: Human-ready proposal + structured extraction fields to aid later steps.

Key files:

- Backend: routers/proposal.py, services/{scraper.py, perplexity.py}
- Frontend: components/ProposalGenerator.tsx, lib/api.ts

### 3.2 Mood-Aware Voice Responder

- Inputs: message_text, language: auto/en/de/ar, optional tone_override, max_words.
- Process:
  - Mood detection: regex + naive sentiment heuristic.
  - Prompt instructs language and tone, asks for concise professional reply (no code fences).
  - ElevenLabs TTS converts text; file written under AUDIO_STORAGE_PATH with unique name.
  - Audio URL returned. Frontend preflights GET to ensure audio/\* content-type before playback; Howler resume for autoplay issues.
- Output: mood, language, response_text, audio_url, negotiation_advice (per mood).

Key files:

- Backend: routers/voice_mood.py, services/{nlp.py, perplexity.py, elevenlabs.py}
- Frontend: components/VoiceResponder.tsx

### 3.3 AI Contract Generator + Risk Analysis

- Inputs: project_description or proposal (one required), optional client_details.
- Process:
  - Generate Markdown contract (clean output, no code fences).
  - Second pass: strict-JSON risk analysis (score 0–100, level low/medium/high, flags, recommendations). Fallback to derive level from score if missing.
- Output: contract_text (.md), risk_score, risk_level, risk_flags, recommendations.
- UI: preview (basic Markdown→HTML renderer) or raw; copy and download .md; risk badge with color and icon.

Key files:

- Backend: routers/contract.py, services/perplexity.py
- Frontend: components/ContractGenerator.tsx

---

## 4. API (v1) Overview

Versioned docs:

- Swagger: GET /api/v1/docs
- ReDoc: GET /api/v1/redoc
- OpenAPI JSON: GET /api/v1/openapi.json

Endpoints:

- POST /api/v1/proposal/generate
- POST /api/v1/voice/generate (simple TTS)
- POST /api/v1/voice/generate-response (mood-aware)
- POST /api/v1/contract/generate
- GET /health (liveness)

Refer to docs/API.md for full request/response examples.

---

## 5. Backend Implementation Details

### 5.1 Routers

- proposal.py: Scrape (optional), prompt Gemini JSON, parse or fallback; return structured response.
- voice.py: Simple TTS for text_to_speak.
- voice_mood.py: Mood detection, LLM response, TTS, negotiation tips.
- contract.py: Markdown contract generation + strict JSON risk analysis.

### 5.2 Models

- proposal.py: ProposalRequest (URL or description required), ProposalResponse (text + structured extraction).
- voice.py: VoiceRequest (min length), VoiceResponse (audio_url).
- contract.py: ContractRequest (one-of constraint), ContractResponse (contract + risk details).

### 5.3 Services

- scraper.py: Playwright async; domain-specific selectors (Upwork/Freelancer/Mostaql) + generic fallback; meta enrichment.
- perplexity.py (Gemini): Async httpx wrapper; JSON mode for proposals; Markdown/plain for others; DEBUG logging hooks.
- elevenlabs.py: REST integration (requests); content-type checking; unique filenames; PUBLIC_BASE_URL-aware.
- nlp.py: Lightweight, dependency-free sentiment heuristic.

### 5.4 App Bootstrap, CORS, Static Files

- main.py:
  - FastAPI app with versioned docs.
  - CORS from CORS_ORIGINS + FRONTEND_URL; safe localhost defaults.
  - Static mount /audio for generated files (AUDIO_STORAGE_PATH).
  - app.state.PUBLIC_BASE_URL for absolute audio URLs.
  - OpenAPI servers include PUBLIC_BASE_URL and local.

### 5.5 Error Handling Strategy

- Validation errors → 422 by FastAPI/Pydantic.
- External failures (LLM/TTS) → 502 with clear messages.
- Input issues (missing description/URL) → 400.
- Catch-all → 500 with message string.
- Frontend interceptor normalizes errors to {status, message}.

---

## 6. Frontend Implementation Details

### 6.1 Pages and UX

- Layout.tsx: Sidebar + mobile nav + theme toggle (Zustand), sets document.title from VITE_APP_NAME.
- Dashboard.tsx: Feature entry points with motion affordances.
- ProposalGenerator.tsx:
  - Zod validation, localStorage persistence of mode and fields.
  - Skill presets (frontend/backend/devops/ai) + manual toggle; dedup + merge.
  - Progress indicators, rich copy actions, toast feedback, accessible labels.
- VoiceResponder.tsx:
  - Form + language/tone selectors; fetch to /v1/voice/generate-response.
  - Preflight audio GET to assert content-type; Howler resume for autoplay.
  - Dialog shows response text, detected mood, audio controls, copy URL.
- ContractGenerator.tsx:
  - Sanitizes accidental JSON; basic Markdown renderer to safe HTML (headings/lists/paragraphs).
  - Risk badge color/icon mapping; copy/download .md.

### 6.2 Shared Libraries

- http.ts: Axios with baseURL normalization to /api; interceptor to normalize errors.
- api.ts: Thin wrappers for proposal/contract/voice endpoints.
- clipboard.ts: Robust copy with fallback.
- themeStore.ts: Light/dark, system sync, persistence.

### 6.3 Developer Experience

- Vite dev server proxies /api, /api/v1, /audio → backend :8000.
- Vitest setup with jest-dom and testing-library; clipboard and matchMedia mocks.
- Tailwind + Radix UI + lucide-react for fast UI assembly.

---

## 7. Build, Deploy, and Operations

### 7.1 Local Development

Backend:

```bash
cd backend
pip install -r requirements.txt
# Optional: python -m playwright install chromium
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

Docs:

- Swagger: http://localhost:8000/api/v1/docs

### 7.2 Single-Image Docker

- Stage 1: Node 18 builds SPA.
- Stage 2: Python 3.12-slim installs backend deps, Playwright deps + Chromium, copies built SPA to Nginx web root.
- Supervisor runs Nginx and Uvicorn; Nginx proxies /api and /audio.

Build:

```bash
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
```

### 7.3 Health Checks

- Backend: GET /health (returns {"status":"ok"})
- Container: Healthcheck configured via Nginx path (see Known Gaps for alignment detail).

---

## 8. CI/CD and Quality Gates

- Frontend CI: Node 18, npm ci, eslint, vitest (jsdom), build, upload dist artifact.
- Backend CI: Python 3.12, pip cache, flake8, black, isort, mypy, pytest. Builds/pushes image to GHCR on main/tags.
- E2E Playwright (Python) smoke: xvfb-run chromium launch to example.com + synthetic scraper test via data URL (offline-friendly).
- Additional workflows: ACR push and Azure Static Web App sample.

---

## 9. Environment Variables

Frontend (build-time):

- VITE_API_BASE_URL: defaults to /api; absolute accepted; normalized to ensure /api suffix.
- VITE_APP_NAME: sets document.title.

Backend (runtime):

- GEMINI_API_KEY: required for LLM.
- ELEVENLABS_API_KEY: required for TTS; optional ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL_ID.
- PUBLIC_BASE_URL: used to generate absolute audio URLs; else relative /audio works behind proxy.
- FRONTEND_URL, CORS_ORIGINS: CORS control.
- AUDIO_STORAGE_PATH: directory for audio output; default /app/audio_files in Docker.
- ENVIRONMENT, DEBUG: environment and debug toggles.

Note: PERPLEXITY_API_KEY appears in scripts, but current LLM implementation uses Gemini via GEMINI_API_KEY.

---

## 10. Security, Stability, Observability

- Security:
  - No client-side secrets; API keys via env.
  - CORS restricted by env; defaults suitable for local dev.
  - Libraries for rate limiting/caching present (slowapi/fastapi-limiter) — not yet wired.
- Stability:
  - Versioned API under /api/v1; strict validation; structured error responses.
  - Scraper fallbacks; LLM JSON fallback heuristics; TTS content-type guard.
- Observability:
  - Health endpoint; DEBUG logging hooks in Gemini service.
  - CI builds and publishes artifacts/images; can add structured logging and tracing.

---

## 11. Known Gaps / Quick Fixes

1. Healthcheck path mismatch

- Container healthcheck uses /api/health via Nginx; backend exposes /health (not /api).
- Quick fixes:
  - Change Dockerfile healthcheck to /health, or
  - Add Nginx location /api/health → proxy_pass /health, or
  - Add a versioned /api/v1/health in FastAPI.

2. DEBUG flag convention

- Some checks compare DEBUG == "dev"; README mentions DEBUG=true. Align on boolean ("true"/"1") and standardize comparisons.

3. Audio directory path resolution

- elevenlabs.py and main.py compute repo root using deep parents which may vary outside Docker. Prefer AUDIO_STORAGE_PATH (env) default and simpler relative base, minimizing assumptions.

4. Naming drift

- services/perplexity.py actually wraps Gemini. Consider renaming to services/llm.py and removing unused PERPLEXITY_API_KEY references for clarity.

5. Rate limiting not wired

- fastapi-limiter present in requirements but not enabled. Add basic per-IP limits to /voice and /proposal if productionizing.

---

## 12. Win Points (What to Highlight)

- Production-minded monorepo with versioned API, strict validation, and deployment-ready Docker (Nginx + Uvicorn).
- Real integrations: Playwright scraping with domain selectors and fallbacks; Gemini LLM with strict JSON mode; ElevenLabs TTS with audio validation and stable file serving.
- CI completeness: linting, types, unit tests, E2E smoke; artifacts and image build/publish.
- Strong UX: localStorage persistence, copy actions, toasts, accessible labels, theme support.
- Type safety throughout: zod (frontend) + Pydantic v2 (backend).
- Clear separation of concerns (routers/models/services) and testability.

---

## 13. Demo Script (5–7 minutes)

1. Open docs at http://localhost:8000/api/v1/docs (versioned endpoints).
2. Proposal:
   - Use a job URL or paste text; select presets + manual skills; generate.
   - Show modal: proposal, pricing, timeline, tips; use copy buttons.
3. Voice responder:
   - Paste “urgent” style message; language auto; generate.
   - Show detected mood, response text, audio playback; copy audio URL. Note audio preflight.
4. Contract:
   - Paste a short proposal; generate.
   - Show preview vs raw, risk badge, flags, recommendations; copy/download .md.
5. Close with Docker/Nginx architecture and CI badges.

---

## 14. Interview Q&A Prompts

- Why Gemini over OpenAI? JSON-mode reliability and latency; easy swap behind service abstraction.
- Playwright in container: system deps + chromium installed; headless; timeouts; stealth optional.
- Scaling: stateless API; TTS files to mounted volume; swap to object storage later; add rate limiting.
- Security: API keys via env; CORS controlled; can add auth when multi-user.
- Observability: health checks in place; structured logging/tracing easy to add.
- Reliability: scraper and LLM fallbacks; content-type validation for TTS; versioned API boundaries.

---

## 15. Short Roadmap

- Proposal “win rate” learning loop (feedback → better prompts).
- Contract clause library with template versioning.
- Multi-voice profiles per mood (ElevenLabs mapping).
- Regional payment clauses, optional lawyer review CTA.
- Enable rate limiting and structured logging in production.

---

## 16. Dependency Reference (Backend & Frontend)

This section catalogs the key dependencies, their roles, and whether they are actively used in the current MVP or reserved for near-term expansion.

### 16.1 Backend (requirements.txt)

- Web & API
  - fastapi — ASGI web framework (routers, validation, OpenAPI). Used throughout backend/app.
  - uvicorn[standard] — ASGI server. Run by Supervisor in the Docker image.
  - pydantic[email] — Data validation (v2) with email extras. Used in app/models/\*.
  - pydantic-settings — Configuration via environment variables (BaseSettings). Present in app/core/config.py; lightly used.

- HTTP & IO
  - httpx — Async HTTP client. Used for Gemini requests in services/perplexity.py.
  - requests — Sync HTTP client. Used for ElevenLabs TTS in services/elevenlabs.py.
  - python-multipart — Multipart/form-data parsing support for FastAPI. Present for future inputs.

- Scraping & Parsing
  - playwright — Headless Chromium automation. Used in services/scraper.py to scrape job pages (Upwork/Freelancer/Mostaql + generic fallback).
  - playwright-stealth — Optional stealth to reduce bot detection. Used opportunistically in scraper.
  - beautifulsoup4, lxml, selectolax — HTML parsing toolset. Not heavily used yet; reserved for richer post-processing of scraped content.

- Data & Persistence (reserved for future)
  - sqlmodel, sqlalchemy — ORM/data layer. Not wired in MVP.
  - alembic — DB migrations. Not wired in MVP.
  - sqlite-utils — Utility for SQLite workflows. Not wired in MVP.

- Auth & Security (reserved)
  - python-jose[cryptography] — JWT creation/verification. Not wired in MVP.
  - passlib[bcrypt] — Password hashing. Not wired in MVP.

- Caching, Tasks, Rate Limiting (reserved)
  - fastapi-cache2[redis] — Response/object caching. Not wired in MVP.
  - celery — Background task processing. Not wired in MVP.
  - slowapi, fastapi-limiter — Rate limiting for endpoints. Planned for /voice and /proposal.

- Config & Utilities
  - python-dotenv — Loads .env files. Used in services/perplexity.py and services/elevenlabs.py.
  - validators — String/URL validators. Available for input hygiene.
  - python-dateutil — Date/time utilities. Not used in MVP.
  - Pillow — Imaging library. Not used in MVP, kept for potential media handling.
  - structlog — Structured logging. Present in requirements; not yet configured.

- Testing & Dev Tooling
  - pytest, pytest-asyncio — Backend tests (sync/async).
  - black, isort, flake8 — Formatting/import order/linting.
  - mypy — Static typing for Python.

Where it’s used in code:

- LLM integration: backend/app/services/perplexity.py (Gemini 2.5 Flash via httpx).
- TTS: backend/app/services/elevenlabs.py (requests).
- Scraper: backend/app/services/scraper.py (playwright, playwright-stealth).
- API routers: backend/app/routers/\*.py (FastAPI routers, pydantic models).

Status summary:

- Actively used: fastapi, uvicorn, pydantic, httpx, requests, playwright, python-dotenv, testing/dev tools.
- Reserved for near-term features: DB stack, auth, caching/limiting, structured logging, HTML parsers beyond current usage.

### 16.2 Frontend (package.json)

- Core
  - react, react-dom — UI runtime.
  - react-router-dom — Client-side routing. Used in src/App.tsx and Layout.

- Forms & Validation
  - react-hook-form — Form state and submission. Used in ProposalGenerator, VoiceResponder, ContractGenerator.
  - zod — Validation schemas.
  - @hookform/resolvers — Connects zod with react-hook-form.

- UI & Styling
  - tailwindcss, @tailwindcss/postcss, postcss, autoprefixer — Styling toolchain.
  - clsx — Conditional className builder.
  - tailwind-merge — Merges Tailwind classes deterministically.
  - @radix-ui/react-dialog — Accessible dialogs (modals).
  - @radix-ui/react-progress — Progress indicators.
  - @radix-ui/react-tabs — Tabbed forms (URL vs manual in Proposal).
  - @radix-ui/react-dropdown-menu, @radix-ui/react-toast, @radix-ui/react-slot — Additional accessible primitives/utilities.
  - lucide-react — Icon set.
  - framer-motion — Animations and motion effects (Dashboard and micro-interactions).

- Data & Networking
  - axios — HTTP client. Wrapped in lib/http.ts with baseURL normalization and error interceptors.

- Audio & Media
  - use-sound — React hook wrapper for Howler. Used in VoiceResponder for playback UX.

- Notifications
  - react-hot-toast — Toast notifications across pages.

- State
  - zustand — Minimal global store. Used for theme mode (light/dark).

- Misc
  - date-fns — Date utilities (not currently used in MVP).
  - react-dropzone — File uploads (not used in MVP but available).

- Tooling (devDependencies)
  - typescript — Type system.
  - vite, @vitejs/plugin-react — Build dev server and React fast-refresh.
  - vitest, jsdom — Test runner and DOM environment.
  - @testing-library/react, @testing-library/jest-dom, @testing-library/user-event — Testing utilities.
  - eslint, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, eslint-plugin-react-hooks, eslint-plugin-react-refresh — Linting.

Where it’s used in code:

- Forms/UI: components/\* (ProposalGenerator, VoiceResponder, ContractGenerator, Layout, Dashboard).
- HTTP: lib/http.ts and lib/api.ts.
- Theming: lib/themeStore.ts (Zustand) + Layout.tsx.
- Tests: components/**tests**/ProposalGenerator.test.tsx, setupTests.ts (testing-library setup, clipboard/matchMedia mocks).

Status summary:

- Actively used: react ecosystem, router, hook-form + zod, Radix primitives, tailwind toolchain, axios, use-sound, toast, zustand, testing stack, vite.
- Present but not currently used: date-fns, react-dropzone (kept for fast iteration on future features).
