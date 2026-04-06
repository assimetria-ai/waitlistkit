#!/usr/bin/env bash
# @system — post-deploy health check script
# Polls $RAILWAY_URL/api/health until it returns {status:'ok'} or max retries exceeded.
# Optionally updates the product's railway_url in Assimetria OS if ASSIMETRIA_OS_URL
# and PRODUCT_SLUG are set.
#
# Usage:
#   RAILWAY_URL=https://myapp.railway.app ./deploy-healthcheck.sh
#   ./deploy-healthcheck.sh https://myapp.railway.app
#
# Exit codes:
#   0 — health check passed
#   1 — health check failed (timeout or non-ok status)

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
RAILWAY_URL="${RAILWAY_URL:-${1:-}}"
MAX_RETRIES=10
RETRY_INTERVAL=10  # seconds between retries

# ── Validate input ───────────────────────────────────────────────────────────
if [[ -z "$RAILWAY_URL" ]]; then
  echo "[healthcheck] ERROR: RAILWAY_URL is not set. Pass it as an env var or first argument." >&2
  exit 1
fi

# Strip trailing slash for consistent URL construction
RAILWAY_URL="${RAILWAY_URL%/}"
HEALTH_URL="${RAILWAY_URL}/api/health"

# ── Poll health endpoint ─────────────────────────────────────────────────────
echo "[healthcheck] Polling ${HEALTH_URL} (max ${MAX_RETRIES} attempts, ${RETRY_INTERVAL}s interval)..."

attempt=0
success=false

while [[ $attempt -lt $MAX_RETRIES ]]; do
  attempt=$((attempt + 1))
  echo "[healthcheck] Attempt ${attempt}/${MAX_RETRIES}..."

  # Fetch with a 10s connect+read timeout; suppress progress output
  response=$(curl --silent --max-time 10 --write-out "\n%{http_code}" "${HEALTH_URL}" 2>/dev/null || true)

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [[ "$http_code" == "200" ]]; then
    # Validate that the JSON status field is 'ok'
    status_field=$(echo "$body" | jq -r '.status' 2>/dev/null || echo "")
    if [[ "$status_field" == "ok" ]]; then
      echo "[healthcheck] Health check passed (status=ok)."
      success=true
      break
    else
      echo "[healthcheck] HTTP 200 but status='${status_field}' — not ready yet."
    fi
  else
    echo "[healthcheck] HTTP ${http_code} — server not ready yet."
  fi

  if [[ $attempt -lt $MAX_RETRIES ]]; then
    echo "[healthcheck] Waiting ${RETRY_INTERVAL}s before next attempt..."
    sleep "$RETRY_INTERVAL"
  fi
done

# ── Handle failure ───────────────────────────────────────────────────────────
if [[ "$success" != "true" ]]; then
  echo "[healthcheck] FAILED: service did not become healthy after ${MAX_RETRIES} attempts." >&2
  echo "[healthcheck] Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >&2
  exit 1
fi

# ── Optional: update railway_url in Assimetria OS ────────────────────────────
ASSIMETRIA_OS_URL="${ASSIMETRIA_OS_URL:-}"
PRODUCT_SLUG="${PRODUCT_SLUG:-}"

if [[ -n "$ASSIMETRIA_OS_URL" && -n "$PRODUCT_SLUG" ]]; then
  echo "[healthcheck] Updating railway_url in Assimetria OS for product '${PRODUCT_SLUG}'..."

  patch_url="${ASSIMETRIA_OS_URL%/}/api/products/${PRODUCT_SLUG}"
  patch_body="{\"railway_url\": \"${RAILWAY_URL}\"}"

  patch_code=$(curl --silent --max-time 15 \
    --request PATCH \
    --header "Content-Type: application/json" \
    --data "$patch_body" \
    --write-out "%{http_code}" \
    --output /dev/null \
    "$patch_url" 2>/dev/null || echo "000")

  if [[ "$patch_code" =~ ^2 ]]; then
    echo "[healthcheck] Assimetria OS updated (HTTP ${patch_code})."
  else
    # Non-fatal: log a warning but do not fail the deploy
    echo "[healthcheck] WARNING: Assimetria OS PATCH returned HTTP ${patch_code}. railway_url may be stale." >&2
  fi
fi

# ── Success ──────────────────────────────────────────────────────────────────
echo "[healthcheck] Deployment verified. Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
exit 0
