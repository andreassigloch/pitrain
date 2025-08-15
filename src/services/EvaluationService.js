/**
 * EvaluationService - Mistral AI integration for pitch evaluation
 * Author: andreas@siglochconsulting.com
 */

const axios = require('axios');

class EvaluationService {
  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY;
    this.baseUrl = process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1';
    this.model = process.env.MISTRAL_EVALUATION_MODEL || 'mistral-small-latest';
    this.timeout = parseInt(process.env.REQUEST_TIMEOUT) || 30000;

    if (!this.apiKey) {
      throw new Error('MISTRAL_API_KEY environment variable is required');
    }
  }

  async evaluate(transcript, duration) {
    const startTime = Date.now();
    
    try {
      console.log(`🎯 Evaluating pitch with ${this.model}: ${duration}s duration`);

      const prompt = this.buildEvaluationPrompt(transcript, duration);
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Experte für BNI-Präsentationen und bewertest Pitches objektiv nach den vorgegebenen KPI-Kategorien.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      const evalTime = Date.now() - startTime;
      
      const result = JSON.parse(response.data.choices[0].message.content);
      
      // Validate and normalize the response
      const evaluation = this.validateEvaluationResult(result);
      
      console.log(`✅ Evaluation completed: ${evalTime}ms, overall score: ${evaluation.overall_score}`);
      
      return {
        ...evaluation,
        processing_time: evalTime,
        model_used: this.model
      };

    } catch (error) {
      const evalTime = Date.now() - startTime;
      console.error(`❌ Evaluation failed after ${evalTime}ms:`, error.message);
      
      if (error.response) {
        console.error('API Response:', error.response.data);
        throw new Error(`Mistral API error: ${error.response.data.message || error.response.statusText}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Evaluation timeout - please try again');
      } else {
        throw new Error(`Network error: ${error.message}`);
      }
    }
  }

  buildEvaluationPrompt(transcript, duration) {
    return `
Bewerte diesen ${duration}-Sekunden BNI-Pitch nach den folgenden KPI-Kategorien. 
Gib deine Antwort als JSON-Objekt zurück.

PITCH TRANSCRIPT:
"${transcript}"

BEWERTUNGSKRITERIEN:
Bewerte jeden Aspekt von 0-100 Punkten:

1. CALL-TO-ACTION QUALITY (40% Gewichtung - WICHTIGSTE KATEGORIE):
   - specific_referral_ask: Konkrete Empfehlungsanfrage vorhanden
   - contact_method_clarity: Kontaktmethode klar kommuniziert
   - target_client_definition: Zielklient definiert
   - actionable_request: Handlungsaufforderung ist umsetzbar

2. STRUCTURE_TIME (25% Gewichtung):
   - introduction_completeness: Vollständige Vorstellung (Name, Unternehmen)
   - word_count_optimization: Wortanzahl für ${duration}s optimal (${duration === 45 ? '90-120' : '120-150'} Wörter)
   - clear_flow_organization: Klarer Aufbau und Struktur
   - time_management: Zeitmanagement passend zu ${duration}s

3. CONTENT_CLARITY (20% Gewichtung):
   - jargon_free_language: Verständliche Sprache ohne Fachjargon
   - single_focus_maintenance: Fokus auf eine Dienstleistung/Produkt
   - benefit_articulation: Nutzen klar artikuliert
   - credibility_markers: Glaubwürdigkeitsmarker vorhanden

4. MEMORABILITY (15% Gewichtung):
   - hook_tagline_presence: Einprägsamer Hook oder Slogan
   - unique_element: Einzigartiges Element oder USP
   - concrete_examples: Konkrete Beispiele oder Geschichten

ANTWORT-FORMAT:
{
  "kpis": {
    "call_to_action": {
      "specific_referral_ask": SCORE,
      "contact_method_clarity": SCORE,
      "target_client_definition": SCORE,
      "actionable_request": SCORE
    },
    "structure_time": {
      "introduction_completeness": SCORE,
      "word_count_optimization": SCORE,
      "clear_flow_organization": SCORE,
      "time_management": SCORE
    },
    "content_clarity": {
      "jargon_free_language": SCORE,
      "single_focus_maintenance": SCORE,
      "benefit_articulation": SCORE,
      "credibility_markers": SCORE
    },
    "memorability": {
      "hook_tagline_presence": SCORE,
      "unique_element": SCORE,
      "concrete_examples": SCORE
    }
  },
  "proposals": [
    {
      "type": "CTA_SPECIFICITY|CTA_CLARITY|STRUCTURE_BASICS|SIMPLIFY_MESSAGE|ADD_MEMORY_HOOK|TIME_OPTIMIZATION",
      "title": "Kurzer Titel",
      "description": "Konkrete Verbesserungsempfehlung",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "overall_score": CALCULATED_WEIGHTED_AVERAGE,
  "word_count": ACTUAL_WORD_COUNT,
  "summary": "2-3 Sätze Gesamteinschätzung"
}

Bewerte streng aber fair. Fehlende Elemente = niedrige Scores. Maximal 3 Verbesserungsvorschläge.`;
  }

  validateEvaluationResult(result) {
    // Ensure all required KPI categories exist
    const defaultKpis = {
      call_to_action: {
        specific_referral_ask: 0,
        contact_method_clarity: 0,
        target_client_definition: 0,
        actionable_request: 0
      },
      structure_time: {
        introduction_completeness: 0,
        word_count_optimization: 0,
        clear_flow_organization: 0,
        time_management: 0
      },
      content_clarity: {
        jargon_free_language: 0,
        single_focus_maintenance: 0,
        benefit_articulation: 0,
        credibility_markers: 0
      },
      memorability: {
        hook_tagline_presence: 0,
        unique_element: 0,
        concrete_examples: 0
      }
    };

    const kpis = { ...defaultKpis, ...(result.kpis || {}) };
    
    // Calculate weighted overall score
    const weights = {
      call_to_action: 0.4,
      structure_time: 0.25,
      content_clarity: 0.2,
      memorability: 0.15
    };

    let overallScore = 0;
    for (const [category, weight] of Object.entries(weights)) {
      const categoryScores = Object.values(kpis[category]);
      const categoryAvg = categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length;
      overallScore += categoryAvg * weight;
    }

    // Validate proposals
    const proposals = (result.proposals || []).slice(0, 3).map(proposal => ({
      type: proposal.type || 'GENERAL_IMPROVEMENT',
      title: proposal.title || 'Verbesserung',
      description: proposal.description || 'Siehe Bewertungsdetails',
      priority: ['HIGH', 'MEDIUM', 'LOW'].includes(proposal.priority) ? proposal.priority : 'MEDIUM'
    }));

    return {
      kpis,
      proposals,
      overall_score: Math.round(overallScore * 10) / 10, // Round to 1 decimal
      word_count: result.word_count || 0,
      summary: result.summary || 'Bewertung abgeschlossen'
    };
  }

  calculateKPIScores(kpis) {
    const scores = {};
    
    for (const [category, items] of Object.entries(kpis)) {
      const itemScores = Object.values(items);
      scores[category] = Math.round(itemScores.reduce((sum, score) => sum + score, 0) / itemScores.length);
    }
    
    return scores;
  }

  async testConnection() {
    try {
      console.log('🔍 Testing Mistral Chat API connection...');
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 5
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      console.log(`✅ Chat API connection successful with ${this.model}`);
      return {
        connected: true,
        model: this.model,
        test_response: response.data.choices[0].message.content
      };
      
    } catch (error) {
      console.error('❌ Chat API connection test failed:', error.message);
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = EvaluationService;