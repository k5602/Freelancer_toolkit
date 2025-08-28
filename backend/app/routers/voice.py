from fastapi import APIRouter, HTTPException, status
from app.models.voice import VoiceRequest, VoiceResponse
from app.services.elevenlabs import text_to_speech

router = APIRouter()


@router.post(
    "/generate",
    response_model=VoiceResponse,
    responses={
        200: {
            "description": "Generated audio URL",
            "content": {
                "application/json": {
                    "example": {
                        "audio_url": "/audio/output_abc123.mp3"
                    }
                }
            }
        }
    },
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "examples": {
                        "basic": {
                            "summary": "Convert short text to speech",
                            "value": {
                                "text_to_speak": "Hello! This is a short message."
                            }
                        },
                        "longer": {
                            "summary": "Longer input",
                            "value": {
                                "text_to_speak": "Thanks for your message. I will follow up shortly with the next steps."
                            }
                        }
                    }
                }
            }
        }
    },
)
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
