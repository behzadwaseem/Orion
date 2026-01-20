from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.core.deps import require_user
from app.models.user import User
from app.models.dataset import Dataset
from app.schemas.datasets import DatasetCreate, DatasetResponse
from fastapi.responses import JSONResponse
from app.models.image import Image
from app.models.annotation import Annotation
from app.schemas.datasets import DatasetCreate, DatasetResponse


router = APIRouter(prefix="/datasets", tags=["datasets"])

@router.get("", response_model=List[DatasetResponse])
async def list_datasets(
    user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """List all datasets owned by the current user."""
    datasets = db.query(Dataset).filter(Dataset.owner_user_id == user.id).all()
    return datasets

@router.post("", response_model=DatasetResponse)
async def create_dataset(
    request: DatasetCreate,
    user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Create a new dataset."""
    dataset = Dataset(
        name=request.name,
        description=request.description,
        owner_user_id=user.id
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset

@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: UUID,
    user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Get a specific dataset by ID."""
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.owner_user_id == user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return dataset

@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: UUID,
    user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Delete a dataset and all its images/annotations."""
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.owner_user_id == user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # SQLAlchemy cascade will delete images and annotations
    db.delete(dataset)
    db.commit()
    
    return {"message": "Dataset deleted successfully"}


@router.get("/{dataset_id}/export")
async def export_dataset(
    dataset_id: UUID,
    user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Export dataset annotations as JSON."""
    
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.owner_user_id == user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    images = db.query(Image).filter(Image.dataset_id == dataset_id).all()
    
    export_data = {
        "dataset": {
            "id": str(dataset.id),
            "name": dataset.name,
            "description": dataset.description,
            "created_at": dataset.created_at.isoformat()
        },
        "images": [],
        "annotations": []
    }
    
    for img in images:
        export_data["images"].append({
            "id": str(img.id),
            "filename": img.filename,
            "width": img.width,
            "height": img.height
        })
        
        annotations = db.query(Annotation).filter(Annotation.image_id == img.id).all()
        
        for ann in annotations:
            export_data["annotations"].append({
                "id": str(ann.id),
                "image_id": str(ann.image_id),
                "label": ann.label,
                "x": ann.x,
                "y": ann.y,
                "w": ann.w,
                "h": ann.h,
                "source": ann.source,
                "confidence": ann.confidence
            })
    
    return JSONResponse(
        content=export_data,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={dataset.name}_export.json"
        }
    )