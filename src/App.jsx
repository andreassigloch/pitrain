/**
 * PitchTrainer Main App Component
 * Author: andreas@siglochconsulting.com
 */

import React, { useState } from 'react'
import DurationSelector from './components/DurationSelector'
import RecordingInterface from './components/RecordingInterface'
import ResultsDisplay from './components/ResultsDisplay'
import DisclaimerBanner from './components/DisclaimerBanner'

const AppState = {
  DISCLAIMER: 'disclaimer',
  DURATION_SELECT: 'duration_select',
  RECORDING: 'recording',
  PROCESSING: 'processing', 
  RESULTS: 'results'
}

function App() {
  const [appState, setAppState] = useState(AppState.DISCLAIMER)
  const [selectedDuration, setSelectedDuration] = useState(null)
  const [evaluationResult, setEvaluationResult] = useState(null)
  const [transcript, setTranscript] = useState('')

  const handleDisclaimerAccept = () => {
    setAppState(AppState.DURATION_SELECT)
  }

  const handleDurationSelect = (duration) => {
    setSelectedDuration(duration)
    setAppState(AppState.RECORDING)
  }

  const handleRecordingComplete = (transcript) => {
    setTranscript(transcript)
    setAppState(AppState.PROCESSING)
  }

  const handleEvaluationComplete = (result) => {
    setEvaluationResult(result)
    setAppState(AppState.RESULTS)
  }

  const handleStartOver = () => {
    setAppState(AppState.DURATION_SELECT)
    setSelectedDuration(null)
    setEvaluationResult(null)
    setTranscript('')
  }

  const renderCurrentView = () => {
    switch (appState) {
      case AppState.DISCLAIMER:
        return <DisclaimerBanner onAccept={handleDisclaimerAccept} />
      
      case AppState.DURATION_SELECT:
        return <DurationSelector onDurationSelect={handleDurationSelect} />
      
      case AppState.RECORDING:
        return (
          <RecordingInterface
            duration={selectedDuration}
            onRecordingComplete={handleRecordingComplete}
            onEvaluationComplete={handleEvaluationComplete}
          />
        )
      
      case AppState.PROCESSING:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
            <h2 className="text-2xl font-semibold text-gray-800">
              🎯 Pitch wird analysiert...
            </h2>
            <p className="text-gray-600 text-center max-w-md">
              Die AI bewertet deine Präsentation nach BNI-Kriterien. Das dauert nur wenige Sekunden.
            </p>
          </div>
        )
      
      case AppState.RESULTS:
        return (
          <ResultsDisplay
            result={evaluationResult}
            transcript={transcript}
            duration={selectedDuration}
            onStartOver={handleStartOver}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            🎯 PitchTrainer
          </h1>
          <p className="text-gray-600 text-lg">
            BNI Pitch Training mit KI-Feedback
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {renderCurrentView()}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Powered by Mistral AI • {' '}
            <a 
              href="https://github.com/andreassigloch/pitrain" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Open Source
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default App