#!/bin/bash
# Debug deployment issues
# Run this on the server to check what's wrong

echo "🔍 PitchTrainer Deployment Debug"
echo "================================"

# Check if directory exists
echo "📁 Checking project directory..."
if [ -d ~/pitrain ]; then
    cd ~/pitrain
    echo "✅ Project directory exists"
    ls -la
else
    echo "❌ Project directory not found"
fi

echo ""
echo "🐳 Docker Status:"
echo "-----------------"
docker ps | grep pitrain || echo "No pitrain containers running"
docker images | grep pitrain || echo "No pitrain images found"

echo ""
echo "🌐 Port Status:"
echo "---------------"
netstat -tlnp | grep :3000 || echo "Port 3000 not in use"

echo ""
echo "📋 NGINX Status:"
echo "----------------"
sudo nginx -t
ls -la /etc/nginx/sites-enabled/*pitrain* 2>/dev/null || echo "No pitrain NGINX config found"

echo ""
echo "🔄 System Services:"
echo "-------------------"
systemctl status nginx --no-pager -l
systemctl status docker --no-pager -l

echo ""
echo "📝 Recent Logs:"
echo "---------------"
if docker ps -q -f name=pitrain_app; then
    echo "Container logs:"
    docker logs pitrain_app --tail 20
else
    echo "No pitrain container running"
fi

echo ""
echo "🔑 Environment Check:"
echo "---------------------"
if [ -f .env.production ]; then
    echo "✅ .env.production exists"
    echo "API Key configured: $(grep -q MISTRAL_API_KEY .env.production && echo 'Yes' || echo 'No')"
else
    echo "❌ .env.production missing"
fi

echo ""
echo "🏥 Health Check:"
echo "----------------"
if curl -f http://localhost:3000/health 2>/dev/null; then
    echo "✅ Local health check passed"
else
    echo "❌ Local health check failed"
fi