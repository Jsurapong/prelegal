#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

if [ ! -f .env ]; then
  echo "Error: .env file not found. Copy .env.example to .env and fill in your values."
  exit 1
fi

echo "Starting Prelegal..."
docker compose up -d --build
echo "Prelegal is running at http://localhost:8000"
