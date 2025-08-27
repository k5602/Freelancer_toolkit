from fastapi import APIRouter, HTTPException, status
from app.models.proposal import ProposalRequest, ProposalResponse
from app.services.perplexity import get_completion
from app.services.scraper import scrape_job_posting

router = APIRouter()


@router.post("/generate", response_model=ProposalResponse)
async def generate_proposal(request: ProposalRequest):
    """
    Generate a proposal from job URL or description, with skills and rate.
    """
    try:
        job_text = request.job_description
        if request.job_url:
            scraped = await scrape_job_posting(request.job_url)
            job_text = scraped.get("description")
        if not job_text:
            raise HTTPException(status_code=400, detail="No job description found.")

        skills_str = ", ".join(request.user_skills) if request.user_skills else ""
        rate_str = (
            f"Target hourly rate: {request.target_rate}" if request.target_rate else ""
        )
        prompt = (
            f"Job Description:\n{job_text}\n\n"
            f"Freelancer Skills: {skills_str}\n{rate_str}\n"
            "Generate a winning freelance proposal for this job. Include:\n"
            "- Proposal text\n- Pricing strategy\n- Timeline estimate\n- 3 tips to improve chances of success."
        )
        ai_response = await get_completion(prompt)
        if not ai_response or "error" in ai_response.lower():
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI service error: Unable to generate proposal.",
            )
        # Parse AI response (simple split, improve later)
        lines = ai_response.splitlines()
        proposal_text = ""
        pricing_strategy = ""
        estimated_timeline = ""
        success_tips = []
        for line in lines:
            l = line.lower()
            if "proposal" in l and not proposal_text:
                proposal_text = line.split(":", 1)[-1].strip()
            elif "pricing" in l:
                pricing_strategy = line.split(":", 1)[-1].strip()
            elif "timeline" in l:
                estimated_timeline = line.split(":", 1)[-1].strip()
            elif "tip" in l:
                tip = line.split(":", 1)[-1].strip()
                if tip:
                    success_tips.append(tip)
        # Fallbacks
        proposal_text = proposal_text or ai_response
        pricing_strategy = pricing_strategy or "See proposal."
        estimated_timeline = estimated_timeline or "See proposal."
        if not success_tips:
            success_tips = [
                "Follow up promptly",
                "Customize your proposal",
                "Show relevant experience",
            ]
        return ProposalResponse(
            proposal_text=proposal_text,
            pricing_strategy=pricing_strategy,
            estimated_timeline=estimated_timeline,
            success_tips=success_tips,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
