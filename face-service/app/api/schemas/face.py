from pydantic import BaseModel
from typing import List
from datetime import datetime


class FaceEnrollRequest(BaseModel):
    student_id: str


class FaceEnrollResponse(BaseModel):
    success: bool
    student_id: str
    embeddings_created: int
    quality_scores: List[float]
    message: str
    timestamp: datetime = datetime.now()


class FaceEmbedding(BaseModel):
    id: str
    student_id: str
    embedding_vector: List[float]
    quality_score: float
    created_at: datetime
