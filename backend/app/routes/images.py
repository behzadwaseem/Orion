from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID
from pathlib import Path
from PIL import Image as PILImage

from app.core.database import get_db
from app.core.deps import require_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.image import Image
from app.models.annotation import Annotation
from app.schemas.images import ImageUploadResponse, ImageListItem

router = APIRouter(tags=["images"])

# Allowed extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Use absolute path to project root
STORAGE_BASE = Path(__file__).parent.parent.parent.parent / "data" / "images"

@router.post("/datasets/{dataset_id}/images", response_model=ImageUploadResponse)
async def upload_images(
    dataset_id: UUID,
    files: List[UploadFile] = File(...),
    user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Upload multiple images to a dataset."""
    
    # Verify dataset ownership
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.owner_user_id == user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Create storage directory
    dataset_dir = STORAGE_BASE / str(dataset_id)
    dataset_dir.mkdir(parents=True, exist_ok=True)
    
    image_ids = []
    
    for file in files:
        # Validate extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.filename}. Allowed: jpg, jpeg, png, webp"
            )
        
        # Create image record
        image = Image(
            dataset_id=dataset_id,
            filename=file.filename,
            storage_uri="",  # Will update after saving
            width=0,  # Will update after opening
            height=0
        )
        db.add(image)
        db.flush()  # Get the ID without committing
        
        # Save file with image_id prefix
        file_path = dataset_dir / f"{image.id}_{file.filename}"
        
        try:
            # Reset file pointer to beginning
            await file.seek(0)
            
            # Save uploaded file
            with file_path.open("wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            # Extract dimensions
            with PILImage.open(file_path) as img:
                width, height = img.size
            
            # Update image record
            image.storage_uri = str(file_path)
            image.width = width
            image.height = height
            
            image_ids.append(image.id)
            
        except Exception as e:
            # Clean up file if processing failed
            if file_path.exists():
                file_path.unlink()
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to process {file.filename}: {str(e)}")
    
    db.commit()
    
    return ImageUploadResponse(
        created=len(image_ids),
        image_ids=image_ids
    )

@router.get("/datasets/{dataset_id}/images", response_model=List[ImageListItem])
async def list_images(
    dataset_id: UUID,
    user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """List all images in a dataset with annotation counts."""
    
    # Verify dataset ownership
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.owner_user_id == user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Query images with annotation counts
    images = db.query(
        Image,
        func.count(Annotation.id).label("annotation_count")
    ).outerjoin(
        Annotation, Annotation.image_id == Image.id
    ).filter(
        Image.dataset_id == dataset_id
    ).group_by(
        Image.id
    ).all()
    
    # Format response
    result = []
    for image, count in images:
        result.append(ImageListItem(
            id=image.id,
            filename=image.filename,
            width=image.width,
            height=image.height,
            annotation_count=count,
            reviewed_at=image.reviewed_at
        ))
    
    return result

@router.get("/images/{image_id}/file")
async def get_image_file(
    image_id: UUID,
    user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Stream image file bytes."""
    
    # Get image and verify access through dataset ownership
    image = db.query(Image).join(Dataset).filter(
        Image.id == image_id,
        Dataset.owner_user_id == user.id
    ).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    file_path = Path(image.storage_uri)
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found on disk")
    
    # Determine media type
    ext = file_path.suffix.lower()
    media_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp"
    }
    media_type = media_types.get(ext, "application/octet-stream")
    
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=image.filename,
        headers={
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Credentials": "true",
        }
    )