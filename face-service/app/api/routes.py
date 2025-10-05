from fastapi import APIRouter
from app.api.endpoints import face

router = APIRouter()
router.include_router(face.router, prefix="/face", tags=["face"])
