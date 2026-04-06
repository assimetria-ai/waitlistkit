# ─────────────────────────────────────────────────────────────────────────────
#  Product Template — Root Dockerfile  (multi-stage, production-ready)
#
#  Single container: nginx (port 80) fronts the Node.js backend (port 4000).
#    Stage 1 (client-build): webpack frontend → client/dist/
#    Stage 2 (server-deps):  Node.js production dependencies
#    Stage 3 (runner):       nginx + Node.js + tini
#
#  Usage:
#    docker build -t product-template .
#    docker run -p 80:80 --env-file .env product-template
#
#  Build targets:
#    --target client-build  → only webpack build (CI cache layer)
#    --target server-deps   → only production server deps (CI cache layer)
#    --target runner        → final production image (default)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: client build ─────────────────────────────────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app/client

# Manifests first → better layer caching
COPY client/package*.json ./
RUN npm ci --ignore-scripts

ARG CACHEBUST=1
COPY client/ ./

RUN npm run build

# ── Stage 2: server production dependencies ───────────────────────────────────
FROM node:20-alpine AS server-deps
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# ── Stage 3: final runner ─────────────────────────────────────────────────────
FROM node:20-alpine AS runner

ARG CACHEBUST=1
RUN apk add --no-cache tini nginx postgresql-client gettext

WORKDIR /app

# Server production deps
COPY --from=server-deps /app/server/node_modules ./server/node_modules

# Server source + scripts (drop-schema-migrations.js used by startup migration recovery)
COPY server/src/ ./server/src/
COPY server/scripts/ ./server/scripts/
COPY server/package*.json ./server/

# Built frontend assets → nginx serves from here
COPY --from=client-build /app/client/dist /usr/share/nginx/html

# nginx config — Alpine uses http.d/ (not conf.d/) for server blocks
RUN rm -f /etc/nginx/http.d/default.conf 2>/dev/null || true
COPY nginx.production.conf /etc/nginx/http.d/default.conf

# Startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

ENV NODE_ENV=production \
    PORT=3001

EXPOSE 80

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/start.sh"]
