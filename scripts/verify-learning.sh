#!/bin/bash
# End-to-end verification for Self-Learning AI Agents
# For Docker: use ./scripts/docker-verify-learning.sh or npm run verify:docker
# For local dev: backend + MongoDB + Redis must be running
# Usage: ./scripts/verify-learning.sh [BASE_URL]
# Default BASE_URL: http://localhost:3001

set -e
BASE_URL="${1:-http://localhost:3001}"
API_URL="${BASE_URL}/api"

echo "=== Self-Learning Verification Script ==="
echo "Target: $API_URL"
echo ""

# Load admin credentials from .env if available
if [ -f "backend/.env" ]; then
  export $(grep -E '^(ADMIN_EMAIL|TEST_ADMIN_EMAIL|ADMIN_PASSWORD|TEST_ADMIN_PASSWORD)=' backend/.env 2>/dev/null | xargs)
fi

# Try common test credentials (from create-admin.js or .env)
ADMIN_EMAIL="${ADMIN_EMAIL:-harshdeepathawale27@gmail.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@123}"

echo "Step 1: Login as admin..."
LOGIN_RESP=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

if echo "$LOGIN_RESP" | grep -q '"success":true'; then
  TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo "  ✓ Login successful"
else
  echo "  ✗ Login failed. Response: $LOGIN_RESP"
  echo "  Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env or use test credentials."
  exit 1
fi

echo ""
echo "Step 2: GET /api/admin/learning/status..."
STATUS_RESP=$(curl -s -X GET "$API_URL/admin/learning/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$STATUS_RESP" | grep -q '"success":true'; then
  echo "  ✓ Learning status endpoint OK"
  echo "  Feedback since last cycle: $(echo "$STATUS_RESP" | grep -o '"feedbackSinceLastCycle":[0-9]*' | cut -d':' -f2)"
  echo "  Total feedback: $(echo "$STATUS_RESP" | grep -o '"totalFeedback":[0-9]*' | cut -d':' -f2)"
  echo "  Ready for cycle: $(echo "$STATUS_RESP" | grep -o '"readyForCycle":[^,}]*' | cut -d':' -f2)"
else
  echo "  ✗ Status request failed: $STATUS_RESP"
  exit 1
fi

echo ""
echo "Step 3: POST /api/admin/learning/trigger (manual learning cycle)..."
TRIGGER_RESP=$(curl -s -X POST "$API_URL/admin/learning/trigger" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$TRIGGER_RESP" | grep -q '"success":true'; then
  echo "  ✓ Manual trigger OK"
  echo "  Cycle status: $(echo "$TRIGGER_RESP" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)"
else
  echo "  Response: $TRIGGER_RESP"
  echo "  (Trigger may complete even if ML service is unavailable - detection agent will be 'skipped')"
fi

echo ""
echo "Step 4: GET /api/admin/learning/history..."
HISTORY_RESP=$(curl -s -X GET "$API_URL/admin/learning/history?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

if echo "$HISTORY_RESP" | grep -q '"success":true'; then
  echo "  ✓ History endpoint OK"
else
  echo "  ✗ History request failed"
fi

echo ""
echo "=== Verification complete ==="
echo ""
echo "Optional: To verify feedback flow, submit feedback on a completed scan:"
echo "  POST /api/scans/:scanId/feedback"
echo "  Body: {\"correctedVerdict\": \"AUTHENTIC\", \"notes\": \"optional\"}"
echo ""
echo "Frames are copied to: uploads/training_dataset/{real,fake}/"
echo "ML retraining requires >= 10 samples in training_dataset."
echo ""
