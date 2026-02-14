#!/bin/bash
# Docker-based end-to-end verification for Self-Learning AI Agents
# Runs against the Docker Compose stack (backend, ML, MongoDB, Redis)
#
# Usage: ./scripts/docker-verify-learning.sh
#
# Prerequisites:
#   1. docker-compose up -d (or run this script - it will start services)
#   2. Admin user must exist (run: docker-compose exec backend node scripts/create-admin.js)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

BASE_URL="http://localhost:3001"
API_URL="${BASE_URL}/api"

echo "=== Docker Self-Learning Verification ==="
echo "Project: $PROJECT_ROOT"
echo "Target:  $BASE_URL (Docker backend)"
echo ""

# 1. Check Docker
if ! command -v docker &>/dev/null; then
  echo "✗ Docker is not installed or not in PATH"
  exit 1
fi

# 2. Ensure docker-compose is running
echo "Step 0: Ensuring Docker Compose services are up..."
if ! docker compose ps 2>/dev/null | grep -q "deepfake-backend"; then
  echo "  Starting Docker Compose..."
  docker compose up -d
  echo "  Waiting for backend to be healthy (up to 60s)..."
  for i in $(seq 1 30); do
    if curl -s -f "$BASE_URL/health" >/dev/null 2>&1; then
      echo "  ✓ Backend is healthy"
      break
    fi
    if [ $i -eq 30 ]; then
      echo "  ✗ Backend did not become healthy. Check: docker compose logs backend"
      exit 1
    fi
    sleep 2
  done
else
  if ! curl -s -f "$BASE_URL/health" >/dev/null 2>&1; then
    echo "  ✗ Backend container exists but health check failed. Restarting..."
    docker compose restart backend
    sleep 10
    if ! curl -s -f "$BASE_URL/health" >/dev/null 2>&1; then
      echo "  ✗ Backend unhealthy. Run: docker compose logs backend"
      exit 1
    fi
  fi
  echo "  ✓ Backend is running"
fi

echo ""

# 3. Load admin credentials
if [ -f "backend/.env" ]; then
  export $(grep -E '^(ADMIN_EMAIL|ADMIN_PASSWORD)=' backend/.env 2>/dev/null | xargs)
fi
if [ -f ".env" ]; then
  export $(grep -E '^(ADMIN_EMAIL|ADMIN_PASSWORD)=' .env 2>/dev/null | xargs)
fi

ADMIN_EMAIL="${ADMIN_EMAIL:-harshdeepathawale27@gmail.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@123}"

# 4. Run verification (reuse logic from verify-learning.sh)
echo "Step 1: Login as admin..."
LOGIN_RESP=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

if echo "$LOGIN_RESP" | grep -q '"success":true'; then
  TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo "  ✓ Login successful"
else
  echo "  ✗ Login failed. Create admin user first:"
  echo "    docker compose exec backend node scripts/create-admin.js"
  echo "  Or set ADMIN_EMAIL and ADMIN_PASSWORD in .env or backend/.env"
  exit 1
fi

echo ""
echo "Step 2: GET /api/admin/learning/status..."
STATUS_RESP=$(curl -s -X GET "$API_URL/admin/learning/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$STATUS_RESP" | grep -q '"success":true'; then
  echo "  ✓ Learning status OK"
  echo "  Feedback since last cycle: $(echo "$STATUS_RESP" | grep -o '"feedbackSinceLastCycle":[0-9]*' | cut -d':' -f2)"
  echo "  Total feedback: $(echo "$STATUS_RESP" | grep -o '"totalFeedback":[0-9]*' | cut -d':' -f2)"
  echo "  Ready for cycle: $(echo "$STATUS_RESP" | grep -o '"readyForCycle":[^,}]*' | cut -d':' -f2)"
else
  echo "  ✗ Status failed: $STATUS_RESP"
  exit 1
fi

echo ""
echo "Step 3: POST /api/admin/learning/trigger..."
TRIGGER_RESP=$(curl -s -X POST "$API_URL/admin/learning/trigger" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$TRIGGER_RESP" | grep -q '"success":true'; then
  echo "  ✓ Manual trigger OK"
  echo "  Cycle status: $(echo "$TRIGGER_RESP" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)"
else
  echo "  Response: $TRIGGER_RESP"
fi

echo ""
echo "Step 4: GET /api/admin/learning/history..."
HISTORY_RESP=$(curl -s -X GET "$API_URL/admin/learning/history?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

if echo "$HISTORY_RESP" | grep -q '"success":true'; then
  echo "  ✓ History OK"
else
  echo "  ✗ History failed"
fi

echo ""
echo "=== Docker verification complete ==="
echo ""
echo "Services: backend (3001), ml-service (5001), frontend (3002)"
echo "Admin UI: http://localhost:3002/admin/ml"
echo ""
