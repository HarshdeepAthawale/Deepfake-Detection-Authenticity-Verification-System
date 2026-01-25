# API Documentation

Complete API reference for the Deepfake Detection & Authenticity Verification System.

## Base URL

```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Get JWT Token

**POST** `/api/auth/login`

Login with email and password to receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "operative"
    }
  }
}
```

---

## Scans

### Upload Media for Scanning

**POST** `/api/scans/upload`

Upload a media file (image, video, or audio) for deepfake detection analysis.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (multipart/form-data):**
- `file` (required): Media file to scan
- `tags` (optional): Comma-separated tags

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "scan_id",
    "fileName": "video.mp4",
    "mediaType": "VIDEO",
    "status": "COMPLETED",
    "result": "DEEPFAKE",
    "riskScore": 85,
    "confidence": 92,
    "videoScore": 80,
    "audioScore": 0,
    "ganFingerprint": 85,
    "temporalConsistency": 75,
    "explanation": "High probability of manipulation detected...",
    "timestamp": "2026-01-26T04:00:00.000Z"
  }
}
```

**Status Codes:**
- `200`: Scan completed successfully
- `400`: Invalid file or validation error
- `401`: Unauthorized (missing or invalid token)
- `413`: File too large
- `500`: Server error

---

### Get Scan History

**GET** `/api/scans/history`

Retrieve paginated scan history with filtering and search.

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `search` (string): Full-text search query
- `status` (string): Filter by status (PENDING, PROCESSING, COMPLETED, FAILED)
- `mediaType` (string): Filter by media type (VIDEO, IMAGE, AUDIO)
- `verdict` (string): Filter by verdict (DEEPFAKE, SUSPICIOUS, AUTHENTIC)
- `startDate` (ISO date): Filter scans after this date
- `endDate` (ISO date): Filter scans before this date
- `sortBy` (string): Sort field (date, confidence, riskScore, fileName)
- `sortOrder` (string): Sort order (asc, desc)

**Example Request:**
```
GET /api/scans/history?page=1&limit=10&verdict=DEEPFAKE&sortBy=riskScore&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "scan_id",
      "fileName": "video.mp4",
      "type": "VIDEO",
      "result": "DEEPFAKE",
      "score": 85,
      "timestamp": "2026-01-26T04:00:00.000Z",
      "operative": "John Doe"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

---

### Get Scan Details

**GET** `/api/scans/:id`

Retrieve detailed information about a specific scan.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "scan_id",
    "fileName": "video.mp4",
    "mediaType": "VIDEO",
    "fileSize": 10485760,
    "status": "COMPLETED",
    "result": "DEEPFAKE",
    "riskScore": 85,
    "confidence": 92,
    "videoScore": 80,
    "audioScore": 0,
    "ganFingerprint": 85,
    "temporalConsistency": 75,
    "explanation": "High probability of manipulation detected...",
    "metadata": {
      "codec": "h264",
      "bitrate": "5000",
      "resolution": "1920x1080",
      "duration": 30,
      "fps": 30
    },
    "gpsCoordinates": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "hash": "sha256:abc123...",
    "timestamp": "2026-01-26T04:00:00.000Z",
    "operative": "John Doe",
    "tags": ["investigation", "case-001"]
  }
}
```

---

### Delete Scan

**DELETE** `/api/scans/:id`

Delete a scan (admin only).

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Scan deleted successfully"
}
```

---

## Admin

### Get System Statistics

**GET** `/api/admin/stats`

Retrieve system-wide statistics (admin only).

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 50,
      "active": 45,
      "inactive": 5,
      "byRole": {
        "admin": 2,
        "operative": 30,
        "analyst": 18
      },
      "newLast24h": 3
    },
    "scans": {
      "total": 1000,
      "completed": 950,
      "pending": 20,
      "processing": 10,
      "failed": 20,
      "byVerdict": {
        "DEEPFAKE": 200,
        "SUSPICIOUS": 150,
        "AUTHENTIC": 600
      },
      "byMediaType": {
        "VIDEO": 700,
        "IMAGE": 250,
        "AUDIO": 50
      },
      "newLast24h": 50
    },
    "system": {
      "health": "operational",
      "uptime": 86400
    }
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "timestamp": "2026-01-26T04:00:00.000Z"
  }
}
```

### Common Error Codes

- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `413 Payload Too Large`: File size exceeds limit
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: Rate limit information is included in response headers:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response.

---

## WebSocket Events

Real-time scan updates are available via WebSocket connection.

**Connection:**
```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

**Events:**

### `scan:progress`
Emitted during scan processing with progress updates.

```javascript
socket.on('scan:progress', (data) => {
  console.log(data);
  // { scanId: 'scan_id', progress: 50, stage: 'detection' }
});
```

### `scan:complete`
Emitted when scan is completed.

```javascript
socket.on('scan:complete', (data) => {
  console.log(data);
  // { scanId: 'scan_id', result: 'DEEPFAKE', riskScore: 85 }
});
```

### `scan:error`
Emitted when scan fails.

```javascript
socket.on('scan:error', (data) => {
  console.log(data);
  // { scanId: 'scan_id', error: 'Error message' }
});
```
