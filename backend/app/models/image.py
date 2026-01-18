from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, UTC
import uuid
from app.core.database import Base

class Image(Base):
    __tablename__ = "images"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id"), nullable=False)
    filename = Column(String, nullable=False)
    storage_uri = Column(String, nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.now(UTC), nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Relationships
    dataset = relationship("Dataset", back_populates="images")
    annotations = relationship("Annotation", back_populates="image", cascade="all, delete-orphan")