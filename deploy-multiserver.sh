#!/bin/bash
# PitchTrainer MultiServer Deployment
# Deploys to waffelwurst.de with NGINX proxy
# Run this on the server to deploy updates
#
# SSH Access: ssh ionos-aise (uses ~/.ssh/aise_deploy_nopass)
# Deploy from local: ssh ionos-aise "cd ~/pitrain && ./deploy-multiserver.sh"
#
# IMPORTANT: docker restart does NOT reload .env.production!
# If secrets changed, container must be recreated (stop + rm + run)

set -e

echo "🚀 PitchTrainer Simple Deployment"
echo "================================="

cd ~/pitrain

# Check for .env.production changes
echo ""
echo "⚠️  PRE-DEPLOYMENT CHECK"
echo "------------------------"
echo "Have you updated .env.production recently? (API keys, secrets)"
echo "If YES: This script will recreate the container to load new env vars."
echo "If NO:  Container will use cached env vars from previous deploy."
echo ""
read -p "Did .env.production change? [y/N]: " env_changed
env_changed=${env_changed:-N}

# Pull latest code
echo ""
echo "📥 Pulling latest code..."
git pull origin main

# Build new image (with frontend)
echo "🔨 Building Docker image (this includes frontend build)..."
docker build -t pitrain:latest .

# Stop old container
echo "🛑 Stopping old container..."
docker stop pitrain || true

# Remove old container
docker rm pitrain || true

# Start new container (IMPORTANT: name must be 'pitrain' for NGINX)
echo "▶️  Starting new container..."
docker run -d --name pitrain --restart unless-stopped --network waffelwurst_frontend --env-file .env.production -v "$(pwd)/data:/data" pitrain:latest

# Wait for startup
echo "⏳ Waiting for container to start..."
sleep 5

# Verify env vars loaded correctly (show first 15 chars of API key)
echo ""
echo "🔑 Verifying environment variables..."
loaded_key=$(docker exec pitrain env | grep MISTRAL_API_KEY | cut -d'=' -f2 | head -c 15)
file_key=$(grep MISTRAL_API_KEY .env.production | cut -d'=' -f2 | head -c 15)
if [ "$loaded_key" = "$file_key" ]; then
    echo "✅ API key matches .env.production"
else
    echo "⚠️  WARNING: Container API key differs from .env.production!"
    echo "   Container: ${loaded_key}..."
    echo "   File:      ${file_key}..."
    echo "   Run deployment again with 'y' for env change question."
fi

# Check health
if curl -f http://localhost:3000/health 2>/dev/null; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    docker logs pitrain --tail 20
    exit 1
fi

# Test API connectivity
echo ""
echo "🧪 Testing Mistral API connectivity..."
api_test=$(curl -s -X POST http://localhost:3000/api/evaluate -H "Content-Type: application/json" -d '{"transcript": "Test", "duration": 45}' | head -c 50)
if echo "$api_test" | grep -q "error"; then
    echo "⚠️  API test returned error: $api_test"
    echo "   Check MISTRAL_API_KEY in .env.production"
else
    echo "✅ Mistral API connection successful"
fi

echo ""
echo "✅ Deployment complete!"
echo "🌐 PitchTrainer available at: https://pitrain.waffelwurst.de"
echo ""
echo "📋 Quick commands:"
echo "   Logs:    docker logs pitrain --tail 50"
echo "   Restart: docker restart pitrain"
echo "   Env:     docker exec pitrain env | grep MISTRAL"