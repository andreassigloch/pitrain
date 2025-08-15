/**
 * RecordingInterface Component - Timer, transcript display, and recording controls
 * Author: andreas@siglochconsulting.com
 */

import React, { useState, useEffect, useRef } from 'react'
import SpeechService from '../services/SpeechService'

function RecordingInterface({ duration, onRecordingComplete, onEvaluationComplete }) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRecording, setIsRecording] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('ready') // ready, recording, processing, error

  const speechServiceRef = useRef(null)
  const timerRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    initializeSpeechService()
    
    return () => {
      cleanup()
    }
  }, [])

  const initializeSpeechService = async () => {
    try {
      speechServiceRef.current = new SpeechService()
      
      speechServiceRef.current.setCallbacks({
        onTranscriptUpdate: (transcript, isFinal) => {
          setLiveTranscript(transcript)
        },
        onError: (error) => {
          setError(error)
          setStatus('error')
        },
        onAudioReady: (audioBlob) => {
          audioRef.current = audioBlob
        }
      })

      const result = await speechServiceRef.current.initialize()
      
      if (!result.success) {
        if (result.permissions) {
          setError('Mikrofon-Berechtigung erforderlich. Bitte erlaube den Zugriff und lade die Seite neu.')
        } else {
          setError('Fehler beim Initialisieren der Aufnahme: ' + result.error)
        }
        setStatus('error')
      }
      
    } catch (error) {
      console.error('Speech service initialization failed:', error)
      setError('Sprachdienst konnte nicht gestartet werden: ' + error.message)
      setStatus('error')
    }
  }

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    if (speechServiceRef.current) {
      speechServiceRef.current.cleanup()
    }
  }

  const startRecording = async () => {
    try {
      setError(null)
      setStatus('recording')
      setIsRecording(true)
      setTimeLeft(duration)
      setLiveTranscript('')

      await speechServiceRef.current.startRecording()

      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording()
            return 0
          }
          
          // Audio cues
          if (prev === 11) playBeep() // 10s warning
          if (prev === 6) playBeep()  // 5s warning
          
          return prev - 1
        })
      }, 1000)

    } catch (error) {
      console.error('Failed to start recording:', error)
      setError('Aufnahme konnte nicht gestartet werden: ' + error.message)
      setStatus('error')
      setIsRecording(false)
    }
  }

  const stopRecording = async () => {
    try {
      setIsRecording(false)
      clearInterval(timerRef.current)
      
      await speechServiceRef.current.stopRecording()
      
      setStatus('processing')
      
      // Wait a moment for audio processing
      setTimeout(async () => {
        await processRecording()
      }, 500)

    } catch (error) {
      console.error('Failed to stop recording:', error)
      setError('Fehler beim Stoppen der Aufnahme: ' + error.message)
      setStatus('error')
    }
  }

  const processRecording = async () => {
    try {
      if (!audioRef.current) {
        throw new Error('Keine Audiodaten verfügbar')
      }

      // Get final transcript from Voxtral
      console.log('🎯 Processing audio with Voxtral...')
      const transcriptionResult = await speechServiceRef.current.transcribeAudio(audioRef.current)
      
      const finalTranscript = transcriptionResult.transcript || liveTranscript
      
      if (!finalTranscript.trim()) {
        throw new Error('Kein Text erkannt. Bitte spreche lauter oder deutlicher.')
      }

      console.log('📝 Final transcript:', finalTranscript.length, 'characters')
      onRecordingComplete(finalTranscript)

      // Send for evaluation
      console.log('🎯 Sending for evaluation...')
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: finalTranscript,
          duration: duration
        }),
      })

      if (!response.ok) {
        throw new Error(`Evaluation failed: ${response.statusText}`)
      }

      const evaluationResult = await response.json()
      console.log('✅ Evaluation complete, overall score:', evaluationResult.overall_score)
      
      onEvaluationComplete(evaluationResult)

    } catch (error) {
      console.error('❌ Processing failed:', error)
      setError('Verarbeitung fehlgeschlagen: ' + error.message)
      setStatus('error')
    }
  }

  const playBeep = () => {
    // Create audio context for beep sound
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800 // Hz
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    }
  }

  const getProgressWidth = () => {
    return ((duration - timeLeft) / duration) * 100
  }

  const getProgressColor = () => {
    if (timeLeft > duration * 0.5) return 'bg-success-500'
    if (timeLeft > duration * 0.2) return 'bg-yellow-500'
    return 'bg-danger-500'
  }

  const formatTime = (seconds) => {
    return `${seconds}s`
  }

  if (status === 'error') {
    return (
      <div className="text-center space-y-6">
        <div className="text-6xl">❌</div>
        <h2 className="text-2xl font-semibold text-danger-600">Fehler</h2>
        <p className="text-gray-600 max-w-md mx-auto">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Seite neu laden
        </button>
      </div>
    )
  }

  if (status === 'processing') {
    return (
      <div className="text-center space-y-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
        <h2 className="text-2xl font-semibold text-gray-800">
          🎯 Verarbeitung läuft...
        </h2>
        <div className="space-y-2 text-gray-600">
          <p>📝 Transkription mit Voxtral AI...</p>
          <p>🤖 Pitch-Bewertung mit Mistral AI...</p>
          <p className="text-sm">Das kann bis zu 10 Sekunden dauern</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Recording Status */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-4 mb-4">
          {isRecording && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-600 font-semibold text-lg">AUFNAHME</span>
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900">
            {duration}s Pitch {isRecording ? '- Läuft' : '- Bereit'}
          </h2>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="progress-bar">
          <div 
            className={`progress-fill ${getProgressColor()}`}
            style={{ width: `${getProgressWidth()}%` }}
          ></div>
        </div>
        <div className="text-center">
          <span className="text-2xl font-bold text-gray-800">
            {isRecording ? `${formatTime(timeLeft)} verbleibend` : `${duration} Sekunden bereit`}
          </span>
        </div>
      </div>

      {/* Live Transcript */}
      <div className="transcript-box">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-700">📝 Live Transcript:</h3>
          {isRecording && (
            <div className="flex items-center space-x-1 text-green-600 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          )}
        </div>
        
        <div className="text-gray-800 leading-relaxed">
          {liveTranscript ? (
            <p>{liveTranscript}</p>
          ) : (
            <p className="text-gray-400 italic">
              {isRecording 
                ? 'Spreche jetzt... (Falls kein Text erscheint, wird die finale Transkription verwendet)'
                : 'Drücke "Start" um mit der Aufnahme zu beginnen'
              }
            </p>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="btn btn-primary text-xl px-8 py-4 min-w-[200px]"
            disabled={status !== 'ready'}
          >
            🎙️ START
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="btn btn-danger text-xl px-8 py-4 min-w-[200px]"
          >
            🛑 STOPP
          </button>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4 text-center">
        <p className="text-blue-800 text-sm">
          💡 <strong>Tipp:</strong> Spreche deutlich und verwende die {duration}s optimal. 
          {duration === 45 && ' Zielwörter: 90-120 Wörter.'} 
          {duration === 60 && ' Zielwörter: 120-150 Wörter.'}
        </p>
      </div>
    </div>
  )
}

export default RecordingInterface