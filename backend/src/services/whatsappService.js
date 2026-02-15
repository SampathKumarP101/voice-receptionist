/**
 * WhatsApp Service
 * Handles sending messages via WhatsApp Business API
 */

const { whatsappClient, config } = require('../config/whatsapp');

class WhatsAppService {
  /**
   * Send a text message
   */
  async sendTextMessage(phoneNumber, message) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await whatsappClient.post(
        `/${config.phoneNumberId}/messages`,
        payload
      );

      console.log(`✓ Text message sent to ${phoneNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error sending text message:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send message with interactive buttons (max 3 buttons)
   */
  async sendButtonMessage(phoneNumber, bodyText, buttons) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: bodyText
          },
          action: {
            buttons: buttons.slice(0, 3).map((btn, index) => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.title.substring(0, 20) // Max 20 chars
              }
            }))
          }
        }
      };

      const response = await whatsappClient.post(
        `/${config.phoneNumberId}/messages`,
        payload
      );

      console.log(`✓ Button message sent to ${phoneNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error sending button message:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send confirmation template message
   */
  async sendConfirmationTemplate(phoneNumber, params, language = 'en') {
    try {
      const templateName = language === 'kn' 
        ? 'booking_confirmation_kn' 
        : 'booking_confirmation_en';

      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: language
          },
          components: [
            {
              type: 'body',
              parameters: params.map(param => ({
                type: 'text',
                text: String(param)
              }))
            }
          ]
        }
      };

      const response = await whatsappClient.post(
        `/${config.phoneNumberId}/messages`,
        payload
      );

      console.log(`✓ Template message sent to ${phoneNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error sending template:', error.response?.data || error.message);
      // Fallback to text message if template fails
      const message = language === 'kn' 
        ? `ನಮಸ್ತೆ ${params[0]},\n\nನಿಮ್ಮ ಬುಕಿಂಗ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ!\n\nಬುಕಿಂಗ್ ID: ${params[1]}\nಸೇವೆ: ${params[2]}\nದಿನಾಂಕ: ${params[3]}\nಸಮಯ: ${params[4]}`
        : `Hello ${params[0]},\n\nYour booking is confirmed!\n\nBooking ID: ${params[1]}\nService: ${params[2]}\nDate: ${params[3]}\nTime: ${params[4]}`;
      
      return await this.sendTextMessage(phoneNumber, message);
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      };

      await whatsappClient.post(
        `/${config.phoneNumberId}/messages`,
        payload
      );
    } catch (error) {
      console.error('Error marking message as read:', error.message);
    }
  }
}

module.exports = new WhatsAppService();
