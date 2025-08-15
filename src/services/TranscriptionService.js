/**
 * TranscriptionService - Voxtral API integration for speech-to-text
 * Author: andreas@siglochconsulting.com
 */

const axios = require('axios');
const FormData = require('form-data');

class TranscriptionService {
  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY;
    this.baseUrl = process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1';
    this.model = process.env.MISTRAL_TRANSCRIPTION_MODEL || 'voxtral-mini-latest';
    this.timeout = parseInt(process.env.REQUEST_TIMEOUT) || 30000;

    if (!this.apiKey) {
      throw new Error('MISTRAL_API_KEY environment variable is required');
    }
  }

  async transcribe(audioBuffer, mimeType) {
    const startTime = Date.now();
    
    try {
      console.log(`🎙️  Transcribing with ${this.model}: ${audioBuffer.length} bytes, ${mimeType}`);

      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('model', this.model);
      formData.append('file', audioBuffer, {
        filename: `audio.${this.getFileExtension(mimeType)}`,
        contentType: mimeType
      });
      formData.append('language', 'de'); // German language hint
      formData.append('response_format', 'json');

      const response = await axios.post(
        `${this.baseUrl}/audio/transcriptions`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            ...formData.getHeaders()
          },
          timeout: this.timeout,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      const duration = Date.now() - startTime;
      const transcript = response.data.text || '';
      
      console.log(`✅ Transcription successful: ${duration}ms, ${transcript.length} chars`);

      return {
        transcript: transcript.trim(),
        language: response.data.language || 'de',
        confidence: this.calculateConfidence(transcript),
        processing_time: duration,
        model_used: this.model
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Transcription failed after ${duration}ms:`, error.message);
      
      if (error.response) {
        console.error('API Response:', error.response.data);
        throw new Error(`Mistral API error: ${error.response.data.message || error.response.statusText}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Transcription timeout - audio file may be too large');
      } else {
        throw new Error(`Network error: ${error.message}`);
      }
    }
  }

  getFileExtension(mimeType) {
    const extensions = {
      'audio/webm': 'webm',
      'audio/wav': 'wav',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/m4a': 'm4a',
      'audio/mp4': 'm4a'
    };
    return extensions[mimeType] || 'webm';
  }

  calculateConfidence(transcript) {
    // Simple heuristic for confidence based on transcript characteristics
    if (!transcript || transcript.length < 10) return 0.3;
    
    // Check for typical speech patterns
    const wordCount = transcript.split(/\s+/).length;
    const hasProperPunctuation = /[.!?]/.test(transcript);
    const hasCapitalization = /[A-Z]/.test(transcript);
    const hasCommonGermanWords = /\b(ich|bin|das|ist|und|mit|der|die|für)\b/i.test(transcript);
    
    let confidence = 0.7; // Base confidence
    
    if (wordCount > 20) confidence += 0.1;
    if (hasProperPunctuation) confidence += 0.05;
    if (hasCapitalization) confidence += 0.05;
    if (hasCommonGermanWords) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  async testConnection() {
    try {
      console.log('🔍 Testing Mistral API connection...');
      
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 5000
      });

      const voxtralModels = response.data.data.filter(model => 
        model.id.includes('voxtral')
      );

      console.log(`✅ API connection successful. Available Voxtral models: ${voxtralModels.length}`);
      return {
        connected: true,
        available_models: voxtralModels.map(m => m.id),
        selected_model: this.model
      };
      
    } catch (error) {
      console.error('❌ API connection test failed:', error.message);
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = TranscriptionService;