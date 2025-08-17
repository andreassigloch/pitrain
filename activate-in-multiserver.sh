#!/bin/bash
# Activate PitchTrainer in MultiServer NGINX configuration
# This script uncomments the proxy configuration in the existing MultiServer config

set -e

echo "🔧 Activating PitchTrainer in MultiServer"
echo "========================================="

MULTISERVER_DIR="$HOME/MultiServer"
CONFIG_FILE="$MULTISERVER_DIR/nginx/sites-enabled/20-pitrain.conf"

# Check if MultiServer exists
if [ ! -d "$MULTISERVER_DIR" ]; then
    echo "❌ MultiServer not found at $MULTISERVER_DIR"
    exit 1
fi

# Check if config exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ PitchTrainer config not found at $CONFIG_FILE"
    exit 1
fi

cd "$MULTISERVER_DIR"

# Create backup
echo "📋 Creating backup..."
sudo cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%s)"

# Activate the configuration
echo "✏️  Activating proxy configuration..."

# Use a Python script for more reliable editing
python3 << 'EOF'
import re

config_file = "nginx/sites-enabled/20-pitrain.conf"

with open(config_file, 'r') as f:
    lines = f.readlines()

# Track if we're in the sections to modify
in_coming_soon = False
in_proxy_section = False

for i, line in enumerate(lines):
    # Detect Coming Soon section (lines ~31-47)
    if "Serve \"Coming Soon\" page" in line:
        in_coming_soon = True
    elif in_coming_soon and line.strip() == "}":
        in_coming_soon = False
        # Comment out this section
        for j in range(i-16, i+1):
            if j >= 0 and j < len(lines) and not lines[j].strip().startswith('#'):
                lines[j] = '    # ' + lines[j].lstrip()
    
    # Detect commented proxy sections (lines ~49-129)
    if "Commented out until PitchTrainer deployment" in line:
        in_proxy_section = True
    elif in_proxy_section and i > 128:
        in_proxy_section = False
    
    # Uncomment proxy sections
    if in_proxy_section and lines[i].startswith('    # '):
        lines[i] = lines[i].replace('    # ', '    ', 1)

# Write back
with open(config_file, 'w') as f:
    f.writelines(lines)

print("✅ Configuration activated")
EOF

# Test NGINX configuration
echo "🧪 Testing NGINX configuration..."
if docker compose exec nginx-proxy nginx -t 2>/dev/null; then
    echo "✅ Configuration is valid"
else
    echo "❌ Configuration test failed! Rolling back..."
    sudo mv "$CONFIG_FILE.backup.$(date +%s)" "$CONFIG_FILE"
    exit 1
fi

# Restart NGINX
echo "🔄 Restarting NGINX..."
docker compose restart nginx-proxy

# Wait for restart
sleep 5

# Verify NGINX is running
if docker compose ps nginx-proxy | grep -q "Up"; then
    echo "✅ NGINX restarted successfully"
else
    echo "❌ NGINX failed to restart!"
    docker compose logs nginx-proxy --tail 20
    exit 1
fi

echo ""
echo "✅ PitchTrainer activated in MultiServer!"
echo ""
echo "Make sure the PitchTrainer container is running:"
echo "  docker ps | grep pitrain"
echo ""
echo "Access your app at:"
echo "  https://pitrain.waffelwurst.de"