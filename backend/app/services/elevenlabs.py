import os
import uuid
from elevenlabs.client import ElevenLabs
import requests
from dotenv import load_dotenv

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
AUDIO_DIR = os.getenv("AUDIO_STORAGE_PATH", "../../frontend/public/audio/")

client = ElevenLabs(api_key=ELEVENLABS_API_KEY)  # This line remains unchanged


def text_to_speech(text: str) -> str:
    """
    Convert text to speech using ElevenLabs, save as unique file, return public URL.
    """
    if not ELEVENLABS_API_KEY:
        return "ElevenLabs API key not found. Please set the ELEVENLABS_API_KEY environment variable."
    try:
        url = "https://api.elevenlabs.io/v1/text-to-speech/Bella"
        headers = {"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.5},
        }
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            return f"ElevenLabs API error: {response.text}"
        audio_data = response.content
    except Exception as e:
        return f"ElevenLabs API error: {str(e)}"

    # Generate unique filename
    filename = f"output_{uuid.uuid4().hex}.mp3"
    audio_path = os.path.join(AUDIO_DIR, filename)
    os.makedirs(AUDIO_DIR, exist_ok=True)
    try:
        with open(audio_path, "wb") as f:
            f.write(audio_data)
    except Exception as e:
        return f"Audio file write error: {str(e)}"

    return f"/audio/{filename}"
