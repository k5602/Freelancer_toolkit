from pydantic import BaseSettings


class Settings(BaseSettings):
    PERPLEXITY_API_KEY: str
    ELEVENLABS_API_KEY: str

    class Config:
        env_file = ".env"


settings = Settings()
