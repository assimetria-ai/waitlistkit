# ─────────────────────────────────────────────────────────────────────────────
#  Server — Node.js/Express  (multi-stage, production-ready)
#  Stage 1 (deps)   → install production dependencies
#  Stage 2 (runner) → minimal runtime image
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: install production deps ─────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Only copy manifests first to maximise layer caching
COPY package*.json ./

RUN npm ci --omit=dev --ignore-scripts

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install tini (PID-1 signal handling) and postgresql-client (migrations / healthchecks)
RUN apk add --no-cache tini postgresql-client

WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy installed modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src/ ./src/
COPY package*.json ./

# Ensure the data directory is writable (if the app writes local files)
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production \
    PORT=3001

EXPOSE 3001

# Use tini as PID 1 so signals are forwarded correctly
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]
