# PitchTrainer Setup Guide

## Prerequisites

### 1. Mistral API Key ✅
- **Status**: Configured
- **Key**: `h5IlBAxOf77jlGMHJROvpIuuogR08rF5`
- **Available Models**:
  - `voxtral-mini-latest` - Audio transcription ($0.001/minute)
  - `voxtral-small-latest` - Advanced audio understanding
  - `mistral-small-latest` - Text evaluation and analysis

### 2. GitHub Repository ✅
- **Repository**: https://github.com/andreassigloch/pitrain
- **Status**: Empty, ready for initial push
- **Visibility**: Public

### 3. GitHub Secrets Required

Add these secrets to your GitHub repository:

```bash
# Server Access
IONOS_SSH_PRIVATE_KEY=<your-ssh-private-key>
IONOS_SERVER_HOST=217.154.9.145  
IONOS_SSH_USER=andreas

# API Keys
MISTRAL_API_KEY=h5IlBAxOf77jlGMHJROvpIuuogR08rF5
```

To add secrets:
1. Go to https://github.com/andreassigloch/pitrain/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret name and value

### 4. Local Development Setup

```bash
# Clone repository
git clone https://github.com/andreassigloch/pitrain.git
cd pitrain

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Environment Configuration

The `.env` file should contain:

```env
MISTRAL_API_KEY=h5IlBAxOf77jlGMHJROvpIuuogR08rF5
NODE_ENV=development
PORT=3000
DATABASE_PATH=./data/pitrain.db
ALLOWED_ORIGINS=http://localhost:3000
MISTRAL_TRANSCRIPTION_MODEL=voxtral-mini-latest
MISTRAL_EVALUATION_MODEL=mistral-small-latest
```

## Deployment Architecture

### Infrastructure Stack
- **Hosting**: IONOS VPS (217.154.9.145)
- **Deployment**: GitHub Actions → Docker → NGINX Proxy
- **Domain**: pitrain.waffelwurst.de
- **SSL**: Wildcard certificate (*.waffelwurst.de)
- **Database**: SQLite for anonymous statistics

### MultiServer Integration
The app integrates with your existing MultiServer setup:
- Docker network: `waffelwurst_frontend`  
- NGINX proxy configuration already prepared
- Automatic SSL certificate management

## API Testing

Test the Mistral API connection:

```bash
# Test API key
curl -X GET "https://api.mistral.ai/v1/models" \
  -H "Authorization: Bearer h5IlBAxOf77jlGMHJROvpIuuogR08rF5"

# Test transcription endpoint
curl -X POST "https://api.mistral.ai/v1/audio/transcriptions" \
  -H "Authorization: Bearer h5IlBAxOf77jlGMHJROvpIuuogR08rF5" \
  -F "model=voxtral-mini-latest" \
  -F "file=@your-audio-file.webm"
```

## Performance Targets

- **Speech Recognition**: < 200ms response time
- **Evaluation**: < 5s total processing time
- **Audio File Size**: Max 10MB
- **Duration**: 45s or 60s pitch recordings
- **Pricing**: ~$0.001/minute for transcription

## Next Steps

1. Initialize the project structure with React + TypeScript
2. Set up the backend API with Express and SQLite
3. Implement hybrid speech recognition (Web Speech API + Voxtral)
4. Create the evaluation engine with Mistral models
5. Set up GitHub Actions deployment workflow
6. Test end-to-end functionality

## Security Notes

- API keys stored as GitHub secrets only
- No user tracking or personal data storage
- Anonymous statistics collection only
- Rate limiting and request validation
- HTTPS-only deployment with CSP headers