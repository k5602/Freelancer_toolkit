from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional, List
import re

from app.services.nlp import analyze_sentiment
from app.services.perplexity import get_text_completion
from app.services.elevenlabs import text_to_speech

router = APIRouter()


# ---- Models ------------------------------------------------------------------


SupportedMood = Literal["urgent", "frustrated", "excited", "professional"]
SupportedLanguage = Literal[
    "auto",
    "en",
    "de",
    "ar",
]


class VoiceMoodRequest(BaseModel):
    message_text: str = Field(
        ..., min_length=5, max_length=2000, description="Client message or email text"
    )
    language: SupportedLanguage = Field(
        default="auto",
        description="Target language for the response. 'auto' will mirror the input message language.",
    )
    tone_override: Optional[SupportedMood] = Field(
        default=None,
        description="Override detected mood/tone (urgent, frustrated, excited, professional).",
    )
    max_words: int = Field(
        default=160,
        ge=40,
        le=400,
        description="Maximum word count for generated response.",
    )

    @field_validator("message_text")
    @classmethod
    def _strip_and_validate(cls, v: str) -> str:
        vv = v.strip()
        if not vv:
            raise ValueError("message_text must not be empty")
        return vv


class VoiceMoodResponse(BaseModel):
    mood: SupportedMood = Field(..., description="Detected or overridden mood/tone")
    language: SupportedLanguage = Field(
        ..., description="Language used for response (or 'auto' when mirrored)"
    )
    response_text: str = Field(..., min_length=3, description="Generated response text")
    audio_url: str = Field(..., min_length=5, description="URL to generated audio file")
    negotiation_advice: List[str] = Field(
        default_factory=list,
        description="Short bullet tips for negotiation/next steps",
    )


# ---- Utilities ---------------------------------------------------------------


_URGENT_RE = re.compile(r"\b(urgent|asap|immediately|now|deadline|soon)\b", re.I)
_FRUSTRATED_RE = re.compile(
    r"\b(frustrated|angry|upset|disappointed|complain|complaint|delay|issue|problem|bug|not\s+happy)\b",
    re.I,
)
_EXCITED_RE = re.compile(
    r"\b(excellent|great|awesome|love|amazing|excited|happy|thanks|thank you)\b", re.I
)


def _detect_mood(text: str) -> SupportedMood:
    """
    Lightweight mood classifier combining keyword heuristics and naive sentiment.
    """
    if _URGENT_RE.search(text):
        return "urgent"
    if _FRUSTRATED_RE.search(text):
        return "frustrated"
    if _EXCITED_RE.search(text):
        return "excited"

    # Fallback to naive sentiment -> map to moods
    sent = analyze_sentiment(text)
    if sent == "positive":
        return "excited"
    if sent == "negative":
        return "frustrated"
    return "professional"


def _language_instruction(lang: SupportedLanguage) -> str:
    """
    Instruction phrase for language behavior in the LLM prompt.
    """
    if lang == "auto":
        return "Reply in the same language as the user's message."
    mapping = {
        "en": "Reply in English.",
        "de": "Antworte auf Deutsch.",
        "ar": "أجب باللغة العربية.",
    }
    return mapping.get(lang, "Reply in the user's language.")


def _tone_instruction(mood: SupportedMood) -> str:
    base = "Keep a concise, friendly, and professional tone."
    if mood == "urgent":
        return f"{base} Acknowledge urgency, be action-oriented, propose next steps with clear timing."
    if mood == "frustrated":
        return f"{base} Acknowledge frustration empathetically, apologize for inconvenience if appropriate, and propose a remedy and clear next steps."
    if mood == "excited":
        return f"{base} Reflect excitement, appreciate the opportunity, and propose confident, value-focused next steps."
    return f"{base} Maintain a calm, confident, and helpful style."


def _negotiation_tips_for(mood: SupportedMood) -> list[str]:
    if mood == "urgent":
        return [
            "Propose the fastest feasible plan and a clear timeline.",
            "Offer a small scope cut or phased delivery if needed.",
            "Confirm deadlines and risks in writing.",
        ]
    if mood == "frustrated":
        return [
            "Acknowledge concerns and restate the problem to show understanding.",
            "Offer one or two concrete remedies with clear outcomes.",
            "Set expectations and timelines transparently.",
        ]
    if mood == "excited":
        return [
            "Emphasize benefits and align on success metrics.",
            "Upsell carefully with optional add-ons tied to value.",
            "Confirm scope, timeline, and next steps in writing.",
        ]
    return [
        "Summarize requirements and confirm scope boundaries.",
        "Discuss pricing structure and tradeoffs transparently.",
        "Agree on milestones, communication cadence, and success criteria.",
    ]


# ---- Endpoint ----------------------------------------------------------------


@router.post("/generate-response", response_model=VoiceMoodResponse)
async def generate_mood_aware_response(req: VoiceMoodRequest) -> VoiceMoodResponse:
    """
    Generate a mood-aware response text and convert it to speech.

    Steps:
    1) Detect mood (or use override).
    2) Generate response in selected language and tone (Markdown-friendly text, no code fences).
    3) Convert to speech using ElevenLabs.
    4) Return audio URL, detected mood, and response text (+ negotiation tips).
    """
    try:
        mood: SupportedMood = req.tone_override or _detect_mood(req.message_text)
        lang_instr = _language_instruction(req.language)
        tone_instr = _tone_instruction(mood)

        prompt = (
            f"{lang_instr}\n"
            f"{tone_instr}\n"
            f"Length: up to {req.max_words} words.\n\n"
            "Task: Craft a courteous, professional reply to the following client message. "
            "Include empathy when appropriate, propose clear next steps, and avoid code fences or JSON. "
            "Do not add headings; respond as a single, readable message.\n\n"
            f"Client message:\n{req.message_text.strip()}\n"
        )

        response_text = await get_text_completion(prompt, markdown=True)
        if not response_text or isinstance(response_text, str) and "error" in response_text.lower():
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI service error: Unable to generate response text.",
            )

        # Convert to speech
        audio_url = text_to_speech(response_text)
        if not audio_url or "error" in audio_url.lower():
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="TTS service error: Unable to generate audio.",
            )

        tips = _negotiation_tips_for(mood)

        return VoiceMoodResponse(
            mood=mood,
            language=req.language,
            response_text=response_text.strip(),
            audio_url=audio_url,
            negotiation_advice=tips,
        )
    except HTTPException:
        raise
    except Exception as ex:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(ex)
        )
