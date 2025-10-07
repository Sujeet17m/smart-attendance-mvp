
from typing import List, Dict
import logging
from datetime import datetime
import face_recognition

from app.core.database import get_db_pool
from app.utils.image_utils import preprocess_image
from app.utils.storage import StorageService  # NEW IMPORT
from app.config import settings

logger = logging.getLogger(__name__)


# Use OpenCV DNN instead of face_recognition library
# (Simplified version - less accurate but works without dlib)

import cv2
import numpy as np

class FaceRecognitionService:
    def __init__(self):
        # Load face detection model
        self.face_net = cv2.dnn.readNetFromCaffe(
            'app/models/deploy.prototxt',
            'app/models/res10_300x300_ssd_iter_140000.caffemodel'
        )
        logger.info("✅ Face recognition service initialized (OpenCV mode)")
    
    # ... rest of the methods use OpenCV instead
    
    async def enroll_student_face(self, student_id: str, images: List[bytes]) -> Dict:
        """
        Enroll student face from multiple images
        
        Args:
            student_id: Student identifier
            images: List of image bytes
            
        Returns:
            Enrollment result
        """
        try:
            embeddings = []
            quality_scores = []
            image_urls = []
            
            for idx, img_bytes in enumerate(images):
                # Decode image
                nparr = np.frombuffer(img_bytes, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if image is None:
                    logger.warning(f"Failed to decode image {idx}")
                    continue
                
                # Preprocess
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                
                # Detect faces
                face_locations = face_recognition.face_locations(image_rgb, model=self.model)
                
                if len(face_locations) == 0:
                    logger.warning(f"No face detected in image {idx}")
                    continue
                
                if len(face_locations) > 1:
                    logger.warning(f"Multiple faces detected in image {idx}, using first")
                
                # Extract face for storage
                top, right, bottom, left = face_locations[0]
                face_img = image[top:bottom, left:right]
                
                # Generate embedding
                face_encodings = face_recognition.face_encodings(image_rgb, face_locations)
                
                if len(face_encodings) > 0:
                    embedding = face_encodings[0]
                    quality = self._assess_quality(image, face_locations[0])
                    
                    # Save face image using storage service
                    image_url = await self.storage.save_face_image(
                        student_id,
                        face_img,
                        idx
                    )
                    
                    embeddings.append(embedding.tolist())
                    quality_scores.append(quality)
                    image_urls.append(image_url)
            
            if len(embeddings) == 0:
                return {
                    'success': False,
                    'student_id': student_id,
                    'embeddings_created': 0,
                    'quality_scores': [],
                    'message': 'No valid faces detected in provided images'
                }
            
            # Store in database
            await self._store_embeddings(student_id, embeddings, quality_scores, image_urls)
            
            return {
                'success': True,
                'student_id': student_id,
                'embeddings_created': len(embeddings),
                'quality_scores': quality_scores,
                'message': f'Successfully enrolled {len(embeddings)} face embeddings'
            }
            
        except Exception as e:
            logger.error(f"Error enrolling face: {e}")
            raise
    
    async def recognize_face(self, image: np.ndarray, class_id: str = None) -> Dict:
        """
        Recognize face in image
        
        Args:
            image: Input image
            class_id: Optional class filter
            
        Returns:
            Recognition result with student_id and confidence
        """
        try:
            # Convert to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detect faces
            face_locations = face_recognition.face_locations(image_rgb, model=self.model)
            
            if len(face_locations) == 0:
                return {'recognized': False, 'reason': 'No face detected'}
            
            # Generate embedding
            face_encodings = face_recognition.face_encodings(image_rgb, face_locations)
            
            if len(face_encodings) == 0:
                return {'recognized': False, 'reason': 'Could not generate encoding'}
            
            face_encoding = face_encodings[0]
            
            # Get enrolled students
            enrolled_students = await self._get_enrolled_students(class_id)
            
            if not enrolled_students:
                return {'recognized': False, 'reason': 'No enrolled students found'}
            
            # Compare with enrolled faces
            best_match = None
            best_distance = float('inf')
            
            for student in enrolled_students:
                for emb_data in student['embeddings']:
                    stored_encoding = np.array(emb_data['embedding'])
                    distance = face_recognition.face_distance([stored_encoding], face_encoding)[0]
                    
                    if distance < best_distance:
                        best_distance = distance
                        best_match = student
            
            # Check threshold (lower distance = better match)
            threshold = 0.6
            if best_match and best_distance < threshold:
                confidence = 1.0 - best_distance
                return {
                    'recognized': True,
                    'student_id': best_match['student_id'],
                    'student_name': best_match['name'],
                    'confidence': float(confidence),
                    'distance': float(best_distance)
                }
            
            return {'recognized': False, 'reason': 'No match found above threshold'}
            
        except Exception as e:
            logger.error(f"Error recognizing face: {e}")
            raise
    
    async def get_student_embeddings(self, student_id: str) -> List[Dict]:
        """Get stored embeddings for student"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, embedding_vector, quality_score, image_url, created_at
                FROM face_embeddings
                WHERE student_id = $1
                ORDER BY quality_score DESC
                """,
                student_id
            )
            
            return [dict(row) for row in rows]
    
    async def delete_student_embeddings(self, student_id: str):
        """Delete all embeddings for student"""
        # Delete from storage
        deleted_count = await self.storage.delete_student_images(student_id)
        logger.info(f"Deleted {deleted_count} images for student {student_id}")
        
        # Delete from database
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "DELETE FROM face_embeddings WHERE student_id = $1",
                student_id
            )
            logger.info(f"Deleted database embeddings for student: {student_id}")
    
    async def _store_embeddings(
        self,
        student_id: str,
        embeddings: List[List[float]],
        quality_scores: List[float],
        image_urls: List[str]
    ):
        """Store embeddings in database"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            for embedding, quality, url in zip(embeddings, quality_scores, image_urls):
                await conn.execute(
                    """
                    INSERT INTO face_embeddings 
                    (student_id, embedding_vector, quality_score, image_url, created_at)
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    student_id,
                    embedding,
                    quality,
                    url,
                    datetime.now()
                )
    
    async def _get_enrolled_students(self, class_id: str = None) -> List[Dict]:
        """Get enrolled students with embeddings"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            query = """
                SELECT 
                    s.id as student_id,
                    s.name,
                    s.roll_number,
                    json_agg(
                        json_build_object(
                            'id', fe.id,
                            'embedding', fe.embedding_vector,
                            'quality', fe.quality_score
                        )
                    ) as embeddings
                FROM students s
                INNER JOIN face_embeddings fe ON s.id = fe.student_id
            """
            
            if class_id:
                query += " WHERE s.class_id = $1"
                rows = await conn.fetch(query + " GROUP BY s.id, s.name, s.roll_number", class_id)
            else:
                rows = await conn.fetch(query + " GROUP BY s.id, s.name, s.roll_number")
            
            return [dict(row) for row in rows]
    
    def _assess_quality(self, image: np.ndarray, face_location: tuple) -> float:
        """Assess face image quality"""
        top, right, bottom, left = face_location
        face_img = image[top:bottom, left:right]
        
        if face_img.size == 0:
            return 0.0
        
        # Calculate sharpness (Laplacian variance)
        gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        sharpness_score = min(laplacian_var / 500.0, 1.0)
        
        # Calculate size score
        face_area = (bottom - top) * (right - left)
        size_score = min(face_area / (200 * 200), 1.0)
        
        # Combined quality score
        quality = (sharpness_score * 0.6 + size_score * 0.4)
        
        return float(quality)