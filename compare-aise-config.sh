#!/bin/bash
# Compare AISE and PitchTrainer NGINX configurations

echo "🔍 Comparing AISE vs PitchTrainer NGINX Configs"
echo "================================================"

echo ""
echo "📋 AISE Config (working):"
echo "------------------------"
cat ~/MultiServer/nginx/sites-enabled/30-aise.conf 2>/dev/null | grep -E "(server_name|location|proxy_pass|set \$|resolver|error_page)" | head -30

echo ""
echo "📋 PitchTrainer Config (broken):"
echo "-------------------------------"
cat ~/MultiServer/nginx/sites-enabled/20-pitrain.conf 2>/dev/null | grep -E "(server_name|location|proxy_pass|set \$|resolver|error_page)" | head -30

echo ""
echo "🔍 Key differences to look for:"
echo "1. Use of variables (set \$upstream_...)"
echo "2. Resolver configuration"
echo "3. Error page handling"
echo "4. Direct proxy_pass vs variable proxy_pass"

echo ""
echo "📝 Show full AISE proxy configuration:"
cat ~/MultiServer/nginx/sites-enabled/30-aise.conf 2>/dev/null | grep -A5 -B5 "location /"

echo ""
echo "✅ Quick fix - copy AISE pattern:"
echo "Replace in pitrain.conf:"
echo "  set \$upstream_pitrain pitrain:3000;"
echo "  proxy_pass http://\$upstream_pitrain;"
echo "With:"
echo "  proxy_pass http://pitrain:3000;"