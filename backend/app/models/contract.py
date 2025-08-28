from pydantic import BaseModel, Field, model_validator


class ContractRequest(BaseModel):
    # Allow either a raw project_description OR a proposal + client_details
    project_description: str | None = Field(
        default=None,
        min_length=10,
        max_length=5000,
        description="Project description text (optional if proposal is provided)",
    )
    proposal: str | None = Field(
        default=None,
        min_length=10,
        max_length=10000,
        description="Generated proposal text (optional if project_description is provided)",
    )
    client_details: str | None = Field(
        default=None,
        max_length=5000,
        description="Client name, company, and any constraints (optional)",
    )

    @model_validator(mode="after")
    def validate_inputs(self):
        has_desc = bool(self.project_description and self.project_description.strip())
        has_prop = bool(self.proposal and self.proposal.strip())
        if not (has_desc or has_prop):
            raise ValueError("Either project_description or proposal must be provided.")
        return self


class ContractResponse(BaseModel):
    contract_text: str = Field(
        ..., min_length=10, description="Generated contract text"
    )
