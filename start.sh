#!/bin/sh

# ============================================
# Boot order: Backend → Frontend
# Database is a separate Railway service (always running)
# Railway routes traffic to PORT=80 (nginx)
# Express listens on BACKEND_PORT=3001 (internal)
# ============================================

export BACKEND_PORT="${BACKEND_PORT:-3001}"

# STEP 1: Start Backend
echo "[start] Step 1/2: Starting backend on port ${BACKEND_PORT}..."
PORT=$BACKEND_PORT node /app/server/src/index.js &
NODE_PID=$!

# Wait for backend to be ready
RETRY=0
until wget -q --spider "http://localhost:${BACKEND_PORT}/api/health" 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge 20 ]; then
    echo "[start] WARNING: Backend not responding after 20s, starting nginx anyway..."
    break
  fi
  sleep 1
done
echo "[start] Backend ready on port ${BACKEND_PORT}."

# STEP 2: Start Frontend (nginx on port 80)
echo "[start] Step 2/2: Starting nginx on port 80..."
trap 'kill $NODE_PID 2>/dev/null; wait $NODE_PID 2>/dev/null' TERM INT
exec nginx -g 'daemon off;'
