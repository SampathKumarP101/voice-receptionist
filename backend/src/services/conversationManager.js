/**
 * Conversation State Manager
 * Manages user conversation state for multi-turn dialogues
 */

// In production, use Redis or database
// For now, using in-memory Map
const userSessions = new Map();

// Session timeout: 30 minutes
const SESSION_TIMEOUT = 30 * 60 * 1000;

class ConversationState {
  constructor(phoneNumber) {
    this.phoneNumber = phoneNumber;
    this.language = null; // 'en' or 'kn'
    this.step = 'language_selection'; // Current step in conversation
    this.appointmentData = {
      patientName: null,
      appointmentDate: null,
      appointmentTime: null,
      notes: null
    };
    this.lastActivity = Date.now();
    this.clinicId = null;
  }

  updateActivity() {
    this.lastActivity = Date.now();
  }

  isExpired() {
    return (Date.now() - this.lastActivity) > SESSION_TIMEOUT;
  }
}

class ConversationManager {
  getSession(phoneNumber) {
    let session = userSessions.get(phoneNumber);
    
    // Create new session if doesn't exist or expired
    if (!session || session.isExpired()) {
      session = new ConversationState(phoneNumber);
      userSessions.set(phoneNumber, session);
    }
    
    session.updateActivity();
    return session;
  }

  updateSession(phoneNumber, updates) {
    const session = this.getSession(phoneNumber);
    Object.assign(session, updates);
    session.updateActivity();
    return session;
  }

  clearSession(phoneNumber) {
    userSessions.delete(phoneNumber);
  }

  // Clean up expired sessions periodically
  cleanupExpiredSessions() {
    for (const [phoneNumber, session] of userSessions.entries()) {
      if (session.isExpired()) {
        userSessions.delete(phoneNumber);
        console.log(`Cleaned up expired session for ${phoneNumber}`);
      }
    }
  }
}

// Cleanup expired sessions every 10 minutes
setInterval(() => {
  const manager = new ConversationManager();
  manager.cleanupExpiredSessions();
}, 10 * 60 * 1000);

module.exports = new ConversationManager();
