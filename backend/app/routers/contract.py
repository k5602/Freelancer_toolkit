from fastapi import APIRouter, HTTPException, status
from app.models.contract import ContractRequest, ContractResponse
from app.services.perplexity import get_completion

router = APIRouter()


@router.post("/generate", response_model=ContractResponse)
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
        contract_text = await get_completion(prompt)
        if not contract_text or "error" in contract_text.lower():
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI service error: Unable to generate contract.",
            )
        return ContractResponse(contract_text=contract_text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
