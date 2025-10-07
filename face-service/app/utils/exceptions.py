class FaceServiceException(Exception):
    """Base exception for face service"""
    pass


class FaceNotDetectedException(FaceServiceException):
    """Face not detected in image"""
    pass


class InvalidImageException(FaceServiceException):
    """Invalid image format or quality"""
    pass


class VideoProcessingException(FaceServiceException):
    """Error processing video"""
    pass


class DatabaseException(FaceServiceException):
    """Database operation failed"""
    pass
