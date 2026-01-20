from sqlalchemy import Column, String, Integer, Boolean, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base

class JobStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETE = "complete"
    FAILED = "failed"

class JobType(str, enum.Enum):
    PRELABEL = "prelabel"
    EXPORT = "export"

class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), nullable=False)
    type = Column(SQLEnum(JobType), nullable=False)
    status = Column(SQLEnum(JobStatus), default=JobStatus.QUEUED, nullable=False)
    processed = Column(Integer, default=0)
    total = Column(Integer, default=0)
    error = Column(String, nullable=True)
    agent_mode = Column(Boolean, default=False)
    plan_v0_json = Column(JSON, nullable=True)
    sample_metrics_json = Column(JSON, nullable=True)
    plan_v1_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)