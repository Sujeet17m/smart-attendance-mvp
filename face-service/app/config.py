import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    # Face data storage
    FACE_DATA_DIR: str = "face_data"
    
    # Face recognition parameters
    FACE_RECOGNITION_TOLERANCE: float = 0.6
    MIN_FACE_SIZE: int = 20

    class Config:
        env_file = ".env"

settings = Settings()
