/**
 * Level 3 System Tests: Privacy and Security Compliance
 * Author: andreas@siglochconsulting.com
 * 
 * Tests privacy requirements with real database operations
 * Speed: 2-10 minutes, real data verification
 */

const request = require('supertest');
const app = require('../../server');
const DatabaseService = require('../../src/services/DatabaseService');

describe('Privacy Compliance System Tests', () => {
  let dbService;

  beforeAll(async () => {
    // Use test database
    process.env.DATABASE_PATH = './data/test-privacy.db';
    dbService = new DatabaseService();
    await dbService.initialize();
  });

  afterAll(async () => {
    if (dbService) {
      await dbService.close();
    }
    
    // Clean up test database
    try {
      const fs = require('fs').promises;
      await fs.unlink('./data/test-privacy.db');
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  describe('REQ-2: Privacy Compliance (No user tracking, anonymous statistics only)', () => {
    test('should verify no personal data is stored in database', async () => {
      const testPitchWithPersonalData = {
        transcript: 'Hallo, ich bin Andreas Sigloch und wohne in München, Maximilianstraße 123. Meine Telefonnummer ist +49 89 123456789 und meine E-Mail andreas@siglochconsulting.com. Wir helfen bei KI-Integration.',
        duration: 60
      };
      
      // Submit evaluation with personal data
      const response = await request(app)
        .post('/api/evaluate')
        .send(testPitchWithPersonalData);
      
      if (response.status === 200) {
        console.log('✅ Evaluation with personal data processed successfully');
        
        // Check database to ensure NO personal data was stored
        const evaluations = await dbService.allQuery(
          'SELECT * FROM evaluations ORDER BY created_at DESC LIMIT 1'
        );
        
        expect(evaluations.length).toBeGreaterThan(0);
        
        const latestEval = evaluations[0];
        
        // Critical privacy checks - NO personal data should be stored
        expect(latestEval).not.toHaveProperty('user_id');
        expect(latestEval).not.toHaveProperty('ip_address');
        expect(latestEval).not.toHaveProperty('session_id');
        expect(latestEval).not.toHaveProperty('user_agent');
        expect(latestEval).not.toHaveProperty('email');
        expect(latestEval).not.toHaveProperty('name');
        expect(latestEval).not.toHaveProperty('phone');
        expect(latestEval).not.toHaveProperty('address');
        
        // Transcript should NOT be stored
        expect(latestEval.transcript).toBeUndefined();
        
        // Only anonymous metrics should be present
        expect(latestEval).toHaveProperty('duration');
        expect(latestEval).toHaveProperty('kpi_scores');
        expect(latestEval).toHaveProperty('word_count');
        expect(latestEval).toHaveProperty('overall_score');
        expect(latestEval).toHaveProperty('timestamp');
        
        console.log('🔒 Privacy verification passed - no personal data stored');
        console.log(`📊 Anonymous data: duration=${latestEval.duration}, score=${latestEval.overall_score}, words=${latestEval.word_count}`);
        
        // Verify proposals don't contain personal data
        const proposals = await dbService.allQuery(
          'SELECT * FROM proposals WHERE evaluation_id = ?',
          [latestEval.id]
        );
        
        proposals.forEach(proposal => {
          expect(proposal).not.toHaveProperty('user_data');
          expect(proposal.type).toBeDefined();
          expect(['CTA_SPECIFICITY', 'CTA_CLARITY', 'STRUCTURE_BASICS', 'SIMPLIFY_MESSAGE', 'ADD_MEMORY_HOOK', 'TIME_OPTIMIZATION']).toContain(proposal.type);
        });
      }
    }, 30000);

    test('should verify database schema prevents personal data storage', async () => {
      // Examine database schema to ensure no personal data fields exist
      const tableInfo = await dbService.allQuery("PRAGMA table_info(evaluations)");
      const columnNames = tableInfo.map(col => col.name.toLowerCase());
      
      console.log('📋 Database columns:', columnNames);
      
      // Ensure no personal data columns exist
      const personalDataFields = [
        'user_id', 'userid', 'user',
        'ip_address', 'ip', 'client_ip',
        'email', 'mail', 'e_mail',
        'name', 'username', 'user_name', 'full_name',
        'phone', 'telephone', 'mobile',
        'address', 'street', 'city', 'country',
        'transcript', 'raw_text', 'speech_text',
        'session_id', 'session', 'cookie',
        'browser', 'user_agent', 'device_id'
      ];
      
      personalDataFields.forEach(field => {
        expect(columnNames).not.toContain(field);
      });
      
      console.log('✅ Database schema verified - no personal data fields');
    });

    test('should verify API endpoints do not log personal information', async () => {
      const personalTestData = {
        transcript: 'Vertrauliche Informationen: Konto 1234567890, Steuer-ID DE123456789, Passwort geheim123',
        duration: 45
      };
      
      // Mock console.log to capture logs
      const originalLog = console.log;
      const logMessages = [];
      console.log = (...args) => {
        logMessages.push(args.join(' '));
        originalLog(...args);
      };
      
      const response = await request(app)
        .post('/api/evaluate')
        .send(personalTestData);
      
      // Restore console.log
      console.log = originalLog;
      
      if (response.status === 200) {
        // Check that no personal data was logged
        const sensitivePatterns = [
          /1234567890/,
          /DE123456789/,
          /geheim123/,
          /Vertrauliche Informationen/
        ];
        
        logMessages.forEach(message => {
          sensitivePatterns.forEach(pattern => {
            expect(message).not.toMatch(pattern);
          });
        });
        
        console.log('🔒 API logging verified - no personal data in logs');
      }
    }, 30000);

    test('should verify statistics are properly anonymized', async () => {
      // Submit multiple evaluations to build statistics
      const testEvaluations = [
        { transcript: 'Test evaluation 1 für Statistiken', duration: 45 },
        { transcript: 'Test evaluation 2 für Statistiken', duration: 60 },
        { transcript: 'Test evaluation 3 für Statistiken', duration: 45 }
      ];
      
      for (const evalData of testEvaluations) {
        await request(app)
          .post('/api/evaluate')
          .send(evalData);
      }
      
      // Retrieve statistics
      const statsResponse = await request(app)
        .get('/api/statistics');
        
      if (statsResponse.status === 200) {
        const stats = statsResponse.body;
        
        console.log('📊 Statistics structure verification:');
        console.log(`   - Total evaluations: ${stats.totalEvaluations}`);
        console.log(`   - Recent evaluations count: ${stats.recentEvaluations.length}`);
        console.log(`   - Proposal stats count: ${stats.proposalStats.length}`);
        
        // Verify statistics contain only anonymous data
        expect(stats.totalEvaluations).toBeGreaterThan(0);
        expect(stats.lastUpdated).toBeDefined();
        
        // Check recent evaluations for privacy compliance
        stats.recentEvaluations.forEach(evaluation => {
          // Should contain only anonymous metrics
          expect(evaluation).toHaveProperty('duration');
          expect(evaluation).toHaveProperty('overall_score');
          expect(evaluation).toHaveProperty('word_count');
          expect(evaluation).toHaveProperty('timestamp');
          
          // Should NOT contain personal data
          expect(evaluation).not.toHaveProperty('transcript');
          expect(evaluation).not.toHaveProperty('user_id');
          expect(evaluation).not.toHaveProperty('ip_address');
          expect(evaluation).not.toHaveProperty('session_id');
        });
        
        // Check proposal statistics
        stats.proposalStats.forEach(proposal => {
          expect(proposal).toHaveProperty('type');
          expect(proposal).toHaveProperty('total_count');
          expect(proposal.total_count).toBeGreaterThan(0);
        });
        
        console.log('✅ Statistics privacy compliance verified');
      }
    }, 60000);
  });

  describe('Data Retention and Cleanup', () => {
    test('should verify no transcript data persistence', async () => {
      const transcriptToCheck = 'This is a unique transcript for persistence verification test 123456';
      
      const response = await request(app)
        .post('/api/evaluate')
        .send({
          transcript: transcriptToCheck,
          duration: 45
        });
        
      if (response.status === 200) {
        // Search entire database for any trace of the transcript
        const tables = ['evaluations', 'proposals', 'statistics'];
        
        for (const table of tables) {
          const rows = await dbService.allQuery(`SELECT * FROM ${table}`);
          
          rows.forEach(row => {
            // Convert row to string and search for transcript content
            const rowString = JSON.stringify(row).toLowerCase();
            const transcriptWords = transcriptToCheck.toLowerCase().split(' ');
            
            transcriptWords.forEach(word => {
              if (word.length > 3) { // Skip short common words
                expect(rowString).not.toContain(word);
              }
            });
          });
        }
        
        console.log('✅ No transcript data found in database - proper data cleanup verified');
      }
    }, 30000);

    test('should verify anonymous data aggregation only', async () => {
      // Check what data is actually being aggregated
      const stats = await dbService.getStatistics();
      
      console.log('📊 Data aggregation verification:');
      console.log(`   - Anonymous evaluation count: ${stats.totalEvaluations}`);
      console.log(`   - Anonymous proposal patterns: ${stats.proposalStats.length} types`);
      
      // Verify aggregated data contains no personal information
      expect(stats.totalEvaluations).toBeGreaterThan(0);
      expect(Array.isArray(stats.recentEvaluations)).toBe(true);
      expect(Array.isArray(stats.proposalStats)).toBe(true);
      
      // All data should be aggregate/statistical only
      stats.proposalStats.forEach(stat => {
        expect(typeof stat.total_count).toBe('number');
        expect(stat.total_count).toBeGreaterThan(0);
        expect(stat.type).toMatch(/^[A-Z_]+$/); // Only proposal type codes
      });
      
      console.log('✅ Anonymous data aggregation verified');
    });
  });
});