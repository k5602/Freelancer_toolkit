from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
from app.routers import proposal, voice, contract, voice_mood

app = FastAPI(
    title="Freelancer Toolkit API",
    description="API for the Freelancer Toolkit, providing services for proposal generation, voice response, and contract creation.",
    version="1.0.0",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json",
    contact={
        "name": "Freelancer Toolkit",
        "url": "TBD",
        "email": "Khaled.alam5602@gmail.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=[
        {"name": "proposal", "description": "Smart proposal generation"},
        {"name": "voice", "description": "Voice response generation and mood-aware replies"},
        {"name": "contract", "description": "AI contract generation and risk analysis"},
        {"name": "system", "description": "System and health endpoints"},
    ],
)

# CORS (env-driven)
_raw_cors = os.getenv("CORS_ORIGINS", "")
_frontend_url = os.getenv("FRONTEND_URL", "").strip()

origins = []
if _raw_cors:
    try:
        import json
        parsed = json.loads(_raw_cors)
        if isinstance(parsed, list):
            origins = [str(o).strip() for o in parsed if str(o).strip()]
        elif isinstance(parsed, str):
            origins = [p.strip() for p in parsed.split(",") if p.strip()]
    except Exception:
        origins = [p.strip() for p in _raw_cors.split(",") if p.strip()]

if _frontend_url:
    origins.append(_frontend_url)

if not origins:
    origins = [
        "http://localhost:8000",
        "http://localhost:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Static files: serve generated audio under /audio
_repo_root = Path(__file__).resolve().parents[3]
_default_audio_dir = _repo_root / "frontend" / "public" / "audio"
_audio_dir = Path(os.getenv("AUDIO_STORAGE_PATH", str(_default_audio_dir)))
_audio_dir.mkdir(parents=True, exist_ok=True)
app.mount("/audio", StaticFiles(directory=str(_audio_dir)), name="audio")
# Public base URL for generating absolute URLs (used by services)
app.state.PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")


# API routes (v1)
app.include_router(proposal.router, prefix="/api/v1/proposal", tags=["proposal"])
app.include_router(voice.router, prefix="/api/v1/voice", tags=["voice"])
app.include_router(voice_mood.router, prefix="/api/v1/voice", tags=["voice"])
app.include_router(contract.router, prefix="/api/v1/contract", tags=["contract"])


@app.get("/")
def read_root():
    return {"message": "Welcome to the Freelancer Toolkit API"}

@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok"}


def custom_openapi():
    """
    Customize OpenAPI schema:
    - Versioned docs already exposed under /api/v1/*
    - Inject 'servers' from env (PUBLIC_BASE_URL) and localhost
    """
    if app.openapi_schema:
        return app.openapi_schema

    # Local import to avoid changing top-level imports
    from fastapi.openapi.utils import get_openapi  # type: ignore

    base_url = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")
    servers = []
    if base_url:
        servers.append({"url": base_url, "description": "Public base URL"})
    servers.append({"url": "http://localhost:8000", "description": "Local development"})

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    # Attach servers and preserve tag metadata from app.openapi_tags
    openapi_schema["servers"] = servers

    app.openapi_schema = openapi_schema
    return app.openapi_schema


# Override default OpenAPI generator with our customized version
app.openapi = custom_openapi  # type: ignore
