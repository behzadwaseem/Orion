from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class AnnotationItem(BaseModel):
    id: UUID
    label: str
    x: float
    y: float
    w: float
    h: float
    source: str
    confidence: Optional[float]
    
    class Config:
        from_attributes = True

class AnnotationInput(BaseModel):
    label: str = "object"
    x: float
    y: float
    w: float
    h: float

class AnnotationBatchUpdate(BaseModel):
    annotations: list[AnnotationInput]