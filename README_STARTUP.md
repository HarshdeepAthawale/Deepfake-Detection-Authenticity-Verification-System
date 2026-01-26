# 🚀 Quick Start Guide

## Starting the System

Run the entire Deepfake Detection System with one command:

```bash
./start.sh
```

This will start:
- ✅ **Frontend** (Next.js) - http://localhost:3002
- ✅ **Backend API** (Node.js) - http://localhost:3001
- ✅ **ML Service** (Python/Flask) - http://localhost:5001
- ✅ **MongoDB Database** - mongodb://localhost:27018

## Stopping the System

```bash
./stop.sh
```

## Viewing Logs

**All services:**
```bash
docker-compose logs -f
```

**Specific service:**
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f ml-service
docker-compose logs -f mongodb
```

## Troubleshooting

### Services not starting?

1. **Check Docker is running:**
   ```bash
   docker info
   ```

2. **View service status:**
   ```bash
   docker-compose ps
   ```

3. **Rebuild containers:**
   ```bash
   docker-compose up -d --build
   ```

### Port conflicts?

If ports 3001, 3002, 5001, or 27018 are already in use, edit `docker-compose.yml` to change the port mappings.

### Frontend showing 0% confidence?

Make sure to **refresh your browser** (Ctrl+Shift+R) after rebuilding the frontend to clear the cache.

## Manual Commands

**Start in foreground (see logs):**
```bash
docker-compose up
```

**Rebuild specific service:**
```bash
docker-compose up -d --build frontend
docker-compose up -d --build backend
docker-compose up -d --build ml-service
```

**Restart a service:**
```bash
docker-compose restart frontend
```

**Remove all containers and volumes:**
```bash
docker-compose down -v
```

## First Time Setup

1. Make scripts executable:
   ```bash
   chmod +x start.sh stop.sh
   ```

2. Start the system:
   ```bash
   ./start.sh
   ```

3. Wait 30-60 seconds for all services to initialize

4. Open http://localhost:3002 in your browser

5. Create an account and start scanning!

## System Requirements

- Docker Desktop installed and running
- At least 4GB RAM available
- Ports 3001, 3002, 5001, 27018 available

---

**Need help?** Check the logs with `docker-compose logs -f`
