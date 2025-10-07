#!/usr/bin/env python3

"""
Test face detection with a sample image
"""

import cv2
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.face_detection import FaceDetectionService


def test_detection():
    """Test face detection"""
    
    print("🧪 Testing face detection...")
    
    # Initialize service
    detector = FaceDetectionService()
    
    # Create a test image (or load your own)
    # For testing, create a simple image
    test_image = cv2.imread('test_image.jpg')
    
    if test_image is None:
        print("❌ No test image found. Please provide 'test_image.jpg'")
        return
    
    # Detect faces
    faces = detector.detect_faces(test_image)
    
    print(f"✅ Detected {len(faces)} face(s)")
    
    # Draw bounding boxes
    for face in faces:
        x1, y1, x2, y2 = face['bbox']
        cv2.rectangle(test_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(
            test_image,
            f"{face['confidence']:.2f}",
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 255, 0),
            2
        )
    
    # Save result
    cv2.imwrite('test_result.jpg', test_image)
    print("✅ Result saved to test_result.jpg")


if __name__ == "__main__":
    test_detection()