# PitchTrainer

A web-based pitch training application with German speech recognition, real-time evaluation, and AI-powered feedback using Mistral models.

The initial spec was elaborated with claude code and stored in pitrain.md as input for the coding, testing and deployment. 

## Features

- 🎯 **BNI Pitch Training** - Specialized for 45s and 60s pitch formats
- 🎤 **Hybrid Speech Recognition** - Real-time feedback with Web Speech API + accurate transcription with Voxtral
- 🤖 **AI-Powered Evaluation** - Mistral models analyze pitch quality across multiple KPIs
- 📊 **Instant Feedback** - Get scores and improvement suggestions in under 5 seconds
- 📱 **Mobile-Optimized** - Touch-friendly interface that works on all devices
- 🔒 **Privacy-First** - No user tracking, only anonymous statistics

## Quick Start

### Prerequisites

- Node.js 18+
- Mistral API key ([Get one here](https://console.mistral.ai/))

### Installation

```bash
# Clone the repository
git clone https://github.com/andreassigloch/pitrain
cd pitrain

# Install dependencies
npm install

# Copy environment example
cp .env.example .env

# Edit .env with your Mistral API key
# MISTRAL_API_KEY=your-key-here

# Start development server
npm run dev
```

### Docker Deployment (Local Development)

```bash
# Using Docker Compose
cp docker-compose.example.yml docker-compose.yml
docker-compose up -d

# Or using Docker directly
docker build -t pitrain .
docker run -p 3000:3000 --env-file .env pitrain
```

## Production Deployment

PitchTrainer is deployed on the Waffelwurst server using the MultiServer NGINX infrastructure.

**Live URL:** https://pitrain.waffelwurst.de

### Prerequisites

**SSH Configuration:**
See [MultiServer SSH-SETUP.md](../MultiServer/MultiServer/SSH-SETUP.md) for complete SSH setup instructions.

**Quick Reference:**
- **SSH Alias:** `ionos-aise`
- **Deployment Directory:** `~/pitrain`
- **Container Name:** `pitrain` (required for NGINX routing)
- **Network:** `waffelwurst_frontend` (external, managed by MultiServer)

### Deployment Process

**From Your Local Machine:**
```bash
# 1. Push code to GitHub
git add .
git commit -m "Your changes"
git push origin main

# 2. SSH to server
ssh ionos-aise

# 3. Deploy updates
cd ~/pitrain
./private/deploy-multiserver.sh
```

**Deployment Script Includes:**
- Git pull from GitHub
- Frontend build (React + Vite)
- Docker image build
- Container restart with health checks

### Verification

```bash
# Check container status
ssh ionos-aise "docker ps | grep pitrain"

# View logs
ssh ionos-aise "docker logs pitrain --tail 50"

# Test health endpoint
curl https://pitrain.waffelwurst.de/health
```

**See:** [private/DEPLOYMENT-MULTISERVER.md](private/DEPLOYMENT-MULTISERVER.md) for detailed deployment documentation and troubleshooting.

## Documentation

- [Architecture & Specification](pitrain.md) - Complete technical documentation
- [Setup Guide](SETUP.md) - Detailed setup instructions
- [Testing Strategy](TESTING-STRATEGY.md) - Testing approach and methodology
- [Test Report](testreport.md) - Validation evidence and test results

## Technology Stack

- **Frontend**: React 18, TailwindCSS, Vite
- **Backend**: Node.js, Express, SQLite
- **AI Models**: Mistral (Voxtral for transcription, Mistral-7B for evaluation)
- **Deployment**: Docker

## Testing

```bash
# Run unit tests (fast, no external dependencies)
npm run test:unit

# Run integration tests (with mocked services)
npm run test:integration  

# Run full test suite (includes real API calls - requires API key)
npm run test:system
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author

Andreas Sigloch - [andreas@siglochconsulting.com](mailto:andreas@siglochconsulting.com)

## Acknowledgments

- Built for BNI members to improve their pitch presentations
- Uses Mistral AI's powerful language models
- Inspired by the need for real-time, actionable feedback