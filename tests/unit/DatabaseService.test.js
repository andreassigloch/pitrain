/**
 * Level 1 Unit Tests: DatabaseService
 * Author: andreas@siglochconsulting.com
 * 
 * Tests individual functions with mock data only
 * Speed: < 5 seconds, no external dependencies
 */

const DatabaseService = require('../../src/services/DatabaseService');

describe('DatabaseService Unit Tests', () => {
  let dbService;

  beforeEach(async () => {
    // Use in-memory database for unit tests
    process.env.DATABASE_PATH = ':memory:';
    dbService = new DatabaseService();
    await dbService.initialize();
  });

  afterEach(async () => {
    if (dbService) {
      await dbService.close();
    }
  });

  describe('Database Connection', () => {
    test('should connect to in-memory database', async () => {
      expect(dbService.db).toBeDefined();
      expect(dbService.dbPath).toBe(':memory:');
    });

    test('should create required tables', async () => {
      // Test that tables exist by querying them
      const evaluationsTable = await dbService.getQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='evaluations'"
      );
      const proposalsTable = await dbService.getQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='proposals'"
      );
      const statisticsTable = await dbService.getQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='statistics'"
      );

      expect(evaluationsTable.name).toBe('evaluations');
      expect(proposalsTable.name).toBe('proposals');
      expect(statisticsTable.name).toBe('statistics');
    });
  });

  describe('Data Operations', () => {
    test('should store evaluation data correctly', async () => {
      const mockEvaluation = {
        duration: 45,
        kpi_scores: {
          call_to_action: { specific_referral_ask: 85, contact_method_clarity: 90 },
          structure_time: { introduction_completeness: 75, word_count_optimization: 80 }
        },
        proposals: [
          { type: 'CTA_SPECIFICITY', description: 'Test proposal' }
        ],
        word_count: 95,
        timestamp: new Date().toISOString()
      };

      const id = await dbService.storeEvaluation(mockEvaluation);
      expect(id).toBeGreaterThan(0);

      // Verify stored data
      const storedEval = await dbService.getQuery(
        'SELECT * FROM evaluations WHERE id = ?',
        [id]
      );

      expect(storedEval.duration).toBe(45);
      expect(storedEval.word_count).toBe(95);
      expect(JSON.parse(storedEval.kpi_scores)).toEqual(mockEvaluation.kpi_scores);
    });

    test('should calculate overall score correctly', async () => {
      const mockEvaluation = {
        duration: 60,
        kpi_scores: {
          call_to_action: { score1: 80, score2: 90 }, // avg: 85
          structure_time: { score1: 70, score2: 80 }  // avg: 75
        },
        proposals: [],
        word_count: 120,
        timestamp: new Date().toISOString()
      };

      const id = await dbService.storeEvaluation(mockEvaluation);
      const stored = await dbService.getQuery(
        'SELECT overall_score FROM evaluations WHERE id = ?',
        [id]
      );

      // Overall score should be average of category averages: (85 + 75) / 2 = 80
      expect(stored.overall_score).toBe(80);
    });

    test('should retrieve statistics correctly', async () => {
      // Store test data
      await dbService.storeEvaluation({
        duration: 45,
        kpi_scores: { test: { score: 80 } },
        proposals: [{ type: 'TEST_TYPE' }],
        word_count: 100,
        timestamp: new Date().toISOString()
      });

      await dbService.storeEvaluation({
        duration: 60,
        kpi_scores: { test: { score: 90 } },
        proposals: [{ type: 'TEST_TYPE' }],
        word_count: 110,
        timestamp: new Date().toISOString()
      });

      const stats = await dbService.getStatistics();

      expect(stats.totalEvaluations).toBe(2);
      expect(stats.recentEvaluations).toHaveLength(2);
      expect(stats.proposalStats).toEqual([
        { type: 'TEST_TYPE', total_count: 2 }
      ]);
    });
  });

  describe('Query Methods', () => {
    test('should execute runQuery correctly', async () => {
      const result = await dbService.runQuery(
        'INSERT INTO evaluations (timestamp, duration, kpi_scores, word_count, overall_score) VALUES (?, ?, ?, ?, ?)',
        [new Date().toISOString(), 45, '{}', 100, 75]
      );

      expect(result.id).toBeGreaterThan(0);
      expect(result.changes).toBe(1);
    });

    test('should handle getQuery for single row', async () => {
      // Insert test data
      await dbService.runQuery(
        'INSERT INTO evaluations (timestamp, duration, kpi_scores, word_count, overall_score) VALUES (?, ?, ?, ?, ?)',
        [new Date().toISOString(), 60, '{}', 120, 80]
      );

      const row = await dbService.getQuery(
        'SELECT * FROM evaluations WHERE duration = ?',
        [60]
      );

      expect(row).toBeDefined();
      expect(row.duration).toBe(60);
      expect(row.word_count).toBe(120);
    });

    test('should handle allQuery for multiple rows', async () => {
      // Insert test data
      for (let i = 0; i < 3; i++) {
        await dbService.runQuery(
          'INSERT INTO evaluations (timestamp, duration, kpi_scores, word_count, overall_score) VALUES (?, ?, ?, ?, ?)',
          [new Date().toISOString(), 45, '{}', 100 + i, 70 + i]
        );
      }

      const rows = await dbService.allQuery(
        'SELECT * FROM evaluations WHERE duration = ?',
        [45]
      );

      expect(rows).toHaveLength(3);
      expect(rows[0].duration).toBe(45);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid SQL queries', async () => {
      await expect(
        dbService.runQuery('INVALID SQL QUERY')
      ).rejects.toThrow();
    });

    test('should handle missing data in storeEvaluation', async () => {
      const invalidData = {
        // Missing required fields
        kpi_scores: {},
        proposals: []
      };

      await expect(
        dbService.storeEvaluation(invalidData)
      ).rejects.toThrow();
    });
  });
});