from pydantic import BaseModel, Field, field_validator


class ProposalRequest(BaseModel):
    job_description: str = Field(
        ..., min_length=10, max_length=5000, description="Job description text"
    )

    @field_validator("job_description")
    def description_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Job description must not be empty")
        return v


class ProposalResponse(BaseModel):
    proposal_text: str = Field(
        ..., min_length=10, description="Generated proposal text"
    )
