#!/usr/bin/env python3
"""
Smart Attendance System - Face Recognition Service
Entry point for the FastAPI application
"""

import sys
import logging
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.config import settings
from app.api.routes import app
from app.utils.logger import setup_logger

# Setup logging
logger = setup_logger(__name__)

if __name__ == "__main__":
    import uvicorn
    
    logger.info("=" * 60)
    logger.info("Smart Attendance System - Face Recognition Service")
    logger.info("=" * 60)
    logger.info(f"Environment: {settings.APP_ENV}")
    logger.info(f"Host: {settings.HOST}")
    logger.info(f"Port: {settings.PORT}")
    logger.info(f"Debug: {settings.DEBUG}")
    logger.info(f"Workers: {settings.WORKERS}")
    logger.info(f"GPU Enabled: {settings.USE_GPU}")
    logger.info("=" * 60)
    
    uvicorn.run(
        "app.api.routes:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=settings.WORKERS if not settings.DEBUG else 1,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True
    )