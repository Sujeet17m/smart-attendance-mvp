# Smart-Tend AI Face Recognition Service

Advanced face detection and recognition service for the Smart-Tend AI attendance system.

## Features

- 🎥 Video processing with face detection
- 👤 Face enrollment for students
- 🔍 Real-time face recognition
- 📊 Quality assessment for face images
- 🚀 High-performance processing
- 🐳 Docker support

## Quick Start

### 1. Install Dependencies

```bash
cd face-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Download Models

```bash
python scripts/download_models.py
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Setup Database

```bash
psql -h localhost -U postgres -d smart_attendance -f database_schema.sql
```

### 5. Run Service

```bash
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

## API Endpoints

### Process Video
```bash
POST /api/process-video
Content-Type: multipart/form-data

Parameters:
- video: Video file (required)
- class_id: Class identifier (optional)
```

### Enroll Face
```bash
POST /api/enroll-face?student_id=<id>
Content-Type: multipart/form-data

Parameters:
- images: Multiple image files (required)
```

### Get Embeddings
```bash
GET /api/student/{student_id}/embeddings
```

### Delete Embeddings
```bash
DELETE /api/student/{student_id}/embeddings
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Test face detection
python scripts/test_detection.py
```

## Docker Deployment

```bash
# Build image
docker build -t smart-tend-face-service .

# Run container
docker run -d \
  --name face-service \
  -p 8002:8002 \
  --env-file .env \
  smart-tend-face-service
```

## Storage Configuration

The service supports two storage options for face images:

### Option 1: Local Storage (Default - No AWS needed!)

This is the default option and requires **NO AWS account or credentials**.

```env
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./storage/faces
```

Face images will be stored in the `storage/faces` directory on your server.

**Advantages:**
- ✅ No AWS account needed
- ✅ No monthly costs
- ✅ Simple setup
- ✅ Fast access
- ✅ Full control

**Perfect for:**
- Development
- Testing
- Small to medium deployments
- On-premise installations

### Option 2: AWS S3 Storage (Optional)

Only use this if you have an AWS account and want cloud storage.

```env
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```

**Advantages:**
- Scalable cloud storage
- Geographic redundancy
- CDN integration possible

**Note:** Requires AWS account and `pip install boto3`

### Serving Face Images (Local Storage)

If using local storage, you'll need to serve the images through your backend:

Add to `backend/src/app.js`:

```javascript
const express = require('express');
const path = require('path');

// Serve face images from face-service storage
app.use('/storage', express.static(
  path.join(__dirname, '../../face-service/storage')
));
```

This allows the frontend to access images at: `http://localhost:5000/storage/faces/student-id/image.jpg`

## Integration with Backend

The face service integrates with the Node.js backend through HTTP API calls. See `backend/src/services/face.service.js` for the integration client.

## Performance Tips

1. **GPU Acceleration**: Set `USE_GPU=True` in .env if CUDA is available
2. **Frame Rate**: Adjust `VIDEO_FRAME_RATE` for processing speed vs accuracy
3. **Batch Processing**: Increase `BATCH_SIZE` for better GPU utilization
4. **Caching**: Enable Redis caching for frequently accessed embeddings

## Troubleshooting

See [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md) for common issues and solutions.

## License

MIT