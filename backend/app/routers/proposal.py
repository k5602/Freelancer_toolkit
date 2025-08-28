from fastapi import APIRouter, HTTPException, status
from app.models.proposal import ProposalRequest, ProposalResponse
from app.services.perplexity import get_proposal_completion_json
from app.services.scraper import scrape_job_posting

router = APIRouter()


@router.post("/generate", response_model=ProposalResponse)
async def generate_proposal(request: ProposalRequest):
    """
    Generate a proposal from job URL or description, with skills and rate.
    """
    try:
        # Initialize scraped info container
        scraped_info = {
            "platform": None,
            "title": None,
            "description": None,
            "budget": None,
            "timeline": None,
            "skills": [],
            "currency": None,
            "location": None,
        }

        job_text = request.job_description
        if request.job_url:
            try:
                scraped = await scrape_job_posting(request.job_url)
                scraped_info.update(
                    {
                        "platform": scraped.get("platform"),
                        "title": scraped.get("title"),
                        "description": scraped.get("description"),
                        "budget": scraped.get("budget") or scraped.get("hourly") or "",
                        "timeline": scraped.get("timeline"),
                        "skills": scraped.get("skills") or [],
                        "currency": scraped.get("currency"),
                        "location": scraped.get("location"),
                    }
                )
                job_text = scraped_info["description"] or job_text
            except Exception as scrape_err:
                # Log and continue with any provided job_description
                print(f"[WARN] scrape_job_posting failed: {scrape_err}")

        # Infer budget type/currency
        budget_text = (scraped_info.get("budget") or "").strip()
        lt = budget_text.lower()
        extracted_budget_type = (
            "hourly"
            if ("hour" in lt or "hourly" in lt)
            else ("fixed" if ("fixed" in lt or "$" in lt or "€" in lt) else "unknown")
        )
        extracted_currency = "$" if "$" in budget_text else ("€" if "€" in budget_text else scraped_info.get("currency"))
        if not job_text:
            raise HTTPException(status_code=400, detail="No job description found (scrape failed and no description provided).")

        skills_str = ", ".join(request.user_skills) if request.user_skills else ""
        rate_str = (
            f"Target hourly rate: {request.target_rate}" if request.target_rate else ""
        )
        prompt = (
            f"Job Description:\n{job_text}\n\n"
            "Context (from job post):\n"
            f"- Title: {scraped_info.get('title') or 'N/A'}\n"
            f"- Platform: {scraped_info.get('platform') or 'N/A'}\n"
            f"- Budget: {budget_text or 'N/A'} (type: {extracted_budget_type}, currency: {extracted_currency or 'unknown'})\n"
            f"- Timeline: {scraped_info.get('timeline') or 'N/A'}\n"
            f"- Skills from post: {', '.join(scraped_info.get('skills') or []) or 'N/A'}\n\n"
            f"Freelancer Skills: {skills_str or 'N/A'}\n{rate_str}\n"
            "Generate a winning freelance proposal for this job. Include:\n"
            "- Proposal text\n- Pricing strategy\n- Timeline estimate\n- 3 tips to improve chances of success."
        )
        ai_response = await get_proposal_completion_json(prompt)
        if not ai_response or (isinstance(ai_response, str) and "error" in ai_response.lower()):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI service error: Unable to generate proposal.",
            )
        # Prefer JSON parsing
        proposal_text = ""
        pricing_strategy = ""
        estimated_timeline = ""
        success_tips = []
        try:
            import json

            parsed = json.loads(ai_response) if isinstance(ai_response, str) else ai_response
            if isinstance(parsed, dict):
                proposal_text = str(parsed.get("proposal_text", "")).strip()
                pricing_strategy = str(parsed.get("pricing_strategy", "")).strip()
                estimated_timeline = str(parsed.get("estimated_timeline", "")).strip()
                tips = parsed.get("success_tips", [])
                if isinstance(tips, list):
                    success_tips = [str(t).strip() for t in tips if str(t).strip()]
        except Exception:
            pass

        # Heuristic fallback if JSON not provided
        if not proposal_text and isinstance(ai_response, str):
            lines = ai_response.splitlines()
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
        proposal_text = proposal_text or (ai_response if isinstance(ai_response, str) else "")
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
            source_url=request.job_url,
            source_platform=scraped_info.get("platform"),
            extracted_title=scraped_info.get("title"),
            extracted_description=scraped_info.get("description"),
            extracted_requirements=[],  # Can be populated by future parser
            extracted_budget=budget_text or None,
            extracted_budget_type=extracted_budget_type,
            extracted_currency=extracted_currency,
            extracted_timeline=scraped_info.get("timeline"),
            extracted_skills=[str(s).strip() for s in (scraped_info.get("skills") or []) if str(s).strip()],
            client_location=scraped_info.get("location"),
        )
    except HTTPException:
        # raise explicit HTTP errors (e.g., 400)
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
