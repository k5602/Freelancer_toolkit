from pydantic import BaseModel, Field, field_validator


class VoiceRequest(BaseModel):
    text_to_speak: str = Field(
        ..., min_length=3, max_length=1000, description="Text to convert to speech"
    )

    @field_validator("text_to_speak")
    def text_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Text to speak must not be empty")
        return v


class VoiceResponse(BaseModel):
    audio_url: str = Field(..., min_length=5, description="URL to generated audio file")
