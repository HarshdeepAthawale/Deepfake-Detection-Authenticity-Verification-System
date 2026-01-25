# System Architecture

## Overview

The Deepfake Detection & Authenticity Verification System is a full-stack application that uses machine learning to detect manipulated media files. The system employs a 4-agent AI pipeline for comprehensive analysis.

## Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Next.js Frontend<br/>React 19, TypeScript]
    end

    subgraph "API Layer"
        API[Express.js Backend<br/>Node.js, REST API]
        WS[WebSocket Server<br/>Socket.IO]
    end

    subgraph "AI Pipeline"
        P[Perception Agent<br/>Frame Extraction]
        D[Detection Agent<br/>ML Inference]
        C[Compression Agent<br/>Artifact Analysis]
        COG[Cognitive Agent<br/>Explanation]
    end

    subgraph "ML Layer"
        ML[ML Service<br/>Flask, PyTorch]
        MODEL[EfficientNet-B0<br/>93.3% AUC]
    end

    subgraph "Data Layer"
        DB[(MongoDB<br/>Scans, Users)]
        REDIS[(Redis<br/>Cache, Queue)]
        FS[File Storage<br/>Uploads]
    end

    UI -->|HTTP/WS| API
    UI -->|Real-time| WS
    API --> P
    P --> D
    D --> C
    C --> COG
    D -->|Inference Request| ML
    ML --> MODEL
    API --> DB
    API --> REDIS
    API --> FS
    WS --> REDIS
```

## Component Architecture

### Frontend (Next.js)

```mermaid
graph LR
    subgraph "Pages"
        LOGIN[Login Page]
        DASH[Dashboard]
        SCAN[Scanner]
        VAULT[Evidence Vault]
        ADMIN[Admin Panel]
        ANALYTICS[Analytics]
    end

    subgraph "Components"
        AUTH[Auth Context]
        SCANNER[Media Scanner]
        EVIDENCE[Evidence Vault]
        SHELL[Tactical Shell]
    end

    subgraph "Services"
        API_CLIENT[API Client]
        WS_CLIENT[WebSocket Client]
    end

    LOGIN --> AUTH
    DASH --> AUTH
    SCAN --> SCANNER
    VAULT --> EVIDENCE
    SCANNER --> API_CLIENT
    EVIDENCE --> API_CLIENT
    SCANNER --> WS_CLIENT
```

### Backend (Express.js)

```mermaid
graph TB
    subgraph "Routes"
        AUTH_R[Auth Routes]
        SCAN_R[Scan Routes]
        ADMIN_R[Admin Routes]
    end

    subgraph "Controllers"
        AUTH_C[Auth Controller]
        SCAN_C[Scan Controller]
        ADMIN_C[Admin Controller]
    end

    subgraph "Services"
        AUTH_S[Auth Service]
        SCAN_S[Scan Service]
        EXPORT_S[Export Service]
        EMAIL_S[Email Service]
    end

    subgraph "Middleware"
        JWT[JWT Auth]
        RBAC[RBAC]
        UPLOAD[File Upload]
        ERROR[Error Handler]
    end

    AUTH_R --> JWT
    JWT --> AUTH_C
    AUTH_C --> AUTH_S
    
    SCAN_R --> JWT
    JWT --> RBAC
    RBAC --> UPLOAD
    UPLOAD --> SCAN_C
    SCAN_C --> SCAN_S
    SCAN_S --> EXPORT_S
```

## Data Flow

### Scan Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Perception
    participant Detection
    participant ML Service
    participant Compression
    participant Cognitive
    participant Database

    User->>Frontend: Upload Media File
    Frontend->>Backend: POST /api/scans/upload
    Backend->>Perception: Extract Frames/Metadata
    Perception->>Detection: Perception Data
    Detection->>ML Service: Inference Request
    ML Service->>ML Service: EfficientNet Inference
    ML Service->>Detection: Scores
    Detection->>Compression: Detection Results
    Compression->>Compression: Analyze Artifacts
    Compression->>Cognitive: Compression Results
    Cognitive->>Cognitive: Generate Explanation
    Cognitive->>Database: Save Scan Results
    Database->>Backend: Scan ID
    Backend->>Frontend: Scan Results
    Frontend->>User: Display Results
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Google
    participant Database

    alt Email/Password Login
        User->>Frontend: Enter Credentials
        Frontend->>Backend: POST /api/auth/login
        Backend->>Database: Verify User
        Database->>Backend: User Data
        Backend->>Backend: Generate JWT
        Backend->>Frontend: JWT Token
        Frontend->>User: Redirect to Dashboard
    else Google OAuth
        User->>Frontend: Click Google Login
        Frontend->>Google: OAuth Request
        Google->>Frontend: Auth Code
        Frontend->>Backend: POST /api/auth/google
        Backend->>Google: Verify Token
        Google->>Backend: User Info
        Backend->>Database: Find/Create User
        Backend->>Backend: Generate JWT
        Backend->>Frontend: JWT Token
        Frontend->>User: Redirect to Dashboard
    end
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        HTTPS[HTTPS/TLS]
        CORS[CORS Policy]
        HELMET[Security Headers]
        RATE[Rate Limiting]
        JWT[JWT Authentication]
        RBAC[Role-Based Access]
        ENCRYPT[Data Encryption]
        HASH[File Hashing]
    end

    subgraph "Data Protection"
        BCRYPT[Password Hashing<br/>bcrypt]
        AES[File Encryption<br/>AES-256]
        SHA[Integrity Check<br/>SHA-256]
    end

    HTTPS --> CORS
    CORS --> HELMET
    HELMET --> RATE
    RATE --> JWT
    JWT --> RBAC
    RBAC --> ENCRYPT
    ENCRYPT --> HASH
    
    ENCRYPT --> BCRYPT
    ENCRYPT --> AES
    HASH --> SHA
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/Load Balancer]
    end

    subgraph "Application Tier"
        FE1[Frontend Instance 1]
        FE2[Frontend Instance 2]
        BE1[Backend Instance 1]
        BE2[Backend Instance 2]
        ML1[ML Service Instance 1]
        ML2[ML Service Instance 2]
    end

    subgraph "Data Tier"
        DB_PRIMARY[(MongoDB Primary)]
        DB_SECONDARY[(MongoDB Secondary)]
        REDIS_MASTER[(Redis Master)]
        REDIS_REPLICA[(Redis Replica)]
    end

    subgraph "Storage"
        S3[Object Storage<br/>S3/MinIO]
    end

    LB --> FE1
    LB --> FE2
    FE1 --> BE1
    FE2 --> BE2
    BE1 --> ML1
    BE2 --> ML2
    BE1 --> DB_PRIMARY
    BE2 --> DB_PRIMARY
    DB_PRIMARY --> DB_SECONDARY
    BE1 --> REDIS_MASTER
    BE2 --> REDIS_MASTER
    REDIS_MASTER --> REDIS_REPLICA
    BE1 --> S3
    BE2 --> S3
```

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: React Context
- **Real-time**: Socket.IO Client

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: MongoDB 7.0
- **Cache**: Redis (optional)
- **Queue**: Bull (optional)
- **Authentication**: JWT, Google OAuth
- **File Processing**: FFmpeg, Multer
- **Logging**: Winston

### ML Service
- **Language**: Python 3.10
- **Framework**: Flask
- **ML Framework**: PyTorch
- **Model**: EfficientNet-B0
- **Image Processing**: Pillow, OpenCV

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose / Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana
- **Logging**: ELK Stack (optional)

## Scalability Considerations

### Horizontal Scaling
- **Frontend**: Stateless, can run multiple instances
- **Backend**: Stateless API, load balanced
- **ML Service**: CPU/GPU intensive, parallel processing
- **Database**: MongoDB replica set for read scaling

### Vertical Scaling
- **ML Service**: Increase CPU/GPU resources
- **Database**: Increase RAM for better caching
- **Backend**: Increase memory for concurrent requests

### Performance Optimization
- **Caching**: Redis for frequently accessed data
- **CDN**: Static assets served from CDN
- **Database Indexing**: Optimized queries
- **Code Splitting**: Lazy loading in frontend
- **Image Optimization**: Next.js image optimization

## Monitoring and Observability

### Metrics
- Request rate and latency
- Error rates
- ML inference time
- Database query performance
- Memory and CPU usage

### Logging
- Application logs (Winston)
- Access logs (Nginx)
- Error tracking (Sentry)
- Audit logs (Database)

### Alerts
- Service downtime
- High error rates
- Resource exhaustion
- Security incidents
