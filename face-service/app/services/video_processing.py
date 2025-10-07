import cv2
import numpy as np
from typing import List, Dict
import logging
import uuid
from datetime import datetime
import tempfile
import os

from app.services.face_detection import FaceDetectionService
from app.services.face_recognition import FaceRecognitionService
from app.config import settings

logger = logging.getLogger(__name__)


class VideoProcessingService:
    """Process attendance videos"""
    
    def __init__(self):
        self.face_detector = FaceDetectionService()
        self.face_recognizer = FaceRecognitionService()
    
    async def process_video(
        self,
        video_content: bytes,
        filename: str,
        class_id: str = None
    ) -> Dict:
        """
        Process attendance video
        
        Args:
            video_content: Video file bytes
            filename: Original filename
            class_id: Optional class identifier
            
        Returns:
            Processing results
        """
        start_time = datetime.now()
        video_id = str(uuid.uuid4())
        
        logger.info(f"Processing video {video_id}: {filename}")
        
        try:
            # Save to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
                tmp_file.write(video_content)
                video_path = tmp_file.name
            
            # Process video
            result = await self._process_video_file(video_path, video_id, class_id)
            
            # Clean up
            os.unlink(video_path)
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            result['processing_time'] = processing_time
            result['video_id'] = video_id
            
            logger.info(f"Video {video_id} processed in {processing_time:.2f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing video: {e}")
            # Clean up on error
            if os.path.exists(video_path):
                os.unlink(video_path)
            raise
    
    async def _process_video_file(
        self,
        video_path: str,
        video_id: str,
        class_id: str
    ) -> Dict:
        """Process video file and extract faces"""
        
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError("Could not open video file")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Process every Nth frame
        frame_interval = max(1, int(fps / settings.VIDEO_FRAME_RATE))
        
        all_detections = {}  # student_id -> list of detections
        processed_frames = 0
        total_faces = 0
        
        frame_number = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process selected frames only
            if frame_number % frame_interval == 0:
                timestamp = frame_number / fps
                
                # Detect faces
                faces = self.face_detector.detect_faces(frame)
                total_faces += len(faces)
                
                # Recognize each face
                for face in faces:
                    bbox = face['bbox']
                    face_img = self.face_detector.extract_face(frame, bbox)
                    
                    # Recognize
                    recognition_result = await self.face_recognizer.recognize_face(
                        face_img,
                        class_id
                    )
                    
                    if recognition_result.get('recognized'):
                        student_id = recognition_result['student_id']
                        
                        if student_id not in all_detections:
                            all_detections[student_id] = {
                                'student_id': student_id,
                                'student_name': recognition_result['student_name'],
                                'detections': []
                            }
                        
                        all_detections[student_id]['detections'].append({
                            'bbox': face['bbox'],
                            'confidence': face['confidence'],
                            'frame_number': frame_number,
                            'timestamp': timestamp
                        })
                
                processed_frames += 1
            
            frame_number += 1
        
        cap.release()
        
        # Calculate average confidence for each student
        recognized_students = []
        for student_data in all_detections.values():
            detections = student_data['detections']
            avg_confidence = sum(d['confidence'] for d in detections) / len(detections)
            
            recognized_students.append({
                'student_id': student_data['student_id'],
                'student_name': student_data['student_name'],
                'confidence': avg_confidence,
                'detections': detections[:5]  # Include first 5 detections
            })
        
        return {
            'success': True,
            'total_frames': total_frames,
            'processed_frames': processed_frames,
            'total_faces_detected': total_faces,
            'unique_students_identified': len(recognized_students),
            'recognized_students': recognized_students
        }