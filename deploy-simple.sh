#!/bin/bash
# Simple deployment script for PitchTrainer
# Run this on the server to deploy updates

set -e

echo "🚀 PitchTrainer Simple Deployment"
echo "================================="

cd ~/pitrain

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Build new image
echo "🔨 Building Docker image..."
docker build -t pitrain:latest .

# Stop old container
echo "🛑 Stopping old container..."
docker stop pitrain || true

# Remove old container
docker rm pitrain || true

# Start new container
echo "▶️  Starting new container..."
docker run -d \
  --name pitrain \
  --restart unless-stopped \
  --network waffelwurst_frontend \
  --env-file .env.production \
  -v "$(pwd)/data:/data" \
  pitrain:latest

# Wait for startup
echo "⏳ Waiting for container to start..."
sleep 5

# Check health
if curl -f http://localhost:3000/health 2>/dev/null; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    docker logs pitrain --tail 20
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo "🌐 PitchTrainer available at: https://pitrain.waffelwurst.de"