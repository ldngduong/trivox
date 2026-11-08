"""Pydantic v2 request and response schemas for CAD compilation."""
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class CompileRequestSchema(BaseModel):
    sessionId: str = Field(..., min_length=1, max_length=128)
    code: str = Field(..., min_length=10)
    outputPath: str = Field(..., min_length=1)
    timeoutSec: float = Field(default=25.0, ge=1.0, le=60.0)


class DimensionsSchema(BaseModel):
    width: float
    depth: float
    height: float


class ExtractedJointSchema(BaseModel):
    id: str
    type: Literal["revolute", "continuous", "prismatic", "free"]
    unit: str
    min: float
    max: float
    default: float


class CompileResponseSchema(BaseModel):
    ok: bool
    elapsedMs: int
    glbPath: Optional[str] = None
    blendPath: Optional[str] = None
    parts: List[str] = Field(default_factory=list)
    joints: List[ExtractedJointSchema] = Field(default_factory=list)
    dimensions: Optional[DimensionsSchema] = None
    error: Optional[str] = None
    traceback: Optional[str] = None
