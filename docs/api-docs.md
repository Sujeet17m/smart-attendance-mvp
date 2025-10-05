# Smart-Tend-AI API Documentation

## Base URLs
- Backend API: `http://localhost:3000/api`
- Face Service API: `http://localhost:8000/api`

## Authentication
All API endpoints except login and register require JWT authentication.

Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Backend API Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}

Response 201:
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt-token"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}

Response 200:
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt-token"
}
```

### Attendance

#### Mark Attendance
```http
POST /attendance/mark
Content-Type: application/json
Authorization: Bearer <token>

{
  "imageData": "base64-encoded-image"
}

Response 201:
{
  "id": "uuid",
  "userId": "user-uuid",
  "date": "2023-12-10",
  "time": "09:00:00",
  "status": "present"
}
```

#### Get Attendance by Date
```http
GET /attendance/by-date/2023-12-10
Authorization: Bearer <token>

Response 200:
[
  {
    "id": "uuid",
    "userId": "user-uuid",
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "date": "2023-12-10",
    "time": "09:00:00",
    "status": "present"
  }
]
```

#### Get User's Attendance History
```http
GET /attendance/by-user/:userId
Authorization: Bearer <token>

Response 200:
[
  {
    "id": "uuid",
    "date": "2023-12-10",
    "time": "09:00:00",
    "status": "present"
  }
]
```

## Face Service API Endpoints

### Face Operations

#### Enroll Face
```http
POST /face/enroll
Content-Type: multipart/form-data

Form fields:
- user_id: string
- image: file

Response 200:
{
  "success": true,
  "message": "Face enrolled successfully"
}
```

#### Verify Face
```http
POST /face/verify
Content-Type: multipart/form-data

Form fields:
- user_id: string
- image: file

Response 200:
{
  "is_match": true,
  "confidence": 0.95
}
```

## Error Responses

### Common Error Codes
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 500 Internal Server Error

### Error Response Format
```json
{
  "error": "Error message description"
}
```