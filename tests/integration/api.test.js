/**
 * Level 2 Integration Tests: API Endpoints
 * Author: andreas@siglochconsulting.com
 * 
 * Tests components working together with test data
 * Speed: 30-120 seconds, controlled test environment
 */

const request = require('supertest');
const app = require('../../server');
const DatabaseService = require('../../src/services/DatabaseService');
const fs = require('fs').promises;
const path = require('path');

describe('API Integration Tests', () => {
  let dbService;

  beforeAll(async () => {
    // Initialize test database
    process.env.DATABASE_PATH = ':memory:';
    dbService = new DatabaseService();
    await dbService.initialize();
  });

  afterAll(async () => {
    if (dbService) {
      await dbService.close();
    }
  });

  describe('Health Check Endpoint', () => {
    test('GET /health should return service status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toBeDefined();
      expect(response.body.services.database).toBe('connected');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Statistics Endpoint', () => {
    test('GET /api/statistics should return initial empty statistics', async () => {
      const response = await request(app)
        .get('/api/statistics')
        .expect(200);

      expect(response.body.totalEvaluations).toBe(0);
      expect(response.body.recentEvaluations).toEqual([]);
      expect(response.body.proposalStats).toEqual([]);
      expect(response.body.lastUpdated).toBeDefined();
    });

    test('GET /api/statistics should return statistics after data insertion', async () => {
      // Insert test evaluation data directly
      await dbService.storeEvaluation({
        duration: 45,
        kpi_scores: {
          call_to_action: { score: 80 },
          structure_time: { score: 75 }
        },
        proposals: [
          { type: 'CTA_SPECIFICITY', description: 'Test proposal' }
        ],
        word_count: 95,
        timestamp: new Date().toISOString()
      });

      const response = await request(app)
        .get('/api/statistics')
        .expect(200);

      expect(response.body.totalEvaluations).toBe(1);
      expect(response.body.recentEvaluations).toHaveLength(1);
      expect(response.body.proposalStats).toHaveLength(1);
      expect(response.body.proposalStats[0].type).toBe('CTA_SPECIFICITY');
    });
  });

  describe('Evaluation Endpoint', () => {
    test('POST /api/evaluate should validate required fields', async () => {
      const response = await request(app)
        .post('/api/evaluate')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Missing transcript or duration');
    });

    test('POST /api/evaluate should validate duration values', async () => {
      const response = await request(app)
        .post('/api/evaluate')
        .send({
          transcript: 'Test transcript',
          duration: 30 // Invalid duration
        })
        .expect(400);

      expect(response.body.error).toBe('Duration must be 45 or 60 seconds');
    });

    test('POST /api/evaluate should accept valid 45s evaluation', async () => {
      const testTranscript = 'Hallo, ich bin Andreas von Sigloch Consulting. Wir helfen Unternehmen bei der digitalen Transformation mit KI-Lösungen. Wenn Sie jemanden kennen, der seine Geschäftsprozesse automatisieren möchte, verbinden Sie mich bitte mit ihm. Erreichen können Sie mich unter andreas@siglochconsulting.com. Vielen Dank!';

      const response = await request(app)
        .post('/api/evaluate')
        .send({
          transcript: testTranscript,
          duration: 45
        });

      // Note: This will make a real API call to Mistral unless mocked
      if (response.status === 200) {
        expect(response.body.kpis).toBeDefined();
        expect(response.body.overall_score).toBeDefined();
        expect(response.body.proposals).toBeDefined();
        expect(response.body.evaluation_time).toBeGreaterThan(0);
        
        // Check KPI structure
        expect(response.body.kpis.call_to_action).toBeDefined();
        expect(response.body.kpis.structure_time).toBeDefined();
        expect(response.body.kpis.content_clarity).toBeDefined();
        expect(response.body.kpis.memorability).toBeDefined();
      } else {
        // If API call fails (no internet/API key), check for proper error handling
        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Evaluation failed');
        expect(response.body.message).toBeDefined();
      }
    }, 30000); // 30 second timeout for API calls

    test('POST /api/evaluate should accept valid 60s evaluation', async () => {
      const testTranscript = 'Hallo, mein Name ist Andreas Sigloch und ich bin Geschäftsführer der Sigloch Consulting GmbH. Wir sind spezialisiert auf KI-Beratung und helfen mittelständischen Unternehmen dabei, künstliche Intelligenz effektiv in ihre Geschäftsprozesse zu integrieren. Unser besonderer Fokus liegt auf der Automatisierung von Routineaufgaben und der Optimierung von Entscheidungsprozessen. Wenn Sie Unternehmer kennen, die ihre Effizienz durch KI steigern möchten, stelle ich gerne den Kontakt her. Sie erreichen mich direkt unter andreas@siglochconsulting.com oder über LinkedIn. Vielen Dank für Ihre Aufmerksamkeit!';

      const response = await request(app)
        .post('/api/evaluate')
        .send({
          transcript: testTranscript,
          duration: 60
        });

      if (response.status === 200) {
        expect(response.body.kpis).toBeDefined();
        expect(response.body.overall_score).toBeDefined();
        expect(response.body.proposals).toBeDefined();
        
        // Validate proposals format
        if (response.body.proposals.length > 0) {
          response.body.proposals.forEach(proposal => {
            expect(proposal.type).toBeDefined();
            expect(proposal.title).toBeDefined();
            expect(proposal.description).toBeDefined();
            expect(['HIGH', 'MEDIUM', 'LOW']).toContain(proposal.priority);
          });
        }
      } else {
        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Evaluation failed');
      }
    }, 30000);
  });

  describe('Transcription Endpoint', () => {
    test('POST /api/transcribe should require audio file', async () => {
      const response = await request(app)
        .post('/api/transcribe')
        .expect(400);

      expect(response.body.error).toBe('No audio file provided');
    });

    test('POST /api/transcribe should validate file type', async () => {
      // Create a fake text file
      const fakeAudioBuffer = Buffer.from('This is not audio data');
      
      const response = await request(app)
        .post('/api/transcribe')
        .attach('audio', fakeAudioBuffer, 'fake.txt')
        .expect(500); // Will fail during processing, not at upload

      expect(response.body.error).toBe('Transcription failed');
    });

    // Note: Testing actual audio transcription would require real audio files
    // and would make actual API calls to Mistral's Voxtral service
  });

  describe('Rate Limiting', () => {
    test('should handle multiple rapid requests', async () => {
      const requests = [];
      
      // Send multiple requests rapidly
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app)
            .get('/api/statistics')
        );
      }

      const responses = await Promise.all(requests);
      
      // All should succeed within rate limit
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('CORS Headers', () => {
    test('should include proper CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/health');

      // Check for helmet security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown-endpoint')
        .expect(404);
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/evaluate')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('Database Integration', () => {
    test('should persist evaluation data correctly', async () => {
      const testData = {
        transcript: 'Integration test transcript',
        duration: 45
      };

      const evalResponse = await request(app)
        .post('/api/evaluate')
        .send(testData);

      if (evalResponse.status === 200) {
        // Check that data was stored in database
        const statsResponse = await request(app)
          .get('/api/statistics')
          .expect(200);

        expect(statsResponse.body.totalEvaluations).toBeGreaterThan(0);
        expect(statsResponse.body.recentEvaluations.length).toBeGreaterThan(0);
        
        // Find our test evaluation
        const testEvaluation = statsResponse.body.recentEvaluations.find(
          evaluation => evaluation.duration === 45
        );
        expect(testEvaluation).toBeDefined();
      }
    }, 30000);
  });
});