import os
import httpx
from dotenv import load_dotenv

load_dotenv()
# using Gemini 2.5 Flash model from Google AI in development
# preplexity.ai is not reliable and often returns errors but we will use in production
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


async def get_completion(prompt: str) -> str:
    """
    Get completion from Gemini 2.5 Flash (Google AI).
    """
    import sys

    if not GEMINI_API_KEY:
        print("[ERROR] Gemini API key not found.", file=sys.stderr)
        return "Gemini API key not found. Please set the GEMINI_API_KEY environment variable."

    json_instruction = (
        "You are an assistant that ONLY returns strict JSON. Return an object with keys: "
        "proposal_text (string), pricing_strategy (string), estimated_timeline (string), "
        "success_tips (array of exactly 3 short strings). Do not include any markdown or extra text."
    )

    full_prompt = (
        f"{json_instruction}\n\n{prompt}\n\n"
        "Respond ONLY as JSON with exactly these keys."
    )

    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json"
        },
    }
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
