# PitchTrainer Deployment Guide (Final)

## ✅ Current Status

PitchTrainer is successfully deployed and running at https://pitrain.waffelwurst.de

## Architecture

```
Internet → MultiServer NGINX → Docker Container
         (proxy on 443)       (pitrain:3000)
                              on waffelwurst_frontend network
```

## Key Requirements

1. **Container name MUST be `pitrain`** (not `pitrain_app` or anything else)
2. **Network MUST be `waffelwurst_frontend`**
3. **Dockerfile MUST build frontend** (multi-stage build)
4. **NGINX config needs main `location /` block**

## Initial Setup (Already Done)

### 1. Environment File
Created `.env.production` with:
```bash
MISTRAL_API_KEY=h5IlBAxOf77jlGMHJROvpIuuogR08rF5
NODE_ENV=production
PORT=3000
DATABASE_PATH=/data/pitrain.db
ALLOWED_ORIGINS=https://pitrain.waffelwurst.de
# ... other settings
```

### 2. NGINX Configuration
Modified `~/MultiServer/nginx/sites-enabled/20-pitrain.conf`:
- Commented out "Coming Soon" section
- Uncommented proxy sections
- Added main `location /` block:
```nginx
location / {
    proxy_pass http://pitrain:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 3. Container Deployment
```bash
docker run -d --name pitrain --restart unless-stopped --network waffelwurst_frontend --env-file .env.production -v "$(pwd)/data:/data" pitrain:latest
```

## Future Updates

Use the simple deployment script:

```bash
cd ~/pitrain
bash deploy-simple.sh
```

This script:
1. Pulls latest code from GitHub
2. Builds Docker image (including frontend)
3. Stops and removes old container
4. Starts new container with correct name
5. Verifies health

## Troubleshooting

### Check Application Status
```bash
# Container status
docker ps | grep pitrain

# Application logs
docker logs pitrain --tail 50

# Health check
curl https://pitrain.waffelwurst.de/health
```

### Check NGINX Status
```bash
cd ~/MultiServer

# NGINX status
docker compose ps nginx-proxy

# NGINX logs
docker compose logs nginx-proxy --tail 50

# Test configuration
docker compose exec nginx-proxy nginx -t
```

### Common Issues and Fixes

**1. Internal Server Error (500)**
- **Cause**: Missing `dist/` folder with frontend files
- **Fix**: Rebuild with updated Dockerfile that includes build step

**2. 404 Not Found**
- **Cause**: Missing `location /` block in NGINX config
- **Fix**: Add main location block to proxy requests

**3. Container Not Reachable**
- **Cause**: Wrong container name or network
- **Fix**: Container must be named `pitrain` and on `waffelwurst_frontend`

**4. NGINX Won't Start**
- **Cause**: Syntax error in config (e.g., "Commented" directive)
- **Fix**: Properly comment/uncomment lines in config file

### Quick Recovery
If something breaks:
```bash
# Restore NGINX if it's down
cd ~/MultiServer
sudo cp nginx/sites-enabled/20-pitrain.conf.backup nginx/sites-enabled/20-pitrain.conf
docker compose restart nginx-proxy

# Redeploy PitchTrainer
cd ~/pitrain
bash deploy-simple.sh
```

## Files Reference

### PitchTrainer Repository
- `Dockerfile` - Multi-stage build with frontend
- `deploy-simple.sh` - Deployment script
- `.env.production` - Production environment variables
- `server.js` - Express server
- `src/` - React frontend source
- `dist/` - Built frontend (created during Docker build)

### MultiServer Repository
- `nginx/sites-enabled/20-pitrain.conf` - NGINX configuration
- `docker-compose.yml` - MultiServer infrastructure
- `SUBDOMAIN-APPS.md` - Documentation for adding apps

## Important Lessons Learned

1. **Container naming is critical** - NGINX expects exact names
2. **Frontend must be built in Docker** - Not just on local machine
3. **NGINX config needs all location blocks** - Not just /api/
4. **Manual deployment is fine** - Complex CI/CD not needed for small teams
5. **MultiServer pattern works** - Follow it for all subdomain apps

## Summary

The deployment is now:
- ✅ **Stable** - Following MultiServer's proven pattern
- ✅ **Simple** - One script to deploy updates
- ✅ **Documented** - Clear troubleshooting steps
- ✅ **Working** - Application is live and functional