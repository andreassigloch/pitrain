#!/bin/bash
# Pitrain MultiServer Deployment
# Author: andreas@siglochconsulting
# Run on server: ~/pitrain/deploy-multiserver.sh

set -e

cd ~/pitrain

echo "Pitrain Deployment"
echo "=================="

if [ ! -f .env.production ]; then
    echo "ERROR: .env.production missing on server."
    echo "Copy .env.example to .env.production and fill in MISTRAL_API_KEY."
    exit 1
fi

echo "Pulling latest code..."
git pull origin main

echo "Building Docker image..."
docker compose build --no-cache

echo "Stopping old container..."
docker compose down || true

echo "Starting new container..."
docker compose up -d

echo "Waiting for startup..."
for i in {1..10}; do
    if docker exec pitrain node -e "require('http').get('http://localhost:3000/health', (r)=>process.exit(r.statusCode===200?0:1))" 2>/dev/null; then
        echo "Healthy."
        break
    fi
    echo "Retry $i/10..."
    sleep 3
done

docker compose ps
echo ""
echo "External check:"
curl -s -o /dev/null -w "https://pitrain.waffelwurst.de/health -> HTTP %{http_code}\n" --max-time 10 https://pitrain.waffelwurst.de/health
