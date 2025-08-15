/**
 * ResultsDisplay Component - Shows KPI scores and improvement proposals
 * Author: andreas@siglochconsulting.com
 */

import React, { useState } from 'react'

function ResultsDisplay({ result, transcript, duration, onStartOver }) {
  const [copied, setCopied] = useState(false)

  const categoryLabels = {
    call_to_action: 'Call-to-Action',
    structure_time: 'Struktur & Zeit', 
    content_clarity: 'Klarheit',
    memorability: 'Merkbarkeit'
  }

  const categoryWeights = {
    call_to_action: 40,
    structure_time: 25,
    content_clarity: 20,
    memorability: 15
  }

  const proposalTypeLabels = {
    CTA_SPECIFICITY: 'Call-to-Action spezifischer machen',
    CTA_CLARITY: 'Kontaktweg klarer kommunizieren',
    STRUCTURE_BASICS: 'Grundstruktur verbessern',
    SIMPLIFY_MESSAGE: 'Botschaft vereinfachen',
    ADD_MEMORY_HOOK: 'Einprägsamen Hook hinzufügen',
    TIME_OPTIMIZATION: 'Zeitmanagement optimieren'
  }

  const calculateCategoryScore = (category) => {
    const scores = Object.values(result.kpis[category])
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getBarColor = (score) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const copyToClipboard = () => {
    const categoryScores = Object.keys(categoryLabels).map(key => {
      const score = calculateCategoryScore(key)
      return `${categoryLabels[key]}: ${score}/100`
    }).join('\n')

    const proposals = result.proposals.map((p, i) => 
      `${i + 1}. ${proposalTypeLabels[p.type] || p.title}: ${p.description}`
    ).join('\n')

    const reportText = `🎯 PitchTrainer Bewertung (${duration}s)

📊 BEWERTUNG:
${categoryScores}

🎯 Gesamtscore: ${result.overall_score}/100

💡 VERBESSERUNGSVORSCHLÄGE:
${proposals}

📝 PITCH TRANSCRIPT:
"${transcript}"

---
Erstellt mit PitchTrainer • https://pitrain.waffelwurst.de`

    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      console.error('Clipboard copy failed')
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-2">✅</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Pitch Analysis Complete
        </h2>
        <p className="text-gray-600">
          {duration}s Pitch • {result.word_count} Wörter • 
          Verarbeitung: {result.evaluation_time}ms
        </p>
      </div>

      {/* Overall Score */}
      <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          🎯 Gesamtscore
        </h3>
        <div className="text-5xl font-bold mb-2">
          <span className={getScoreColor(result.overall_score)}>
            {result.overall_score}
          </span>
          <span className="text-gray-400 text-3xl">/100</span>
        </div>
        {result.summary && (
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            {result.summary}
          </p>
        )}
      </div>

      {/* KPI Breakdown */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          📊 Detailbewertung
        </h3>
        
        {Object.keys(categoryLabels).map((category) => {
          const score = calculateCategoryScore(category)
          const weight = categoryWeights[category]
          
          return (
            <div key={category} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800">
                  {categoryLabels[category]}
                  <span className="text-sm text-gray-500 ml-1">
                    ({weight}% Gewichtung)
                  </span>
                </span>
                <span className={`font-bold ${getScoreColor(score)}`}>
                  {score}/100
                </span>
              </div>
              
              <div className="kpi-bar">
                <div 
                  className={`kpi-fill ${getBarColor(score)}`}
                  style={{ width: `${score}%` }}
                ></div>
              </div>
              
              {/* Individual KPI details */}
              <div className="mt-2 text-xs text-gray-600">
                {Object.entries(result.kpis[category]).map(([kpi, value]) => (
                  <span key={kpi} className="inline-block mr-3">
                    {kpi.replace(/_/g, ' ')}: {value}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Improvement Proposals */}
      {result.proposals && result.proposals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            💡 Verbesserungsvorschläge
          </h3>
          
          {result.proposals.map((proposal, index) => (
            <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    proposal.priority === 'HIGH' ? 'bg-red-500' :
                    proposal.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {proposalTypeLabels[proposal.type] || proposal.title}
                  </h4>
                  <p className="text-gray-700 text-sm">
                    {proposal.description}
                  </p>
                  {proposal.priority && (
                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                      proposal.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                      proposal.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {proposal.priority} Priorität
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transcript Display */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          📝 Dein Pitch
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
          <p className="text-gray-800 leading-relaxed text-sm">
            "{transcript}"
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={copyToClipboard}
          className={`btn ${copied ? 'btn-secondary' : 'btn-primary'} min-w-[180px]`}
        >
          {copied ? '✅ Kopiert!' : '📋 KOPIEREN'}
        </button>
        
        <button
          onClick={onStartOver}
          className="btn btn-secondary min-w-[180px]"
        >
          🔄 NOCHMAL
        </button>
      </div>

      {/* Performance Info */}
      <div className="text-center text-xs text-gray-400 space-y-1">
        <p>Powered by Mistral AI • Voxtral Transcription • {result.model_used}</p>
        <p>Transkription + Bewertung: {result.processing_time + (result.evaluation_time || 0)}ms</p>
      </div>
    </div>
  )
}

export default ResultsDisplay