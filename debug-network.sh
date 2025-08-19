#!/bin/bash
# Debug network connectivity between NGINX and pitrain container

echo "🌐 Network Debug for PitchTrainer"
echo "=================================="

echo ""
echo "📦 Container Network Info:"
docker inspect pitrain --format='{{range $k, $v := .NetworkSettings.Networks}}Network: {{$k}}{{"\n"}}IP: {{$v.IPAddress}}{{end}}'

echo ""
echo "🔍 Test from NGINX container:"
echo "Testing connection from nginx-proxy to pitrain..."
docker exec nginx-proxy wget -O- http://pitrain:3000/health 2>&1 | head -20

echo ""
echo "🔍 Alternative test with container IP:"
CONTAINER_IP=$(docker inspect pitrain --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "Container IP: $CONTAINER_IP"
if [ ! -z "$CONTAINER_IP" ]; then
    docker exec nginx-proxy wget -O- http://$CONTAINER_IP:3000/health 2>&1 | head -20
fi

echo ""
echo "📋 Network List:"
docker network ls | grep -E "(NETWORK|waffel|frontend)"

echo ""
echo "🔍 Check if containers are on same network:"
echo "NGINX networks:"
docker inspect nginx-proxy --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' 2>/dev/null || echo "nginx-proxy not found"

echo "PitchTrainer networks:"
docker inspect pitrain --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}'

echo ""
echo "📝 NGINX Config Check:"
echo "Looking for pitrain proxy configuration..."
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf 2>/dev/null | grep -A5 -B5 "pitrain" | head -20 || echo "Config not accessible"

echo ""
echo "🔧 Common Fixes:"
echo "1. If containers are on different networks:"
echo "   docker network connect waffelwurst_frontend pitrain"
echo ""
echo "2. If NGINX can't resolve 'pitrain' hostname:"
echo "   - Container must be named exactly 'pitrain'"
echo "   - Restart both containers:"
echo "     docker restart pitrain"
echo "     docker restart nginx-proxy"
echo ""
echo "3. Full redeploy:"
echo "   docker stop pitrain"
echo "   docker rm pitrain"
echo "   bash deploy-multiserver.sh"