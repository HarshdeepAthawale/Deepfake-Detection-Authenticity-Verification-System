# Deployment Guide

Complete guide for deploying the Deepfake Detection System to production.

## Prerequisites

- Docker and Docker Compose installed
- Domain name configured with DNS
- SSL/TLS certificates (Let's Encrypt recommended)
- Minimum 4GB RAM, 2 CPU cores
- 50GB storage space

## Quick Start (Docker Compose)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/deepfake-detection-system.git
cd deepfake-detection-system
```

### 2. Configure Environment

```bash
# Copy production environment template
cp .env.production.example .env

# Edit .env and update all values
nano .env
```

**Critical values to change:**
- `JWT_SECRET` - Generate: `openssl rand -base64 32`
- `ENCRYPTION_KEY` - Generate: `openssl rand -base64 32 | cut -c1-32`
- `ENCRYPTION_IV` - Generate: `openssl rand -base64 16 | cut -c1-16`
- `MONGODB_URI` - Your MongoDB connection string
- `FRONTEND_URL` - Your production domain

### 3. Build and Start Services

```bash
# Build all Docker images
docker-compose build

# Start all services
docker-compose up -d

# Check service health
docker-compose ps
```

### 4. Verify Deployment

```bash
# Check backend health
curl http://localhost:3001/health

# Check ML service health
curl http://localhost:5001/health

# Check frontend
curl http://localhost:3002
```

### 5. Create Admin User

```bash
# Access backend container
docker-compose exec backend bash

# Run admin setup script
npm run set-admin

# Follow prompts to create admin user
```

## Production Deployment

### Option 1: Docker Compose with Nginx

#### 1. Install Nginx

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

#### 2. Configure Nginx

Create `/etc/nginx/sites-available/deepfake-detection`:

```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 500M;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/deepfake-detection /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 3. Setup SSL with Let's Encrypt

```bash
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

### Option 2: Kubernetes Deployment

#### 1. Create Kubernetes Manifests

See `k8s/` directory for example manifests:
- `k8s/mongodb-deployment.yaml`
- `k8s/backend-deployment.yaml`
- `k8s/ml-service-deployment.yaml`
- `k8s/frontend-deployment.yaml`
- `k8s/ingress.yaml`

#### 2. Deploy to Kubernetes

```bash
kubectl apply -f k8s/
```

## Database Setup

### MongoDB Production Configuration

#### Option 1: MongoDB Atlas (Recommended)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Configure network access (whitelist IPs)
4. Create database user
5. Get connection string
6. Update `MONGODB_URI` in `.env`

#### Option 2: Self-Hosted MongoDB

```bash
# Install MongoDB
sudo apt install mongodb-org

# Configure authentication
sudo nano /etc/mongod.conf

# Enable authentication
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod

# Create admin user
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})
```

## ML Model Setup

The ML model is included in the `ml-service/efficientnet_b0_ffpp_c23` directory. If you need to update or retrain the model:

1. Train model using `ml-training/` scripts
2. Export model to PyTorch format (.pth)
3. Copy to `ml-service/efficientnet_b0_ffpp_c23/`
4. Rebuild ML service container

## Monitoring and Logging

### Application Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f ml-service

# Export logs
docker-compose logs > logs.txt
```

### Health Monitoring

Set up health check endpoints:
- Backend: `http://localhost:3001/health`
- ML Service: `http://localhost:5001/health`

Use monitoring tools like:
- **Uptime Robot** - Free uptime monitoring
- **Prometheus + Grafana** - Metrics and dashboards
- **Sentry** - Error tracking

## Backup and Recovery

### Database Backup

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out /backup

# Copy backup from container
docker cp deepfake-mongodb:/backup ./mongodb-backup-$(date +%Y%m%d)

# Restore from backup
docker-compose exec mongodb mongorestore /backup
```

### File Uploads Backup

```bash
# Backup uploads directory
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz backend/uploads
```

### Automated Backups

Create cron job for daily backups:

```bash
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

## Scaling

### Horizontal Scaling

1. **Backend**: Run multiple backend instances behind load balancer
2. **ML Service**: Run multiple ML service instances for parallel processing
3. **Database**: Use MongoDB replica set for high availability

### Vertical Scaling

Increase resources in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

## Security Checklist

- [ ] Changed all default secrets in `.env`
- [ ] Enabled HTTPS with valid SSL certificate
- [ ] Configured firewall (allow only 80, 443, 22)
- [ ] Enabled MongoDB authentication
- [ ] Set up regular backups
- [ ] Configured rate limiting
- [ ] Enabled security headers (Helmet)
- [ ] Reviewed CORS settings
- [ ] Set up monitoring and alerts
- [ ] Configured log rotation
- [ ] Disabled debug mode in production
- [ ] Updated all dependencies to latest versions

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs backend

# Check port conflicts
sudo lsof -i :3001

# Restart services
docker-compose restart
```

### Database Connection Issues

```bash
# Test MongoDB connection
docker-compose exec backend node -e "require('./src/config/db.js').connectDB()"

# Check MongoDB logs
docker-compose logs mongodb
```

### ML Service Issues

```bash
# Check ML service health
curl http://localhost:5001/health

# Check model is loaded
docker-compose logs ml-service | grep "Model loaded"

# Restart ML service
docker-compose restart ml-service
```

### High Memory Usage

```bash
# Check container stats
docker stats

# Limit container memory
# Edit docker-compose.yml and add memory limits
```

## Performance Optimization

1. **Enable Redis caching** - Reduces database queries
2. **Use CDN** - Serve static assets from CDN
3. **Enable compression** - Gzip/Brotli compression in Nginx
4. **Database indexing** - Ensure proper indexes on MongoDB
5. **Image optimization** - Optimize frontend images
6. **Code splitting** - Enable Next.js code splitting

## Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose build

# Restart services
docker-compose up -d

# Run migrations (if any)
docker-compose exec backend npm run migrate
```

### Update Dependencies

```bash
# Backend
cd backend
npm update
npm audit fix

# Frontend
npm update
npm audit fix

# ML Service
cd ml-service
pip install --upgrade -r requirements.txt
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-org/deepfake-detection-system/issues
- Documentation: https://docs.your-domain.com
- Email: support@your-domain.com
