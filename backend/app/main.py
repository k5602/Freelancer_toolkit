from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import proposal, voice, contract

app = FastAPI(
    title="Freelancer Toolkit API",
    description="API for the Freelancer Toolkit, providing services for proposal generation, voice response, and contract creation.",
    version="1.0.0",
)

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(proposal.router, prefix="/api/proposal", tags=["proposal"])
app.include_router(voice.router, prefix="/api/voice", tags=["voice"])
app.include_router(contract.router, prefix="/api/contract", tags=["contract"])


@app.get("/")
def read_root():
    return {"message": "Welcome to the Freelancer Toolkit API"}

@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok"}
