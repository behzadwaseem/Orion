from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.core.deps import require_user
from app.models.user import User
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetCreate, DatasetResponse

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