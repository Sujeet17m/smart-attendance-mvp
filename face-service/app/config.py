# import os
# from pydantic import BaseSettings

# class Settings(BaseSettings):
#     # Face data storage
#     FACE_DATA_DIR: str = "face_data"
    
#     # Face recognition parameters
#     FACE_RECOGNITION_TOLERANCE: float = 0.6
#     MIN_FACE_SIZE: int = 20

#     class Config:
#         env_file = ".env"

# settings = Settings()

"""
Configuration Management
"""

# import os
# from typing import List
# from pydantic_settings import BaseSettings


# class Settings(BaseSettings):
#     # Application
#     APP_NAME: str = "Smart-Tend Face Recognition"
#     HOST: str = "0.0.0.0"
#     PORT: int = 8002
#     DEBUG: bool = False
    
#     # CORS
#     ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5000"]
    
#     # Database
#     POSTGRES_HOST: str = "localhost"
#     POSTGRES_PORT: int = 5432
#     POSTGRES_DB: str = "smart_attendance"
#     POSTGRES_USER: str = "postgres"
#     POSTGRES_PASSWORD: str = "password"
    
#     # AWS S3
#     AWS_ACCESS_KEY_ID: str = ""
#     AWS_SECRET_ACCESS_KEY: str = ""
#     AWS_REGION: str = "us-east-1"
#     S3_BUCKET_NAME: str = "smart-attend-faces"
    
#     # Face Detection Settings
#     DETECTION_CONFIDENCE: float = 0.7
#     MIN_FACE_SIZE: int = 80
#     MAX_FACES_PER_FRAME: int = 50
    
#     # Face Recognition Settings
#     RECOGNITION_THRESHOLD: float = 0.6
#     EMBEDDING_SIZE: int = 512
    
#     # Liveness Detection
#     ENABLE_LIVENESS: bool = True
#     LIVENESS_THRESHOLD: float = 0.85
    
#     # Processing
#     VIDEO_FRAME_RATE: int = 2  # Process 2 frames per second
#     MAX_VIDEO_DURATION: int = 10  # seconds
#     BATCH_SIZE: int = 16
    
#     # GPU
#     USE_GPU: bool = True
#     GPU_DEVICE: int = 0
    
#     # Logging
#     LOG_LEVEL: str = "INFO"
    
#     class Config:
#         env_file = ".env"
#         case_sensitive = True


# settings = Settings()

import os
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Smart-Tend Face Recognition"
    HOST: str = "0.0.0.0"
    PORT: int = 8002
    DEBUG: bool = False
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5000"]
    
    # Database
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "smart_attendance"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres123"
    
    # Storage Settings - AWS is OPTIONAL
    STORAGE_TYPE: str = "local"  # Options: "local" or "s3"
    LOCAL_STORAGE_PATH: str = "./storage/faces"  # Local storage directory
    
    # AWS S3 (Optional - only needed if STORAGE_TYPE="s3")
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: Optional[str] = None
    
    # Face Detection Settings
    DETECTION_CONFIDENCE: float = 0.7
    MIN_FACE_SIZE: int = 80
    MAX_FACES_PER_FRAME: int = 50
    
    # Face Recognition Settings
    RECOGNITION_THRESHOLD: float = 0.6
    EMBEDDING_SIZE: int = 512
    
    # Liveness Detection
    ENABLE_LIVENESS: bool = True
    LIVENESS_THRESHOLD: float = 0.85
    
    # Processing
    VIDEO_FRAME_RATE: int = 2
    MAX_VIDEO_DURATION: int = 10
    BATCH_SIZE: int = 16
    
    # GPU
    USE_GPU: bool = False
    GPU_DEVICE: int = 0
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    def is_s3_enabled(self) -> bool:
        """Check if S3 storage is enabled and configured"""
        return (
            self.STORAGE_TYPE == "s3" and
            self.AWS_ACCESS_KEY_ID is not None and
            self.AWS_SECRET_ACCESS_KEY is not None and
            self.S3_BUCKET_NAME is not None
        )
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Create local storage directory if using local storage
if settings.STORAGE_TYPE == "local":
    os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)