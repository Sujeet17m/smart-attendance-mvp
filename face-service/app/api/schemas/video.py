from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class FaceDetection(BaseModel):
    bbox: List[float]
    confidence: float
    frame_number: int
    timestamp: float


class RecognizedStudent(BaseModel):
    student_id: str
    student_name: str
    confidence: float
    detections: List[FaceDetection]


class VideoProcessRequest(BaseModel):
    class_id: Optional[str] = None


class VideoProcessResponse(BaseModel):
    success: bool
    video_id: str
    total_frames: int
    processed_frames: int
    total_faces_detected: int
    unique_students_identified: int
    recognized_students: List[RecognizedStudent]
    processing_time: float
    timestamp: datetime = datetime.now()
