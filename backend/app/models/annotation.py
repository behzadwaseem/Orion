from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, UTC
import uuid
import enum
from app.core.database import Base

class AnnotationSource(str, enum.Enum):
    manual = "manual"
    yolo = "yolo"

class Annotation(Base):
    __tablename__ = "annotations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_id = Column(UUID(as_uuid=True), ForeignKey("images.id"), nullable=False)
    label = Column(String, nullable=False, default="object")
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    w = Column(Float, nullable=False)
    h = Column(Float, nullable=False)
    source = Column(SQLEnum(AnnotationSource), nullable=False, default=AnnotationSource.manual)
    confidence = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=datetime.now(UTC), onupdate=datetime.now(UTC), nullable=False)
    
    # Relationships
    image = relationship("Image", back_populates="annotations")