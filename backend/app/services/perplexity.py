import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"


async def get_completion(prompt: str) -> str:
    """
    Get completion from Gemini 2.5 Flash (Google AI).
    """
    if not GEMINI_API_KEY:
        return "Gemini API key not found. Please set the GEMINI_API_KEY environment variable."

    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}", json=payload, timeout=30.0
        )
        if response.status_code != 200:
            return f"Gemini API error: {response.text}"
        data = response.json()
        # Extract the generated text from the response
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            return "Gemini API response format error."
