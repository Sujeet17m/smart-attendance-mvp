from app.services.video_processing import VideoProcessingService
from app.services.face_recognition import FaceRecognitionService

_video_service = None
_face_service = None


def get_video_service() -> VideoProcessingService:
    global _video_service
    if _video_service is None:
        _video_service = VideoProcessingService()
    return _video_service


def get_face_service() -> FaceRecognitionService:
    global _face_service
    if _face_service is None:
        _face_service = FaceRecognitionService()
    return _face_service