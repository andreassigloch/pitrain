#!/bin/bash
# Manual deployment script for PitchTrainer
# Author: andreas@siglochconsulting.com

set -e

echo "🚀 Starting PitchTrainer deployment..."

# Check if we're on the server
if [ ! -d "/home/andreas" ]; then
    echo "❌ This script must be run on the IONOS server"
    exit 1
fi

# Navigate to project directory
cd ~/pitrain || {
    echo "📁 Creating pitrain directory..."
    mkdir -p ~/pitrain
    cd ~/pitrain
}

# Clone/update repository
if [ ! -d ".git" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/andreassigloch/pitrain.git .
else
    echo "📥 Updating repository..."
    git pull origin main
fi

# Create production environment file
echo "🔧 Setting up environment..."
cat > .env.production << EOF
MISTRAL_API_KEY=${MISTRAL_API_KEY:-h5IlBAxOf77jlGMHJROvpIuuogR08rF5}
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

# Create data directory
echo "📁 Creating data directory..."
mkdir -p ./data

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t pitrain:latest .

# Stop existing container if running
echo "🛑 Stopping existing container..."
docker stop pitrain_app 2>/dev/null || true
docker rm pitrain_app 2>/dev/null || true

# Run new container
echo "🏃 Starting new container..."
docker run -d \
  --name pitrain_app \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  -v "$(pwd)/data:/data" \
  pitrain:latest

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 5

# Test health endpoint
echo "🏥 Testing health endpoint..."
if curl -f http://localhost:3000/health; then
    echo "✅ Container is healthy!"
else
    echo "❌ Container health check failed"
    docker logs pitrain_app
    exit 1
fi

# Check if NGINX config exists
NGINX_CONFIG="/etc/nginx/sites-enabled/pitrain.conf"
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "🔧 Creating NGINX configuration..."
    sudo tee "$NGINX_CONFIG" > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name pitrain.waffelwurst.de;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name pitrain.waffelwurst.de;

    ssl_certificate /etc/letsencrypt/live/waffelwurst.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/waffelwurst.de/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
}
EOF

    # Test and reload NGINX
    echo "🔄 Reloading NGINX..."
    sudo nginx -t && sudo systemctl reload nginx
fi

echo "✅ Deployment complete!"
echo "🌐 Application should be available at: https://pitrain.waffelwurst.de"
echo "🏥 Health check: https://pitrain.waffelwurst.de/health"

# Final verification
echo "🔍 Final verification..."
sleep 3
if curl -f http://localhost:3000/health; then
    echo "✅ Local health check passed"
else
    echo "❌ Local health check failed"
    docker logs pitrain_app --tail 20
fi