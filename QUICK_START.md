# 🚀 Quick Start Guide

Get the Deepfake Detection System running in minutes!

## Option 1: Docker (Recommended)

### Prerequisites
- Docker Desktop installed

### Steps

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Seed initial users:**
   ```bash
   docker-compose exec backend npm run seed
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api

4. **Login with:**
   - Email: `operative@sentinel.com`
   - Password: `operative123`

See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed Docker instructions.

---

## Option 2: Local Development

### Prerequisites
- Node.js 18+
- MongoDB running locally
- FFmpeg installed

### Backend Setup

1. **Navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   # Copy example env file
   cp .env.example .env
   # Edit .env with your settings (at minimum, change JWT_SECRET and ENCRYPTION_KEY)
   ```

4. **Start MongoDB:**
   ```bash
   # Windows: mongod
   # macOS/Linux: sudo systemctl start mongod
   ```

5. **Seed users:**
   ```bash
   npm run seed
   ```

6. **Start backend:**
   ```bash
   npm run dev
   ```

Backend will run on http://localhost:3001

### Frontend Setup

1. **Navigate to root directory:**
   ```bash
   cd ..
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
   ```

4. **Start frontend:**
   ```bash
   npm run dev
   ```

Frontend will run on http://localhost:3000

---

## Verify Installation

### Test Backend Health
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "deepfake-detection-backend",
  "version": "1.0.0"
}
```

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"operative@sentinel.com","password":"operative123"}'
```

### Test Frontend
Open http://localhost:3000 in your browser and login.

---

## Default Users

After running `npm run seed` or `docker-compose exec backend npm run seed`:

| Role | Email | Password | Operative ID |
|------|-------|----------|--------------|
| Admin | admin@sentinel.com | admin123 | ADMIN_1 |
| Operative | operative@sentinel.com | operative123 | GHOST_1 |
| Analyst | analyst@sentinel.com | analyst123 | ANALYST_1 |

---

## Next Steps

1. ✅ System is running
2. 📖 Read [Backend README](./backend/README.md) for API documentation
3. 📖 Read [DOCKER_SETUP.md](./DOCKER_SETUP.md) for Docker details
4. 🔧 Configure production environment variables
5. 🚀 Deploy to production

---

## Troubleshooting

### Backend won't start
- Check MongoDB is running: `mongosh` or `mongo`
- Verify `.env` file exists and has correct `MONGODB_URI`
- Check logs: `backend/logs/app.log`

### Frontend can't connect to backend
- Verify backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors

### Docker issues
- See [DOCKER_SETUP.md](./DOCKER_SETUP.md) troubleshooting section
- Check logs: `docker-compose logs`

---

**Need help?** Check the detailed documentation:
- [Backend README](./backend/README.md)
- [Backend SETUP](./backend/SETUP.md)
- [DOCKER_SETUP.md](./DOCKER_SETUP.md)

