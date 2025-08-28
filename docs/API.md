# Freelancer Toolkit API (v1)

This document describes the versioned REST API for the Freelancer Toolkit. All endpoints are now available under the `/api/v1` prefix. Interactive documentation and the OpenAPI schema are exposed at versioned URLs.

## Quick Links

- Swagger UI: `GET /api/v1/docs`
- ReDoc: `GET /api/v1/redoc`
- OpenAPI JSON: `GET /api/v1/openapi.json`

Servers:

- Public (if configured): Derived from `PUBLIC_BASE_URL`
- Local: `http://localhost:8000`

Content type: All API requests and responses use `application/json` unless otherwise noted.

Authentication: Not required (server is responsible for providing necessary API keys via environment variables; see `.env.example`).

---

## Health

- Method: GET
- Path: `/health`
- Description: Liveness probe endpoint.
- Success (200):

```json
{
  "status": "ok"
}
```

---

## 1. Smart Proposal Generator

Generate a tailored proposal from either a job URL (scraped) or a pasted job description, plus user skills and optional target rate. The response includes both the final proposal and structured extraction data.

- Method: POST
- Path: `/api/v1/proposal/generate`

### Request Body

At least one of `job_url` or `job_description` is required.

```json
{
  "job_url": "https://www.upwork.com/jobs/Example-Job",
  "job_description": "Optional: paste the job description if not providing a URL.",
  "user_skills": ["React", "TypeScript", "FastAPI"],
  "target_rate": 45.0
}
```

Fields:

- `job_url` (string, optional): URL of the job to scrape.
- `job_description` (string, optional, min 10): Raw job description text.
- `user_skills` (array<string>, required): Your skills (from presets and/or manual input).
- `target_rate` (number, optional): Desired hourly rate.

### Response (200)

```json
{
  "proposal_text": "string",
  "pricing_strategy": "string",
  "estimated_timeline": "string",
  "success_tips": ["string", "string", "string"],

  "source_url": "https://www.upwork.com/jobs/Example-Job",
  "source_platform": "upwork",
  "extracted_title": "Senior React Developer",
  "extracted_description": "Raw job description text...",
  "extracted_requirements": [],
  "extracted_budget": "$3,000 fixed",
  "extracted_budget_type": "fixed",
  "extracted_currency": "$",
  "extracted_timeline": "4-6 weeks",
  "extracted_skills": ["React", "TypeScript"],
  "client_location": "US"
}
```

### Example cURL

```bash
curl -X POST http://localhost:8000/api/v1/proposal/generate \
  -H "Content-Type: application/json" \
  -d '{
    "job_url": "https://www.upwork.com/jobs/Example-Job",
    "user_skills": ["React","TypeScript","FastAPI"],
    "target_rate": 45
  }'
```

---

## 2. Voice Responder

Two modes are available:

- Simple TTS: Convert provided text to speech.
- Mood-aware TTS: Analyze the client message, generate a mood- and language-appropriate response text, and convert it to speech. Supported languages: Arabic (`ar`), English (`en`), German (`de`), or `auto`.

### 2.1 Simple Text-to-Speech

- Method: POST
- Path: `/api/v1/voice/generate`

Request:

```json
{
  "text_to_speak": "Hello! This is a short message."
}
```

Response (200):

```json
{
  "audio_url": "/audio/output_abc123.mp3"
}
```

Example cURL:

```bash
curl -X POST http://localhost:8000/api/v1/voice/generate \
  -H "Content-Type: application/json" \
  -d '{"text_to_speak":"Hello! This is a short message."}'
```

### 2.2 Mood-Aware Response + TTS

- Method: POST
- Path: `/api/v1/voice/generate-response`

Request:

```json
{
  "message_text": "Client: Can we deliver this faster? We need it urgently this week.",
  "
language": "auto",
  "tone_override": "urgent",
  "max_words": 160
}
```

Fields:

- `message_text` (string, required, min 5): Client message/email text.
- `language` (enum: `auto`, `en`, `de`, `ar`; default `auto`): Target language.
- `tone_override` (optional enum: `urgent`, `frustrated`, `excited`, `professional`): Force a tone instead of detection.
- `max_words` (int, 40–400; default 160): Maximum length of the generated response text.

Response (200):

```json
{
  "mood": "urgent",
  "language": "en",
  "response_text": "Thanks for the update—understood on the urgency. Here's a feasible plan...",
  "audio_url": "/audio/output_abcdef123.mp3",
  "negotiation_advice": [
    "Propose the fastest feasible plan and a clear timeline.",
    "Offer a small scope cut or phased delivery if needed.",
    "Confirm deadlines and risks in writing."
  ]
}
```

Example cURL:

```bash
curl -X POST http://localhost:8000/api/v1/voice/generate-response \
  -H "Content-Type: application/json" \
  -d '{
    "message_text":"Client: Can we deliver this faster? We need it urgently this week.",
    "language":"auto",
    "tone_override":"urgent",
    "max_words":160
  }'
```

Note: Audio files are served under `/audio/{filename}.mp3`. When `PUBLIC_BASE_URL` is configured, `audio_url` will be absolute.

---

## 3. AI Contract Generator

Generates a clean Markdown contract and performs a risk analysis.

- Method: POST
- Path: `/api/v1/contract/generate`

### Request Body

Provide at least one of `project_description` or `proposal`. `client_details` is optional.

```json
{
  "project_description": "Build an authenticated web app with payment integration...",
  "proposal": "Optional: previously generated proposal text...",
  "client_details": "ACME Inc., Ms. Jane Doe, timeline target Q2"
}
```

### Response (200)

```json
{
  "contract_text": "# Freelance Software Development Agreement\n\n## Scope of Work\n...",
  "risk_score": 45,
  "risk_level": "medium",
  "risk_flags": ["Payment terms unclear", "Scope creep risk not capped"],
  "recommendations": [
    "Add milestone-based payments with due dates",
    "Define a change request process and cap revisions"
  ]
}
```

### Example cURL

```bash
curl -X POST http://localhost:8000/api/v1/contract/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_description": "Build an authenticated web app...",
    "client_details": "ACME Inc., Ms. Jane Doe"
  }'
```

---

## Errors

All error responses follow FastAPI’s standard error format.

- Validation error (422) example:

```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "job_description"],
      "msg": "String should have at least 10 characters",
      "input": "too short"
    }
  ]
}
```

- Service error (e.g., AI/LLM/TTS failure) example:

```json
{
  "detail": "AI service error: Unable to generate response text."
}
```

- Contract input error (400) example:

```json
{
  "detail": "Either project_description or proposal must be provided."
}
```

---

## OpenAPI & Tags

- Swagger UI: `GET /api/v1/docs`
- ReDoc: `GET /api/v1/redoc`
- OpenAPI JSON: `GET /api/v1/openapi.json`

Tags:

- `proposal` — Smart proposal generation
- `voice` — Voice response generation and mood-aware replies
- `contract` — AI contract generation and risk analysis
- `system` — Health/status endpoints

The OpenAPI schema includes a list of `servers`, typically:

- `http://localhost:8000` (local development)
- Your public URL, when `PUBLIC_BASE_URL` is set.

---

## Notes

- The server requires valid API keys for Gemini (LLM) and ElevenLabs (TTS). Configure via environment variables (`.env.example`).
- Audio files are written to `AUDIO_STORAGE_PATH` and served under `/audio/*`.
- All endpoints are versioned under `/api/v1`. Older non-versioned routes are deprecated and no longer available.
