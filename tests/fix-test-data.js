/**
 * Quick fix to add test data via API while server is running
 * Author: andreas@siglochconsulting.com
 */

const axios = require('axios');

async function addTestDataViaAPI() {
  const baseURL = 'http://localhost:3000';
  
  const testEvaluations = [
    {
      transcript: "Hallo, ich bin Andreas Sigloch von Sigloch Consulting. Wir helfen Unternehmen dabei, ihre IT-Prozesse zu optimieren. Wenn Sie jemanden kennen, der Probleme mit der Digitalisierung hat, empfehlen Sie mich gerne. Kontaktieren Sie mich unter andreas@siglochconsulting.com",
      duration: 45
    },
    {
      transcript: "Mein Name ist Test User, ich leite das Marketing bei Example Corp. Wir entwickeln innovative Software-Lösungen für kleine Unternehmen. Falls Sie Unternehmer kennen, die ihre Abläufe digitalisieren möchten, stellen Sie gerne den Kontakt her. Rufen Sie mich an unter 0123-456789.",
      duration: 60
    },
    {
      transcript: "Ich bin Maria Weber von Weber Solutions. Wir bieten professionelle Buchhaltung für Freelancer und Startups. Kennen Sie jemanden, der Hilfe mit der Steuererklärung braucht? Dann empfehlen Sie mich weiter. Meine Website ist weber-solutions.de",
      duration: 45
    },
    {
      transcript: "Hi, ich bin Tom Müller, Geschäftsführer der TechBoost GmbH. Wir helfen etablierten Unternehmen dabei, moderne Cloud-Technologien einzuführen. Wenn Sie Firmen kennen, die ihre IT modernisieren wollen, verbinden Sie uns gerne. Schreiben Sie mir an tom@techboost.de oder besuchen Sie unsere Website.",
      duration: 60
    },
    {
      transcript: "Mein Name ist Lisa Schmidt, ich führe eine Designagentur namens Creative Vision. Wir gestalten Markenidentitäten und Websites für B2B-Unternehmen. Falls Sie Geschäftskontakte haben, die ein professionelles Rebranding benötigen, empfehlen Sie mich bitte weiter. Erreichen können Sie mich unter lisa@creative-vision.com",
      duration: 45
    }
  ];

  try {
    console.log('🚀 Adding test evaluations via API...');
    
    for (let i = 0; i < testEvaluations.length; i++) {
      const evaluation = testEvaluations[i];
      
      try {
        console.log(`📝 Evaluating pitch ${i + 1}/${testEvaluations.length}...`);
        
        const response = await axios.post(`${baseURL}/api/evaluate`, {
          transcript: evaluation.transcript,
          duration: evaluation.duration
        }, {
          timeout: 30000
        });
        
        console.log(`✅ Added evaluation ${i + 1}: Score ${response.data.overall_score}/100`);
        
      } catch (error) {
        if (error.response?.status === 500 && error.response?.data?.error === 'Evaluation failed') {
          // Expected for local testing without Mistral API - create mock data
          console.log(`⚠️  API error for evaluation ${i + 1}, this is expected without Mistral API key`);
        } else {
          console.error(`❌ Error adding evaluation ${i + 1}:`, error.message);
        }
      }
    }
    
    console.log('\n📈 Checking statistics...');
    const statsResponse = await axios.get(`${baseURL}/api/statistics`);
    console.log('Statistics:', JSON.stringify(statsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure the server is running with: npm run dev');
  }
}

addTestDataViaAPI();