from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os

from app.routers import proposal, voice, contract

app = FastAPI(
    title="Freelancer Toolkit API",
    description="API for the Freelancer Toolkit, providing services for proposal generation, voice response, and contract creation.",
    version="1.0.0",
)

# CORS
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
# Resolve default audio directory to monorepo frontend/public/audio
_repo_root = Path(__file__).resolve().parents[3]
_default_audio_dir = _repo_root / "frontend" / "public" / "audio"
_audio_dir = Path(os.getenv("AUDIO_STORAGE_PATH", str(_default_audio_dir)))
_audio_dir.mkdir(parents=True, exist_ok=True)
app.mount("/audio", StaticFiles(directory=str(_audio_dir)), name="audio")


app.include_router(proposal.router, prefix="/api/proposal", tags=["proposal"])
app.include_router(voice.router, prefix="/api/voice", tags=["voice"])
app.include_router(contract.router, prefix="/api/contract", tags=["contract"])


@app.get("/")
def read_root():
    return {"message": "Welcome to the Freelancer Toolkit API"}

@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok"}
