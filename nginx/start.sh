#!/bin/sh
set -e

# ── Port configuration ────────────────────────────────────────────────────────
# Railway/hosting sets PORT for the public-facing server (nginx).
# Backend always runs on 3001 internally.
export NGINX_PORT="${PORT:-80}"
export BACKEND_PORT=3001

# ── Generate nginx config from template ───────────────────────────────────────
envsubst '${NGINX_PORT}' < /etc/nginx/http.d/default.conf > /tmp/nginx.conf
cp /tmp/nginx.conf /etc/nginx/http.d/default.conf

# ── DB migrations ─────────────────────────────────────────────────────────────
echo "[start] Running DB migrations..."
node /app/server/src/db/migrations/@system/run.js
echo "[start] Migrations complete."

# ── Start backend ─────────────────────────────────────────────────────────────
echo "[start] Starting backend on port ${BACKEND_PORT}..."
PORT=${BACKEND_PORT} node /app/server/src/index.js &

# ── Wait for backend to be ready ──────────────────────────────────────────────
echo "[start] Waiting for backend..."
for i in $(seq 1 30); do
  if wget -qO- "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; then
    echo "[start] Backend ready."
    break
  fi
  sleep 1
done

# ── Start nginx ───────────────────────────────────────────────────────────────
echo "[start] Starting nginx on port ${NGINX_PORT}..."
exec nginx -g 'daemon off;'
