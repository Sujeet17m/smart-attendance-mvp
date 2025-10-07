import cv2
import numpy as np
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class FaceDetectionService:
    """Face detection using OpenCV DNN"""
    
    def __init__(self):
        self.load_model()
    
    def load_model(self):
        """Load pre-trained face detection model"""
        try:
            # Load Caffe model
            prototxt_path = "app/models/deploy.prototxt"
            model_path = "app/models/res10_300x300_ssd_iter_140000.caffemodel"
            
            self.net = cv2.dnn.readNetFromCaffe(prototxt_path, model_path)
            logger.info("✅ Face detection model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Error loading face detection model: {e}")
            # Fallback to Haar Cascade
            self.net = None
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            logger.info("Using Haar Cascade for face detection")
    
    def detect_faces(self, image: np.ndarray, confidence_threshold: float = 0.7) -> List[Dict]:
        """
        Detect faces in image
        
        Args:
            image: Input image (BGR format)
            confidence_threshold: Minimum confidence for detection
            
        Returns:
            List of detected faces with bounding boxes
        """
        if self.net is not None:
            return self._detect_with_dnn(image, confidence_threshold)
        else:
            return self._detect_with_haar(image)
    
    def _detect_with_dnn(self, image: np.ndarray, threshold: float) -> List[Dict]:
        """Detect faces using DNN"""
        h, w = image.shape[:2]
        
        # Prepare blob
        blob = cv2.dnn.blobFromImage(
            cv2.resize(image, (300, 300)),
            1.0,
            (300, 300),
            (104.0, 177.0, 123.0)
        )
        
        # Run detection
        self.net.setInput(blob)
        detections = self.net.forward()
        
        faces = []
        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            
            if confidence > threshold:
                box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                x1, y1, x2, y2 = box.astype("int")
                
                # Validate bbox
                if x1 < 0 or y1 < 0 or x2 > w or y2 > h:
                    continue
                
                faces.append({
                    'bbox': [int(x1), int(y1), int(x2), int(y2)],
                    'confidence': float(confidence),
                    'width': int(x2 - x1),
                    'height': int(y2 - y1)
                })
        
        return faces
    
    def _detect_with_haar(self, image: np.ndarray) -> List[Dict]:
        """Detect faces using Haar Cascade"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        faces_rect = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(80, 80)
        )
        
        faces = []
        for (x, y, w, h) in faces_rect:
            faces.append({
                'bbox': [int(x), int(y), int(x + w), int(y + h)],
                'confidence': 0.9,
                'width': int(w),
                'height': int(h)
            })
        
        return faces
    
    def extract_face(self, image: np.ndarray, bbox: List[int], margin: float = 0.2) -> np.ndarray:
        """Extract face region with margin"""
        x1, y1, x2, y2 = bbox
        h, w = image.shape[:2]
        
        # Add margin
        width = x2 - x1
        height = y2 - y1
        
        x1 = max(0, int(x1 - width * margin))
        y1 = max(0, int(y1 - height * margin))
        x2 = min(w, int(x2 + width * margin))
        y2 = min(h, int(y2 + height * margin))
        
        return image[y1:y2, x1:x2]