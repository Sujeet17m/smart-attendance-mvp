from pydantic import BaseModel

class FaceVerificationResult(BaseModel):
    is_match: bool
    confidence: float