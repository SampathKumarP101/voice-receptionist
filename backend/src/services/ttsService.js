/**
 * Sarvam AI Text-to-Speech Service
 * Generates natural speech in Kannada and English
 */

const { sarvamClient } = require('../config/sarvam');

class SarvamTTSService {
  /**
   * Convert text to speech
   * @param {String} text - Text to convert
   * @param {String} languageCode - Target language (kn-IN, en-IN)
   * @param {String} speaker - Voice speaker ID
   * @returns {Object} - Audio data
   */
  async generateSpeech(text, languageCode = 'kn-IN', speaker = 'default') {
    try {
      const response = await sarvamClient.post('/v1/text-to-speech', {
        text: text,
        target_language_code: languageCode,
        speaker: speaker,
        model: 'bulbul:v3',
        output_audio_codec: 'mulaw',
        sample_rate: 8000
      });

      return {
        success: true,
        audioData: response.data.audios[0],
        format: 'mulaw',
        sampleRate: 8000
      };
    } catch (error) {
      console.error('Sarvam TTS Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate speech for Twilio (mulaw format)
   */
  async generateSpeechForTwilio(text, languageCode = 'kn-IN') {
    return this.generateSpeech(text, languageCode);
  }

  /**
   * Get available voices for a language
   */
  getAvailableVoices(languageCode = 'kn-IN') {
    const voices = {
      'kn-IN': ['meera', 'arvind', 'default'],
      'en-IN': ['anjali', 'ravi', 'default']
    };

    return voices[languageCode] || ['default'];
  }
}

module.exports = new SarvamTTSService();
