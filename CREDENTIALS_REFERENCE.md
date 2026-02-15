# 🔑 Credentials Reference - WhatsApp Receptionist

## 📍 Where Credentials Are Used

### 1. WhatsApp Business API Credentials

**Location in code:** `/backend/src/config/whatsapp.js`

```javascript
// WhatsApp Configuration (from .env)
WHATSAPP_APP_ID=1515312206127688
WHATSAPP_APP_SECRET=403f86a3096e2352d1a9524a1bdd0f71
WHATSAPP_BUSINESS_ACCOUNT_ID=1125294732261949
WHATSAPP_PHONE_NUMBER_ID=779035141956928
WHATSAPP_ACCESS_TOKEN=<YOU NEED TO ADD THIS>
WHATSAPP_VERIFY_TOKEN=kannada_clinic_2026_secure_token
```

**Used for:**
- Sending messages to users
- Receiving webhook notifications
- Template message delivery
- Interactive button messages

**How it's used:**
- `whatsappClient` in `/services/whatsappService.js` uses these to call Meta's Graph API
- `Authorization: Bearer ${WHATSAPP_ACCESS_TOKEN}` in API headers

---

### 2. Supabase (Database) Credentials

**Location in code:** `/backend/src/config/database.js`

```javascript
SUPABASE_URL=https://vznzjjimystviujckrfj.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:Sam@8970670135@db.vznzjjimystviujckrfj.supabase.co:5432/postgres
```

**Used for:**
- Storing appointments (clinics, appointments, call_logs tables)
- User authentication
- Retrieving clinic information

**How it's used:**
- `supabase` client created in `/config/database.js`
- Used throughout controllers for database operations

---

### 3. OpenAI API Credentials

**Location in code:** `/backend/src/config/openai.js`

```javascript
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY_HERE>
OPENAI_MODEL=gpt-4o-mini
```

**Used for:**
- Natural language understanding (intent extraction)
- Processing user messages when they don't click buttons
- Understanding free-form text like dates, times, names

**How it's used:**
- `intentService.js` uses OpenAI to extract booking intent from user messages
- Falls back to simple keyword matching if AI fails

---

### 4. Server Configuration

```javascript
PORT=8002
BASE_URL=https://curly-onions-fold.loca.lt
FRONTEND_URL=http://localhost:3000
```

**Used for:**
- Server listens on port 8002
- BASE_URL used in webhook callbacks
- FRONTEND_URL for CORS

---

## 🗂️ File Structure (Cleaned)

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js ✅ (Supabase credentials)
│   │   ├── openai.js ✅ (OpenAI credentials)
│   │   └── whatsapp.js ✅ (WhatsApp credentials)
│   ├── controllers/
│   │   ├── appointmentController.js ✅
│   │   └── whatsappController.js ✅ (Main chatbot logic)
│   ├── routes/
│   │   ├── appointments.js ✅
│   │   └── whatsapp.js ✅ (Webhook endpoints)
│   ├── services/
│   │   ├── bookingService.js ✅
│   │   ├── conversationManager.js ✅ (Session state)
│   │   ├── intentService.js ✅ (AI understanding)
│   │   ├── notificationService.js ✅
│   │   └── whatsappService.js ✅ (Send messages)
│   ├── jobs/
│   │   └── reminderScheduler.js ✅
│   └── server.js ✅ (Main entry point)
└── .env ✅ (All credentials)
```

---

## 🗑️ What Was Removed

**Deleted Files (voice-related):**
- ❌ `config/exotel.js`
- ❌ `config/twilio.js`
- ❌ `config/sarvam.js`
- ❌ `routes/voice.js`
- ❌ `routes/callLogs.js`
- ❌ `controllers/voiceController.js`
- ❌ `controllers/callLogController.js`
- ❌ `services/sttService.js` (Speech-to-Text)
- ❌ `services/ttsService.js` (Text-to-Speech)

**Removed from .env:**
- ❌ `EXOTEL_*` credentials
- ❌ `SARVAM_API_KEY`
- ❌ `MAX_CALL_DURATION_SECONDS`

**Removed npm packages:**
- ❌ `twilio`
- ❌ `ws` (WebSockets)

---

## ✅ What Remains (Clean & Focused)

**Core Functionality:**
- ✅ WhatsApp chatbot with conversational AI
- ✅ Appointment booking/management
- ✅ Database operations (Supabase)
- ✅ Natural language understanding (OpenAI)
- ✅ Interactive buttons + text messages
- ✅ Multi-language support (Kannada/English)
- ✅ Session state management
- ✅ Appointment reminders

**Dependencies:**
- ✅ `express` - Web framework
- ✅ `@supabase/supabase-js` - Database client
- ✅ `openai` - AI intent extraction
- ✅ `axios` - HTTP requests (WhatsApp API)
- ✅ `dotenv` - Environment variables
- ✅ `cors` - CORS handling
- ✅ `helmet` - Security
- ✅ `express-rate-limit` - Rate limiting
- ✅ `bcryptjs` - Password hashing (dashboard)
- ✅ `jsonwebtoken` - JWT auth (dashboard)
- ✅ `node-cron` - Reminder scheduling
- ✅ `morgan` - Logging
- ✅ `joi` - Validation
- ✅ `uuid` - ID generation

---

## 🔐 Security Notes

**Never expose these in client-side code:**
- ❌ WHATSAPP_APP_SECRET
- ❌ SUPABASE_SERVICE_KEY
- ❌ OPENAI_API_KEY
- ❌ JWT_SECRET

**Safe to expose:**
- ✅ WHATSAPP_APP_ID
- ✅ WHATSAPP_PHONE_NUMBER_ID
- ✅ SUPABASE_ANON_KEY (limited permissions)
- ✅ SUPABASE_URL

---

## 📝 To Complete Setup

**YOU ONLY NEED TO ADD:**
1. WhatsApp Access Token in `.env`:
   ```
   WHATSAPP_ACCESS_TOKEN=EAAV...your_token_here
   ```

**Everything else is already configured!** ✅

---

## 🧪 Test Credentials Are Working

```bash
# Test health check
curl http://localhost:8002/health

# Should show:
# {
#   "services": {
#     "database": "connected",
#     "whatsapp": "configured",  ✅
#     "openai": "configured"      ✅
#   }
# }
```

---

## 📊 Credentials Summary

| Service | Status | What It's For |
|---------|--------|---------------|
| WhatsApp | ⚠️ Missing token | Chatbot messaging |
| Supabase | ✅ Configured | Database storage |
| OpenAI | ✅ Configured | AI understanding |
| JWT | ✅ Configured | Dashboard auth |

**Missing:** Only WhatsApp access token!

---

**Get your WhatsApp token from:**
https://developers.facebook.com/apps/1515312206127688/whatsapp-business/wa-dev-console/
