#!/usr/bin/env bash
# @system — CI/CD post-deploy wrapper
# Runs deploy-healthcheck.sh and logs the final result.
# Meant to be called from Railway, GitHub Actions, or any CI/CD pipeline
# immediately after a deployment completes.
#
# Required env vars (or pass RAILWAY_URL as first arg):
#   RAILWAY_URL          — deployed app base URL, e.g. https://myapp.railway.app
#
# Optional env vars (passed through to deploy-healthcheck.sh):
#   ASSIMETRIA_OS_URL    — base URL of the Assimetria OS API
#   PRODUCT_SLUG         — product slug used to update railway_url in OS DB

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[post-deploy] Starting post-deploy validation..."
echo "[post-deploy] Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Run the health check script; capture its exit code without triggering set -e
"${SCRIPT_DIR}/deploy-healthcheck.sh" "${1:-}"
healthcheck_exit=$?

if [[ $healthcheck_exit -eq 0 ]]; then
  echo ""
  echo "[post-deploy] ✓ Deployment verified successfully."
  echo "[post-deploy]   URL: ${RAILWAY_URL:-${1:-<unknown>}}"
  echo "[post-deploy]   All systems healthy. Good to go."
  exit 0
else
  echo "" >&2
  echo "[post-deploy] ✗ Deployment verification FAILED." >&2
  echo "[post-deploy]   URL: ${RAILWAY_URL:-${1:-<unknown>}}" >&2
  echo "[post-deploy]   Investigate at: ${RAILWAY_URL:-${1:-<unknown>}}/api/health" >&2
  echo "[post-deploy]   Check Railway logs: railway logs --tail" >&2
  echo "[post-deploy]   Check DB connectivity and environment variables." >&2
  exit 1
fi
