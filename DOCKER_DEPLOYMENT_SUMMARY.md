# Docker Deployment Setup — Summary

## What Was Updated

Your SENTINEL-X system is now fully containerized and ready for deployment with a single command!

### Modified Files

1. **docker-compose.yml** — Updated environment variable references and service dependencies
   - Fixed frontend build args: `${GOOGLE_CLIENT_ID}` → `${NEXT_PUBLIC_GOOGLE_CLIENT_ID}`
   - Added API URL environment variable
   - Improved backend health check dependency

2. **.env.local** — Reorganized with complete Docker Compose configuration
   - All required variables now documented and present
   - Safe development defaults provided
   - Ready for production customization

3. **README.md** — Updated Quick Start section
   - Simplified Docker Compose instructions
   - Added default login credentials
   - Links to detailed documentation

### New Documentation Files

1. **DOCKER_SETUP.md** — Complete Docker guide (40+ sections)
   - Detailed service descriptions
   - Common commands reference
   - Troubleshooting guide
   - Production deployment guide
   - System architecture diagrams

2. **DOCKER_PRE_FLIGHT_CHECKLIST.md** — Pre-deployment verification
   - System requirements check
   - Port availability verification
   - Environment configuration validation
   - File structure verification
   - Quick validation script

3. **docker-start.sh** (Linux/macOS) — Automated startup script
   - Verifies Docker/Docker Compose installation
   - Checks environment configuration
   - Handles already-running services
   - Colored output for clarity

4. **docker-start.bat** (Windows) — Automated startup script
   - Windows PowerShell compatible
   - Pre-flight checks
   - Service management

---

## How to Use

### Option 1: One-Command Start (Recommended) 🚀

```bash
# Linux/macOS
./docker-start.sh

# Windows
docker-start.bat
```

### Option 2: Direct Docker Compose

```bash
# Start services
docker compose up

# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Option 3: Individual Service Control

```bash
# Start only database and cache
docker compose up mongodb redis

# Start frontend after backend is ready
docker compose up --wait backend
docker compose up frontend

# Rebuild and restart a service
docker compose up --build backend
```

---

## What Runs When You Start

### 1. **MongoDB** (Port 27019:27017)
- Database for users, scans, audit logs
- Auto-initializes `deepfake-detection` database
- Health check: mongosh ping

### 2. **Redis** (Port 6380:6379)
- Cache layer for session data
- Job queue for batch processing
- Health check: redis-cli ping

### 3. **ML Service** (Port 5001:5000)
- Python Flask service
- SiglIP deepfake detector (94.44% accuracy)
- Audio detector (92.86% accuracy)
- Auto-downloads models on first run (~500MB)

### 4. **Backend API** (Port 3001:3001)
- Node.js Express server
- User authentication (JWT)
- Audit logging
- Waits for: MongoDB, Redis, ML Service
- Health check: GET /health → 200 status

### 5. **Frontend** (Port 3002:3000)
- Next.js production build
- React 19 + Tailwind CSS
- Waits for: Backend API
- Health check: GET http://localhost:3000 → 200 status

---

## Default Test Users

Pre-seeded on first backend startup:

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `admin@sentinel.local` | `AdminPass123!` | Admin | Full system access |
| `analyst@sentinel.local` | `AnalystPass123!` | Analyst | Analysis + reporting |
| `operative@sentinel.local` | `OperativePass123!` | Operative | Upload & scan only |

### Create Custom Users

After logging in as admin, use the Admin Panel:
1. Navigate to `/admin`
2. Go to "User Management"
3. Click "Add User"
4. Set role and initial password

---

## Access Points After Startup

Once all services show "healthy" (watch the logs):

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3002 | Web application |
| **Backend API** | http://localhost:3001/api | REST API |
| **ML Health** | http://localhost:5001/health | Model status |
| **Backend Health** | http://localhost:3001/health | API status |

---

## Data Persistence

Docker Compose creates named volumes that persist data between restarts:

| Volume | Contains | Path |
|--------|----------|------|
| `mongo-data` | MongoDB databases | `/data/db` |
| `redis-data` | Redis persistence | `/data` |
| `uploads` | Uploaded media files | `/app/uploads` |
| `ml-checkpoints` | Fine-tuned models | `/app/checkpoints` |
| `backend_logs` | API logs | `/app/logs` |

### Reset All Data

```bash
# Remove containers and volumes
docker compose down -v

# Restart fresh
docker compose up
```

---

## Environment Configuration

All settings in `.env.local`:

### Required (Must Have)
```env
JWT_SECRET=sentinel-deepfake-jwt-secret-key-dev-minimum-32-chars
ENCRYPTION_KEY=sentinel-encrypt-key-32charssssssssss
ENCRYPTION_IV=sentineliv123456
```

### Optional (Google OAuth)
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_ID=your-google-client-id
```

### Database (Auto-configured for Docker)
```env
MONGODB_URI=mongodb://mongodb:27017/deepfake-detection
REDIS_URL=redis://redis:6379
ML_SERVICE_URL=http://ml-service:5000
```

**Note**: These are correct for Docker Compose networking. Don't change them unless you modify docker-compose.yml.

---

## Troubleshooting

### Services Won't Start
```bash
# Check individual service logs
docker compose logs mongodb      # MongoDB
docker compose logs redis        # Redis
docker compose logs ml-service   # ML service
docker compose logs backend      # Backend API
docker compose logs frontend     # Frontend
```

### Port Already in Use
```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change ports in docker-compose.yml (line 48, 98, 146, etc.)
```

### ML Service Models Not Loading
```bash
# Models auto-download on first startup (2-3 minutes)
# Watch the logs
docker compose logs -f ml-service | grep -i "model\|download\|loading"
```

### Frontend Shows Blank Page
```bash
# Check frontend logs
docker compose logs -f frontend

# Rebuild frontend
docker compose up --build frontend
```

### Health Checks Failing
```bash
# View health status
docker ps --format "{{.Names}}\t{{.Status}}"

# Manual health check
docker exec deepfake-backend curl -s http://localhost:3001/health
docker exec deepfake-mongodb mongosh --eval "db.adminCommand('ping')"
docker exec deepfake-redis redis-cli ping
```

---

## Production Deployment

### Before Deploying to Production

1. **Generate strong secrets**:
   ```bash
   openssl rand -base64 32  # JWT_SECRET
   openssl rand -base64 32  # ENCRYPTION_KEY
   openssl rand -base64 16  # ENCRYPTION_IV
   ```

2. **Update .env.local**:
   ```env
   NODE_ENV=production
   LOG_LEVEL=error
   JWT_SECRET=<generated-value>
   ENCRYPTION_KEY=<generated-value>
   ENCRYPTION_IV=<generated-value>
   FRONTEND_URL=https://your-domain.com
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/deepfake-detection
   ```

3. **Update docker-compose.yml**:
   ```yaml
   backend:
     environment:
       NODE_ENV: production
       FRONTEND_URL: https://your-domain.com
   ```

4. **Run with compose**:
   ```bash
   docker compose -f docker-compose.yml up -d
   docker compose logs -f
   ```

---

## Performance Tips

### For Development (Local)
- Models cached locally (~500MB)
- First scan slower (model download + initialization)
- Subsequent scans: video ~13s, image ~300ms, audio ~2s

### For Production
1. **Enable GPU** (if available):
   - Uncomment `ml-service-gpu` in docker-compose.yml
   - Requires NVIDIA Docker runtime
   - 10-50x faster inference

2. **Increase resources**:
   ```yaml
   backend:
     deploy:
       resources:
         limits:
           memory: 2G
         reservations:
           memory: 1G
   ```

3. **Enable Redis persistence**:
   - Already configured in docker-compose.yml
   - Sessions survive container restarts

---

## Quick Reference

| Task | Command |
|------|---------|
| Start all services | `docker compose up` |
| Start in background | `docker compose up -d` |
| View logs | `docker compose logs -f` |
| View specific service logs | `docker compose logs -f backend` |
| Stop services | `docker compose down` |
| Stop + remove volumes | `docker compose down -v` |
| Rebuild services | `docker compose up --build` |
| Rebuild specific service | `docker compose up --build backend` |
| Check service status | `docker ps` or `docker compose ps` |
| Execute command in container | `docker compose exec backend npm run health` |
| View resource usage | `docker stats` |

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|------------|
| **RAM** | 4GB | 8GB+ |
| **CPU** | 2 cores | 4+ cores |
| **Disk** | 20GB | 50GB+ |
| **Docker** | 20.10+ | Latest |
| **Docker Compose** | 2.0+ | Latest |

Check your resources:
```bash
docker stats
```

---

## Documentation Files

- **DOCKER_SETUP.md** — Full reference guide (40+ sections)
- **DOCKER_PRE_FLIGHT_CHECKLIST.md** — Pre-deployment verification
- **README.md** — Updated with Docker quick start
- **This file** — Deployment summary

---

## Support & Debugging

1. **Check logs**: `docker compose logs -f`
2. **Verify health**: `docker compose ps` (all should show "healthy")
3. **Test connectivity**: `curl http://localhost:3001/health`
4. **Reset and restart**:
   ```bash
   docker compose down -v
   docker compose up
   ```

For detailed troubleshooting, see DOCKER_SETUP.md section: "Troubleshooting"

---

## Next Steps

1. ✅ Run `./docker-start.sh` (Linux/macOS) or `docker-start.bat` (Windows)
2. 🔗 Wait for all services to show "healthy"
3. 📱 Open http://localhost:3002 in your browser
4. 🔐 Login with test credentials (see above)
5. 📤 Upload media for deepfake detection
6. 📊 View results and analytics

**You're all set! 🎉**

