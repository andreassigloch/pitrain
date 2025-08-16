#!/bin/bash
# NGINX Configuration Setup for PitchTrainer
# Run this manually on the server after deployment
# This script works with MultiServer infrastructure

echo "🔧 Setting up NGINX configuration for PitchTrainer with MultiServer..."

# Check if MultiServer directory exists
MULTISERVER_DIR="/home/ionos/MultiServer/MultiServer"

if [ ! -d "$MULTISERVER_DIR" ]; then
    echo "❌ MultiServer directory not found at $MULTISERVER_DIR"
    echo "Please update the path in this script or ensure MultiServer is installed"
    exit 1
fi

# Create NGINX config for MultiServer
sudo tee $MULTISERVER_DIR/nginx/sites-enabled/pitrain.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name pitrain.waffelwurst.de;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pitrain.waffelwurst.de;

    ssl_certificate /etc/nginx/ssl/certs/waffelwurst.de/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/private/waffelwurst.de/privkey.pem;

    location / {
        proxy_pass http://pitrain_app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://pitrain_app:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_Set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
}
EOF

echo "✅ NGINX configuration created for MultiServer"
echo "🔄 Restarting MultiServer NGINX container..."

# Restart the MultiServer NGINX container to pick up new config
cd $MULTISERVER_DIR
docker-compose restart nginx-proxy

# Wait for restart
sleep 5

# Test if NGINX container is running
if docker-compose ps nginx-proxy | grep -q "Up"; then
    echo "✅ MultiServer NGINX restarted successfully"
    echo "🌐 PitchTrainer should now be available at https://pitrain.waffelwurst.de"
    echo "📝 Make sure your PitchTrainer container is connected to waffelwurst_frontend network"
else
    echo "❌ MultiServer NGINX restart failed"
    echo "🔍 Check MultiServer logs: docker-compose logs nginx-proxy"
    exit 1
fi