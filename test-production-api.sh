#!/bin/bash
# Test production API endpoints directly

echo "🔍 Production API Test"
echo "======================"

echo ""
echo "1️⃣ Test Health (should work):"
curl -s https://pitrain.waffelwurst.de/health | jq . 2>/dev/null || curl -s https://pitrain.waffelwurst.de/health

echo ""
echo "2️⃣ Test from inside container (bypass NGINX):"
docker exec pitrain sh -c 'wget -O- http://localhost:3000/health 2>/dev/null' | jq . 2>/dev/null || echo "Failed"

echo ""
echo "3️⃣ Test transcribe endpoint (will fail with WebM):"
echo "Creating test audio file..."
echo -n "RIFF____WAVEfmt " > test.wav
curl -X POST https://pitrain.waffelwurst.de/api/transcribe \
  -F "audio=@test.wav" \
  -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  -o response.txt 2>/dev/null
cat response.txt
rm -f test.wav response.txt

echo ""
echo "4️⃣ Check container logs for errors:"
docker logs pitrain --tail 5 2>&1 | grep -E "(Error|error|ERROR|❌|failed|Failed)"

echo ""
echo "5️⃣ Test Mistral API directly from container:"
docker exec pitrain sh -c 'curl -X POST https://api.mistral.ai/v1/models \
  -H "Authorization: Bearer $MISTRAL_API_KEY" \
  -H "Content-Type: application/json" 2>/dev/null | head -c 100'

echo ""
echo "6️⃣ Check environment in container:"
docker exec pitrain sh -c 'echo "NODE_ENV: $NODE_ENV"'
docker exec pitrain sh -c 'echo "MISTRAL_API_KEY: ${MISTRAL_API_KEY:0:10}..."'
docker exec pitrain sh -c 'echo "MISTRAL_TRANSCRIPTION_MODEL: $MISTRAL_TRANSCRIPTION_MODEL"'

echo ""
echo "🔧 Diagnosis:"
echo "- If health works but transcribe fails → Mistral API issue"
echo "- If MISTRAL_API_KEY is empty → Environment variable not passed"
echo "- If timeout occurs → Increase NGINX proxy timeouts"