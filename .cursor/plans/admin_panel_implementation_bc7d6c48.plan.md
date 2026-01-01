---
name: Admin Panel Implementation
overview: Build a complete admin panel with user management, system statistics, and admin dashboard accessible via /admin route, with backend API endpoints and frontend UI components.
todos:
  - id: backend-user-service
    content: Create user.service.js with getAllUsers, getUserById, createUser, updateUser, deleteUser, and getUserStats methods
    status: completed
  - id: backend-user-controller
    content: Create user.controller.js with handlers for all user CRUD operations and stats endpoint
    status: completed
    dependencies:
      - backend-user-service
  - id: backend-user-routes
    content: Create user.routes.js with all user management endpoints protected by admin permissions
    status: completed
    dependencies:
      - backend-user-controller
  - id: backend-admin-stats
    content: Create admin.controller.js and admin.routes.js for system statistics endpoint
    status: completed
  - id: register-routes
    content: Register user and admin routes in backend/src/app.js
    status: completed
    dependencies:
      - backend-user-routes
      - backend-admin-stats
  - id: frontend-api-methods
    content: Add admin API methods to lib/api.ts (getAllUsers, createUser, updateUser, deleteUser, getUserStats, getAdminStats)
    status: completed
    dependencies:
      - register-routes
  - id: admin-protected-route
    content: Create components/admin-protected-route.tsx to protect admin routes with role check
    status: completed
  - id: admin-dashboard
    content: Create app/admin/page.tsx with admin dashboard layout and system statistics
    status: completed
    dependencies:
      - admin-protected-route
      - frontend-api-methods
  - id: user-management-components
    content: Create user management components (user-list.tsx, user-form.tsx, user-stats.tsx) in components/admin/
    status: completed
    dependencies:
      - admin-dashboard
  - id: update-navigation
    content: Update components/tactical-shell.tsx to show Admin Panel nav item only for admin users
    status: completed
    dependencies:
      - admin-dashboard
---

# Admin Panel Imple

mentation Plan

## Overview

Create a comprehensive admin panel with full user management capabilities, system statistics, and admin dashboard. The panel will be accessible via a separate `/admin` route, visible only to users with admin role.

## Architecture

```mermaid
flowchart TD
    A[Admin User] -->|Access| B[/admin Route]
    B -->|Protected| C[AdminProtectedRoute]
    C -->|Check Role| D{Is Admin?}
    D -->|Yes| E[Admin Dashboard]
    D -->|No| F[Redirect to Dashboard]
    E --> G[User Management]
    E --> H[System Statistics]
    E --> I[All Scans View]
    G --> J[Backend API /api/users]
    H --> K[Backend API /api/admin/stats]
    I --> L[Backend API /api/scans/history]
```



## Backend Implementation

### 1. User Service (`backend/src/users/user.service.js`)

- `getAllUsers(page, limit, filters)` - Get paginated list of all users

- `getUserById(userId)` - Get user by ID

- `createUser(userData)` - Create new user (with validation)

- `updateUser(userId, userData)` - Update user (prevent changing to admin if admin exists)

- `deleteUser(userId)` - Delete user (prevent deleting admin)

- `getUserStats()` - Get user statistics (total, by role, active/inactive)

### 2. User Controller (`backend/src/users/user.controller.js`)

- `getUsers` - GET /api/users (with pagination and filters)

- `getUser` - GET /api/users/:id

- `createUser` - POST /api/users

- `updateUser` - PUT /api/users/:id

- `deleteUser` - DELETE /api/users/:id

- `getStats` - GET /api/users/stats

### 3. User Routes (`backend/src/users/user.routes.js`)

- All routes require authentication

- All routes require admin permissions (USER_VIEW, USER_CREATE, USER_EDIT, USER_DELETE)

- Register routes in [backend/src/app.js](backend/src/app.js)

### 4. Admin Stats Endpoint

- Add `getAdminStats` in scan controller or create admin controller

- GET /api/admin/stats - Returns system-wide statistics (total scans, users, deepfakes detected, etc.)

## Frontend Implementation

### 1. Admin API Service (`lib/api.ts`)

Add admin methods:

- `getAllUsers(page, limit, filters)` - Fetch users with pagination

- `createUser(userData)` - Create new user

- `updateUser(userId, userData)` - Update user

- `deleteUser(userId)` - Delete user

- `getUserStats()` - Get user statistics

- `getAdminStats()` - Get system statistics

### 2. Admin Protected Route (`components/admin-protected-route.tsx`)

- Similar to `ProtectedRoute` but checks for admin role

- Redirects non-admin users to dashboard

### 3. Admin Dashboard Page (`app/admin/page.tsx`)

- Main admin dashboard with:

- System statistics cards (total users, scans, deepfakes detected)
- Quick actions

- Recent activity feed

- Uses `TacticalShell` with `activeTab="admin"`

### 4. User Management Components

- `components/admin/user-list.tsx` - Table/list of all users with actions

- `components/admin/user-form.tsx` - Create/edit user form

- `components/admin/user-stats.tsx` - User statistics display

### 5. Update Navigation (`components/tactical-shell.tsx`)

- Add "Admin Panel" nav item (only visible when `user.role === 'admin'`)

- Link to `/admin` route

### 6. Admin Stats Component (`components/admin/admin-stats.tsx`)

- Display system-wide statistics

- Charts/graphs for visual representation

## Key Features

### User Management

- View all users with pagination

- Filter by role, status (active/inactive)

- Create new users (default role: operative, cannot create admin)

- Edit user details (email, role, metadata, isActive)

- Delete users (with confirmation, cannot delete admin)

- View user statistics

### System Statistics

- Total users count

- Users by role breakdown

- Total scans
- Deepfakes detected count

- System health metrics

### Security

- All admin routes protected with `requirePermission(PERMISSIONS.USER_*)`

- Frontend role check before showing admin panel

- Prevent creating multiple admins (backend validation)

- Prevent deleting admin user

- Prevent changing user to admin if admin exists

## File Structure

```javascript
backend/src/
  users/
    user.model.js (existing)
    user.service.js (new)
    user.controller.js (new)
    user.routes.js (new)
  admin/
    admin.controller.js (new - for stats)
    admin.routes.js (new)

app/
  admin/
    page.tsx (new)

components/
  admin-protected-route.tsx (new)
  admin/
    user-list.tsx (new)
    user-form.tsx (new)
    user-stats.tsx (new)
    admin-stats.tsx (new)
```



## Implementation Order

1. Backend user service and controller

2. Backend user routes and registration

3. Admin stats endpoint

4. Frontend API service methods

5. Admin protected route component

6. Admin dashboard page

7. User management components
8. Update navigation