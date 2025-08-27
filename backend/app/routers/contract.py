from fastapi import APIRouter
from app.models.contract import ContractRequest, ContractResponse
from app.services.perplexity import get_completion

router = APIRouter()


@router.post("/generate")
async def generate_contract(request: ContractRequest) -> ContractResponse:
    """
    Generate a contract from a project description.
    """
    prompt = f"Generate a contract based on the following project description:\n\n{request.project_description}"
    contract_text = await get_completion(prompt)
    return ContractResponse(contract_text=contract_text)
