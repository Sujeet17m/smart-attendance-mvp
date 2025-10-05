import os
import face_recognition
import numpy as np
from app.config import settings
from app.schemas.face import FaceVerificationResult

class FaceRecognitionService:
    def __init__(self):
        self.face_data_dir = settings.FACE_DATA_DIR
        os.makedirs(self.face_data_dir, exist_ok=True)

    def _load_face_encoding(self, user_id: str) -> np.ndarray:
        encoding_file = os.path.join(self.face_data_dir, f"{user_id}.npy")
        if not os.path.exists(encoding_file):
            raise ValueError(f"No face data found for user {user_id}")
        return np.load(encoding_file)

    def _save_face_encoding(self, user_id: str, encoding: np.ndarray):
        encoding_file = os.path.join(self.face_data_dir, f"{user_id}.npy")
        np.save(encoding_file, encoding)

    def enroll_face(self, user_id: str, image_bytes: bytes) -> bool:
        # Load image from bytes
        image = face_recognition.load_image_file(image_bytes)
        face_locations = face_recognition.face_locations(image)
        
        if not face_locations:
            raise ValueError("No face detected in the image")
        
        if len(face_locations) > 1:
            raise ValueError("Multiple faces detected in the image")
        
        # Get face encoding
        face_encoding = face_recognition.face_encodings(image, face_locations)[0]
        
        # Save face encoding
        self._save_face_encoding(user_id, face_encoding)
        return True

    def verify_face(self, user_id: str, image_bytes: bytes) -> FaceVerificationResult:
        # Load enrolled face encoding
        known_encoding = self._load_face_encoding(user_id)
        
        # Load and encode the provided image
        image = face_recognition.load_image_file(image_bytes)
        face_locations = face_recognition.face_locations(image)
        
        if not face_locations:
            return FaceVerificationResult(is_match=False, confidence=0.0)
        
        if len(face_locations) > 1:
            raise ValueError("Multiple faces detected in the image")
        
        face_encoding = face_recognition.face_encodings(image, face_locations)[0]
        
        # Compare faces
        face_distance = face_recognition.face_distance([known_encoding], face_encoding)[0]
        is_match = face_distance <= settings.FACE_RECOGNITION_TOLERANCE
        confidence = 1 - face_distance
        
        return FaceVerificationResult(is_match=is_match, confidence=float(confidence))