# Docker Compose Setup Guide — SENTINEL-X

## Quick Start (One Command!)

```bash
docker compose up
```

All services will start automatically with proper health checks and dependency management.

---

## What Gets Started

When you run `docker compose up`, these services start in dependency order:

| Service | Port | Status |
|---------|------|--------|
| **MongoDB** | 27019 → 27017 | Database (waits for health check) |
| **Redis** | 6380 → 6379 | Cache & Queue (waits for health check) |
| **ML Service** | 5001 → 5000 | Python Flask (Deepfake Detection Models) |
| **Backend API** | 3001 | Node.js Express (waits for MongoDB, Redis, ML Service healthy) |
| **Frontend** | 3002 → 3000 | Next.js (waits for Backend healthy) |

---

## Service Health Checks

Each service has a health check configured:

- **MongoDB**: `mongosh --eval "db.adminCommand('ping')"` — checks every 10s
- **Redis**: `redis-cli ping` — checks every 10s  
- **Backend**: `curl http://localhost:3001/health` — checks every 30s after 40s startup grace period
- **Frontend**: `curl http://localhost:3000` — checks every 30s after 40s startup grace period
- **ML Service**: No health check (starts immediately)

---

## Environment Configuration

The system uses `.env.local` for Docker Compose environment variables. Required variables:

```env
# Authentication
JWT_SECRET=sentinel-deepfake-jwt-secret-key-dev-minimum-32-chars
ENCRYPTION_KEY=sentinel-encrypt-key-32charssssssssss
ENCRYPTION_IV=sentineliv123456

# OAuth (optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=900108796300-1ag26bmttfmh9h6qcdulo8fuonm0dmrc.apps.googleusercontent.com

# Database (auto-configured for Docker)
MONGODB_URI=mongodb://mongodb:27017/deepfake-detection
REDIS_URL=redis://redis:6379
ML_SERVICE_URL=http://ml-service:5000

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3001/api
FRONTEND_URL=http://localhost:3002
```

All values are pre-configured in `.env.local` with safe defaults for development.

---

## Access the Application

Once all services are healthy (watch the logs for "healthy"):

1. **Landing Page**: http://localhost:3002
2. **Login**: http://localhost:3002/login
3. **Backend API**: http://localhost:3001/api
4. **ML Service**: http://localhost:5001 (health status)

---

## Default Test Users

Pre-seeded users for testing (created on first backend startup):

| Email | Password | Role |
|-------|----------|------|
| `admin@sentinel.local` | `AdminPass123!` | Admin |
| `analyst@sentinel.local` | `AnalystPass123!` | Analyst |
| `operative@sentinel.local` | `OperativePass123!` | Operative |

---

## Volumes & Persistence

Docker Compose creates these named volumes for data persistence:

| Volume | Purpose | Mounted At |
|--------|---------|-----------|
| `mongo-data` | MongoDB database files | `/data/db` |
| `mongodb_config` | MongoDB config | `/data/configdb` |
| `redis-data` | Redis persistence | `/data` |
| `uploads` | Shared upload folder | `/app/uploads` |
| `ml-checkpoints` | ML model fine-tuning checkpoints | `/app/checkpoints` |
| `backend_logs` | Backend application logs | `/app/logs` |

To clear all data and start fresh:
```bash
docker compose down -v
docker compose up
```

---

## Common Commands

### Start Services (Attached Logs)
```bash
docker compose up
```

### Start Services (Background)
```bash
docker compose up -d
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f ml-service
docker compose logs -f frontend
```

### Stop Services
```bash
docker compose down
```

### Stop + Remove Volumes
```bash
docker compose down -v
```

### Rebuild All Images
```bash
docker compose up --build
```

### Rebuild Specific Service
```bash
docker compose up --build backend
docker compose up --build frontend
```

---

## Troubleshooting

### Ports Already in Use
```bash
# Change port mappings in docker-compose.yml
# Or kill existing processes:
lsof -i :3001   # Backend
lsof -i :3002   # Frontend
lsof -i :5001   # ML Service
lsof -i :6380   # Redis
lsof -i :27019  # MongoDB
```

### Services Not Starting
Check logs:
```bash
docker compose logs --tail=50 backend
docker compose logs --tail=50 mongodb
```

Common issues:
- **MongoDB**: Waiting for mongosh — ensure mongo:7.0 image exists (`docker pull mongo:7.0`)
- **Redis**: Port conflict — check port 6380 is free
- **Backend**: Waiting for MongoDB health check — wait for "healthy" status in logs
- **Frontend**: Build failed — ensure Node.js version 20+ and all dependencies installed

### Health Check Failures

If a service shows "unhealthy":

```bash
# Check service status
docker compose ps

# Inspect container
docker exec deepfake-backend npm run health
docker exec deepfake-mongodb mongosh --eval "db.adminCommand('ping')"
docker exec deepfake-redis redis-cli ping
```

### ML Service Not Loading Models
Models auto-download on first run from HuggingFace. If startup is slow, check logs:
```bash
docker compose logs -f ml-service | grep -i "model\|download"
```

First startup can take 2-3 minutes for model downloads (500MB+ total).

---

## Production Deployment

For production, update these values in `.env.local` before deploying:

```env
# Use strong secrets (generate with: openssl rand -base64 32)
JWT_SECRET=<generate-new>
ENCRYPTION_KEY=<generate-new>
ENCRYPTION_IV=<generate-new>

# Update URLs to your domain
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api

# Use production MongoDB Atlas
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/deepfake-detection

# Disable development logging
LOG_LEVEL=error
NODE_ENV=production
```

Then:
```bash
docker compose -f docker-compose.yml up -d
```

---

## System Requirements

- **Docker**: v20.10+
- **Docker Compose**: v2.0+
- **Disk Space**: 20GB+ (for models + data)
- **RAM**: 8GB minimum (for ML models)
- **CPU**: 4 cores recommended

Check versions:
```bash
docker --version
docker compose version
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│            Docker Compose Network                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐  ┌──────────────┐                 │
│  │  Frontend   │  │  Backend API │                 │
│  │ :3002→:3000 │  │  :3001:3001  │                 │
│  │ Next.js     │  │ Node.js      │                 │
│  └─────────────┘  └──────────────┘                 │
│       │                    │                        │
│       └────────────────────┼────────────────────┐   │
│                            │                    │   │
│                    ┌───────┴──────────┐         │   │
│                    │                  │         │   │
│            ┌───────▼────┐    ┌───────▼──┐     │   │
│            │  MongoDB   │    │  Redis   │     │   │
│            │ :27019→... │    │ :6380→.. │     │   │
│            └────────────┘    └──────────┘     │   │
│                                               │   │
│                    ┌──────────────────────┐   │   │
│                    │   ML Service         │◄──┘   │
│                    │ :5001→:5000 (Flask)  │       │
│                    └──────────────────────┘       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Next Steps

1. ✅ Run `docker compose up`
2. 🔗 Visit http://localhost:3002
3. 🔐 Login with test user credentials
4. 📤 Upload media for deepfake detection
5. 📊 Check results and analytics dashboard

Enjoy! 🎉
