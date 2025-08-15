/**
 * Level 2 Integration Tests: Service Layer Integration
 * Author: andreas@siglochconsulting.com
 * 
 * Tests service components working together
 * Speed: 30-120 seconds, controlled test environment
 */

const DatabaseService = require('../../src/services/DatabaseService');
const TranscriptionService = require('../../src/services/TranscriptionService');
const EvaluationService = require('../../src/services/EvaluationService');

describe('Service Integration Tests', () => {
  let dbService, transcriptionService, evaluationService;

  beforeAll(async () => {
    // Initialize services with test configuration
    process.env.DATABASE_PATH = ':memory:';
    
    dbService = new DatabaseService();
    await dbService.initialize();
    
    transcriptionService = new TranscriptionService();
    evaluationService = new EvaluationService();
  });

  afterAll(async () => {
    if (dbService) {
      await dbService.close();
    }
  });

  describe('Database and Evaluation Integration', () => {
    test('should store evaluation results from EvaluationService', async () => {
      const mockTranscript = 'Hallo, ich bin Andreas und helfe Unternehmen bei der KI-Integration. Wenn Sie jemanden kennen, der seine Prozesse automatisieren möchte, verbinden Sie uns gerne. Erreichen können Sie mich unter andreas@example.com.';
      
      // Mock the Mistral API response to avoid external calls
      const originalEvaluate = evaluationService.evaluate;
      evaluationService.evaluate = jest.fn().mockResolvedValue({
        kpis: {
          call_to_action: {
            specific_referral_ask: 85,
            contact_method_clarity: 90,
            target_client_definition: 80,
            actionable_request: 88
          },
          structure_time: {
            introduction_completeness: 90,
            word_count_optimization: 85,
            clear_flow_organization: 80,
            time_management: 90
          },
          content_clarity: {
            jargon_free_language: 85,
            single_focus_maintenance: 90,
            benefit_articulation: 80,
            credibility_markers: 75
          },
          memorability: {
            hook_tagline_presence: 60,
            unique_element: 70,
            concrete_examples: 65
          }
        },
        proposals: [
          {
            type: 'ADD_MEMORY_HOOK',
            title: 'Einprägsamen Hook hinzufügen',
            description: 'Entwickeln Sie einen einprägsamen Slogan oder eine Tagline',
            priority: 'MEDIUM'
          }
        ],
        overall_score: 82.1,
        word_count: 38,
        summary: 'Solide Struktur mit Verbesserungspotential bei der Merkbarkeit'
      });

      // Test evaluation
      const evaluation = await evaluationService.evaluate(mockTranscript, 45);
      
      // Store in database
      const evaluationId = await dbService.storeEvaluation({
        duration: 45,
        kpi_scores: evaluation.kpis,
        proposals: evaluation.proposals,
        word_count: evaluation.word_count,
        timestamp: new Date().toISOString()
      });

      expect(evaluationId).toBeGreaterThan(0);

      // Verify data was stored correctly
      const stats = await dbService.getStatistics();
      expect(stats.totalEvaluations).toBe(1);
      expect(stats.recentEvaluations[0].duration).toBe(45);
      expect(stats.recentEvaluations[0].overall_score).toBeCloseTo(79.9, 1);
      expect(stats.proposalStats[0].type).toBe('ADD_MEMORY_HOOK');

      // Restore original method
      evaluationService.evaluate = originalEvaluate;
    });

    test('should handle multiple evaluations with different durations', async () => {
      const evaluations = [
        { duration: 45, score: 75 },
        { duration: 60, score: 85 },
        { duration: 45, score: 80 }
      ];

      for (const evalData of evaluations) {
        await dbService.storeEvaluation({
          duration: evalData.duration,
          kpi_scores: { test: { score: evalData.score } },
          proposals: [{ type: 'TEST_PROPOSAL' }],
          word_count: 100,
          timestamp: new Date().toISOString()
        });
      }

      const stats = await dbService.getStatistics();
      expect(stats.totalEvaluations).toBeGreaterThan(3); // Including previous test
      
      const recentEvals = stats.recentEvaluations;
      const durations45 = recentEvals.filter(e => e.duration === 45);
      const durations60 = recentEvals.filter(e => e.duration === 60);
      
      expect(durations45.length).toBeGreaterThanOrEqual(2);
      expect(durations60.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Service Error Handling', () => {
    test('should handle invalid evaluation data gracefully', async () => {
      const invalidData = {
        duration: 45,
        kpi_scores: null, // Invalid
        proposals: [],
        word_count: 'invalid', // Invalid
        timestamp: 'invalid-date' // Invalid
      };

      await expect(dbService.storeEvaluation(invalidData)).rejects.toThrow();
    });

    test('should handle database connection errors', async () => {
      const tempDbService = new DatabaseService();
      tempDbService.dbPath = '/invalid/path/that/does/not/exist.db';
      
      await expect(tempDbService.initialize()).rejects.toThrow();
    });

    test('should validate TranscriptionService configuration', () => {
      const originalApiKey = process.env.MISTRAL_API_KEY;
      delete process.env.MISTRAL_API_KEY;
      
      expect(() => new TranscriptionService()).toThrow('MISTRAL_API_KEY environment variable is required');
      
      // Restore API key
      process.env.MISTRAL_API_KEY = originalApiKey;
    });

    test('should validate EvaluationService configuration', () => {
      const originalApiKey = process.env.MISTRAL_API_KEY;
      delete process.env.MISTRAL_API_KEY;
      
      expect(() => new EvaluationService()).toThrow('MISTRAL_API_KEY environment variable is required');
      
      // Restore API key
      process.env.MISTRAL_API_KEY = originalApiKey;
    });
  });

  describe('Service Method Integration', () => {
    test('should process evaluation pipeline correctly', async () => {
      const testTranscript = 'Ich bin Andreas, Geschäftsführer der Sigloch Consulting. Wir helfen bei KI-Integration. Kontaktieren Sie mich für Empfehlungen.';
      
      // Create mock evaluation result
      const mockEvaluation = {
        kpis: {
          call_to_action: { score1: 70, score2: 80 },
          structure_time: { score1: 85, score2: 75 },
          content_clarity: { score1: 90, score2: 85 },
          memorability: { score1: 60, score2: 70 }
        },
        proposals: [
          { type: 'CTA_SPECIFICITY', title: 'CTA verbessern', description: 'Spezifischere Empfehlung', priority: 'HIGH' }
        ],
        overall_score: 76.5,
        word_count: 21,
        summary: 'Kompakter Pitch mit gutem Inhalt'
      };

      // Validate evaluation result structure
      const validated = evaluationService.validateEvaluationResult(mockEvaluation);
      expect(validated.kpis.call_to_action).toBeDefined();
      expect(validated.proposals).toHaveLength(1);
      expect(validated.overall_score).toBeGreaterThan(0);

      // Test KPI score calculation
      const kpiScores = evaluationService.calculateKPIScores(validated.kpis);
      expect(kpiScores.call_to_action).toBe(75); // (70+80)/2
      expect(kpiScores.structure_time).toBe(80); // (85+75)/2
      expect(kpiScores.content_clarity).toBe(88); // (90+85)/2 rounded
      expect(kpiScores.memorability).toBe(65); // (60+70)/2

      // Store the evaluation
      const storedId = await dbService.storeEvaluation({
        duration: 45,
        kpi_scores: validated.kpis,
        proposals: validated.proposals,
        word_count: validated.word_count,
        timestamp: new Date().toISOString()
      });

      expect(storedId).toBeGreaterThan(0);
    });

    test('should handle different proposal types correctly', async () => {
      const proposalTypes = [
        'CTA_SPECIFICITY',
        'CTA_CLARITY', 
        'STRUCTURE_BASICS',
        'SIMPLIFY_MESSAGE',
        'ADD_MEMORY_HOOK',
        'TIME_OPTIMIZATION'
      ];

      for (const type of proposalTypes) {
        await dbService.storeEvaluation({
          duration: 60,
          kpi_scores: { test: { score: 75 } },
          proposals: [{ type: type, description: `Test ${type}` }],
          word_count: 120,
          timestamp: new Date().toISOString()
        });
      }

      const stats = await dbService.getStatistics();
      const proposalStats = stats.proposalStats;
      
      // Should have all proposal types represented
      const storedTypes = proposalStats.map(p => p.type);
      proposalTypes.forEach(type => {
        expect(storedTypes).toContain(type);
      });
    });
  });

  describe('Data Flow Integration', () => {
    test('should maintain data integrity through full pipeline', async () => {
      const testPitch = {
        transcript: 'Hallo, ich bin Andreas von Sigloch Consulting und helfe Unternehmen bei der digitalen Transformation. Wenn Sie jemanden kennen, der KI-Lösungen benötigt, verbinden Sie uns bitte. Meine E-Mail ist andreas@siglochconsulting.com.',
        duration: 60,
        expectedWordCount: 29
      };

      // Step 1: Validate transcript
      expect(testPitch.transcript.trim().length).toBeGreaterThan(0);
      
      // Step 2: Calculate word count
      const wordCount = testPitch.transcript.split(/\s+/).length;
      expect(wordCount).toBe(testPitch.expectedWordCount);
      
      // Step 3: Mock evaluation processing
      const mockResult = {
        kpis: {
          call_to_action: { 
            specific_referral_ask: 90,
            contact_method_clarity: 95,
            target_client_definition: 85,
            actionable_request: 90
          },
          structure_time: {
            introduction_completeness: 85,
            word_count_optimization: 70, // Low because short for 60s
            clear_flow_organization: 80,
            time_management: 60
          },
          content_clarity: {
            jargon_free_language: 85,
            single_focus_maintenance: 90,
            benefit_articulation: 80,
            credibility_markers: 85
          },
          memorability: {
            hook_tagline_presence: 50,
            unique_element: 60,
            concrete_examples: 55
          }
        },
        proposals: [
          { type: 'TIME_OPTIMIZATION', title: 'Mehr Inhalt', description: 'Pitch für 60s zu kurz', priority: 'HIGH' },
          { type: 'ADD_MEMORY_HOOK', title: 'Hook hinzufügen', description: 'Einprägsamen Slogan entwickeln', priority: 'MEDIUM' }
        ],
        word_count: wordCount,
        overall_score: 78.2
      };

      // Step 4: Validate result
      const validated = evaluationService.validateEvaluationResult(mockResult);
      expect(validated.overall_score).toBeCloseTo(78.2, 1);
      
      // Step 5: Store in database
      const evaluationId = await dbService.storeEvaluation({
        duration: testPitch.duration,
        kpi_scores: validated.kpis,
        proposals: validated.proposals,
        word_count: validated.word_count,
        timestamp: new Date().toISOString()
      });

      // Step 6: Verify stored data
      expect(evaluationId).toBeGreaterThan(0);
      
      const stats = await dbService.getStatistics();
      const latestEval = stats.recentEvaluations.find(e => e.word_count === wordCount);
      expect(latestEval).toBeDefined();
      expect(latestEval.duration).toBe(60);
      
      // Verify proposals were stored
      expect(stats.proposalStats.find(p => p.type === 'TIME_OPTIMIZATION')).toBeDefined();
      expect(stats.proposalStats.find(p => p.type === 'ADD_MEMORY_HOOK')).toBeDefined();
    });
  });
});