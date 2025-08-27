from fastapi import APIRouter, HTTPException, status
from app.models.voice import VoiceRequest, VoiceResponse
from app.services.elevenlabs import text_to_speech

router = APIRouter()


@router.post("/generate", response_model=VoiceResponse)
def generate_voice(request: VoiceRequest):
    """
    Generate a voice response from a text.
    """
    try:
        audio_url = text_to_speech(request.text_to_speak)
        if not audio_url or "error" in audio_url.lower():
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="TTS service error: Unable to generate audio.",
            )
        return VoiceResponse(audio_url=audio_url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
