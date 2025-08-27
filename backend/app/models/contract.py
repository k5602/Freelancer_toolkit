from pydantic import BaseModel, Field, field_validator


class ContractRequest(BaseModel):
    project_description: str = Field(
        ..., min_length=10, max_length=5000, description="Project description text"
    )

    @field_validator("project_description")
    def description_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Project description must not be empty")
        return v


class ContractResponse(BaseModel):
    contract_text: str = Field(
        ..., min_length=10, description="Generated contract text"
    )
