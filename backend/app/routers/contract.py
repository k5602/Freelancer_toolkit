from fastapi import APIRouter, HTTPException, status
from app.models.contract import ContractRequest, ContractResponse
from app.services.perplexity import get_text_completion

router = APIRouter()


@router.post(
    "/generate",
    response_model=ContractResponse,
    responses={
        200: {
            "description": "Generated contract with risk analysis",
            "content": {
                "application/json": {
                    "example": {
                        "contract_text": "# Freelance Software Development Agreement\n\n## Scope of Work\n...",
                        "risk_score": 45,
                        "risk_level": "medium",
                        "risk_flags": ["Payment terms unclear", "Scope creep risk not capped"],
                        "recommendations": [
                            "Add milestone-based payments with due dates",
                            "Define a change request process and cap revisions"
                        ]
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
                        "fromDescription": {
                            "summary": "Generate from project description",
                            "value": {
                                "project_description": "Build an authenticated web app with payment integration and admin reporting.",
                                "client_details": "ACME Inc., Ms. Jane Doe"
                            }
                        },
                        "fromProposal": {
                            "summary": "Generate from proposal text",
                            "value": {
                                "proposal": "Hello Client, I propose to deliver a secure web application with milestones and testing...",
                                "client_details": "ACME Inc., Ms. Jane Doe"
                            }
                        }
                    }
                }
            }
        }
    },
)
async def generate_contract(request: ContractRequest):
    """
    Generate a contract from a project description.
    """
    try:
        # Build prompt from available fields to make ai in context
        prompt_parts = [
            "You are a helpful legal assistant. Draft a clear, friendly, and professional freelance contract.",
            "Include: Scope, Deliverables, Timeline, Payment Terms, Revisions, IP Ownership, Confidentiality, Termination, and Signatures.",
        ]

        if request.project_description and request.project_description.strip():
            prompt_parts.append(f"Project Description:\n{request.project_description.strip()}")
        if request.proposal and request.proposal.strip():
            prompt_parts.append(f"Proposal Context:\n{request.proposal.strip()}")
        if request.client_details and request.client_details.strip():
            prompt_parts.append(f"Client Details:\n{request.client_details.strip()}")

        # Ensure we have at least one core input
        if len(prompt_parts) <= 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either project_description or proposal must be provided.",
            )

        prompt = "\n\n".join(prompt_parts)
        contract_text = await get_text_completion(prompt, markdown=True)
        try:
            import json
            # If the model accidentally returned JSON, extract a usable markdown body.
            if isinstance(contract_text, str) and contract_text.strip().startswith("{"):
                data = json.loads(contract_text)
                extracted = data.get("contract_text") or data.get("proposal_text")
                if isinstance(extracted, str) and extracted.strip():
                    contract_text = extracted.strip()
        except Exception:
            # Best-effort fallback; keep original text
            pass
        if not contract_text or "error" in contract_text.lower():
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI service error: Unable to generate contract.",
            )

        # Risk analysis phase
        risk_score = None
        risk_level = None
        risk_flags = []
        recommendations = []

        try:
            # Instruct model to return strict JSON for risk analysis
            risk_instruction = (
                "You are a contracts analyst. Analyze the following freelance contract for risks. "
                "Return STRICT JSON with keys: "
                "risk_score (integer 0-100), risk_level (one of: low|medium|high), "
                "risk_flags (array of short strings), recommendations (array of short strings). "
                "Do not include any extra text."
            )
            risk_prompt = f"{risk_instruction}\n\nContract:\n{contract_text}"
            risk_raw = await get_text_completion(risk_prompt, markdown=False)
            data = {}
            try:
                data = json.loads(risk_raw) if isinstance(risk_raw, str) else {}
            except Exception:
                data = {}
            # Extract fields with normalization
            rs = data.get("risk_score")
            try:
                risk_score = max(0, min(100, int(rs))) if rs is not None else None
            except Exception:
                risk_score = None
            rl = data.get("risk_level")
            if isinstance(rl, str):
                rl = rl.lower().strip()
                if rl in {"low", "medium", "high"}:
                    risk_level = rl
            rf = data.get("risk_flags") or []
            if isinstance(rf, list):
                risk_flags = [str(x).strip() for x in rf if str(x).strip()]
            recs = data.get("recommendations") or []
            if isinstance(recs, list):
                recommendations = [str(x).strip() for x in recs if str(x).strip()]
        except Exception:
            # keep defaults if analysis fails
            pass

        # Derive risk_level from score if missing
        if risk_level is None and isinstance(risk_score, int):
            if risk_score <= 30:
                risk_level = "low"
            elif risk_score <= 70:
                risk_level = "medium"
            else:
                risk_level = "high"

        return ContractResponse(
            contract_text=contract_text,
            risk_score=risk_score,
            risk_level=risk_level,
            risk_flags=risk_flags,
            recommendations=recommendations,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
