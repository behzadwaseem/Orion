from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    # starred: Optional[bool]

class DatasetResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True