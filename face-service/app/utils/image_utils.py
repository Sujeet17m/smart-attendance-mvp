import cv2
import numpy as np


def preprocess_image(image: np.ndarray, target_size: tuple = (224, 224)) -> np.ndarray:
    """Preprocess image for model input"""
    # Resize
    resized = cv2.resize(image, target_size, interpolation=cv2.INTER_AREA)
    
    # Normalize
    normalized = resized.astype(np.float32) / 255.0
    
    return normalized


def enhance_image(image: np.ndarray) -> np.ndarray:
    """Enhance image quality"""
    # Convert to LAB
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # Apply CLAHE to L channel
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l)
    
    # Merge and convert back
    lab_enhanced = cv2.merge([l_enhanced, a, b])
    enhanced = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
    
    return enhanced


def calculate_blur_score(image: np.ndarray) -> float:
    """Calculate image blur score using Laplacian variance"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    score = laplacian.var()
    return score