from fastapi import APIRouter, HTTPException, status
from app.models.proposal import ProposalRequest, ProposalResponse
from app.services.perplexity import get_completion

router = APIRouter()


@router.post("/generate", response_model=ProposalResponse)
async def generate_proposal(request: ProposalRequest):
    """
    Generate a proposal from a job description.
    """
    try:
        prompt = f"Generate a project proposal based on the following job description:\n\n{request.job_description}"
        proposal_text = await get_completion(prompt)
        if not proposal_text or "error" in proposal_text.lower():
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI service error: Unable to generate proposal.",
            )
        return ProposalResponse(proposal_text=proposal_text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
