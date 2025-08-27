import os
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

def text_to_speech(text: str) -> str:
    """
    Convert text to speech using ElevenLabs.
    """
    if not ELEVENLABS_API_KEY:
        return "ElevenLabs API key not found. Please set the ELEVENLABS_API_KEY environment variable."

    audio = client.generate(
        text=text,
        voice="Bella",
        model="eleven_multilingual_v2"
    )

    # Save the generated audio to an MP3 file
    # The path is relative to the backend directory
    audio_path = "../../frontend/public/audio/output.mp3"
    with open(audio_path, "wb") as f:
        f.write(audio)

    return "/audio/output.mp3"
