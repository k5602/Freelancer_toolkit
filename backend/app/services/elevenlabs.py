import os
import uuid
from elevenlabs.client import ElevenLabs
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
ELEVENLABS_MODEL_ID = os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")
# Resolve default audio directory to monorepo frontend/public/audio (absolute)
_repo_root = Path(__file__).resolve().parents[4]
_default_audio_dir = _repo_root / "frontend" / "public" / "audio"
_audio_dir_env = os.getenv("AUDIO_STORAGE_PATH")
if _audio_dir_env:
    AUDIO_DIR = str(Path(_audio_dir_env).resolve())
else:
    AUDIO_DIR = str(_default_audio_dir)

client = ElevenLabs(api_key=ELEVENLABS_API_KEY)  # This line remains unchanged


def text_to_speech(text: str) -> str:
    """
    Convert text to speech using ElevenLabs, save as unique file, return public URL.
    """
    if not ELEVENLABS_API_KEY or ELEVENLABS_API_KEY.strip() in ("", "test_dummy"):
        return "ElevenLabs API key missing or invalid. Set ELEVENLABS_API_KEY."
    if not text or not text.strip():
        return "Text to speak must not be empty"
    safe_text = text.strip()
    if len(safe_text) > 5000:
        safe_text = safe_text[:5000] #taking only first 5000 characters to avoid long texts and api ratelimits
    try:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
        headers = {"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}
        payload = {
            "text": safe_text,
            "model_id": ELEVENLABS_MODEL_ID,
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.5},
        }
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code != 200:
            try:
                err = response.json()
            except Exception:
                err = {"detail": response.text}
            return f"ElevenLabs API error ({response.status_code}): {err.get('detail') or err}"
        ctype = response.headers.get("Content-Type", "")
        if "audio" not in ctype.lower():
            try:
                err = response.json()
            except Exception:
                err = {"detail": response.text}
            return f"ElevenLabs API error: Unexpected response type: {ctype} {err.get('detail') or ''}".strip()
        audio_data = response.content
    except requests.RequestException as e:
        return f"ElevenLabs network error: {str(e)}"
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

    public_base = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")
    if public_base:
        return f"{public_base}/audio/{filename}"
    return f"/audio/{filename}"
