#!/usr/bin/env bash
set -e

echo "[setup] Installing server dependencies..."
cd server && npm install && cd ..

echo "[setup] Installing client dependencies..."
cd client && npm install && cd ..

echo "[setup] Installing root dependencies (node-forge for key generation)..."
npm install

echo "[setup] Bootstrapping .env files and generating cryptographic keys..."
npm run bootstrap

echo "[setup] Done. Fill in the remaining values in server/.env and client/.env, then run: npm run dev"
