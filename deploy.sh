#!/usr/bin/env bash
# Runs on the VPS. Pulls the latest frontend image from GHCR and recreates the web service.
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE_FILE="docker-compose.web.yml"

echo ">>> Pulling latest frontend image"
docker compose -f "$COMPOSE_FILE" pull

echo ">>> Recreating web service"
docker compose -f "$COMPOSE_FILE" up -d

echo ">>> Waiting for web health"
for i in $(seq 1 30); do
  if docker compose -f "$COMPOSE_FILE" exec -T web wget -qO- http://127.0.0.1/ >/dev/null 2>&1; then
    echo ">>> Web is healthy"
    docker compose -f "$COMPOSE_FILE" ps
    docker image prune -f
    echo ">>> Deploy finished"
    exit 0
  fi
  sleep 2
done

echo ">>> Web failed the health check — showing recent logs"
docker compose -f "$COMPOSE_FILE" logs --tail=80 web
exit 1
