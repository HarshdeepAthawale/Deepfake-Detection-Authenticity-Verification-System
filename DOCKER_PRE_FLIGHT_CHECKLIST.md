# Docker Pre-Flight Checklist — SENTINEL-X

Before running `docker compose up`, verify your system is ready.

---

## System Requirements ✅

### Docker & Docker Compose
```bash
# Check Docker version (need v20.10+)
docker --version

# Check Docker Compose version (need v2.0+)
docker compose version

# Test Docker access (should show containers/images)
docker ps
```

### System Resources
- **Disk Space**: Minimum 20GB free (for images, volumes, ML models)
- **RAM**: Minimum 8GB available (ML models need ~4-6GB)
- **CPU**: 4+ cores recommended (especially for ML inference)

Check available resources:
```bash
# Linux
df -h
free -h

# macOS
df -h
vm_stat

# Windows (PowerShell)
Get-Volume
Get-ComputerInfo | Select-Object TotalPhysicalMemory
```

---

## Port Availability ✅

Verify these ports are not in use:

```bash
# Check all required ports
lsof -i :3001   # Backend API
lsof -i :3002   # Frontend
lsof -i :5001   # ML Service
lsof -i :6380   # Redis
lsof -i :27019  # MongoDB

# If any are in use, either:
# 1. Kill the process: kill -9 <PID>
# 2. Or change ports in docker-compose.yml
```

Ports needed:
- **3002** → Frontend
- **3001** → Backend API  
- **5001** → ML Service
- **6380** → Redis
- **27019** → MongoDB

---

## Environment Configuration ✅

### Check .env.local exists

```bash
# File should exist at project root
ls -la .env.local

# Should contain these keys (don't need valid values, just present):
grep -E "JWT_SECRET|ENCRYPTION_KEY|MONGODB_URI|NEXT_PUBLIC_GOOGLE_CLIENT_ID" .env.local
```

### Verify environment variables

Required variables:
- ✅ `JWT_SECRET` — JWT signing key (minimum 32 chars)
- ✅ `ENCRYPTION_KEY` — Data encryption key (32 chars)
- ✅ `ENCRYPTION_IV` — Encryption IV (16 chars)
- ✅ `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google OAuth ID (or empty string)
- ✅ `MONGODB_URI` — Should be `mongodb://mongodb:27017/deepfake-detection`
- ✅ `REDIS_URL` — Should be `redis://redis:6379`

Check current values:
```bash
cat .env.local | grep -E "JWT_SECRET|ENCRYPTION_KEY|MONGODB_URI"
```

All should be populated (even if with dummy values for dev).

---

## File Structure ✅

Critical files/directories that must exist:

```bash
# Frontend files
ls -l Dockerfile              # Frontend docker config
ls -l next.config.js         # Next.js config
ls -l package.json           # Node dependencies

# Backend files
ls -l backend/Dockerfile     # Backend docker config
ls -l backend/package.json   # Backend dependencies
ls -l backend/src/server.js  # Backend entry point

# ML Service files
ls -l ml-service/Dockerfile  # ML docker config
ls -l ml-service/app.py      # ML service entry
ls -l ml-service/requirements.txt  # Python deps

# Docker config
ls -l docker-compose.yml     # Docker Compose manifest
ls -l .env.local             # Environment variables

# Should exist and be executable
ls -l backend/scripts/seed-mongo-users.js  # DB seed script
```

---

## Docker Images ✅

Pre-pull necessary Docker images to save time:

```bash
# Official MongoDB image
docker pull mongo:7.0

# Official Redis image
docker pull redis:7-alpine

# Node.js runtime for backend
docker pull node:18-alpine

# Node.js runtime for frontend
docker pull node:20-alpine

# Python runtime for ML service
docker pull python:3.9-slim

# Verify all pulled
docker images | grep -E "mongo|redis|node|python"
```

---

## Network Configuration ✅

Ensure Docker bridge networking works:

```bash
# Create a test network
docker network create test-network

# List networks
docker network ls | grep test-network

# Remove test network
docker network rm test-network
```

---

## Volume Management ✅

Check Docker can create volumes:

```bash
# List existing volumes
docker volume ls

# Create a test volume
docker volume create test-volume

# Inspect the volume
docker volume inspect test-volume

# Clean up test volume
docker volume rm test-volume
```

---

## Git Repository Status ✅

Ensure repo is in a clean state:

```bash
# Check git status (should be clean or expected changes)
git status

# Verify you're on the correct branch
git branch

# Optionally pull latest changes
git pull origin master
```

---

## Quick Validation Script

Run all checks at once:

```bash
#!/bin/bash
echo "🔍 SENTINEL-X Docker Pre-Flight Checklist"
echo "========================================"

# Docker
echo "✓ Checking Docker..."
docker --version || { echo "❌ Docker not found"; exit 1; }

# Docker Compose
echo "✓ Checking Docker Compose..."
docker compose version || { echo "❌ Docker Compose not found"; exit 1; }

# Ports
echo "✓ Checking ports..."
for port in 3001 3002 5001 6380 27019; do
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port $port is in use"
  fi
done

# Environment
echo "✓ Checking environment..."
[ -f .env.local ] && echo "✓ .env.local exists" || echo "❌ .env.local missing"

# Files
echo "✓ Checking critical files..."
[ -f Dockerfile ] && echo "✓ Dockerfile exists" || echo "❌ Dockerfile missing"
[ -f backend/Dockerfile ] && echo "✓ backend/Dockerfile exists" || echo "❌ backend/Dockerfile missing"
[ -f docker-compose.yml ] && echo "✓ docker-compose.yml exists" || echo "❌ docker-compose.yml missing"

echo ""
echo "✅ Pre-flight checklist complete!"
echo "You're ready to run: docker compose up"
```

---

## Ready to Deploy? 🚀

Once all checks pass, start the system:

```bash
# Start all services (attached logs)
docker compose up

# Or background mode
docker compose up -d

# Watch logs
docker compose logs -f
```

---

## Immediate Help

### Docker Command Issues
```bash
# If docker commands fail with permission denied:
# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or use sudo
sudo docker compose up
```

### Port Binding Errors
```bash
# Find and kill process using a port
lsof -i :3002
kill -9 <PID>

# Or change ports in docker-compose.yml
# Then run: docker compose up
```

### Image Pull Failures
```bash
# If images fail to download:
# Check internet connection
ping docker.io

# Try pulling manually
docker pull mongo:7.0
docker pull node:20-alpine
docker pull python:3.9-slim
```

---

## Next Steps

1. ✅ Complete all checklist items above
2. 🚀 Run `docker compose up`
3. 📊 Monitor logs for errors
4. 🔗 Visit http://localhost:3002
5. 🔐 Login with test credentials

**Questions?** Check DOCKER_SETUP.md for detailed documentation.
