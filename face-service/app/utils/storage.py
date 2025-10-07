import os
import logging
from datetime import datetime
from typing import Optional
import cv2
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)


class StorageService:
    """Unified storage service supporting local and S3 storage"""
    
    def __init__(self, settings):
        self.settings = settings
        self.storage_type = settings.STORAGE_TYPE
        self.s3_client = None
        
        if self.storage_type == "local":
            self._setup_local_storage()
        elif self.storage_type == "s3":
            self._setup_s3_storage()
    
    def _setup_local_storage(self):
        """Setup local file storage"""
        storage_path = Path(self.settings.LOCAL_STORAGE_PATH)
        storage_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"✅ Using local storage: {storage_path.absolute()}")
    
    def _setup_s3_storage(self):
        """Setup S3 storage (optional)"""
        if not self.settings.is_s3_enabled():
            logger.warning("⚠️  S3 storage selected but credentials not provided. Falling back to local storage.")
            self.storage_type = "local"
            self._setup_local_storage()
            return
        
        try:
            import boto3
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=self.settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=self.settings.AWS_SECRET_ACCESS_KEY,
                region_name=self.settings.AWS_REGION
            )
            logger.info(f"✅ Using S3 storage: {self.settings.S3_BUCKET_NAME}")
        except ImportError:
            logger.error("❌ boto3 not installed. Install with: pip install boto3")
            logger.warning("⚠️  Falling back to local storage")
            self.storage_type = "local"
            self._setup_local_storage()
        except Exception as e:
            logger.error(f"❌ Error initializing S3: {e}")
            logger.warning("⚠️  Falling back to local storage")
            self.storage_type = "local"
            self._setup_local_storage()
    
    async def save_face_image(
        self,
        student_id: str,
        image: np.ndarray,
        index: int = 0
    ) -> str:
        """
        Save face image to storage
        
        Args:
            student_id: Student identifier
            image: Face image (numpy array)
            index: Image index for multiple images
            
        Returns:
            URL or path to saved image
        """
        try:
            # Generate filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{student_id}_{timestamp}_{index}.jpg"
            
            # Encode image
            _, buffer = cv2.imencode('.jpg', image, [cv2.IMWRITE_JPEG_QUALITY, 95])
            image_bytes = buffer.tobytes()
            
            if self.storage_type == "local":
                return await self._save_local(student_id, filename, image_bytes)
            else:
                return await self._save_s3(student_id, filename, image_bytes)
                
        except Exception as e:
            logger.error(f"Error saving image: {e}")
            raise
    
    async def _save_local(
        self,
        student_id: str,
        filename: str,
        image_bytes: bytes
    ) -> str:
        """Save to local file system"""
        try:
            # Create student directory
            student_dir = Path(self.settings.LOCAL_STORAGE_PATH) / student_id
            student_dir.mkdir(parents=True, exist_ok=True)
            
            # Save file
            file_path = student_dir / filename
            file_path.write_bytes(image_bytes)
            
            # Return relative path
            relative_path = f"faces/{student_id}/{filename}"
            logger.debug(f"Saved locally: {file_path}")
            
            return relative_path
            
        except Exception as e:
            logger.error(f"Error saving to local storage: {e}")
            raise
    
    async def _save_s3(
        self,
        student_id: str,
        filename: str,
        image_bytes: bytes
    ) -> str:
        """Save to S3 bucket"""
        try:
            from io import BytesIO
            
            # S3 key
            key = f"faces/{student_id}/{filename}"
            
            # Upload to S3
            self.s3_client.upload_fileobj(
                BytesIO(image_bytes),
                self.settings.S3_BUCKET_NAME,
                key,
                ExtraArgs={'ContentType': 'image/jpeg'}
            )
            
            # Generate URL
            url = f"https://{self.settings.S3_BUCKET_NAME}.s3.{self.settings.AWS_REGION}.amazonaws.com/{key}"
            logger.debug(f"Saved to S3: {url}")
            
            return url
            
        except Exception as e:
            logger.error(f"Error saving to S3: {e}")
            # Fallback to local storage
            logger.warning("Falling back to local storage")
            return await self._save_local(student_id, filename, image_bytes)
    
    async def delete_student_images(self, student_id: str) -> int:
        """Delete all images for a student"""
        try:
            if self.storage_type == "local":
                return await self._delete_local(student_id)
            else:
                return await self._delete_s3(student_id)
        except Exception as e:
            logger.error(f"Error deleting images: {e}")
            return 0
    
    async def _delete_local(self, student_id: str) -> int:
        """Delete from local storage"""
        try:
            student_dir = Path(self.settings.LOCAL_STORAGE_PATH) / student_id
            
            if not student_dir.exists():
                return 0
            
            # Count and delete files
            files = list(student_dir.glob("*.jpg"))
            count = len(files)
            
            for file in files:
                file.unlink()
            
            # Remove directory if empty
            if not any(student_dir.iterdir()):
                student_dir.rmdir()
            
            logger.info(f"Deleted {count} local images for student {student_id}")
            return count
            
        except Exception as e:
            logger.error(f"Error deleting from local storage: {e}")
            return 0
    
    async def _delete_s3(self, student_id: str) -> int:
        """Delete from S3 bucket"""
        try:
            # List objects
            prefix = f"faces/{student_id}/"
            response = self.s3_client.list_objects_v2(
                Bucket=self.settings.S3_BUCKET_NAME,
                Prefix=prefix
            )
            
            if 'Contents' not in response:
                return 0
            
            # Delete objects
            objects = [{'Key': obj['Key']} for obj in response['Contents']]
            
            if objects:
                self.s3_client.delete_objects(
                    Bucket=self.settings.S3_BUCKET_NAME,
                    Delete={'Objects': objects}
                )
            
            count = len(objects)
            logger.info(f"Deleted {count} S3 images for student {student_id}")
            return count
            
        except Exception as e:
            logger.error(f"Error deleting from S3: {e}")
            return 0
    
    def get_image_url(self, relative_path: str) -> str:
        """Get full URL/path for an image"""
        if self.storage_type == "local":
            # Return path that can be served by backend
            return f"/storage/{relative_path}"
        else:
            # S3 URL is already complete
            return relative_path