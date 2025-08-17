# PitchTrainer Deployment - Simple & Stable

## Overview

PitchTrainer integrates with the MultiServer infrastructure as a Docker container on the `waffelwurst_frontend` network.

## Initial Setup (One-Time)

### 1. Fix Current Issues
If NGINX is down or deployment is broken, run:
```bash
bash FIX-SERVER.sh
```

### 2. Manual First Deployment
```bash
# On your server
cd ~/pitrain
git clone https://github.com/andreassigloch/pitrain.git .

# Create environment file
cat > .env.production << EOF
MISTRAL_API_KEY=h5IlBAxOf77jlGMHJROvpIuuogR08rF5
NODE_ENV=production
PORT=3000
DATABASE_PATH=/data/pitrain.db
ALLOWED_ORIGINS=https://pitrain.waffelwurst.de
EOF

# Deploy
bash deploy-simple.sh

# Activate in MultiServer
bash activate-in-multiserver.sh
```

## Future Updates

For any code updates, simply:
```bash
cd ~/pitrain
bash deploy-simple.sh
```

## How It Works

### MultiServer Pattern
```
Internet → NGINX Proxy → Docker Container
         (MultiServer)    (pitrain:3000)
```

### Key Points
- **Container Name**: Must be `pitrain` (not `pitrain_app`)
- **Network**: Must be on `waffelwurst_frontend`
- **Port**: Internal port 3000
- **NGINX Config**: Already exists in MultiServer at `20-pitrain.conf`

## Adding New Subdomain Apps

For any new app (e.g., `newapp.waffelwurst.de`):

### 1. Build and Run Container
```bash
docker run -d \
  --name newapp \
  --network waffelwurst_frontend \
  --restart unless-stopped \
  newapp:latest
```

### 2. Add NGINX Config
Use MultiServer's helper:
```bash
cd ~/MultiServer
./scripts/add-app.sh
```

Or manually create `/MultiServer/nginx/sites-enabled/30-newapp.conf`:
```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name newapp.waffelwurst.de;
    
    ssl_certificate /etc/nginx/ssl/certs/fullchain.cer;
    ssl_certificate_key /etc/nginx/ssl/private/*.waffelwurst.de_private_key.key;
    
    location / {
        proxy_pass http://newapp:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Restart NGINX
```bash
cd ~/MultiServer
docker compose restart nginx-proxy
```

## Troubleshooting

### Container Not Accessible
```bash
# Check container is running
docker ps | grep pitrain

# Check it's on the right network
docker inspect pitrain | grep -A 5 Networks

# Check health endpoint
curl http://localhost:3000/health
```

### NGINX Issues
```bash
cd ~/MultiServer

# Check NGINX status
docker compose ps nginx-proxy

# View logs
docker compose logs nginx-proxy --tail 50

# Test configuration
docker compose exec nginx-proxy nginx -t
```

### Quick Fixes
```bash
# Restart everything
cd ~/MultiServer
docker compose restart nginx-proxy

cd ~/pitrain
docker restart pitrain
```

## Why This Approach?

✅ **Simple** - No complex CI/CD for a one-person team
✅ **Stable** - Follows MultiServer's proven pattern  
✅ **Fast** - Deploy in seconds with one command
✅ **Debuggable** - Clear error messages and simple scripts

## Files Reference

- `FIX-SERVER.sh` - Emergency fix if things break
- `deploy-simple.sh` - Deploy updates
- `activate-in-multiserver.sh` - Activate NGINX config
- `.env.production` - Environment variables