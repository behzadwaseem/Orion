from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, UTC
import uuid
from app.core.database import Base

class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now(UTC), nullable=False)
    
    # Relationships
    owner = relationship("User", backref="datasets")
    images = relationship("Image", back_populates="dataset", cascade="all, delete-orphan")