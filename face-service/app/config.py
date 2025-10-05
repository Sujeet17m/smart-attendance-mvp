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

import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = Field(default="Face Recognition Service")
    APP_ENV: str = Field(default="development")
    DEBUG: bool = Field(default=True)
    
    # Server
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)
    WORKERS: int = Field(default=1)
    
    # Database
    DB_HOST: str = Field(default="localhost")
    DB_PORT: int = Field(default=5432)
    DB_NAME: str = Field(default="attendance")
    DB_USER: str = Field(default="postgres")
    DB_PASSWORD: str = Field(default="postgres123")
    DB_POOL_SIZE: int = Field(default=5)
    DB_MAX_OVERFLOW: int = Field(default=10)
    
    # Face Detection
    FACE_CONFIDENCE_THRESHOLD: float = Field(default=0.9)
    MIN_FACE_SIZE: int = Field(default=20)
    MTCNN_THRESHOLDS: str = Field(default="0.6,0.7,0.9")
    
    # Face Recognition
    RECOGNITION_THRESHOLD: float = Field(default=0.75)
    EMBEDDING_DIMENSION: int = Field(default=512)
    MODEL_VERSION: str = Field(default="v1.0")
    
    # Video Processing
    VIDEO_FRAME_SAMPLING_RATE: int = Field(default=3)
    MAX_VIDEO_DURATION: int = Field(default=10)
    BATCH_SIZE: int = Field(default=8)
    MAX_FACES_PER_FRAME: int = Field(default=50)
    
    # Performance
    USE_GPU: bool = Field(default=False)
    GPU_MEMORY_FRACTION: float = Field(default=0.7)
    MAX_WORKERS: int = Field(default=4)
    
    # Model Paths
    MODEL_PATH: str = Field(default="/app/models")
    FACENET_MODEL: str = Field(default="vggface2")
    MTCNN_DEVICE: str = Field(default="cpu")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FILE: str = Field(default="/app/logs/face-service.log")
    LOG_FORMAT: str = Field(default="json")
    
    # API Security
    API_KEY: str = Field(default="")
    ALLOWED_ORIGINS: str = Field(default="*")
    
    # AWS
    AWS_REGION: str = Field(default="us-east-1")
    AWS_ACCESS_KEY_ID: str = Field(default="")
    AWS_SECRET_ACCESS_KEY: str = Field(default="")
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def database_url(self) -> str:
        """Get PostgreSQL connection URL"""
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    @property
    def mtcnn_thresholds_list(self) -> List[float]:
        """Parse MTCNN thresholds"""
        return [float(x) for x in self.MTCNN_THRESHOLDS.split(",")]
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse allowed origins"""
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


# Create settings instance
settings = Settings()
