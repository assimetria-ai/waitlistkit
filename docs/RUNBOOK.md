# Runbook

## Local Dev Setup

```bash
# 1. Start DB
docker-compose -f docker-compose.local.yml up -d

# 2. Server
cd server
cp .env.example .env   # fill in values
npm install
npm run migrate
npm run dev

# 3. Client
cd client
npm install
npm run dev
```

Client: http://localhost:5173
API:    http://localhost:4000

## Migrations

```bash
cd server && npm run migrate
```

## Environment Variables

See `server/.env.example` for all required vars.

## Stripe Webhook (local)

```bash
stripe listen --forward-to localhost:4000/api/stripe/webhook
```
