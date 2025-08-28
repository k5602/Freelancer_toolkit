import os
import sys
import httpx
from dotenv import load_dotenv

load_dotenv()
# using Gemini 2.5 Flash model from Google AI in development
# preplexity.ai is not reliable and often returns errors but we will use in production
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


async def _post_to_gemini(payload: dict) -> str:
    """
    Low-level POST helper. Returns the text output or an error string.
    """
    if not GEMINI_API_KEY:
        print("[ERROR] Gemini API key not found.", file=sys.stderr)
        return "Gemini API key not found. Please set the GEMINI_API_KEY environment variable."
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}", json=payload, timeout=45.0
        )
        print(f"[DEBUG] Gemini API response status: {resp.status_code}", file=sys.stderr)
        if resp.status_code != 200:
            print(f"[ERROR] Gemini API error: {resp.text}", file=sys.stderr)
            return f"Gemini API error: {resp.text}"
        data = resp.json()
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as ex:
            print(f"[ERROR] Gemini API response format error: {ex}", file=sys.stderr)
            return "Gemini API response format error."
        print(f"[DEBUG] Gemini API response text length: {len(text)}", file=sys.stderr)
        return text


async def get_proposal_completion_json(prompt: str) -> str:
    """
    Get a STRICT JSON response for proposals with the required keys:
    - proposal_text (string)
    - pricing_strategy (string)
    - estimated_timeline (string)
    - success_tips (array of exactly 3 short strings)
    """
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
        "generationConfig": {"response_mime_type": "application/json"},
    }
    return await _post_to_gemini(payload)


async def get_text_completion(prompt: str, markdown: bool = True) -> str:
    """
    Get a plain text (or Markdown) response suitable for contracts or free-form content.
    When markdown=True, instructs the model to produce clean, well-structured Markdown
    without code fences, suitable for direct rendering and download as .md.
    """
    style_instruction = (
        "Return a well-structured, professional Markdown document suitable for download as a .md file. "
        "Do NOT use code fences. Use headings, bullet lists, numbered lists, and clear sections."
        if markdown
        else "Return a clear, professional plain text document without JSON or code fences."
    )
    full_prompt = f"{style_instruction}\n\n{prompt}"
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        # Let the model output text by default; no enforced JSON mime type.
    }
    return await _post_to_gemini(payload)

async def get_completion(prompt: str) -> str:
    return await get_proposal_completion_json(prompt)
