from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
import logging

from app.api.schemas.video import VideoProcessRequest, VideoProcessResponse
from app.api.schemas.face import FaceEnrollRequest, FaceEnrollResponse
from app.services.video_processing import VideoProcessingService
from app.services.face_recognition import FaceRecognitionService
from app.api.dependencies import get_video_service, get_face_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/process-video", response_model=VideoProcessResponse)
async def process_video(
    video: UploadFile = File(...),
    class_id: str = None,
    video_service: VideoProcessingService = Depends(get_video_service)
):
    """
    Process attendance video and detect faces
    
    - **video**: Video file (MP4, MOV, AVI)
    - **class_id**: Optional class identifier
    """
    try:
        # Validate video file
        if not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="File must be a video")
        
        # Read video content
        video_content = await video.read()
        
        logger.info(f"Processing video: {video.filename} ({len(video_content)} bytes)")
        
        # Process video
        result = await video_service.process_video(
            video_content=video_content,
            filename=video.filename,
            class_id=class_id
        )
        
        return VideoProcessResponse(**result)
        
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enroll-face", response_model=FaceEnrollResponse)
async def enroll_face(
    student_id: str,
    images: List[UploadFile] = File(...),
    face_service: FaceRecognitionService = Depends(get_face_service)
):
    """
    Enroll student face for recognition
    
    - **student_id**: Student identifier
    - **images**: Multiple face images (3-5 recommended)
    """
    try:
        if len(images) < 1:
            raise HTTPException(status_code=400, detail="At least one image required")
        
        if len(images) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 images allowed")
        
        # Process images
        image_data = []
        for img in images:
            if not img.content_type.startswith('image/'):
                continue
            content = await img.read()
            image_data.append(content)
        
        logger.info(f"Enrolling face for student: {student_id} with {len(image_data)} images")
        
        # Enroll face
        result = await face_service.enroll_student_face(
            student_id=student_id,
            images=image_data
        )
        
        return FaceEnrollResponse(**result)
        
    except Exception as e:
        logger.error(f"Error enrolling face: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/student/{student_id}/embeddings")
async def get_student_embeddings(
    student_id: str,
    face_service: FaceRecognitionService = Depends(get_face_service)
):
    """Get stored face embeddings for a student"""
    try:
        embeddings = await face_service.get_student_embeddings(student_id)
        return {"student_id": student_id, "embeddings": embeddings}
    except Exception as e:
        logger.error(f"Error fetching embeddings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/student/{student_id}/embeddings")
async def delete_student_embeddings(
    student_id: str,
    face_service: FaceRecognitionService = Depends(get_face_service)
):
    """Delete all face embeddings for a student"""
    try:
        await face_service.delete_student_embeddings(student_id)
        return {"message": "Embeddings deleted successfully", "student_id": student_id}
    except Exception as e:
        logger.error(f"Error deleting embeddings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
