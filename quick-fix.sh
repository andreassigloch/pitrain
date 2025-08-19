#!/bin/bash
# Quick fix for NGINX configuration

echo "🚀 Quick Fix for PitchTrainer NGINX Config"
echo "==========================================="

echo ""
echo "📝 Creating minimal working configuration..."

cat > ~/MultiServer/nginx/sites-enabled/20-pitrain.conf << 'EOF'
# PitchTrainer Application - pitrain.waffelwurst.de
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name pitrain.waffelwurst.de;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/certs/fullchain.cer;
    ssl_certificate_key /etc/nginx/ssl/private/waffelwurst.de.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Logging
    access_log /var/log/nginx/pitrain_access.log main;
    error_log /var/log/nginx/pitrain_error.log warn;
    
    # Large file upload support
    client_max_body_size 50M;
    
    # Main application - DIRECT proxy without variables
    location / {
        proxy_pass http://pitrain:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Extended timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
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

echo "✅ Configuration written!"
echo ""
echo "🔄 Reloading NGINX..."
docker exec multiserver_nginx nginx -s reload

echo ""
echo "🧪 Testing..."
sleep 2
curl -s https://pitrain.waffelwurst.de/health | jq . 2>/dev/null || curl https://pitrain.waffelwurst.de/health

echo ""
echo "✅ Done! The app should work now."