# 🐳 Docker Setup Guide

This guide explains how to run the Deepfake Detection System using Docker and Docker Compose.

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- At least 4GB of available RAM
- 10GB of free disk space

## Quick Start

### 1. Clone and Navigate

```bash
cd deepfake-detection-system
```

### 2. Set Environment Variables (Optional)

Create a `.env` file in the root directory for Docker Compose:

```env
# Security Secrets (REQUIRED - Change these in production!)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-in-production
ENCRYPTION_KEY=your-32-character-encryption-key-change-in-production
ENCRYPTION_IV=your-16-character-iv

# Optional: Override defaults
# FRONTEND_URL=http://localhost:3000
# MONGODB_URI=mongodb://mongodb:27017/deepfake-detection
```

**⚠️ Important:** Change the secrets in production! Never commit `.env` files with real secrets.

### 3. Build and Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health
- **MongoDB**: localhost:27017

### 5. Seed Initial Users

```bash
# Execute seed script in backend container
docker-compose exec backend npm run seed
```

This creates:
- **Admin**: `admin@sentinel.com` / `admin123`
- **Operative**: `operative@sentinel.com` / `operative123`
- **Analyst**: `analyst@sentinel.com` / `analyst123`

## Services

### MongoDB (`mongodb`)
- Port: `27017`
- Data persisted in Docker volume `mongodb_data`
- Health check enabled

### Backend (`backend`)
- Port: `3001`
- Built from `backend/Dockerfile`
- Includes FFmpeg for media processing
- Uploads stored in volume `backend_uploads`
- Logs stored in volume `backend_logs`

### Frontend (`frontend`)
- Port: `3000`
- Built from root `Dockerfile`
- Uses Next.js standalone output
- Connects to backend via `NEXT_PUBLIC_API_URL`

## Docker Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Restart Services

```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Rebuild all services
docker-compose build
docker-compose up -d
```

### Access Container Shell

```bash
# Backend container
docker-compose exec backend sh

# Frontend container
docker-compose exec frontend sh

# MongoDB shell
docker-compose exec mongodb mongosh
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Development Mode

For development with hot-reload, you can run services individually:

### Backend (Development)

```bash
cd backend
npm install
npm run dev
```

### Frontend (Development)

```bash
npm install
npm run dev
```

### MongoDB (Docker)

```bash
docker-compose up -d mongodb
```

## Production Deployment

### 1. Update Environment Variables

Create production `.env` file with:
- Strong `JWT_SECRET` (32+ characters)
- Strong `ENCRYPTION_KEY` (32 characters)
- Strong `ENCRYPTION_IV` (16 characters)
- Production `FRONTEND_URL`
- Production `MONGODB_URI` (if using external MongoDB)

### 2. Build Production Images

```bash
docker-compose -f docker-compose.yml build
```

### 3. Start Services

```bash
docker-compose -f docker-compose.yml up -d
```

### 4. Set Up Reverse Proxy (Recommended)

Use Nginx or Traefik to:
- Handle SSL/TLS certificates
- Route traffic to frontend/backend
- Add rate limiting
- Enable compression

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
# Windows
netstat -ano | findstr :3001

# macOS/Linux
lsof -i :3001

# Change ports in docker-compose.yml if needed
```

### MongoDB Connection Failed

```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Backend Won't Start

```bash
# Check backend logs
docker-compose logs backend

# Verify environment variables
docker-compose exec backend env | grep MONGODB

# Rebuild backend
docker-compose build backend
docker-compose up -d backend
```

### Frontend Build Fails

```bash
# Check build logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### FFmpeg Not Found

FFmpeg is installed in the backend Docker image. If you see errors:
- Verify backend container is running: `docker-compose ps backend`
- Check backend logs: `docker-compose logs backend`
- Rebuild backend: `docker-compose build backend`

### Volume Permissions

If you encounter permission issues with volumes:

```bash
# Fix uploads directory permissions
docker-compose exec backend chown -R node:node /app/uploads

# Fix logs directory permissions
docker-compose exec backend chown -R node:node /app/logs
```

## Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:3001/health
curl http://localhost:3000
```

## Data Persistence

Data is persisted in Docker volumes:
- `mongodb_data`: Database data
- `mongodb_config`: MongoDB configuration
- `backend_uploads`: Uploaded media files
- `backend_logs`: Application logs

To backup:

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out /data/backup

# Backup volumes
docker run --rm -v deepfake-detection-system_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb_backup.tar.gz /data
```

## Network

All services are on the `deepfake-network` bridge network:
- Services can communicate using service names (e.g., `mongodb`, `backend`)
- Frontend connects to backend via `http://localhost:3001/api` (from browser)
- Backend connects to MongoDB via `mongodb://mongodb:27017/deepfake-detection`

## Resource Limits

For production, consider adding resource limits in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Security Notes

1. **Never commit `.env` files** with real secrets
2. **Change default secrets** before production deployment
3. **Use secrets management** (Docker secrets, AWS Secrets Manager, etc.) in production
4. **Enable firewall** rules to restrict MongoDB port access
5. **Use HTTPS** in production (set up reverse proxy with SSL)
6. **Regular updates**: Keep Docker images and dependencies updated

---

**Ready to deploy!** 🚀

For more information, see:
- [Backend README](./backend/README.md)
- [Backend SETUP](./backend/SETUP.md)
- [API Integration Guide](./backend/API_INTEGRATION.md)

