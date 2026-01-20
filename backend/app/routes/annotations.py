from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, UTC

from app.core.database import get_db
from app.core.deps import require_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.image import Image
from app.models.annotation import Annotation, AnnotationSource
from app.schemas.annotations import AnnotationItem, AnnotationBatchUpdate

router = APIRouter(tags=["annotations"])

@router.get("/images/{image_id}/annotations", response_model=List[AnnotationItem])
async def get_annotations(
    image_id: UUID,
    user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Get all annotations for an image."""
    
    # Verify image access through dataset ownership
    image = db.query(Image).join(Dataset).filter(
        Image.id == image_id,
        Dataset.owner_user_id == user.id
    ).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    annotations = db.query(Annotation).filter(
        Annotation.image_id == image_id
    ).all()
    
    return annotations

@router.put("/images/{image_id}/annotations")
async def update_annotations(
    image_id: UUID,
    request: AnnotationBatchUpdate,
    user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Replace all annotations for an image (replace-all strategy)."""
    
    # Verify image access through dataset ownership
    image = db.query(Image).join(Dataset).filter(
        Image.id == image_id,
        Dataset.owner_user_id == user.id
    ).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Delete all existing annotations for this image
    db.query(Annotation).filter(Annotation.image_id == image_id).delete()
    
    # Create new annotations
    new_annotations = []
    for ann_input in request.annotations:
        annotation = Annotation(
            image_id=image_id,
            label=ann_input.label,
            x=ann_input.x,
            y=ann_input.y,
            w=ann_input.w,
            h=ann_input.h,
            source=AnnotationSource.manual,
            confidence=None
        )
        db.add(annotation)
        new_annotations.append(annotation)
    
    db.commit()
    
    # Refresh all to get IDs and timestamps
    for ann in new_annotations:
        db.refresh(ann)
    
    return {
        "image_id": image_id,
        "saved": len(new_annotations),
        "annotations": [
            {
                "id": str(ann.id),
                "label": ann.label,
                "x": ann.x,
                "y": ann.y,
                "w": ann.w,
                "h": ann.h,
                "source": ann.source.value,
                "confidence": ann.confidence
            }
            for ann in new_annotations
        ]
    }

@router.post("/images/{image_id}/reviewed")
async def mark_reviewed(
    image_id: UUID,
    user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Mark an image as reviewed."""
    
    # Verify image access through dataset ownership
    image = db.query(Image).join(Dataset).filter(
        Image.id == image_id,
        Dataset.owner_user_id == user.id
    ).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    image.reviewed_at = datetime.now(UTC)
    db.commit()
    
    return {"image_id": image_id, "reviewed_at": image.reviewed_at}