from pydantic import BaseModel


class VoiceRequest(BaseModel):
    text_to_speak: str


class VoiceResponse(BaseModel):
    audio_url: str
