/**
 * PitchTrainer Server
 * Author: andreas@siglochconsulting.com
 * 
 * Express server with speech transcription and pitch evaluation
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const DatabaseService = require('./src/services/DatabaseService');
const TranscriptionService = require('./src/services/TranscriptionService');
const EvaluationService = require('./src/services/EvaluationService');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://api.mistral.ai"],
      mediaSrc: ["'self'", "blob:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://pitrain.waffelwurst.de']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files allowed.'));
    }
  }
});

// Initialize services
let dbService, transcriptionService, evaluationService;

async function initializeServices() {
  try {
    dbService = new DatabaseService();
    await dbService.initialize();
    
    transcriptionService = new TranscriptionService();
    evaluationService = new EvaluationService();
    
    console.log('✅ Services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    process.exit(1);
  }
}

// API Routes
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(`📝 Transcribing audio file: ${req.file.mimetype}, ${req.file.size} bytes`);
    
    const startTime = Date.now();
    const result = await transcriptionService.transcribe(req.file.buffer, req.file.mimetype);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Transcription completed in ${duration}ms`);
    
    res.json({
      transcript: result.transcript,
      language: result.language || 'de',
      duration: duration,
      confidence: result.confidence || 0.95
    });
  } catch (error) {
    console.error('❌ Transcription error:', error);
    res.status(500).json({ 
      error: 'Transcription failed',
      message: error.message 
    });
  }
});

app.post('/api/evaluate', async (req, res) => {
  try {
    const { transcript, duration } = req.body;
    
    if (!transcript || !duration) {
      return res.status(400).json({ error: 'Missing transcript or duration' });
    }
    
    if (![45, 60].includes(duration)) {
      return res.status(400).json({ error: 'Duration must be 45 or 60 seconds' });
    }

    console.log(`🎯 Evaluating pitch: ${duration}s, ${transcript.length} characters`);
    
    const startTime = Date.now();
    const evaluation = await evaluationService.evaluate(transcript, duration);
    const evalDuration = Date.now() - startTime;
    
    // Store anonymous statistics
    await dbService.storeEvaluation({
      duration,
      kpi_scores: evaluation.kpis,
      proposals: evaluation.proposals,
      word_count: transcript.split(' ').length,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Evaluation completed in ${evalDuration}ms`);
    
    res.json({
      kpis: evaluation.kpis,
      proposals: evaluation.proposals,
      evaluation_time: evalDuration,
      overall_score: evaluation.overall_score
    });
  } catch (error) {
    console.error('❌ Evaluation error:', error);
    res.status(500).json({ 
      error: 'Evaluation failed',
      message: error.message 
    });
  }
});

app.get('/api/statistics', async (req, res) => {
  try {
    const stats = await dbService.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('❌ Statistics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
});

app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await dbService.getStatistics();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        transcription: 'ready',
        evaluation: 'ready'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large' });
    }
  }
  
  console.error('❌ Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    console.log(`🎯 PitchTrainer server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔑 Mistral API: ${process.env.MISTRAL_API_KEY ? 'configured' : 'missing'}`);
  });
}

startServer().catch(console.error);

module.exports = app;