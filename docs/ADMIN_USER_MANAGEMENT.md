# Admin User Management API

## Overview

Complete CRUD (Create, Read, Update, Delete) operations for user management. **Admin access only.**

---

## Authentication

All endpoints require:
1. **JWT Token** in Authorization header
2. **Admin role** (only admins can manage users)

```bash
Authorization: Bearer <your_jwt_token>
```

---

## API Endpoints

### 1. Get All Users (Read)

**GET** `/api/users`

Get paginated list of all users with optional filters.

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `limit` | number | Users per page | 20 |
| `role` | string | Filter by role (admin/operative/analyst) | - |
| `isActive` | boolean | Filter by active status | - |
| `search` | string | Search by email or operative ID | - |

#### Example Request
```bash
curl -X GET "http://localhost:3001/api/users?page=1&limit=10&role=operative" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "65abc123...",
      "email": "user@example.com",
      "operativeId": "OP-001",
      "role": "operative",
      "isActive": true,
      "authProvider": "local",
      "metadata": {
        "firstName": "John",
        "lastName": "Doe",
        "department": "Field Operations",
        "clearanceLevel": "CONFIDENTIAL"
      },
      "lastLogin": "2026-02-05T02:30:00.000Z",
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-02-05T02:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalUsers": 47,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 2. Get Single User (Read)

**GET** `/api/users/:id`

Get detailed information about a specific user.

#### Example Request
```bash
curl -X GET "http://localhost:3001/api/users/65abc123..." \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "id": "65abc123...",
    "email": "user@example.com",
    "operativeId": "OP-001",
    "role": "operative",
    "isActive": true,
    "authProvider": "local",
    "metadata": {
      "firstName": "John",
      "lastName": "Doe",
      "department": "Field Operations",
      "clearanceLevel": "CONFIDENTIAL"
    },
    "notificationPreferences": {
      "emailEnabled": true,
      "emailOnDeepfake": true,
      "emailOnAll": false,
      "inAppEnabled": true
    },
    "lastLogin": "2026-02-05T02:30:00.000Z",
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-02-05T02:30:00.000Z"
  }
}
```

---

### 3. Create User (Create)

**POST** `/api/users`

Create a new user account.

#### Request Body
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "operativeId": "OP-042",
  "role": "operative",
  "metadata": {
    "firstName": "Jane",
    "lastName": "Smith",
    "department": "Intelligence",
    "clearanceLevel": "SECRET"
  }
}
```

#### Required Fields
- `email` (string, unique)
- `password` (string, min 8 characters)
- `operativeId` (string, unique, uppercase)

#### Optional Fields
- `role` (string: "admin" | "operative" | "analyst", default: "operative")
- `metadata.firstName` (string)
- `metadata.lastName` (string)
- `metadata.department` (string)
- `metadata.clearanceLevel` (string: "PUBLIC" | "CONFIDENTIAL" | "SECRET" | "TOP_SECRET")

#### Example Request
```bash
curl -X POST "http://localhost:3001/api/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePassword123!",
    "operativeId": "OP-042",
    "role": "operative",
    "metadata": {
      "firstName": "Jane",
      "lastName": "Smith",
      "department": "Intelligence",
      "clearanceLevel": "SECRET"
    }
  }'
```

#### Example Response
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "65def456...",
    "email": "newuser@example.com",
    "operativeId": "OP-042",
    "role": "operative",
    "isActive": true,
    "authProvider": "local",
    "metadata": {
      "firstName": "Jane",
      "lastName": "Smith",
      "department": "Intelligence",
      "clearanceLevel": "SECRET"
    },
    "createdAt": "2026-02-05T03:00:00.000Z",
    "updatedAt": "2026-02-05T03:00:00.000Z"
  }
}
```

---

### 4. Update User (Update)

**PUT** `/api/users/:id`

Update an existing user's information.

#### Request Body (all fields optional)
```json
{
  "email": "updated@example.com",
  "role": "analyst",
  "isActive": false,
  "metadata": {
    "firstName": "Jane",
    "lastName": "Doe",
    "department": "Analytics",
    "clearanceLevel": "TOP_SECRET"
  },
  "notificationPreferences": {
    "emailEnabled": true,
    "emailOnDeepfake": true,
    "emailOnAll": true,
    "inAppEnabled": true
  }
}
```

#### Example Request
```bash
curl -X PUT "http://localhost:3001/api/users/65abc123..." \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "analyst",
    "metadata": {
      "department": "Analytics",
      "clearanceLevel": "TOP_SECRET"
    }
  }'
```

#### Example Response
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "65abc123...",
    "email": "user@example.com",
    "operativeId": "OP-001",
    "role": "analyst",
    "isActive": true,
    "metadata": {
      "firstName": "John",
      "lastName": "Doe",
      "department": "Analytics",
      "clearanceLevel": "TOP_SECRET"
    },
    "updatedAt": "2026-02-05T03:15:00.000Z"
  }
}
```

---

### 5. Delete User (Delete)

**DELETE** `/api/users/:id`

Delete a user account permanently.

> **⚠️ Warning:** This action cannot be undone. The admin user cannot be deleted.

#### Example Request
```bash
curl -X DELETE "http://localhost:3001/api/users/65abc123..." \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Example Response
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 6. Get User Statistics

**GET** `/api/users/stats`

Get system-wide user statistics.

#### Example Request
```bash
curl -X GET "http://localhost:3001/api/users/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "total": 47,
    "active": 42,
    "inactive": 5,
    "byRole": {
      "admin": 1,
      "operative": 35,
      "analyst": 11
    },
    "byAuthProvider": {
      "local": 40,
      "google": 7
    },
    "recentLogins": 28
  }
}
```

---

## Role Permissions

### Admin (ADMIN)
- ✅ Create users
- ✅ Read all users
- ✅ Update any user
- ✅ Delete users (except admin)
- ✅ View user statistics
- ✅ Full system access

### Operative (OPERATIVE)
- ❌ Cannot access user management
- ✅ Can upload scans
- ✅ Can view own scans

### Analyst (ANALYST)
- ❌ Cannot access user management
- ✅ Can view all scans
- ✅ Can export reports

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "message": "Email is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: Insufficient permissions",
  "required": ["user:create"],
  "current": ["scan:upload", "scan:view"]
}
```

### 404 Not Found
```json
{
  "error": "Failed to fetch user",
  "message": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create user",
  "message": "Database connection error"
}
```

---

## Security Features

### Password Requirements
- Minimum 8 characters
- Hashed with bcrypt (12 rounds)
- Never returned in API responses

### Admin Protection
- Only one admin allowed in the system
- Admin user cannot be deleted
- Admin role cannot be changed to non-admin

### Audit Logging
All user management actions are logged:
- User creation
- User updates
- User deletion
- Who performed the action
- When it was performed
- What was changed

### Rate Limiting
- 100 requests per 15 minutes per IP
- Prevents brute force attacks

---

## Testing with cURL

### 1. Login as Admin
```bash
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "harshdeepathawale27@gmail.com",
    "password": "Admin@123"
  }'
```

Save the `token` from the response.

### 2. Create a User
```bash
TOKEN="your_jwt_token_here"

curl -X POST "http://localhost:3001/api/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operative@example.com",
    "password": "SecurePass123!",
    "operativeId": "OP-100",
    "role": "operative",
    "metadata": {
      "firstName": "Test",
      "lastName": "User",
      "department": "Testing"
    }
  }'
```

### 3. Get All Users
```bash
curl -X GET "http://localhost:3001/api/users?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Update a User
```bash
curl -X PUT "http://localhost:3001/api/users/USER_ID_HERE" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "analyst"
  }'
```

### 5. Delete a User
```bash
curl -X DELETE "http://localhost:3001/api/users/USER_ID_HERE" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- User IDs are MongoDB ObjectIDs
- Operative IDs must be unique and uppercase
- Email addresses are automatically lowercased
- Passwords are never returned in responses
- Google OAuth users don't have passwords
