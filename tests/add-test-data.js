/**
 * Script to add test data for statistics testing
 * Author: andreas@siglochconsulting.com
 */

const DatabaseService = require('../src/services/DatabaseService');

async function addTestData() {
  const db = new DatabaseService();
  
  try {
    console.log('🗄️  Adding test data to database...');
    
    // Sample evaluation data
    const testEvaluations = [
      {
        duration: 45,
        overall_score: 78,
        word_count: 65,
        kpis: {
          call_to_action: { specificity: 85, clarity: 80, target_definition: 75 },
          structure_time: { intro: 70, main: 75, outro: 65, timing: 80 },
          content_clarity: { message_clear: 80, jargon_free: 75 },
          memorability: { hook_present: 60, memorable_element: 55 }
        },
        proposals: [
          { type: 'CTA_SPECIFICITY', priority: 'HIGH', description: 'Konkretere Empfehlungsanfrage formulieren' },
          { type: 'ADD_MEMORY_HOOK', priority: 'MEDIUM', description: 'Einprägsamen Slogan hinzufügen' }
        ]
      },
      {
        duration: 60,
        overall_score: 72,
        word_count: 89,
        kpis: {
          call_to_action: { specificity: 70, clarity: 75, target_definition: 80 },
          structure_time: { intro: 75, main: 70, outro: 70, timing: 85 },
          content_clarity: { message_clear: 75, jargon_free: 80 },
          memorability: { hook_present: 65, memorable_element: 60 }
        },
        proposals: [
          { type: 'STRUCTURE_BASICS', priority: 'MEDIUM', description: 'Grundstruktur verbessern' },
          { type: 'SIMPLIFY_MESSAGE', priority: 'LOW', description: 'Botschaft vereinfachen' }
        ]
      },
      {
        duration: 45,
        overall_score: 82,
        word_count: 58,
        kpis: {
          call_to_action: { specificity: 90, clarity: 85, target_definition: 80 },
          structure_time: { intro: 80, main: 85, outro: 75, timing: 90 },
          content_clarity: { message_clear: 85, jargon_free: 90 },
          memorability: { hook_present: 75, memorable_element: 70 }
        },
        proposals: [
          { type: 'ADD_MEMORY_HOOK', priority: 'LOW', description: 'Noch einprägsameren Hook entwickeln' }
        ]
      },
      {
        duration: 60,
        overall_score: 68,
        word_count: 95,
        kpis: {
          call_to_action: { specificity: 65, clarity: 70, target_definition: 75 },
          structure_time: { intro: 65, main: 60, outro: 70, timing: 75 },
          content_clarity: { message_clear: 70, jargon_free: 65 },
          memorability: { hook_present: 55, memorable_element: 50 }
        },
        proposals: [
          { type: 'CTA_SPECIFICITY', priority: 'HIGH', description: 'Zielgruppe genauer definieren' },
          { type: 'CTA_CLARITY', priority: 'HIGH', description: 'Kontaktweg deutlicher kommunizieren' },
          { type: 'TIME_OPTIMIZATION', priority: 'MEDIUM', description: 'Inhalt für Zeitlimit optimieren' }
        ]
      },
      {
        duration: 45,
        overall_score: 75,
        word_count: 62,
        kpis: {
          call_to_action: { specificity: 80, clarity: 75, target_definition: 85 },
          structure_time: { intro: 75, main: 80, outro: 70, timing: 75 },
          content_clarity: { message_clear: 75, jargon_free: 80 },
          memorability: { hook_present: 70, memorable_element: 65 }
        },
        proposals: [
          { type: 'STRUCTURE_BASICS', priority: 'MEDIUM', description: 'Outro verstärken' }
        ]
      }
    ];
    
    // Insert evaluations
    for (let i = 0; i < testEvaluations.length; i++) {
      const evaluation = testEvaluations[i];
      const evaluationId = await db.storeEvaluation({
        duration: evaluation.duration,
        overall_score: evaluation.overall_score,
        word_count: evaluation.word_count,
        kpi_scores: evaluation.kpis,  // Fixed: use kpi_scores not kpis
        proposals: evaluation.proposals
      });
      
      console.log(`✅ Added evaluation ${i + 1}/${testEvaluations.length} (ID: ${evaluationId})`);
    }
    
    // Get statistics to verify
    const stats = await db.getStatistics();
    console.log('\n📈 Current Statistics:');
    console.log(`Total trainings: ${stats.total_count}`);
    console.log(`Average scores:`, stats.avg_scores);
    console.log(`Overall average: ${Math.round(stats.avg_overall_score)}`);
    
    console.log('\n🎉 Test data added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error);
  } finally {
    await db.close();
  }
}

// Run if called directly
if (require.main === module) {
  addTestData();
}

module.exports = addTestData;