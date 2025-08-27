import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-exp:generateContent"


async def get_completion(prompt: str) -> str:
    """
    Get completion from Gemini 2.5 Flash (Google AI).
    """
    import sys

    print(f"[DEBUG] GEMINI_API_KEY: {GEMINI_API_KEY}", file=sys.stderr)
    if not GEMINI_API_KEY:
        print("[ERROR] Gemini API key not found.", file=sys.stderr)
        return "Gemini API key not found. Please set the GEMINI_API_KEY environment variable."

    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}", json=payload, timeout=30.0
        )
        print(
            f"[DEBUG] Gemini API response status: {response.status_code}",
            file=sys.stderr,
        )
        if response.status_code != 200:
            print(f"[ERROR] Gemini API error: {response.text}", file=sys.stderr)
            return f"Gemini API error: {response.text}"
        data = response.json()
        print(f"[DEBUG] Gemini API response data: {data}", file=sys.stderr)
        # Extract the generated text from the response
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as ex:
            print(f"[ERROR] Gemini API response format error: {ex}", file=sys.stderr)
            return "Gemini API response format error."
