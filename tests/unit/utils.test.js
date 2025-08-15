/**
 * Level 1 Unit Tests: Utility Functions
 * Author: andreas@siglochconsulting.com
 * 
 * Tests individual utility functions
 * Speed: < 5 seconds, no external dependencies
 */

describe('Utility Functions Unit Tests', () => {
  
  describe('Timer Calculations', () => {
    // Test timer logic that would be in a separate utils file
    const calculateProgress = (timeLeft, totalDuration) => {
      return ((totalDuration - timeLeft) / totalDuration) * 100;
    };

    const getProgressColor = (timeLeft, totalDuration) => {
      const ratio = timeLeft / totalDuration;
      if (ratio > 0.5) return 'bg-success-500';
      if (ratio > 0.2) return 'bg-yellow-500';
      return 'bg-danger-500';
    };

    const formatTime = (seconds) => {
      return `${seconds}s`;
    };

    test('should calculate progress percentage correctly', () => {
      expect(calculateProgress(30, 60)).toBe(50);
      expect(Math.round(calculateProgress(15, 45) * 100) / 100).toBe(66.67);
      expect(calculateProgress(0, 60)).toBe(100);
      expect(calculateProgress(60, 60)).toBe(0);
    });

    test('should return correct color based on time remaining', () => {
      // More than 50% time left - green
      expect(getProgressColor(35, 60)).toBe('bg-success-500');
      
      // Between 20-50% time left - yellow
      expect(getProgressColor(20, 60)).toBe('bg-yellow-500');
      expect(getProgressColor(15, 60)).toBe('bg-yellow-500');
      
      // Less than 20% time left - red
      expect(getProgressColor(10, 60)).toBe('bg-danger-500');
      expect(getProgressColor(5, 60)).toBe('bg-danger-500');
    });

    test('should format time correctly', () => {
      expect(formatTime(45)).toBe('45s');
      expect(formatTime(0)).toBe('0s');
      expect(formatTime(120)).toBe('120s');
    });
  });

  describe('KPI Score Utilities', () => {
    const getScoreColor = (score) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    const getBarColor = (score) => {
      if (score >= 80) return 'bg-green-500';
      if (score >= 60) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    test('should return correct text color based on score', () => {
      expect(getScoreColor(90)).toBe('text-green-600');
      expect(getScoreColor(80)).toBe('text-green-600');
      expect(getScoreColor(70)).toBe('text-yellow-600');
      expect(getScoreColor(60)).toBe('text-yellow-600');
      expect(getScoreColor(50)).toBe('text-red-600');
      expect(getScoreColor(30)).toBe('text-red-600');
    });

    test('should return correct bar color based on score', () => {
      expect(getBarColor(95)).toBe('bg-green-500');
      expect(getBarColor(80)).toBe('bg-green-500');
      expect(getBarColor(75)).toBe('bg-yellow-500');
      expect(getBarColor(60)).toBe('bg-yellow-500');
      expect(getBarColor(45)).toBe('bg-red-500');
      expect(getBarColor(20)).toBe('bg-red-500');
    });
  });

  describe('Validation Functions', () => {
    const validateDuration = (duration) => {
      return [45, 60].includes(duration);
    };

    const validateTranscript = (transcript) => {
      return transcript !== null && 
             transcript !== undefined && 
             typeof transcript === 'string' && 
             transcript.trim().length > 0;
    };

    const calculateWordCount = (text) => {
      if (!text || typeof text !== 'string') return 0;
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const isOptimalWordCount = (wordCount, duration) => {
      if (duration === 45) {
        return wordCount >= 90 && wordCount <= 120;
      } else if (duration === 60) {
        return wordCount >= 120 && wordCount <= 150;
      }
      return false;
    };

    test('should validate duration correctly', () => {
      expect(validateDuration(45)).toBe(true);
      expect(validateDuration(60)).toBe(true);
      expect(validateDuration(30)).toBe(false);
      expect(validateDuration(90)).toBe(false);
      expect(validateDuration(null)).toBe(false);
    });

    test('should validate transcript correctly', () => {
      expect(validateTranscript('Hello world')).toBe(true);
      expect(validateTranscript('   Valid text   ')).toBe(true);
      expect(validateTranscript('')).toBe(false);
      expect(validateTranscript('   ')).toBe(false);
      expect(validateTranscript(null)).toBe(false);
      expect(validateTranscript(undefined)).toBe(false);
      expect(validateTranscript(123)).toBe(false);
    });

    test('should calculate word count correctly', () => {
      expect(calculateWordCount('Hello world')).toBe(2);
      expect(calculateWordCount('  Hello    world  test  ')).toBe(3);
      expect(calculateWordCount('Single')).toBe(1);
      expect(calculateWordCount('')).toBe(0);
      expect(calculateWordCount('   ')).toBe(0);
      expect(calculateWordCount(null)).toBe(0);
      expect(calculateWordCount(undefined)).toBe(0);
    });

    test('should check optimal word count for different durations', () => {
      // 45s pitch: 90-120 words optimal
      expect(isOptimalWordCount(100, 45)).toBe(true);
      expect(isOptimalWordCount(90, 45)).toBe(true);
      expect(isOptimalWordCount(120, 45)).toBe(true);
      expect(isOptimalWordCount(80, 45)).toBe(false);
      expect(isOptimalWordCount(130, 45)).toBe(false);

      // 60s pitch: 120-150 words optimal
      expect(isOptimalWordCount(135, 60)).toBe(true);
      expect(isOptimalWordCount(120, 60)).toBe(true);
      expect(isOptimalWordCount(150, 60)).toBe(true);
      expect(isOptimalWordCount(110, 60)).toBe(false);
      expect(isOptimalWordCount(160, 60)).toBe(false);
    });
  });

  describe('Clipboard Utilities', () => {
    const generateReportText = (result, transcript, duration) => {
      const categoryLabels = {
        call_to_action: 'Call-to-Action',
        structure_time: 'Struktur & Zeit',
        content_clarity: 'Klarheit',
        memorability: 'Merkbarkeit'
      };

      const calculateCategoryScore = (category) => {
        const scores = Object.values(result.kpis[category] || {});
        return scores.length > 0 
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;
      };

      const categoryScores = Object.keys(categoryLabels).map(key => {
        const score = calculateCategoryScore(key);
        return `${categoryLabels[key]}: ${score}/100`;
      }).join('\n');

      return `🎯 PitchTrainer Bewertung (${duration}s)

📊 BEWERTUNG:
${categoryScores}

🎯 Gesamtscore: ${result.overall_score}/100`;
    };

    test('should generate report text correctly', () => {
      const mockResult = {
        overall_score: 85,
        kpis: {
          call_to_action: { score1: 80, score2: 90 },
          structure_time: { score1: 70, score2: 80 },
          content_clarity: { score1: 85, score2: 95 },
          memorability: { score1: 60, score2: 70 }
        }
      };

      const reportText = generateReportText(mockResult, 'Test transcript', 60);
      
      expect(reportText).toContain('PitchTrainer Bewertung (60s)');
      expect(reportText).toContain('Call-to-Action: 85/100');
      expect(reportText).toContain('Struktur & Zeit: 75/100');
      expect(reportText).toContain('Klarheit: 90/100');
      expect(reportText).toContain('Merkbarkeit: 65/100');
      expect(reportText).toContain('Gesamtscore: 85/100');
    });

    test('should handle missing KPI data gracefully', () => {
      const incompleteResult = {
        overall_score: 70,
        kpis: {
          call_to_action: { score: 80 }
          // Missing other categories
        }
      };

      const reportText = generateReportText(incompleteResult, 'Test', 45);
      
      expect(reportText).toContain('Call-to-Action: 80/100');
      expect(reportText).toContain('Struktur & Zeit: 0/100');
      expect(reportText).toContain('Gesamtscore: 70/100');
    });
  });
});