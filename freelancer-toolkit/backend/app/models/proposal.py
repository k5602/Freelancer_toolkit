from pydantic import BaseModel


class ProposalRequest(BaseModel):
    job_description: str


class ProposalResponse(BaseModel):
    proposal_text: str
