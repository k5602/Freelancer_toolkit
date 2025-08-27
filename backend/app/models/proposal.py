from pydantic import BaseModel, Field, field_validator


class ProposalRequest(BaseModel):
    job_url: str | None = Field(
        default=None, description="URL to job posting (optional)"
    )
    job_description: str | None = Field(
        default=None,
        min_length=10,
        max_length=5000,
        description="Job description text (optional if job_url provided)",
    )
    user_skills: list[str] = Field(
        default_factory=list, description="List of freelancer skills"
    )
    target_rate: float | None = Field(
        default=None, description="Desired hourly rate (optional)"
    )

    @field_validator("job_description")
    def description_not_empty(cls, v, values):
        if not v and not values.get("job_url"):
            raise ValueError("Either job_description or job_url must be provided.")
        return v


class ProposalResponse(BaseModel):
    proposal_text: str = Field(
        ..., min_length=10, description="Generated proposal text"
    )
    pricing_strategy: str = Field(
        ..., description="Rate justification and pricing strategy"
    )
    estimated_timeline: str = Field(..., description="Estimated project timeline")
    success_tips: list[str] = Field(
        default_factory=list, description="Improvement suggestions for proposal"
    )
