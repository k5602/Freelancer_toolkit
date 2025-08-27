from pydantic import BaseModel


class ContractRequest(BaseModel):
    project_description: str


class ContractResponse(BaseModel):
    contract_text: str
