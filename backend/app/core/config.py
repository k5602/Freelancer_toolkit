from typing import Optional
from pydantic import BaseSettings


class Settings(BaseSettings):
    PERPLEXITY_API_KEY: Optional[str] = None
    ELEVENLABS_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"


settings = Settings()
