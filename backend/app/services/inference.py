from ultralytics import YOLO
from pathlib import Path
from typing import List, Dict, Any
import logging
import os

logger = logging.getLogger(__name__)

class YOLOService:
    def __init__(self):
        self.models = {}
        # Get the models directory path
        self.models_dir = Path(__file__).parent.parent.parent / "yolo-models"
        self.models_dir.mkdir(exist_ok=True)  # Create if doesn't exist
    
    def load_model(self, model_name: str):
        """Load YOLO model (cached)."""
        if model_name not in self.models:
            logger.info(f"Loading YOLO model: {model_name}")
            
            # Check if model exists in local models folder first
            local_model_path = self.models_dir / model_name
            
            if local_model_path.exists():
                logger.info(f"Using local model: {local_model_path}")
                self.models[model_name] = YOLO(str(local_model_path))
            else:
                # Fallback to downloading from ultralytics
                logger.info(f"Model not found locally, downloading: {model_name}")
                self.models[model_name] = YOLO(model_name)
                
        return self.models[model_name]
    
    def predict_image(
        self,
        image_path: Path,
        model_name: str = "yolov8n.pt",
        imgsz: int = 640,
        conf: float = 0.25,
        iou: float = 0.45,
        max_det: int = 100,
        min_box_area: int = 100,
    ) -> List[Dict[str, Any]]:
        """Run YOLO on single image, return boxes in xywh format."""
        
        model = self.load_model(model_name)
        
        results = model.predict(
            source=str(image_path),
            imgsz=imgsz,
            conf=conf,
            iou=iou,
            max_det=max_det,
            verbose=False
        )
        
        boxes = []
        
        if results and len(results) > 0:
            result = results[0]
            
            if result.boxes is not None:
                for box in result.boxes:
                    # Convert xyxy to xywh
                    xyxy = box.xyxy[0].cpu().numpy()
                    x1, y1, x2, y2 = xyxy
                    x, y, w, h = x1, y1, x2 - x1, y2 - y1
                    
                    # Filter by min area
                    area = w * h
                    if area < min_box_area:
                        continue
                    
                    # Clamp to bounds
                    x = max(0, x)
                    y = max(0, y)
                    w = max(0, w)
                    h = max(0, h)
                    
                    boxes.append({
                        "x": float(x),
                        "y": float(y),
                        "w": float(w),
                        "h": float(h),
                        "confidence": float(box.conf[0]),
                        "label": "object",  # Simplified for MVP
                    })
        
        return boxes

# Singleton instance
yolo_service = YOLOService()