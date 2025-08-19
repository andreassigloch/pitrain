#!/bin/bash
# Check NGINX configuration for pitrain

echo "🔍 NGINX Configuration Check"
echo "============================"

echo ""
echo "📋 All config files:"
docker exec multiserver_nginx ls -la /etc/nginx/conf.d/ 2>/dev/null || docker exec multiserver_nginx ls -la /etc/nginx/sites-enabled/ 2>/dev/null

echo ""
echo "🔍 Search for pitrain configuration:"
docker exec multiserver_nginx grep -r "pitrain" /etc/nginx/ 2>/dev/null | head -20

echo ""
echo "📝 Check specific pitrain config file:"
docker exec multiserver_nginx cat /etc/nginx/sites-enabled/20-pitrain.conf 2>/dev/null || \
docker exec multiserver_nginx cat /etc/nginx/conf.d/20-pitrain.conf 2>/dev/null || \
echo "No pitrain-specific config found"

echo ""
echo "🔍 Check default server block:"
docker exec multiserver_nginx grep -A20 "server_name.*pitrain" /etc/nginx/conf.d/default.conf 2>/dev/null || \
docker exec multiserver_nginx grep -A20 "server_name.*pitrain" /etc/nginx/sites-enabled/default 2>/dev/null

echo ""
echo "✅ Test direct proxy pass:"
docker exec multiserver_nginx sh -c 'curl -H "Host: pitrain.waffelwurst.de" http://pitrain:3000/health' 2>/dev/null

echo ""
echo "🔧 If config is missing or wrong:"
echo "1. Check ~/MultiServer/nginx/sites-enabled/20-pitrain.conf on host"
echo "2. Restart NGINX: docker restart multiserver_nginx"
echo "3. Or reload config: docker exec multiserver_nginx nginx -s reload"