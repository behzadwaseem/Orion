# Orion

Orion is a full stack web app for creating computer vision datasets with manual bounding box annotation and YOLO-powered auto-labeling. It includes an optional Agent Mode that samples images, computes simple quality metrics, and adjusts YOLO parameters before labeling the full dataset.

[<img width="1440" height="876" alt="image" src="https://github.com/user-attachments/assets/9295f6a0-e250-45fb-abe2-390e8a10fbda" />](https://www.youtube.com/watch?v=c68kAMMEUuk)


## Features

- Datasets: create, list, delete
- Images: upload, list, authenticated file serving
- Annotations: create, update, delete; source tracking (manual vs yolo)
- Auto-labeling: background prelabel jobs with progress polling
- Agent Mode: sample, evaluate, refine YOLO settings before full run
- Export: download dataset and annotations as JSON

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind, shadcn/ui
- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL
- CV: Ultralytics YOLOv8

## Repo Structure

- `frontend/` Next.js app
- `backend/` FastAPI app
- `backend/models/` YOLO model weights (optional local models)
- `backend/uploads/` stored images (local dev)

## Requirements

- Node.js 18+
- pnpm
- Python 3.11+
- Poetry
- PostgreSQL 14+

## Quick Start

### 1) Backend

```bash
cd Orion/backend
poetry install
cp .env.example .env
```

Update `.env` with your database connection and auth settings.

Run migrations:

```bash
poetry run alembic upgrade head
```

Start the API:

```bash
poetry run uvicorn app.main:app --reload --port 8000
```

Optional: use local YOLO weights
- Put model files in `backend/models/` (example: `yolov8n.pt`, `yolov8s.pt`)
- The inference service will load from `backend/models/` if present

### 2) Frontend

```bash
cd Orion/frontend
pnpm install
```

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the web app:

```bash
pnpm dev
```

Open:

- http://localhost:3000

## Usage

1. Sign up and log in
2. Create a dataset
3. Upload images into the dataset
4. Open the annotate view to draw boxes and save
5. Use Auto-Label with AI to generate YOLO annotations
6. Optionally enable Agent Mode and add instructions to tune parameters
7. Export JSON when ready

## Agent Mode (What It Does)

When Agent Mode is enabled for auto-labeling:

1. Create an initial YOLO plan (goal-based defaults)
2. Run YOLO on a small sample of images
3. Compute metrics such as:
   - average detections per image
   - percent of images with zero detections
   - overlap rate
   - tiny box ratio
4. Refine the plan deterministically (adjust confidence, IoU, min box area)
5. Run YOLO on the full dataset with the refined plan

## API Overview

Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

Datasets
- `GET /datasets`
- `POST /datasets`
- `GET /datasets/{dataset_id}`
- `DELETE /datasets/{dataset_id}`
- `GET /datasets/{dataset_id}/export`

Images
- `GET /datasets/{dataset_id}/images`
- `POST /datasets/{dataset_id}/images`
- `GET /images/{image_id}/file`

Annotations
- `GET /images/{image_id}/annotations`
- `POST /images/{image_id}/annotations`

Auto-labeling and jobs
- `POST /datasets/{dataset_id}/prelabel`
- `GET /jobs/{job_id}`

## Notes

- Image file endpoints are authenticated. The frontend loads images via `fetch(..., { credentials: "include" })` and renders them from a blob URL.
- If you add new tables or models, generate and apply a migration:
  ```bash
  cd Orion/backend
  poetry run alembic revision --autogenerate -m "your message"
  poetry run alembic upgrade head
  ```

## Next Steps

This project is designed to be extended. Possible next steps include:

- Cloud storage integration
  - Store images and exports in S3, GCS, or Azure Blob Storage
  - Use signed URLs for secure, time-limited access to image files
  - Add lifecycle policies for storage management

- Scalable background processing
  - Replace in-process background tasks with Celery, RQ, or Dramatiq
  - Add a worker queue backed by Redis for distributed inference jobs
  - Support cancellation, retries, and priority scheduling

- LLM-assisted instruction extraction
  - Use an LLM to parse user instructions into structured constraints
  - Examples: preferred classes, ignore rules, size filters, confidence bias
  - Store structured instruction outputs alongside job plans for auditing

- Support additional visual models
  - Segmentation models (SAM, YOLO-seg, Mask R-CNN) for mask annotations
  - Pose estimation (YOLO-pose, OpenPose) for keypoints
  - Classification models for image-level labels
  - OCR pipelines (text detection plus recognition) for document datasets

- Add new annotation types and tools
  - Polygons and segmentation masks
  - Keypoints and skeletons
  - Rotated boxes and oriented bounding boxes
  - Tracking IDs for video or multi-frame sequences

- Production deployment
  - Containerize with Docker and add a production ASGI server configuration
  - Deploy API and workers on a managed platform (ECS, Cloud Run, AKS)
  - Add observability: structured logs, metrics, tracing, and alerting
  - Add CI for linting, tests, and migrations

## License

MIT
