#!/bin/bash
# EMERGENCY FIX: Restore NGINX and deploy PitchTrainer correctly
# Run this on the server to fix everything

set -e

echo "🚨 Emergency Fix for PitchTrainer Deployment"
echo "============================================"

# Step 1: Fix NGINX
echo ""
echo "Step 1: Fixing NGINX configuration..."
echo "-------------------------------------"

# Remove the bad config we added
if [ -f ~/MultiServer/nginx/sites-enabled/pitrain.conf ]; then
    echo "Removing bad pitrain.conf..."
    sudo rm ~/MultiServer/nginx/sites-enabled/pitrain.conf
fi

# Restart NGINX to get it working again
echo "Restarting NGINX..."
cd ~/MultiServer
docker compose restart nginx-proxy

# Wait for NGINX to start
sleep 5

# Check if NGINX is running
if docker compose ps nginx-proxy | grep -q "Up"; then
    echo "✅ NGINX is running again!"
else
    echo "❌ NGINX still not running. Check logs:"
    docker compose logs nginx-proxy --tail 20
    exit 1
fi

# Step 2: Fix PitchTrainer Container
echo ""
echo "Step 2: Deploying PitchTrainer with correct name..."
echo "---------------------------------------------------"

cd ~/pitrain

# Stop and remove wrongly named container
echo "Removing old container..."
docker stop pitrain_app 2>/dev/null || true
docker rm pitrain_app 2>/dev/null || true
docker stop pitrain 2>/dev/null || true
docker rm pitrain 2>/dev/null || true

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Ensure .env.production exists
if [ ! -f .env.production ]; then
    echo "Creating .env.production..."
    cat > .env.production << 'EOF'
MISTRAL_API_KEY=h5IlBAxOf77jlGMHJROvpIuuogR08rF5
NODE_ENV=production
PORT=3000
DATABASE_PATH=/data/pitrain.db
ALLOWED_ORIGINS=https://pitrain.waffelwurst.de
MISTRAL_TRANSCRIPTION_MODEL=voxtral-mini-latest
MISTRAL_EVALUATION_MODEL=mistral-small-latest
MISTRAL_BASE_URL=https://api.mistral.ai/v1
MAX_AUDIO_DURATION=900
MAX_FILE_SIZE=10485760
REQUEST_TIMEOUT=30000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
EOF
fi

# Create data directory
mkdir -p ./data

# Build Docker image
echo "Building Docker image..."
docker build -t pitrain:latest .

# Run container with correct name
echo "Starting PitchTrainer container..."
docker run -d \
  --name pitrain \
  --restart unless-stopped \
  --network waffelwurst_frontend \
  --env-file .env.production \
  -v "$(pwd)/data:/data" \
  pitrain:latest

# Check if container is running
if docker ps | grep -q "pitrain"; then
    echo "✅ PitchTrainer container is running!"
else
    echo "❌ Container failed to start. Check logs:"
    docker logs pitrain --tail 20
    exit 1
fi

# Test health endpoint
sleep 5
if curl -f http://localhost:3000/health 2>/dev/null; then
    echo "✅ PitchTrainer health check passed!"
else
    echo "⚠️  Health check failed (container might still be starting)"
fi

# Step 3: Activate NGINX Config
echo ""
echo "Step 3: Activating PitchTrainer in NGINX..."
echo "-------------------------------------------"

cd ~/MultiServer

# Create backup of the config
sudo cp nginx/sites-enabled/20-pitrain.conf nginx/sites-enabled/20-pitrain.conf.backup

# Create a temporary sed script to uncomment the proxy sections
cat > /tmp/activate_pitrain.sed << 'EOF'
# Comment out the "Coming Soon" section (lines 31-47)
31,47 s/^    /    # /

# Uncomment the API sections (lines 49-129)
49,129 s/^    # //
EOF

# Apply the changes
sudo sed -i -f /tmp/activate_pitrain.sed nginx/sites-enabled/20-pitrain.conf

# Clean up
rm /tmp/activate_pitrain.sed

# Restart NGINX to apply changes
echo "Restarting NGINX with new config..."
docker compose restart nginx-proxy

# Wait for restart
sleep 10

# Final verification
echo ""
echo "Step 4: Final Verification..."
echo "-----------------------------"

# Check NGINX is running
if docker compose ps nginx-proxy | grep -q "Up"; then
    echo "✅ NGINX is running"
else
    echo "❌ NGINX failed. Rolling back..."
    sudo mv nginx/sites-enabled/20-pitrain.conf.backup nginx/sites-enabled/20-pitrain.conf
    docker compose restart nginx-proxy
    echo "Rolled back to backup config"
    exit 1
fi

# Check if PitchTrainer is accessible
echo ""
echo "Testing public access..."
response=$(curl -s -o /dev/null -w "%{http_code}" https://pitrain.waffelwurst.de/health 2>/dev/null || echo "000")

if [ "$response" = "200" ]; then
    echo "✅ PitchTrainer is LIVE at https://pitrain.waffelwurst.de"
else
    echo "⚠️  Public access not working yet (HTTP $response)"
    echo "This might be normal if DNS/SSL is still propagating"
fi

echo ""
echo "============================================"
echo "✨ Fix complete!"
echo ""
echo "Status:"
echo "  - NGINX: Running ✅"
echo "  - PitchTrainer Container: Running ✅"
echo "  - URL: https://pitrain.waffelwurst.de"
echo ""
echo "If the site isn't accessible yet, wait a few minutes for:"
echo "  - NGINX to fully reload"
echo "  - DNS to propagate"
echo "  - SSL certificates to be recognized"