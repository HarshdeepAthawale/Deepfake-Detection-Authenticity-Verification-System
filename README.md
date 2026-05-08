# SENTINEL - Deepfake Detection & Authenticity Verification System

A full-stack AI-powered platform for detecting deepfake media using machine learning and agentic AI orchestration. Detects AI-generated or manipulated content in images, videos, and audio with confidence scores and forensic analysis.

## Features

- **4-Agent AI Pipeline**: Perception, Detection, Compression, and Cognitive agents
- **Advanced ML Model**: SiglIP-based detector with 94.44% accuracy
- **Multi-Modal**: Images (JPEG, PNG), videos (MP4, AVI, MOV, WebM), audio (MP3, WAV)
- **Batch Processing**: Analyze up to 50 files simultaneously
- **Real-time Updates**: WebSocket-based progress tracking
- **GPU Support**: Optional CUDA for 10-50x faster inference
- **RBAC Authentication**: Admin, Operative, and Analyst roles
- **Evidence Vault**: Secure storage with integrity verification
- **Export Options**: PDF, JSON, and CSV export formats
- **Admin Dashboard**: User management, ML health monitoring, audit logs

## Technology Stack

| Layer | Tech |
|-------|------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express.js, MongoDB, JWT, FFmpeg |
| **ML Service** | Python 3.9+, Flask, HuggingFace, SiglIP |
| **Infrastructure** | Docker, Docker Compose, Redis, Nginx |

## Quick Start

### Docker (Recommended)
```bash
git clone https://github.com/HarshdeepAthawale/Deepfake-Detection-Authenticity-Verification-System.git
cd Deepfake-Detection-Authenticity-Verification-System

docker-compose up -d

# Access
# Frontend: http://localhost:3002
# Backend: http://localhost:3001
# ML Service: http://localhost:5001
```

### Manual Setup

**Prerequisites**: Node.js 18+, Python 3.10+, MongoDB 7.0+, Redis 7+, FFmpeg

**Frontend**:
```bash
npm install && npm run dev
```

**Backend**:
```bash
cd backend && npm install && npm run dev
```

**ML Service**:
```bash
cd ml-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && python app.py
```

## Architecture

```
Client → Frontend (Next.js, Port 3002)
           ↓ HTTP/WebSocket
         Backend (Express, Port 3001)
           ↓ 4-Agent Pipeline
         ML Service (Flask, Port 5001)
           ↓
         MongoDB, Redis, File Storage
```

## ML Model

| Property | Value |
|----------|-------|
| **Model** | SiglIP Deepfake Detector v1.0.0 |
| **Accuracy** | 94.44% |
| **Input Size** | 224×224 RGB |
| **Framework** | HuggingFace Transformers |
| **Model ID** | prithivMLmods/deepfake-detector-model-v1 |

## Verdict Thresholds

| Verdict | Score | Description |
|---------|-------|-------------|
| **DEEPFAKE** | ≥75% | High probability of manipulation |
| **SUSPICIOUS** | 40-74% | Moderate indicators |
| **AUTHENTIC** | <40% | Likely genuine |

## API Endpoints

### Authentication
```
POST   /api/auth/login        - Login
POST   /api/auth/register     - Register
GET    /api/auth/me           - Get current user
```

### Scans
```
POST   /api/scans/upload      - Upload single file
POST   /api/scans/batch       - Upload multiple (max 50)
GET    /api/scans/history     - Scan history
GET    /api/scans/:id         - Get scan details
DELETE /api/scans/:id         - Delete scan
```

### Admin
```
GET    /api/admin/stats       - System stats
GET    /api/admin/audit       - Audit logs
GET    /api/admin/ml/health   - ML service health
GET    /api/users             - List users
POST   /api/users             - Create user
```

### Reports
```
GET    /api/reports/scans/:id/pdf   - Export PDF
GET    /api/reports/scans/:id/json  - Export JSON
GET    /api/reports/scans/csv       - Bulk CSV
```

## Security

- **JWT Authentication**: 24h expiry, refresh tokens (7d)
- **Password**: bcrypt with 12 rounds
- **OAuth 2.0**: Google login support
- **RBAC**: Admin, Operative, Analyst roles
- **Data Protection**: SHA-256 hashing, AES-256 encryption
- **Rate Limiting**: 100 req/15 min
- **Security Headers**: Helmet.js (CSP, HSTS, XSS protection)
- **Input Validation**: Zod schemas
- **Audit Trail**: Complete action logging

## Deployment

### Production Checklist
- [ ] Update `.env` secrets
- [ ] Enable HTTPS with SSL
- [ ] Configure firewall (80, 443, 22)
- [ ] Enable MongoDB auth
- [ ] Set regular backups
- [ ] Configure rate limiting
- [ ] Review CORS settings
- [ ] Set up monitoring
- [ ] Disable debug mode

## Project Structure

```
deepfake-detection-system/
├── app/                    # Next.js pages
├── backend/src/            # Express backend
│   ├── agents/            # 4-Agent AI pipeline
│   ├── auth/              # Authentication
│   ├── scans/             # Scan management
│   └── admin/             # Admin routes
├── ml-service/            # Python ML service
├── components/            # React components
├── contexts/              # React context
└── docker-compose.yml     # Docker config
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit: `git commit -m 'Add feature'`
4. Push: `git push origin feature/name`
5. Open Pull Request

## License

This project is proprietary. All rights reserved. See LICENSE for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/HarshdeepAthawale/Deepfake-Detection-Authenticity-Verification-System/issues)
- **Documentation**: [docs/](docs/)

---

**Built for tactical field deployment. No shortcuts taken.**
