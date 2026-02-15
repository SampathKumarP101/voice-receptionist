/**
 * Voice Call Controller (Exotel)
 * Handles Exotel voice webhooks and call flow
 */

const { getExoMLResponse } = require('../config/exotel');
const supabase = require('../config/database');
const sttService = require('../services/sttService');
const ttsService = require('../services/ttsService');
const intentService = require('../services/intentService');
const bookingService = require('../services/bookingService');
const notificationService = require('../services/notificationService');

// Store active call sessions (in production, use Redis)
const callSessions = new Map();

class VoiceCallController {
  /**
   * Handle incoming call from Exotel
   * Exotel sends: AccountSid, CallSid, From, To, PhoneNumberSid, Direction, StartTime
   */
  async handleIncomingCall(req, res) {
    try {
      const { CallSid, From, To, AccountSid, StartTime } = req.body;
      
      console.log(`📞 Incoming call: ${CallSid} from ${From} to ${To}`);

      // Find clinic by phone number
      const { data: clinic } = await supabase
        .from('clinics')
        .select('*')
        .eq('phone', To)
        .single();

      if (!clinic) {
        console.error('Clinic not found for number:', To);
        const exoml = getExoMLResponse();
        exoml.say('Sorry, clinic not found. Goodbye.');
        exoml.hangup();
        return res.type('text/xml').send(exoml.toString());
      }

      // Initialize call session
      callSessions.set(CallSid, {
        callSid: CallSid,
        clinicId: clinic.id,
        fromNumber: From,
        language: clinic.language_preference || 'kn-IN',
        step: 'greeting',
        transcript: [],
        startTime: new Date(StartTime || Date.now())
      });

      // Create call log
      await supabase
        .from('call_logs')
        .insert({
          clinic_id: clinic.id,
          call_sid: CallSid,
          from_number: From,
          to_number: To,
          call_status: 'initiated',
          detected_language: clinic.language_preference
        });

      // Generate greeting based on language
      const greeting = clinic.language_preference === 'kn-IN'
        ? 'ನಮಸ್ಕಾರ. ಕ್ಲಿನಿಕ್‌ಗೆ ಸ್ವಾಗತ. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು? ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಲು ಹೇಳಿ.'
        : 'Welcome to our clinic. How can I help you today? Please tell us what you need.';

      const exoml = getExoMLResponse();
      
      // Play greeting and gather speech
      exoml.say(greeting, { 
        voice: 'female',
        language: clinic.language_preference === 'kn-IN' ? 'hi' : 'en' // Exotel uses 'hi' for Indian languages
      });
      
      // Gather digit input (for now, since Exotel speech recognition requires special setup)
      exoml.gather({
        numDigits: 1,
        action: `${process.env.BASE_URL}/api/voice/process-input/${CallSid}`,
        method: 'POST',
        timeout: 5,
        say: clinic.language_preference === 'kn-IN' 
          ? 'ಬುಕ್ ಮಾಡಲು 1 ಒತ್ತಿ, ರದ್ದು ಮಾಡಲು 2 ಒತ್ತಿ.'
          : 'Press 1 to book appointment, Press 2 to cancel.'
      });

      // If no input, redirect
      exoml.redirect(`${process.env.BASE_URL}/api/voice/no-input/${CallSid}`);

      res.type('text/xml').send(exoml.toString());
    } catch (error) {
      console.error('Incoming call error:', error.message);
      
      const exoml = getExoMLResponse();
      exoml.say('Sorry, something went wrong. Please try again later.');
      exoml.hangup();
      
      res.type('text/xml').send(exoml.toString());
    }
  }

  /**
   * Process digit input from Exotel Gather
   * Exotel sends: Digits, CallSid
   */
  async processInput(req, res) {
    try {
      const { CallSid } = req.params;
      const { Digits } = req.body;

      console.log(`🔢 Input for ${CallSid}: ${Digits}`);

      const session = callSessions.get(CallSid);
      if (!session) {
        const exoml = getExoMLResponse();
        exoml.say('Session expired. Please call again.');
        exoml.hangup();
        return res.type('text/xml').send(exoml.toString());
      }

      const exoml = getExoMLResponse();

      // Handle based on digit
      if (Digits === '1') {
        // Book appointment
        session.step = 'booking_name';
        
        const msg = session.language === 'kn-IN'
          ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರು ಹೇಳಿ.'
          : 'Please tell us your name.';
        
        exoml.say(msg, { language: session.language === 'kn-IN' ? 'hi' : 'en' });
        exoml.record({
          maxLength: 10,
          finishOnKey: '#',
          action: `${process.env.BASE_URL}/api/voice/record-name/${CallSid}`
        });
        
      } else if (Digits === '2') {
        // Cancel appointment
        session.step = 'cancel';
        
        const msg = session.language === 'kn-IN'
          ? 'ರದ್ದು ಮಾಡಲು, ದಯವಿಟ್ಟು ನಿಮ್ಮ ಫೋನ್ ನಂಬರ್ ಹೇಳಿ.'
          : 'To cancel, please provide your phone number.';
        
        exoml.say(msg);
        exoml.gather({
          numDigits: 10,
          action: `${process.env.BASE_URL}/api/voice/cancel-appointment/${CallSid}`,
          method: 'POST'
        });
        
      } else {
        // Invalid input
        const msg = session.language === 'kn-IN'
          ? 'ತಪ್ಪು ಆಯ್ಕೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
          : 'Invalid option. Please try again.';
        
        exoml.say(msg);
        exoml.redirect(`${process.env.BASE_URL}/api/voice/incoming-call`);
      }

      res.type('text/xml').send(exoml.toString());
    } catch (error) {
      console.error('Process input error:', error.message);
      
      const exoml = getExoMLResponse();
      exoml.say('Sorry, something went wrong.');
      exoml.hangup();
      
      res.type('text/xml').send(exoml.toString());
    }
  }

  /**
   * Handle name recording
   */
  async recordName(req, res) {
    try {
      const { CallSid } = req.params;
      const { RecordingUrl } = req.body;

      console.log(`🎤 Recording for ${CallSid}: ${RecordingUrl}`);

      const session = callSessions.get(CallSid);
      if (!session) {
        const exoml = getExoMLResponse();
        exoml.say('Session expired.');
        exoml.hangup();
        return res.type('text/xml').send(exoml.toString());
      }

      // In production, transcribe the recording using Sarvam STT
      // For now, ask for date via DTMF
      session.recordingUrl = RecordingUrl;
      session.step = 'booking_date';

      const exoml = getExoMLResponse();
      
      const msg = session.language === 'kn-IN'
        ? 'ಧನ್ಯವಾದಗಳು. ದಯವಿಟ್ಟು ದಿನಾಂಕ ಹೇಳಿ. ಉದಾಹರಣೆ: ಫೆಬ್ರವರಿ 15.'
        : 'Thank you. Please tell us the date. For example: February 15th.';
      
      exoml.say(msg);
      exoml.record({
        maxLength: 10,
        finishOnKey: '#',
        action: `${process.env.BASE_URL}/api/voice/record-date/${CallSid}`
      });

      res.type('text/xml').send(exoml.toString());
    } catch (error) {
      console.error('Record name error:', error.message);
      
      const exoml = getExoMLResponse();
      exoml.say('Sorry, something went wrong.');
      exoml.hangup();
      
      res.type('text/xml').send(exoml.toString());
    }
  }

  /**
   * Handle date recording and complete booking
   */
  async recordDate(req, res) {
    try {
      const { CallSid } = req.params;
      const { RecordingUrl } = req.body;

      const session = callSessions.get(CallSid);
      if (!session) {
        const exoml = getExoMLResponse();
        exoml.say('Session expired.');
        exoml.hangup();
        return res.type('text/xml').send(exoml.toString());
      }

      // In production: Use Sarvam STT to transcribe name and date
      // Then use OpenAI to extract structured data
      // Then check availability and book

      // For MVP demo: Use simple logic
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      const timeStr = '10:00';

      // Try to book
      const booking = await bookingService.createAppointment({
        clinicId: session.clinicId,
        patientName: 'Patient', // In production, extract from recording
        patientPhone: session.fromNumber,
        date: dateStr,
        time: timeStr,
        languageUsed: session.language,
        createdVia: 'voice',
        notes: `Call SID: ${CallSid}`
      });

      const exoml = getExoMLResponse();

      if (booking.success) {
        // Send SMS
        await notificationService.sendAppointmentConfirmation(
          booking.appointment,
          session.language
        );

        const msg = session.language === 'kn-IN'
          ? `ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ${dateStr} ರ ${timeStr} ಕ್ಕೆ ನಿಶ್ಚಿತವಾಗಿದೆ. SMS ಕಳುಹಿಸಲಾಗಿದೆ. ಧನ್ಯವಾದಗಳು!`
          : `Your appointment is confirmed for ${dateStr} at ${timeStr}. SMS sent. Thank you!`;
        
        exoml.say(msg);
      } else {
        const msg = session.language === 'kn-IN'
          ? 'ಕ್ಷಮಿಸಿ, ಆ ಸಮಯ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಕರೆ ಮಾಡಿ.'
          : 'Sorry, that time is not available. Please call again.';
        
        exoml.say(msg);
      }

      exoml.hangup();

      // Update call log
      await supabase
        .from('call_logs')
        .update({
          full_transcript: JSON.stringify(session.transcript),
          call_status: 'completed',
          appointment_id: booking.appointment?.id
        })
        .eq('call_sid', CallSid);

      res.type('text/xml').send(exoml.toString());
    } catch (error) {
      console.error('Record date error:', error.message);
      
      const exoml = getExoMLResponse();
      exoml.say('Sorry, something went wrong.');
      exoml.hangup();
      
      res.type('text/xml').send(exoml.toString());
    }
  }

  /**
   * Handle no input timeout
   */
  async handleNoInput(req, res) {
    const { CallSid } = req.params;
    
    const exoml = getExoMLResponse();
    exoml.say('We did not receive any input. Goodbye.');
    exoml.hangup();
    
    res.type('text/xml').send(exoml.toString());
  }

  /**
   * Handle call end (status callback)
   */
  async handleCallEnd(req, res) {
    try {
      const { CallSid, Status, ConversationDuration } = req.body;
      
      console.log(`📴 Call ended: ${CallSid}, Status: ${Status}, Duration: ${ConversationDuration}s`);

      const session = callSessions.get(CallSid);
      if (session) {
        // Update call log
        await supabase
          .from('call_logs')
          .update({
            call_duration_seconds: parseInt(ConversationDuration) || 0,
            call_status: Status,
            ended_at: new Date().toISOString()
          })
          .eq('call_sid', CallSid);

        // Clean up session
        callSessions.delete(CallSid);
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('Call end error:', error.message);
      res.sendStatus(500);
    }
  }
}

module.exports = new VoiceCallController();
