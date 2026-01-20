from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel

from app.core.deps import get_db, require_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.image import Image
from app.models.jobs import Job, JobStatus, JobType
from app.models.annotation import Annotation
from app.services.inference import yolo_service
from app.services.agent import agent_service
from datetime import datetime, UTC
from pathlib import Path
import random

router = APIRouter()

class PrelabelRequest(BaseModel):
    goal: str = "balanced"  # fast | balanced | quality
    instructions: str = ""

class JobResponse(BaseModel):
    job_id: str

@router.post("/datasets/{dataset_id}/prelabel", response_model=JobResponse)
async def start_prelabel(
    dataset_id: UUID,
    request: PrelabelRequest,
    agent_mode: bool = False,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Start auto-labeling job."""
    
    # Verify dataset ownership
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.owner_user_id == user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Count images
    image_count = db.query(Image).filter(Image.dataset_id == dataset_id).count()
    
    if image_count == 0:
        raise HTTPException(status_code=400, detail="No images to label")
    
    # Create job
    job = Job(
        dataset_id=dataset_id,
        type=JobType.PRELABEL,
        status=JobStatus.QUEUED,
        total=image_count,
        agent_mode=agent_mode
    )
    
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Run in background
    background_tasks.add_task(
        run_prelabel_job,
        job.id,
        dataset_id,
        request.goal,
        request.instructions,
        agent_mode
    )
    
    return {"job_id": str(job.id)}

def run_prelabel_job(
    job_id: UUID,
    dataset_id: UUID,
    goal: str,
    instructions: str,
    agent_mode: bool
):
    """Execute prelabel job (runs in background)."""
    
    from app.core.database import SessionLocal
    db = SessionLocal()
    
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        job.status = JobStatus.RUNNING
        db.commit()
        
        # Get all images
        images = db.query(Image).filter(Image.dataset_id == dataset_id).all()
        
        if agent_mode:
            # Agent mode: Plan → Sample → Evaluate → Refine → Full run
            
            # 1. Create initial plan
            plan_v0 = agent_service.create_initial_plan(goal, instructions)
            job.plan_v0_json = plan_v0
            db.commit()
            
            # 2. Sample run
            sample_size = min(20, len(images))
            sample_images = random.sample(images, sample_size)
            
            sample_results = []
            for img in sample_images:
                boxes = yolo_service.predict_image(
                    Path(img.storage_uri),
                    model_name=plan_v0["model"],
                    imgsz=plan_v0["imgsz"],
                    conf=plan_v0["conf"],
                    iou=plan_v0["iou"],
                    max_det=plan_v0["max_det"],
                    min_box_area=plan_v0["postprocess"]["min_box_area"]
                )
                sample_results.append(boxes)
            
            # 3. Evaluate
            metrics = agent_service.compute_sample_metrics(sample_results)
            job.sample_metrics_json = metrics
            db.commit()
            
            # 4. Refine
            plan_v1 = agent_service.refine_plan(plan_v0, metrics)
            job.plan_v1_json = plan_v1
            db.commit()
            
            # 5. Full run with refined plan
            final_plan = plan_v1
        else:
            # Direct mode: just use initial plan
            final_plan = agent_service.create_initial_plan(goal, instructions)
        
        # Run on all images
        for idx, img in enumerate(images):
            boxes = yolo_service.predict_image(
                Path(img.storage_uri),
                model_name=final_plan["model"],
                imgsz=final_plan["imgsz"],
                conf=final_plan["conf"],
                iou=final_plan["iou"],
                max_det=final_plan["max_det"],
                min_box_area=final_plan["postprocess"]["min_box_area"]
            )
            
            # Delete existing YOLO annotations
            db.query(Annotation).filter(
                Annotation.image_id == img.id,
                Annotation.source == "yolo"
            ).delete()
            
            # Create new annotations
            for box in boxes:
                annotation = Annotation(
                    image_id=img.id,
                    label=box["label"],
                    x=box["x"],
                    y=box["y"],
                    w=box["w"],
                    h=box["h"],
                    source="yolo",
                    confidence=box["confidence"]
                )
                db.add(annotation)
            
            job.processed = idx + 1
            db.commit()
        
        job.status = JobStatus.COMPLETE
        job.finished_at = datetime.now(UTC)
        db.commit()
        
    except Exception as e:
        job.status = JobStatus.FAILED
        job.error = str(e)
        db.commit()
        raise
    finally:
        db.close()

@router.get("/jobs/{job_id}")
async def get_job_status(
    job_id: UUID,
    user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Get job status and progress."""
    
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Verify ownership through dataset
    dataset = db.query(Dataset).filter(
        Dataset.id == job.dataset_id,
        Dataset.owner_user_id == user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "id": str(job.id),
        "type": job.type,
        "status": job.status,
        "processed": job.processed,
        "total": job.total,
        "error": job.error,
        "agent_mode": job.agent_mode,
        "plan_v0": job.plan_v0_json,
        "sample_metrics": job.sample_metrics_json,
        "plan_v1": job.plan_v1_json,
        "created_at": job.created_at.isoformat(),
        "finished_at": job.finished_at.isoformat() if job.finished_at else None
    }