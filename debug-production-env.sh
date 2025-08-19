#!/bin/bash
# Debug script to check production environment variables
# Run this ON THE SERVER to check API key configuration

echo "🔍 Production Environment Debug"
echo "==============================="

echo ""
echo "📂 Environment Files:"
ls -la .env* 2>/dev/null || echo "❌ No .env files found"

echo ""
echo "🔑 Environment Variables in Container:"
echo "MISTRAL_API_KEY check:"
docker exec pitrain printenv MISTRAL_API_KEY 2>/dev/null | head -c 20 && echo "... (truncated)" || echo "❌ MISTRAL_API_KEY not found in container"

echo ""
echo "NODE_ENV:"
docker exec pitrain printenv NODE_ENV 2>/dev/null || echo "❌ NODE_ENV not found"

echo ""
echo "MISTRAL_BASE_URL:"
docker exec pitrain printenv MISTRAL_BASE_URL 2>/dev/null || echo "❌ MISTRAL_BASE_URL not found"

echo ""
echo "📋 Container Status:"
docker ps | grep pitrain || echo "❌ No pitrain container running"

echo ""
echo "📜 Recent Container Logs:"
docker logs pitrain --tail 10 2>/dev/null || echo "❌ Cannot get container logs"

echo ""
echo "🧪 Internal API Test:"
echo "Testing transcription endpoint inside container..."
docker exec pitrain curl -X POST http://localhost:3000/api/transcribe \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@/dev/null" 2>/dev/null || echo "❌ Internal API test failed"

echo ""
echo "🔧 Quick Fixes:"
echo "1. If MISTRAL_API_KEY is missing:"
echo "   - Check .env.production file exists and contains correct key"
echo "   - Restart container: docker restart pitrain"
echo ""
echo "2. If container crashes on startup:"
echo "   - Check logs: docker logs pitrain"
echo "   - Rebuild and restart: bash deploy-multiserver.sh"