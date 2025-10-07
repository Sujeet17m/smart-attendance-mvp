# face-service/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.api.routes import router as api_router
from app.config import settings
from app.utils.logger import setup_logger
from app.core.database import init_db

logger = setup_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("🚀 Starting Smart-Tend AI Face Recognition Service...")
    
    # Initialize database connection
    await init_db()
    
    logger.info("✅ Face Recognition Service started successfully")
    yield
    
    logger.info("👋 Shutting down Face Recognition Service...")


app = FastAPI(
    title="Smart-Tend AI Face Recognition Service",
    description="Advanced face detection and recognition for attendance system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "service": "Smart-Tend AI Face Recognition",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "face-recognition"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )