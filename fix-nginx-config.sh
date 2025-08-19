#!/bin/bash
# Fix NGINX configuration for pitrain

echo "🔧 NGINX Configuration Fix"
echo "=========================="

echo ""
echo "📋 Current NGINX error log:"
docker exec multiserver_nginx tail -20 /var/log/nginx/error.log 2>/dev/null | grep -E "pitrain|upstream"

echo ""
echo "🔍 Test NGINX config:"
docker exec multiserver_nginx nginx -t 2>&1

echo ""
echo "📝 Creating fixed configuration..."
cat > 20-pitrain-fixed.conf << 'EOF'
# PitchTrainer Application - pitrain.waffelwurst.de
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name pitrain.waffelwurst.de;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/certs/fullchain.cer;
    ssl_certificate_key /etc/nginx/ssl/private/waffelwurst.de.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Logging
    access_log /var/log/nginx/pitrain_access.log main;
    error_log /var/log/nginx/pitrain_error.log warn;
    
    # Large file upload support
    client_max_body_size 50M;
    client_body_buffer_size 5M;
    
    # Main proxy to pitrain container
    location / {
        proxy_pass http://pitrain:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Extended timeouts for API calls
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # API endpoints with extended timeouts
    location /api/ {
        proxy_pass http://pitrain:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Extended timeouts for audio processing
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Larger buffer for API responses
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
        
        # Disable buffering for streaming
        proxy_buffering off;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name pitrain.waffelwurst.de;
    return 301 https://$server_name$request_uri;
}
EOF

echo ""
echo "✅ Fixed configuration saved to: 20-pitrain-fixed.conf"
echo ""
echo "📌 To apply the fix on the server:"
echo "1. Backup current config:"
echo "   cp ~/MultiServer/nginx/sites-enabled/20-pitrain.conf ~/MultiServer/nginx/sites-enabled/20-pitrain.conf.backup"
echo ""
echo "2. Replace with fixed config:"
echo "   cp ~/pitrain/20-pitrain-fixed.conf ~/MultiServer/nginx/sites-enabled/20-pitrain.conf"
echo ""
echo "3. Reload NGINX:"
echo "   docker exec multiserver_nginx nginx -s reload"
echo ""
echo "🔍 Key changes:"
echo "- Removed problematic \$upstream_pitrain variable"
echo "- Direct proxy_pass to pitrain:3000"
echo "- Removed unnecessary /transcribe and /analyze locations"
echo "- Simplified error handling"