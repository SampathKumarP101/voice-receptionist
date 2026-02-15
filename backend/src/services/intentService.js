/**
 * OpenAI Intent Extraction Service
 * Extracts booking intent, name, date, time from conversation transcripts
 */

const { openai, model } = require('../config/openai');

class IntentService {
  /**
   * Extract booking intent and details from conversation
   * @param {String} transcript - Conversation transcript
   * @param {String} language - Detected language (kn-IN or en-IN)
   * @returns {Object} - Extracted intent and details
   */
  async extractIntent(transcript, language = 'en-IN') {
    try {
      const systemPrompt = `You are an AI assistant analyzing patient phone call transcripts for a Karnataka clinic.
Your task is to extract:
1. INTENT: book, cancel, reschedule, faq, escalate
2. PATIENT_NAME: Full name if mentioned
3. DATE: Appointment date (format: YYYY-MM-DD)
4. TIME: Appointment time (format: HH:MM in 24-hour)
5. PHONE: Phone number if mentioned
6. REASON: Reason for cancellation/query

The conversation may be in Kannada, English, or mixed. Extract information accurately.

Respond ONLY with valid JSON in this format:
{
  "intent": "book|cancel|reschedule|faq|escalate",
  "confidence": 0.0-1.0,
  "patient_name": "name or null",
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM or null",
  "phone": "phone or null",
  "reason": "reason or null",
  "query": "user query if FAQ"
}`;

      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Transcript: ${transcript}` }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const extracted = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        ...extracted
      };
    } catch (error) {
      console.error('Intent extraction error:', error.message);
      return {
        success: false,
        intent: 'escalate',
        confidence: 0.1,
        error: error.message
      };
    }
  }

  /**
   * Generate response based on intent and context
   */
  async generateResponse(intent, context, language = 'en-IN') {
    try {
      const languageInstruction = language === 'kn-IN' 
        ? 'Respond in Kannada language.'
        : 'Respond in English with Indian accent.';

      const systemPrompt = `You are a helpful clinic receptionist AI. ${languageInstruction}
Be polite, professional, and concise. Keep responses under 30 words.`;

      const contextMessage = this._buildContextMessage(intent, context);

      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contextMessage }
        ],
        temperature: 0.7,
        max_tokens: 100
      });

      return {
        success: true,
        response: response.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('Response generation error:', error.message);
      return {
        success: false,
        response: language === 'kn-IN' 
          ? 'ಕ್ಷಮಿಸಿ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯ ಕಾಯ್ದಿರಿ.' 
          : 'Sorry, please wait a moment.'
      };
    }
  }

  _buildContextMessage(intent, context) {
    switch (intent) {
      case 'book':
        if (context.available) {
          return `Confirm appointment booking for ${context.patient_name} on ${context.date} at ${context.time}`;
        } else {
          return `Slot not available. Suggest alternative times: ${context.alternatives?.join(', ')}`;
        }
      
      case 'cancel':
        return `Confirm cancellation of appointment for ${context.patient_name}`;
      
      case 'reschedule':
        return `Reschedule appointment from ${context.old_date} to ${context.new_date}`;
      
      case 'faq':
        return `Answer this question: ${context.query}`;
      
      case 'escalate':
        return 'Transfer to human receptionist';
      
      default:
        return 'How can I help you today?';
    }
  }

  /**
   * Answer FAQ using OpenAI
   */
  async answerFAQ(query, clinicFAQs = [], language = 'en-IN') {
    try {
      const languageInstruction = language === 'kn-IN'
        ? 'Answer in Kannada.'
        : 'Answer in English.';

      const faqContext = clinicFAQs.length > 0
        ? `\n\nClinic FAQs:\n${clinicFAQs.map(f => `Q: ${f.question_text}\nA: ${f.answer_text}`).join('\n\n')}`
        : '';

      const systemPrompt = `You are a clinic receptionist. ${languageInstruction}
Answer patient questions professionally. If you don't know, say so.${faqContext}`;

      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.5,
        max_tokens: 150
      });

      return {
        success: true,
        answer: response.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('FAQ answering error:', error.message);
      return {
        success: false,
        answer: language === 'kn-IN'
          ? 'ಕ್ಷಮಿಸಿ, ನನಗೆ ಗೊತ್ತಿಲ್ಲ.'
          : 'Sorry, I don\'t have that information.'
      };
    }
  }
}

module.exports = new IntentService();
