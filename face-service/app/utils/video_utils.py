import cv2
import numpy as np
from typing import Generator


def extract_frames(
    video_path: str,
    frame_rate: int = 2
) -> Generator[tuple, None, None]:
    """
    Extract frames from video
    
    Args:
        video_path: Path to video file
        frame_rate: Frames per second to extract
        
    Yields:
        (frame_number, timestamp, frame_image)
    """
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError("Could not open video file")
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = max(1, int(fps / frame_rate))
    
    frame_number = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_number % frame_interval == 0:
            timestamp = frame_number / fps
            yield (frame_number, timestamp, frame)
        
        frame_number += 1
    
    cap.release()


def get_video_info(video_path: str) -> dict:
    """Get video metadata"""
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError("Could not open video file")
    
    info = {
        'fps': cap.get(cv2.CAP_PROP_FPS),
        'frame_count': int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
        'width': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        'height': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        'duration': cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS)
    }
    
    cap.release()
    return info