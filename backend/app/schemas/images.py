from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

class ImageUploadResponse(BaseModel):
    created: int
    image_ids: list[UUID]

class ImageListItem(BaseModel):
    id: UUID
    filename: str
    width: int
    height: int
    annotation_count: int
    reviewed_at: Optional[datetime]
    
    class Config:
        from_attributes = True