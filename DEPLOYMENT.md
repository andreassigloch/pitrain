# PitchTrainer Deployment Guide

## Simplified Deployment Process

The deployment has been simplified for a one-person team. Here's what happens:

### Automatic (GitHub Actions)
1. **Push to main branch** triggers automatic deployment
2. **Unit tests run** (fast, no external dependencies)
3. **Application builds** and deploys to Docker container
4. **Container starts** on waffelwurst_frontend network

### Manual (One-time setup)
After first deployment, run this **once** on the server:

```bash
cd ~/pitrain
bash setup-nginx.sh
```

This integrates PitchTrainer with your existing MultiServer infrastructure.

## What's Simplified

### ✅ Before (Complex)
- Nested heredocs in GitHub Actions
- Manual NGINX config in CI/CD
- Integration tests in CI pipeline
- Complex deployment script

### ✅ After (Simple)
- Clean deployment script upload
- Unit tests only in CI
- Manual NGINX setup (one-time)
- Proper MultiServer integration

## File Overview

- `deploy.yml` - Simplified GitHub Actions workflow
- `setup-nginx.sh` - One-time NGINX setup for MultiServer
- `nginx-config-for-multiserver.conf` - Reference config file

## Network Integration

The deployment correctly connects to `waffelwurst_frontend` network to work with MultiServer's NGINX proxy at `pitrain_app:3000`.

## Health Checks

- Local: `curl http://localhost:3000/health`
- Public: `curl https://pitrain.waffelwurst.de/health`

## Troubleshooting

1. **Container not starting**: `docker logs pitrain_app`
2. **NGINX issues**: Check MultiServer logs with `docker-compose logs nginx-proxy`
3. **Network issues**: Verify container is on `waffelwurst_frontend` network
4. **SSH issues**: Verify GitHub secrets are correctly configured