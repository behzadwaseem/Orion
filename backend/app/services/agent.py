from typing import Dict, Any, List
import statistics

class AgentService:
    
    def create_initial_plan(self, goal: str = "balanced", instructions: str = "") -> Dict[str, Any]:
        """Create plan_v0 based on goal and instructions."""
        
        # Base plans for yolo configuration
        plans = {
            "fast": {
                "tool": "yolov8",
                "model": "yolov8n.pt",
                "imgsz": 512,
                "conf": 0.30,
                "iou": 0.45,
                "max_det": 100,
                "postprocess": {"min_box_area": 200, "clamp_to_bounds": True}
            },
            "balanced": {
                "tool": "yolov8",
                "model": "yolov8s.pt",
                "imgsz": 640,
                "conf": 0.25,
                "iou": 0.45,
                "max_det": 150,
                "postprocess": {"min_box_area": 150, "clamp_to_bounds": True}
            },
            "quality": {
                "tool": "yolov8",
                "model": "yolov8s.pt",
                "imgsz": 640,
                "conf": 0.15,
                "iou": 0.45,
                "max_det": 200,
                "postprocess": {"min_box_area": 100, "clamp_to_bounds": True}
            }
        }
        
        plan = plans.get(goal, plans["balanced"]).copy()
        
        # Adjust based on instructions
        instructions_lower = instructions.lower()
        if "recall" in instructions_lower or "don't miss" in instructions_lower:
            plan["conf"] = max(0.05, plan["conf"] - 0.05)
        if "precision" in instructions_lower or "fewer false" in instructions_lower:
            plan["conf"] = min(0.70, plan["conf"] + 0.05)
        if "ignore small" in instructions_lower:
            plan["postprocess"]["min_box_area"] = int(plan["postprocess"]["min_box_area"] * 1.5)
        
        return plan
    
    def compute_sample_metrics(self, sample_results: List[List[Dict]]) -> Dict[str, Any]:
        """Compute metrics from sample run results."""
        
        all_det_counts = []
        all_confidences = []
        zero_det_count = 0
        overlap_count = 0
        total_boxes = 0
        tiny_box_count = 0
        
        for image_boxes in sample_results:
            det_count = len(image_boxes)
            all_det_counts.append(det_count)
            
            if det_count == 0:
                zero_det_count += 1
                continue
            
            # Check overlaps
            for i, box1 in enumerate(image_boxes):
                all_confidences.append(box1["confidence"])
                
                # Check if tiny
                area = box1["w"] * box1["h"]
                if area < 100:  # Threshold
                    tiny_box_count += 1
                
                for box2 in image_boxes[i+1:]:
                    iou = self._compute_iou(box1, box2)
                    if iou > 0.8:
                        overlap_count += 1
                
                total_boxes += 1
        
        return {
            "avg_dets_per_image": statistics.mean(all_det_counts) if all_det_counts else 0,
            "pct_zero_det_images": zero_det_count / len(sample_results) if sample_results else 0,
            "avg_confidence": statistics.mean(all_confidences) if all_confidences else 0,
            "overlap_rate": overlap_count / max(1, total_boxes),
            "tiny_box_ratio": tiny_box_count / max(1, total_boxes),
        }
    
    def refine_plan(self, plan_v0: Dict[str, Any], metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Refine plan based on sample metrics."""
        
        plan_v1 = plan_v0.copy()
        
        # Deterministic rules
        if metrics["pct_zero_det_images"] > 0.40:
            plan_v1["conf"] = max(0.05, plan_v1["conf"] - 0.05)
        
        if metrics["avg_dets_per_image"] > 15:
            plan_v1["conf"] = min(0.70, plan_v1["conf"] + 0.05)
        
        if metrics["overlap_rate"] > 0.25:
            plan_v1["iou"] = max(0.20, plan_v1["iou"] - 0.05)
        
        if metrics["tiny_box_ratio"] > 0.35:
            current_area = plan_v1["postprocess"]["min_box_area"]
            plan_v1["postprocess"]["min_box_area"] = int(current_area * 1.2)
        
        return plan_v1
    
    def _compute_iou(self, box1: Dict, box2: Dict) -> float:
        """Compute IoU between two boxes."""
        x1_min = box1["x"]
        y1_min = box1["y"]
        x1_max = box1["x"] + box1["w"]
        y1_max = box1["y"] + box1["h"]
        
        x2_min = box2["x"]
        y2_min = box2["y"]
        x2_max = box2["x"] + box2["w"]
        y2_max = box2["y"] + box2["h"]
        
        inter_x_min = max(x1_min, x2_min)
        inter_y_min = max(y1_min, y2_min)
        inter_x_max = min(x1_max, x2_max)
        inter_y_max = min(y1_max, y2_max)
        
        if inter_x_max <= inter_x_min or inter_y_max <= inter_y_min:
            return 0.0
        
        inter_area = (inter_x_max - inter_x_min) * (inter_y_max - inter_y_min)
        box1_area = box1["w"] * box1["h"]
        box2_area = box2["w"] * box2["h"]
        union_area = box1_area + box2_area - inter_area
        
        return inter_area / union_area if union_area > 0 else 0.0

agent_service = AgentService()