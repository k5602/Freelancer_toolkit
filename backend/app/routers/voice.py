from fastapi import APIRouter
from app.models.voice import VoiceRequest, VoiceResponse
from app.services.elevenlabs import text_to_speech

router = APIRouter()


@router.post("/generate")
def generate_voice(request: VoiceRequest) -> VoiceResponse:
    """
    Generate a voice response from a text.
    """
    audio_url = text_to_speech(request.text_to_speak)
    return VoiceResponse(audio_url=audio_url)
