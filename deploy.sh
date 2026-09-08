#!/usr/bin/env bash
# Runs on the VPS. Pulls the latest frontend image from GHCR and recreates the web service.
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE_FILE="docker-compose.web.yml"
export FRONTEND_IMAGE="${FRONTEND_IMAGE:-}"

echo "========================================="
echo ">>> FRONTEND DEPLOY START"
echo ">>> HOST=$(hostname)"
echo ">>> DATE=$(date -Is)"
echo ">>> FRONTEND_IMAGE=${FRONTEND_IMAGE:-<unset>}"
echo ">>> COMPOSE_FILE=$COMPOSE_FILE"
echo ">>> DOCKER_VERSION=$(docker --version)"
echo ">>> COMPOSE_VERSION=$(docker compose version || echo 'compose plugin missing')"
echo ">>> WHOAMI=$(whoami)"
echo ">>> PWD=$(pwd)"
echo "========================================="

echo ">>> GHCR login check:"
docker info 2>&1 | grep -i 'Username\|Registry' || true

echo ">>> Pulling latest frontend image"
docker compose -f "$COMPOSE_FILE" pull || {
  echo ">>> ERROR: docker compose pull failed — trying docker-compose fallback"
  docker-compose -f "$COMPOSE_FILE" pull
}

echo ">>> Recreating web service"
docker compose -f "$COMPOSE_FILE" up -d

echo ">>> Waiting for web health"
for i in $(seq 1 30); do
  if docker exec $(docker compose -f "$COMPOSE_FILE" ps -q web) wget -qO- http://127.0.0.1/ >/dev/null 2>&1; then
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
