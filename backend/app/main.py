from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes import auth, datasets, images, annotations

app = FastAPI(title="Orion API", version="0.1.0")

# CORS Configuration 
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Important for file downloads
)

# Include routers
app.include_router(auth.router)
app.include_router(datasets.router)
app.include_router(images.router)
app.include_router(annotations.router)

@app.get("/")
async def root():
    return {"message": "Orion API", "version": "0.1.0"}

@app.get("/health")
async def health():
    return {"status": "ok"}