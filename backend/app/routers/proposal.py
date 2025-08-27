from fastapi import APIRouter
from app.models.proposal import ProposalRequest, ProposalResponse
from app.services.perplexity import get_completion

router = APIRouter()


@router.post("/generate")
async def generate_proposal(request: ProposalRequest) -> ProposalResponse:
    """
    Generate a proposal from a job description.
    """
    prompt = f"Generate a project proposal based on the following job description:\n\n{request.job_description}"
    proposal_text = await get_completion(prompt)
    return ProposalResponse(proposal_text=proposal_text)
