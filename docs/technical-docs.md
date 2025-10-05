# Smart-Tend-AI Technical Documentation

## Overview
Smart-Tend-AI is a comprehensive attendance management system that leverages facial recognition technology for accurate and automated attendance tracking. The system consists of three main components:

1. Backend Service (Node.js/Express)
2. Frontend Application (React/Vite)
3. Face Recognition Service (Python/FastAPI)

## Architecture

### System Components

#### Backend Service
- REST API built with Node.js and Express
- PostgreSQL database for data persistence
- JWT-based authentication
- Sequelize ORM for database operations

#### Frontend Application
- Built with React and Vite
- TypeScript for type safety
- Tailwind CSS for styling
- React Router for navigation
- Context API for state management

#### Face Recognition Service
- Python FastAPI service
- Uses face_recognition library
- OpenCV for image processing
- RESTful API endpoints for face enrollment and verification

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.8+
- PostgreSQL 13+
- npm or yarn
- pip

### Installation

#### Backend Service
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your configuration
npm run dev
```

#### Frontend Application
```bash
cd frontend
npm install
npm run dev
```

#### Face Recognition Service
```bash
cd face-service
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## API Documentation

### Backend API Endpoints

#### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login

#### Attendance
- POST /api/attendance/mark - Mark attendance
- GET /api/attendance/by-date/:date - Get attendance by date
- GET /api/attendance/by-user/:userId - Get user's attendance history

### Face Recognition API Endpoints

#### Face Operations
- POST /api/face/enroll - Enroll user's face
- POST /api/face/verify - Verify face for attendance

## Database Schema

### Users Table
- id (UUID, Primary Key)
- name (VARCHAR)
- email (VARCHAR, Unique)
- password (VARCHAR)
- face_data (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Attendance Table
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- date (DATE)
- time (TIME)
- status (VARCHAR)
- verification_image (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## Security Considerations

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation
- Rate limiting
- Face data encryption

## Development Guidelines

### Code Style
- Follow ESLint configurations
- Use TypeScript for type safety
- Write unit tests
- Document API endpoints
- Follow Git commit conventions

### Version Control
- Use feature branches
- Write meaningful commit messages
- Review pull requests
- Keep dependencies updated

## Deployment

### Production Requirements
- SSL/TLS certificates
- Domain configuration
- Environment variables
- Database backups
- Monitoring setup

### Deployment Steps
[Detailed deployment instructions will be added]