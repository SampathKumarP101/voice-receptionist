/**
 * WhatsApp Webhook Controller
 * Handles incoming WhatsApp messages and manages conversation flow
 */

const { config } = require('../config/whatsapp');
const whatsappService = require('../services/whatsappService');
const conversationManager = require('../services/conversationManager');
const intentService = require('../services/intentService');
const bookingService = require('../services/bookingService');
const supabase = require('../config/database');

class WhatsAppController {
  /**
   * Webhook verification (GET request from Meta)
   */
  async verifyWebhook(req, res) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode === 'subscribe' && token === config.verifyToken) {
        console.log('✓ Webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        console.log('✗ Webhook verification failed');
        res.sendStatus(403);
      }
    } catch (error) {
      console.error('Webhook verification error:', error);
      res.sendStatus(500);
    }
  }

  /**
   * Handle incoming messages (POST request from Meta)
   */
  async handleWebhook(req, res) {
    try {
      const body = req.body;

      // Immediately respond with 200 to acknowledge receipt
      if (body.object === 'whatsapp_business_account') {
        res.status(200).send('EVENT_RECEIVED');
      } else {
        res.sendStatus(404);
        return;
      }

      // Process webhook asynchronously
      this.processWebhook(body);
    } catch (error) {
      console.error('Webhook handling error:', error);
    }
  }

  /**
   * Process webhook payload
   */
  async processWebhook(body) {
    try {
      if (!body.entry || body.entry.length === 0) return;

      for (const entry of body.entry) {
        if (!entry.changes || entry.changes.length === 0) continue;

        for (const change of entry.changes) {
          const value = change.value;

          // Handle incoming messages
          if (value.messages && value.messages.length > 0) {
            const message = value.messages[0];
            await this.handleIncomingMessage(message, value.contacts?.[0]);
          }

          // Handle message status updates (delivered, read, etc.)
          if (value.statuses && value.statuses.length > 0) {
            const status = value.statuses[0];
            console.log(`Message ${status.id} status: ${status.status}`);
          }
        }
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }

  /**
   * Handle incoming message from user
   */
  async handleIncomingMessage(message, contact) {
    try {
      const phoneNumber = message.from;
      const userName = contact?.profile?.name || 'User';
      let messageText = '';
      let buttonId = null;

      // Extract message content based on type
      if (message.type === 'text') {
        messageText = message.text.body;
      } else if (message.type === 'button') {
        messageText = message.button.text;
        buttonId = message.button.payload;
      } else if (message.type === 'interactive') {
        if (message.interactive.type === 'button_reply') {
          messageText = message.interactive.button_reply.title;
          buttonId = message.interactive.button_reply.id;
        }
      } else {
        // Unsupported message type
        await whatsappService.sendTextMessage(
          phoneNumber,
          'Sorry, I can only process text messages right now. Please send a text message.'
        );
        return;
      }

      console.log(`📱 Message from ${userName} (${phoneNumber}): ${messageText}`);

      // Mark message as read
      await whatsappService.markAsRead(message.id);

      // Get or create conversation session
      const session = conversationManager.getSession(phoneNumber);

      // Process message based on current step
      await this.processConversationStep(session, messageText, buttonId, userName);

    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  /**
   * Process conversation based on current step
   */
  async processConversationStep(session, messageText, buttonId, userName) {
    const phoneNumber = session.phoneNumber;

    try {
      switch (session.step) {
        case 'language_selection':
          await this.handleLanguageSelection(session, phoneNumber);
          break;

        case 'awaiting_language':
          await this.handleLanguageChoice(session, messageText, buttonId, phoneNumber);
          break;

        case 'main_menu':
          await this.handleMainMenuChoice(session, messageText, buttonId, phoneNumber);
          break;

        case 'awaiting_name':
          await this.handleNameInput(session, messageText, phoneNumber, userName);
          break;

        case 'awaiting_date':
          await this.handleDateInput(session, messageText, phoneNumber);
          break;

        case 'awaiting_time':
          await this.handleTimeInput(session, messageText, phoneNumber);
          break;

        case 'awaiting_confirmation':
          await this.handleConfirmation(session, messageText, buttonId, phoneNumber);
          break;

        default:
          // Reset to language selection
          session.step = 'language_selection';
          await this.handleLanguageSelection(session, phoneNumber);
      }
    } catch (error) {
      console.error('Error in conversation step:', error);
      const errorMessage = session.language === 'kn'
        ? 'ಕ್ಷಮಿಸಿ, ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
        : 'Sorry, something went wrong. Please try again.';
      
      await whatsappService.sendTextMessage(phoneNumber, errorMessage);
    }
  }

  /**
   * Step 1: Language Selection
   */
  async handleLanguageSelection(session, phoneNumber) {
    await whatsappService.sendButtonMessage(
      phoneNumber,
      '👋 Welcome to Kannada Health Clinic!\n\nನಮಸ್ಕಾರ ಕನ್ನಡ ಹೆಲ್ತ್ ಕ್ಲಿನಿಕ್‌ಗೆ!\n\nPlease choose your language / ದಯವಿಟ್ಟು ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:',
      [
        { id: 'lang_en', title: 'English' },
        { id: 'lang_kn', title: 'ಕನ್ನಡ' }
      ]
    );

    session.step = 'awaiting_language';
  }

  /**
   * Step 2: Handle Language Choice
   */
  async handleLanguageChoice(session, messageText, buttonId, phoneNumber) {
    const text = messageText.toLowerCase();
    
    if (buttonId === 'lang_en' || text.includes('english') || text.includes('eng')) {
      session.language = 'en';
    } else if (buttonId === 'lang_kn' || text.includes('kannada') || text.includes('ಕನ್ನಡ')) {
      session.language = 'kn';
    } else {
      // Use AI to detect language
      session.language = text.match(/[\u0C80-\u0CFF]/) ? 'kn' : 'en';
    }

    conversationManager.updateSession(phoneNumber, session);
    await this.showMainMenu(session, phoneNumber);
  }

  /**
   * Show Main Menu
   */
  async showMainMenu(session, phoneNumber) {
    const isKannada = session.language === 'kn';
    
    const message = isKannada
      ? 'ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?'
      : 'How can I help you today?';

    const buttons = isKannada
      ? [
          { id: 'book_apt', title: 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ' },
          { id: 'cancel_apt', title: 'ರದ್ದುಗೊಳಿಸಿ' },
          { id: 'change_lang', title: 'Change Language' }
        ]
      : [
          { id: 'book_apt', title: 'Book Appointment' },
          { id: 'cancel_apt', title: 'Cancel Appointment' },
          { id: 'change_lang', title: 'ಭಾಷೆ ಬದಲಿಸಿ' }
        ];

    await whatsappService.sendButtonMessage(phoneNumber, message, buttons);
    session.step = 'main_menu';
  }

  /**
   * Handle Main Menu Choice
   */
  async handleMainMenuChoice(session, messageText, buttonId, phoneNumber) {
    const text = messageText.toLowerCase();

    if (buttonId === 'book_apt' || text.includes('book') || text.includes('ಬುಕ್')) {
      await this.startBookingFlow(session, phoneNumber);
    } else if (buttonId === 'cancel_apt' || text.includes('cancel') || text.includes('ರದ್ದು')) {
      await this.handleCancellation(session, phoneNumber);
    } else if (buttonId === 'change_lang') {
      session.step = 'language_selection';
      await this.handleLanguageSelection(session, phoneNumber);
    } else {
      // Try to understand intent using AI
      const intent = await intentService.extractIntent(messageText, session.language);
      
      if (intent.action === 'book') {
        await this.startBookingFlow(session, phoneNumber);
      } else {
        const msg = session.language === 'kn'
          ? 'ಕ್ಷಮಿಸಿ, ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಬಟನ್ ಆಯ್ಕೆಮಾಡಿ.'
          : 'Sorry, I didn\'t understand. Please choose a button.';
        await whatsappService.sendTextMessage(phoneNumber, msg);
      }
    }
  }

  /**
   * Start Booking Flow
   */
  async startBookingFlow(session, phoneNumber) {
    const message = session.language === 'kn'
      ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರು ನಮೂದಿಸಿ:'
      : 'Please enter your name:';

    await whatsappService.sendTextMessage(phoneNumber, message);
    session.step = 'awaiting_name';
  }

  /**
   * Handle Name Input
   */
  async handleNameInput(session, messageText, phoneNumber, userName) {
    session.appointmentData.patientName = messageText || userName;

    const message = session.language === 'kn'
      ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ದಿನಾಂಕವನ್ನು ನಮೂದಿಸಿ (DD/MM/YYYY):'
      : 'Please enter your preferred appointment date (DD/MM/YYYY):';

    await whatsappService.sendTextMessage(phoneNumber, message);
    session.step = 'awaiting_date';
  }

  /**
   * Handle Date Input
   */
  async handleDateInput(session, messageText, phoneNumber) {
    // Parse date (simple validation)
    const dateMatch = messageText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    
    if (!dateMatch) {
      const msg = session.language === 'kn'
        ? 'ಅಮಾನ್ಯ ದಿನಾಂಕ. ದಯವಿಟ್ಟು DD/MM/YYYY ಸ್ವರೂಪದಲ್ಲಿ ನಮೂದಿಸಿ:'
        : 'Invalid date. Please enter in DD/MM/YYYY format:';
      await whatsappService.sendTextMessage(phoneNumber, msg);
      return;
    }

    const [, day, month, year] = dateMatch;
    session.appointmentData.appointmentDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    const message = session.language === 'kn'
      ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಆದ್ಯತೆಯ ಸಮಯವನ್ನು ನಮೂದಿಸಿ (HH:MM AM/PM):'
      : 'Please enter your preferred time (HH:MM AM/PM):';

    await whatsappService.sendTextMessage(phoneNumber, message);
    session.step = 'awaiting_time';
  }

  /**
   * Handle Time Input
   */
  async handleTimeInput(session, messageText, phoneNumber) {
    session.appointmentData.appointmentTime = messageText;

    // Show confirmation
    const isKannada = session.language === 'kn';
    const summary = isKannada
      ? `ದೃಢೀಕರಿಸಿ:\n\nಹೆಸರು: ${session.appointmentData.patientName}\nದಿನಾಂಕ: ${session.appointmentData.appointmentDate}\nಸಮಯ: ${session.appointmentData.appointmentTime}\n\nದೃಢೀಕರಿಸುವುದೇ?`
      : `Please confirm:\n\nName: ${session.appointmentData.patientName}\nDate: ${session.appointmentData.appointmentDate}\nTime: ${session.appointmentData.appointmentTime}\n\nConfirm booking?`;

    await whatsappService.sendButtonMessage(
      phoneNumber,
      summary,
      [
        { id: 'confirm_yes', title: isKannada ? 'ದೃಢೀಕರಿಸಿ' : 'Confirm' },
        { id: 'confirm_no', title: isKannada ? 'ರದ್ದುಗೊಳಿಸಿ' : 'Cancel' }
      ]
    );

    session.step = 'awaiting_confirmation';
  }

  /**
   * Handle Confirmation
   */
  async handleConfirmation(session, messageText, buttonId, phoneNumber) {
    const text = messageText.toLowerCase();
    
    if (buttonId === 'confirm_yes' || text.includes('yes') || text.includes('confirm') || text.includes('ದೃಢೀಕರಿಸಿ')) {
      await this.createAppointment(session, phoneNumber);
    } else {
      const msg = session.language === 'kn'
        ? 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ. ಮುಖ್ಯ ಮೆನುಗೆ ಹಿಂತಿರುಗುವುದೇ?'
        : 'Booking cancelled. Return to main menu?';
      
      await whatsappService.sendTextMessage(phoneNumber, msg);
      session.step = 'main_menu';
      await this.showMainMenu(session, phoneNumber);
    }
  }

  /**
   * Create Appointment in Database
   */
  async createAppointment(session, phoneNumber) {
    try {
      // Get clinic info
      const { data: clinic } = await supabase
        .from('clinics')
        .select('*')
        .limit(1)
        .single();

      if (!clinic) {
        throw new Error('Clinic not found');
      }

      // Create appointment
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          clinic_id: clinic.id,
          patient_name: session.appointmentData.patientName,
          patient_phone: phoneNumber,
          appointment_date: session.appointmentData.appointmentDate,
          appointment_time: session.appointmentData.appointmentTime,
          status: 'confirmed',
          language_used: session.language,
          created_via: 'whatsapp'
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✓ Appointment created: ${appointment.id}`);

      // Send confirmation message
      await whatsappService.sendConfirmationTemplate(
        phoneNumber,
        [
          session.appointmentData.patientName,
          appointment.id.substring(0, 8),
          'General Consultation',
          session.appointmentData.appointmentDate,
          session.appointmentData.appointmentTime
        ],
        session.language
      );

      // Clear session
      conversationManager.clearSession(phoneNumber);

      const thankYouMsg = session.language === 'kn'
        ? 'ಧನ್ಯವಾದಗಳು! ನೋಡುವ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮನ್ನು ನೋಡೋಣ! 🏥'
        : 'Thank you! See you at your appointment! 🏥';
      
      await whatsappService.sendTextMessage(phoneNumber, thankYouMsg);

    } catch (error) {
      console.error('Error creating appointment:', error);
      
      const errorMsg = session.language === 'kn'
        ? 'ಕ್ಷಮಿಸಿ, ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ರಚಿಸುವಲ್ಲಿ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
        : 'Sorry, failed to create appointment. Please try again.';
      
      await whatsappService.sendTextMessage(phoneNumber, errorMsg);
    }
  }

  /**
   * Handle Appointment Cancellation
   */
  async handleCancellation(session, phoneNumber) {
    const message = session.language === 'kn'
      ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ID ಅಥವಾ ದಿನಾಂಕವನ್ನು ನಮೂದಿಸಿ:'
      : 'Please enter your appointment ID or date:';

    await whatsappService.sendTextMessage(phoneNumber, message);
    // TODO: Implement cancellation flow
  }
}

module.exports = new WhatsAppController();
