# SENTINEL - Deepfake Detection & Authenticity Verification System

An AI-powered platform for detecting deepfake media using machine learning and multi-agent orchestration. Analyzes images, videos, and audio to identify AI-generated or manipulated content with confidence scores and forensic analysis. Features RBAC authentication, batch processing (50 files), real-time updates via WebSocket, GPU support, and comprehensive evidence storage.

**Quick Start**: Clone the repo, run `docker-compose up -d`, and access the platform at http://localhost:3002 (frontend), http://localhost:3001 (backend), and http://localhost:5001 (ML service).

**Tech Stack**: Next.js 16 + React 19 + TypeScript (frontend), Node.js + Express.js + MongoDB (backend), Python + Flask + SiglIP 94.44% accurate deepfake detector (ML), Docker + Redis + Nginx (infrastructure).

**Key Features**: 4-Agent AI Pipeline (Perception, Detection, Compression, Cognitive), multi-modal analysis (images/video/audio), JWT authentication, role-based access control (Admin/Operative/Analyst), PDF/JSON/CSV exports, admin dashboard with ML health monitoring, audit logging, and GPU acceleration. See [docs/](docs/) for detailed documentation and [GitHub Issues](https://github.com/HarshdeepAthawale/Deepfake-Detection-Authenticity-Verification-System/issues) for support.

---

**License**: Proprietary. All rights reserved. | **Built for tactical field deployment.**
