/**
 * Sarvam AI Speech-to-Text Service
 * Handles transcription of voice calls in Kannada and English
 */

const { sarvamClient } = require('../config/sarvam');

class SarvamSTTService {
  /**
   * Transcribe audio from Twilio call
   * @param {Buffer|String} audioData - Audio data or URL
   * @param {String} languageCode - Language code (kn-IN, en-IN, or auto)
   * @param {String} mode - transcribe, translate, codemix
   * @returns {Object} - Transcription result
   */
  async transcribeAudio(audioData, languageCode = 'auto', mode = 'transcribe') {
    try {
      const response = await sarvamClient.post('/v1/speech-to-text', {
        audio: audioData,
        language_code: languageCode,
        mode: mode,
        model: 'saaras:v3'
      });

      return {
        success: true,
        transcript: response.data.transcript,
        language: response.data.language_code,
        confidence: response.data.confidence || 0.9
      };
    } catch (error) {
      console.error('Sarvam STT Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Detect language from audio
   * @param {Buffer|String} audioData
   * @returns {String} - Detected language code
   */
  async detectLanguage(audioData) {
    try {
      const response = await sarvamClient.post('/v1/speech-to-text', {
        audio: audioData,
        language_code: 'auto',
        mode: 'transcribe',
        model: 'saaras:v3'
      });

      return response.data.language_code || 'en-IN';
    } catch (error) {
      console.error('Language detection error:', error.message);
      return 'en-IN';
    }
  }

  /**
   * Transcribe real-time audio stream
   * Used for WebSocket-based streaming
   */
  async transcribeStream(audioChunk, sessionContext = {}) {
    // For streaming transcription (WebSocket implementation)
    // This would connect to Sarvam's streaming endpoint
    try {
      const response = await sarvamClient.post('/v1/speech-to-text/stream', {
        audio_chunk: audioChunk,
        session_id: sessionContext.sessionId,
        language_code: sessionContext.languageCode || 'auto'
      });

      return {
        success: true,
        partialTranscript: response.data.partial_transcript,
        isFinal: response.data.is_final,
        language: response.data.language_code
      };
    } catch (error) {
      console.error('Streaming STT error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new SarvamSTTService();
