import pytest
import numpy as np
from app.services.face_detection import FaceDetectionService


class TestFaceDetection:
    
    @pytest.fixture
    def detector(self):
        return FaceDetectionService()
    
    def test_detector_initialization(self, detector):
        """Test detector initializes correctly"""
        assert detector is not None
    
    def test_detect_faces_empty_image(self, detector):
        """Test detection on empty image"""
        empty_image = np.zeros((480, 640, 3), dtype=np.uint8)
        faces = detector.detect_faces(empty_image)
        assert isinstance(faces, list)
    
    def test_extract_face(self, detector, sample_image):
        """Test face extraction"""
        bbox = [100, 100, 300, 300]
        face = detector.extract_face(sample_image, bbox)
        assert face is not None
        assert face.shape[0] > 0 and face.shape[1] > 0