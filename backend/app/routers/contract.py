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
        prompt = f"Generate a contract based on the following project description:\n\n{request.project_description}"
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
