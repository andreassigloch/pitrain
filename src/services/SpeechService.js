/**
 * SpeechService - Hybrid speech recognition with Web Speech API + MediaRecorder
 * Author: andreas@siglochconsulting.com
 */

class SpeechService {
  constructor() {
    this.recognition = null
    this.mediaRecorder = null
    this.audioChunks = []
    this.isSupported = this.checkSupport()
    this.onTranscriptUpdate = null
    this.onError = null
    this.onAudioReady = null
  }

  checkSupport() {
    const hasWebSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    const hasMediaRecorder = 'MediaRecorder' in window
    
    return {
      webSpeech: hasWebSpeech,
      mediaRecorder: hasMediaRecorder,
      hybrid: hasWebSpeech && hasMediaRecorder
    }
  }

  async initialize() {
    try {
      // Get microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })

      this.setupMediaRecorder(stream)
      this.setupSpeechRecognition()

      console.log('✅ Speech service initialized')
      return { success: true }
      
    } catch (error) {
      console.error('❌ Speech service initialization failed:', error)
      return { 
        success: false, 
        error: error.message,
        permissions: error.name === 'NotAllowedError'
      }
    }
  }

  setupMediaRecorder(stream) {
    // Setup MediaRecorder for high-quality audio capture
    const options = {
      mimeType: 'audio/webm;codecs=opus'
    }
    
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/wav'
      }
    }

    this.mediaRecorder = new MediaRecorder(stream, options)
    this.audioChunks = []

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data)
      }
    }

    this.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType })
      console.log(`🎙️  Audio recorded: ${audioBlob.size} bytes, ${this.mediaRecorder.mimeType}`)
      
      if (this.onAudioReady) {
        this.onAudioReady(audioBlob)
      }
    }

    this.mediaRecorder.onerror = (error) => {
      console.error('MediaRecorder error:', error)
      if (this.onError) {
        this.onError('Audio recording failed: ' + error.error)
      }
    }
  }

  setupSpeechRecognition() {
    if (!this.isSupported.webSpeech) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new SpeechRecognition()

    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = 'de-DE'
    this.recognition.maxAlternatives = 1

    let finalTranscript = ''
    let interimTranscript = ''

    this.recognition.onresult = (event) => {
      interimTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      const fullTranscript = finalTranscript + interimTranscript
      
      if (this.onTranscriptUpdate) {
        this.onTranscriptUpdate(fullTranscript.trim(), event.results[event.results.length - 1].isFinal)
      }
    }

    this.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error)
      // Don't treat speech recognition errors as fatal
      // The MediaRecorder will still provide audio for Voxtral transcription
    }

    this.recognition.onend = () => {
      console.log('📝 Live speech recognition ended')
    }
  }

  startRecording() {
    return new Promise((resolve, reject) => {
      try {
        // Reset audio chunks
        this.audioChunks = []

        // Start MediaRecorder
        if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
          this.mediaRecorder.start(100) // Collect data every 100ms
          console.log('🎙️  MediaRecorder started')
        }

        // Start Speech Recognition (best effort)
        if (this.recognition && this.isSupported.webSpeech) {
          try {
            this.recognition.start()
            console.log('📝 Live speech recognition started')
          } catch (error) {
            console.warn('Speech recognition start failed, continuing with audio only:', error.message)
          }
        }

        resolve({ success: true })
        
      } catch (error) {
        console.error('❌ Failed to start recording:', error)
        reject(error)
      }
    })
  }

  stopRecording() {
    return new Promise((resolve) => {
      // Stop Speech Recognition
      if (this.recognition) {
        try {
          this.recognition.stop()
        } catch (error) {
          console.warn('Error stopping speech recognition:', error)
        }
      }

      // Stop MediaRecorder
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop()
        console.log('🎙️  MediaRecorder stopped')
        
        // Wait for the audio blob to be ready
        setTimeout(() => {
          resolve({ success: true })
        }, 100)
      } else {
        resolve({ success: true })
      }
    })
  }

  async transcribeAudio(audioBlob) {
    try {
      console.log('📤 Sending audio for transcription:', audioBlob.size, 'bytes')
      
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Transcription received:', result.transcript.length, 'characters')
      
      return result
      
    } catch (error) {
      console.error('❌ Transcription failed:', error)
      throw error
    }
  }

  async cleanup() {
    if (this.recognition) {
      this.recognition.abort()
    }

    if (this.mediaRecorder && this.mediaRecorder.stream) {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop())
    }

    console.log('🧹 Speech service cleaned up')
  }

  setCallbacks({ onTranscriptUpdate, onError, onAudioReady }) {
    this.onTranscriptUpdate = onTranscriptUpdate
    this.onError = onError
    this.onAudioReady = onAudioReady
  }
}

export default SpeechService