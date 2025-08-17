#!/bin/bash
# Activate PitchTrainer in existing MultiServer NGINX configuration

echo "🔧 Activating PitchTrainer configuration in MultiServer..."

MULTISERVER_DIR="$HOME/MultiServer"
PITRAIN_CONF="$MULTISERVER_DIR/nginx/sites-enabled/20-pitrain.conf"

if [ ! -f "$PITRAIN_CONF" ]; then
    echo "❌ PitchTrainer config not found at $PITRAIN_CONF"
    exit 1
fi

echo "📝 Uncommenting PitchTrainer proxy configuration..."

# Create a backup
sudo cp "$PITRAIN_CONF" "$PITRAIN_CONF.backup"

# Uncomment the PitchTrainer configuration sections
sudo sed -i '49,129s/^    # /    /g' "$PITRAIN_CONF"
sudo sed -i '49,129s/^    # #/    #/g' "$PITRAIN_CONF"

# Comment out the "Coming Soon" section
sudo sed -i '31,40s/^    /    # /g' "$PITRAIN_CONF"
sudo sed -i '43,47s/^    /    # /g' "$PITRAIN_CONF"

echo "✅ Configuration updated"
echo "🔄 Restarting NGINX..."

cd "$MULTISERVER_DIR"
docker compose restart nginx-proxy

echo "✅ NGINX restarted"
echo ""
echo "⚠️  IMPORTANT: Make sure your PitchTrainer container is named 'pitrain' not 'pitrain_app'"
echo "Run this to fix the container name:"
echo ""
echo "docker stop pitrain_app"
echo "docker rm pitrain_app"
echo "docker run -d --name pitrain --restart unless-stopped --network waffelwurst_frontend --env-file .env.production -v \"\$(pwd)/data:/data\" pitrain:latest"