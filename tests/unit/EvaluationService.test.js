/**
 * Level 1 Unit Tests: EvaluationService
 * Author: andreas@siglochconsulting.com
 * 
 * Tests individual functions with mock data only
 * Speed: < 5 seconds, no external dependencies
 */

const EvaluationService = require('../../src/services/EvaluationService');

// Mock axios to avoid external API calls
jest.mock('axios');
const axios = require('axios');

describe('EvaluationService Unit Tests', () => {
  let evalService;

  beforeEach(() => {
    evalService = new EvaluationService();
    jest.clearAllMocks();
  });

  describe('Constructor and Configuration', () => {
    test('should initialize with correct configuration', () => {
      expect(evalService.apiKey).toBeDefined();
      expect(evalService.baseUrl).toBe('https://api.mistral.ai/v1');
      expect(evalService.model).toBe('mistral-small-latest');
      expect(evalService.timeout).toBe(30000);
    });

    test('should throw error if API key is missing', () => {
      delete process.env.MISTRAL_API_KEY;
      
      expect(() => {
        new EvaluationService();
      }).toThrow('MISTRAL_API_KEY environment variable is required');
      
      // Restore API key
      process.env.MISTRAL_API_KEY = 'test-key';
    });
  });

  describe('Prompt Building', () => {
    test('should build evaluation prompt correctly for 45s pitch', () => {
      const transcript = 'Hallo, ich bin Andreas und helfe Unternehmen mit KI.';
      const prompt = evalService.buildEvaluationPrompt(transcript, 45);

      expect(prompt).toContain('45-Sekunden BNI-Pitch');
      expect(prompt).toContain(transcript);
      expect(prompt).toContain('90-120 Wörter');
      expect(prompt).toContain('JSON-Objekt');
    });

    test('should build evaluation prompt correctly for 60s pitch', () => {
      const transcript = 'Test transcript for longer pitch presentation.';
      const prompt = evalService.buildEvaluationPrompt(transcript, 60);

      expect(prompt).toContain('60-Sekunden BNI-Pitch');
      expect(prompt).toContain(transcript);
      expect(prompt).toContain('120-150 Wörter');
      expect(prompt).toContain('call_to_action');
      expect(prompt).toContain('structure_time');
    });

    test('should include all KPI categories in prompt', () => {
      const prompt = evalService.buildEvaluationPrompt('test', 45);

      expect(prompt).toContain('CALL-TO-ACTION QUALITY');
      expect(prompt).toContain('STRUCTURE_TIME');
      expect(prompt).toContain('CONTENT_CLARITY');
      expect(prompt).toContain('MEMORABILITY');
      expect(prompt).toContain('40% Gewichtung');
    });
  });

  describe('Result Validation', () => {
    test('should validate and normalize complete evaluation result', () => {
      const mockResult = {
        kpis: {
          call_to_action: {
            specific_referral_ask: 85,
            contact_method_clarity: 90,
            target_client_definition: 80,
            actionable_request: 88
          },
          structure_time: {
            introduction_completeness: 75,
            word_count_optimization: 85,
            clear_flow_organization: 80,
            time_management: 90
          },
          content_clarity: {
            jargon_free_language: 95,
            single_focus_maintenance: 88,
            benefit_articulation: 82,
            credibility_markers: 78
          },
          memorability: {
            hook_tagline_presence: 60,
            unique_element: 70,
            concrete_examples: 65
          }
        },
        proposals: [
          {
            type: 'CTA_SPECIFICITY',
            title: 'Spezifischere Empfehlung',
            description: 'Konkretere Empfehlungsanfrage formulieren',
            priority: 'HIGH'
          }
        ],
        overall_score: 82.5,
        word_count: 105,
        summary: 'Guter Pitch mit Verbesserungspotential'
      };

      const validated = evalService.validateEvaluationResult(mockResult);

      expect(validated.kpis).toEqual(mockResult.kpis);
      expect(validated.proposals).toHaveLength(1);
      expect(validated.proposals[0].type).toBe('CTA_SPECIFICITY');
      // Calculate expected weighted score manually:
      // CTA: (85+90+80+88)/4 = 85.75 * 0.4 = 34.3
      // Structure: (75+85+80+90)/4 = 82.5 * 0.25 = 20.625  
      // Content: (95+88+82+78)/4 = 85.75 * 0.2 = 17.15
      // Memory: (60+70+65)/3 = 65 * 0.15 = 9.75
      // Total: 34.3 + 20.625 + 17.15 + 9.75 = 81.825 ≈ 81.8
      expect(validated.overall_score).toBe(81.8);
      expect(validated.word_count).toBe(105);
    });

    test('should fill missing KPI categories with defaults', () => {
      const incompleteResult = {
        kpis: {
          call_to_action: { specific_referral_ask: 80 }
          // Missing other categories
        },
        proposals: []
      };

      const validated = evalService.validateEvaluationResult(incompleteResult);

      expect(validated.kpis.structure_time).toBeDefined();
      expect(validated.kpis.content_clarity).toBeDefined();
      expect(validated.kpis.memorability).toBeDefined();
      expect(validated.kpis.structure_time.introduction_completeness).toBe(0);
    });

    test('should limit proposals to maximum 3 items', () => {
      const resultWithManyProposals = {
        proposals: [
          { type: 'TYPE1', title: 'Title1', description: 'Desc1' },
          { type: 'TYPE2', title: 'Title2', description: 'Desc2' },
          { type: 'TYPE3', title: 'Title3', description: 'Desc3' },
          { type: 'TYPE4', title: 'Title4', description: 'Desc4' },
          { type: 'TYPE5', title: 'Title5', description: 'Desc5' }
        ]
      };

      const validated = evalService.validateEvaluationResult(resultWithManyProposals);
      expect(validated.proposals).toHaveLength(3);
    });

    test('should validate proposal priority values', () => {
      const resultWithInvalidPriority = {
        proposals: [
          { type: 'TEST', title: 'Test', description: 'Test desc', priority: 'INVALID' }
        ]
      };

      const validated = evalService.validateEvaluationResult(resultWithInvalidPriority);
      expect(validated.proposals[0].priority).toBe('MEDIUM');
    });
  });

  describe('KPI Score Calculations', () => {
    test('should calculate category averages correctly', () => {
      const kpis = {
        call_to_action: {
          specific_referral_ask: 80,
          contact_method_clarity: 90,
          target_client_definition: 70,
          actionable_request: 100
        },
        structure_time: {
          introduction_completeness: 60,
          word_count_optimization: 80,
          clear_flow_organization: 70,
          time_management: 90
        }
      };

      const scores = evalService.calculateKPIScores(kpis);

      // call_to_action: (80+90+70+100)/4 = 85
      expect(scores.call_to_action).toBe(85);
      
      // structure_time: (60+80+70+90)/4 = 75
      expect(scores.structure_time).toBe(75);
    });

    test('should handle empty KPI categories', () => {
      const emptyKpis = {
        call_to_action: {},
        structure_time: {}
      };

      const scores = evalService.calculateKPIScores(emptyKpis);
      
      // Empty categories should result in NaN, but function should not crash
      expect(isNaN(scores.call_to_action)).toBe(true);
    });
  });

  describe('Weighted Overall Score Calculation', () => {
    test('should calculate weighted overall score correctly', () => {
      const mockResult = {
        kpis: {
          call_to_action: { score: 80 },      // 80 * 0.4 = 32
          structure_time: { score: 90 },      // 90 * 0.25 = 22.5
          content_clarity: { score: 70 },     // 70 * 0.2 = 14
          memorability: { score: 60 }         // 60 * 0.15 = 9
        }
      };

      const validated = evalService.validateEvaluationResult(mockResult);
      
      // Expected: 32 + 22.5 + 14 + 9 = 77.5
      expect(validated.overall_score).toBe(77.5);
    });

    test('should round overall score to 1 decimal place', () => {
      const mockResult = {
        kpis: {
          call_to_action: { score1: 83, score2: 87 },     // avg: 85
          structure_time: { score1: 77, score2: 83 },     // avg: 80  
          content_clarity: { score1: 71, score2: 79 },    // avg: 75
          memorability: { score1: 65, score2: 75 }        // avg: 70
        }
      };

      const validated = evalService.validateEvaluationResult(mockResult);
      
      // 85*0.4 + 80*0.25 + 75*0.2 + 70*0.15 = 34 + 20 + 15 + 10.5 = 79.5
      expect(validated.overall_score).toBe(79.5);
      expect(validated.overall_score % 1).not.toBe(0); // Should have decimal
    });
  });
});