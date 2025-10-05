from fastapi import APIRouter, UploadFile, HTTPException
from app.services.face_recognition_service import FaceRecognitionService
from app.schemas.face import FaceVerificationResult

router = APIRouter()
face_service = FaceRecognitionService()

@router.post("/enroll")
async def enroll_face(user_id: str, image: UploadFile):
    try:
        image_bytes = await image.read()
        result = face_service.enroll_face(user_id, image_bytes)
        return {"success": True, "message": "Face enrolled successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify", response_model=FaceVerificationResult)
async def verify_face(user_id: str, image: UploadFile):
    try:
        image_bytes = await image.read()
        result = face_service.verify_face(user_id, image_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))