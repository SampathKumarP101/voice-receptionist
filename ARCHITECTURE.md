# AI Voice Receptionist - System Architecture

## Overview
Production-ready AI voice receptionist for Karnataka clinics that automates appointment booking via phone calls in Kannada and English.

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Voice**: Twilio Voice API
- **STT**: Sarvam AI (Kannada/English)
- **TTS**: Sarvam AI
- **AI**: OpenAI GPT-5.2
- **Scheduling**: node-cron

### Frontend
- **Framework**: Next.js 14 (App Router)
- **State Management**: React Hooks
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **API Client**: Axios

## Architecture Diagram

```
┌─────────────┐
│   Caller    │
└──────┬──────┘
       │ Phone Call
       ▼
┌─────────────────────┐
│   Twilio Voice API  │
│  (Incoming Calls)   │
└──────┬──────────────┘
       │ Webhook
       ▼
┌────────────────────────────────────────┐
│         Node.js Backend (Express)      │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Voice Controller                 │ │
│  │  - Incoming call handler          │ │
│  │  - Speech input processor         │ │
│  └────┬─────────────────────────┬───┘ │
│       │                         │      │
│  ┌────▼────────┐        ┌──────▼───┐  │
│  │ Sarvam STT  │        │ Sarvam   │  │
│  │ Service     │        │ TTS      │  │
│  └────┬────────┘        └──────┬───┘  │
│       │                        │      │
│  ┌────▼────────────────────────▼───┐  │
│  │    OpenAI Intent Service        │  │
│  │  - Extract: book/cancel/FAQ     │  │
│  │  - Parse: name, date, time      │  │
│  └────┬────────────────────────────┘  │
│       │                                │
│  ┌────▼──────────┐                    │
│  │  Booking      │                    │
│  │  Service      │                    │
│  │  - Availability│                   │
│  │  - Conflicts   │                   │
│  └────┬──────────┘                    │
│       │                                │
└───────┼────────────────────────────────┘
        │
        ▼
┌──────────────────┐      ┌─────────────────┐
│  Supabase DB     │◄────►│  Notification   │
│  (PostgreSQL)    │      │  Service        │
│  - Clinics       │      │  - SMS          │
│  - Appointments  │      │  - WhatsApp     │
│  - Call Logs     │      └─────────────────┘
│  - Reminders     │
└──────────────────┘
        ▲
        │
┌───────┴──────────┐
│   Next.js Admin  │
│   Dashboard      │
│  - Appointments  │
│  - Call Logs     │
│  - Analytics     │
└──────────────────┘
```

## Data Flow

### 1. Incoming Call Flow
```
1. Caller dials Twilio number
2. Twilio sends webhook to /api/voice/incoming-call
3. Backend creates call session
4. TwiML response plays greeting in Kannada/English
5. Twilio gathers speech input
6. Webhook to /api/voice/process-input/{CallSid}
7. Sarvam STT transcribes speech
8. OpenAI extracts intent
9. Backend processes intent (book/cancel/FAQ)
10. Sarvam TTS generates response
11. TwiML plays response to caller
12. Loop continues until call ends
```

### 2. Booking Flow
```
1. Intent = "book"
2. Extract: patient_name, date, time
3. Check clinic availability_slots
4. Check conflicting appointments
5. If available:
   - Create appointment record
   - Schedule reminder (24h before)
   - Send SMS confirmation
   - Play success message
6. If not available:
   - Get alternative slots
   - Suggest alternatives
   - Loop back for new selection
```

### 3. Reminder Flow
```
1. Cron job runs every minute
2. Query reminders with status=pending, scheduled_for<=now
3. For each reminder:
   - Get appointment details
   - Send SMS via Twilio
   - Update reminder status=sent
4. Log results
```

## Database Schema

### Tables

**clinics**
- Multi-tenant root table
- Stores clinic info, settings, language preference

**users**
- Clinic staff access
- Future: authentication for dashboard

**appointments**
- All bookings
- Status: confirmed, cancelled, completed
- Tracks creation source (voice, dashboard, manual)

**availability_slots**
- Clinic working hours
- day_of_week (0-6), start_time, end_time
- Slot duration (default 30 min)

**call_logs**
- Every call recorded
- Full transcript, detected intent
- Duration, status, recording URL

**reminders**
- Scheduled SMS reminders
- Status: pending, sent, failed
- Links to appointment

**faqs**
- Clinic-specific Q&A
- Used by OpenAI to answer questions
- Multi-language support

## API Endpoints

### Voice Webhooks (Twilio → Backend)
```
POST /api/voice/incoming-call
POST /api/voice/process-input/:CallSid
POST /api/voice/call-end
```

### Appointments (Dashboard → Backend)
```
GET  /api/appointments/:clinicId
POST /api/appointments/:clinicId
DELETE /api/appointments/:id
GET  /api/appointments/:clinicId/slots?date=YYYY-MM-DD
```

### Call Logs
```
GET /api/call-logs/:clinicId
GET /api/call-logs/details/:callSid
```

## Scaling Strategy

### Phase 1: MVP (Single Clinic)
- Vertical scaling (increase server RAM/CPU)
- Single Twilio number
- Manual Supabase connection pool

### Phase 2: Multi-Clinic (10-50 clinics)
- Redis for call session storage
- Connection pooling for database
- Queue for reminder processing
- Load balancer (Nginx/Cloudflare)

### Phase 3: Enterprise (100+ clinics)
- Microservices (voice, booking, notifications)
- Dedicated Twilio subaccount per region
- Database sharding by clinic_id
- Kubernetes for auto-scaling
- CDN for static assets

### Cost Analysis
**Per Call (Avg 3 min)**
- Twilio voice: ₹2.40 ($0.03)
- Sarvam STT: ₹1.50 (3 min × ₹0.50/min)
- Sarvam TTS: ₹0.75 (1.5 min playback)
- OpenAI GPT: ₹0.20 (1 request)
- Twilio SMS: ₹0.60 ($0.0075)
- **Total: ~₹5.45 per call**

**Monthly (100 calls)**
- Voice: ₹545
- Supabase: Free tier (< 500MB)
- Hosting: ₹500 (Railway/Render)
- **Total: ~₹1,045/month**

## Security

### Authentication
- Dashboard: JWT tokens
- Twilio webhooks: Signature validation
- Supabase: Row Level Security (RLS)

### Data Privacy
- No PII in logs
- Call recordings optional
- GDPR compliance ready
- Data retention policies

### Rate Limiting
- 100 req/15min per IP
- Webhook timeout: 15s max
- Database connection limits

## Monitoring

### Metrics to Track
- Call success rate
- Average call duration
- Intent extraction accuracy
- Booking conversion rate
- Reminder delivery rate
- API response times

### Alerts
- Webhook failures
- Database connection errors
- High error rates
- Low balance warnings

### Logs
- Structured JSON logging
- Winston/Pino for production
- CloudWatch/Datadog integration

## Deployment

### Recommended Stack
- Backend: Railway.app or Render.com
- Frontend: Vercel
- Database: Supabase (managed)
- Voice: Twilio
- Monitoring: Sentry + Uptime Robot

### Environment Requirements
- Node.js 18+
- PostgreSQL 14+
- HTTPS (required by Twilio)
- Public webhook URL

## Future Enhancements

1. **Multi-language Support**: Add Tamil, Telugu, Malayalam
2. **WhatsApp Bot**: Booking via WhatsApp messages
3. **Voice Cloning**: Custom clinic voice
4. **AI Insights**: Analyze call patterns, peak times
5. **EHR Integration**: Sync with clinic management systems
6. **Payment Integration**: Collect advance payment
7. **Patient Portal**: Self-service booking website
8. **Mobile App**: Clinic staff app for notifications

## Known Limitations

1. Twilio doesn't provide Indian phone numbers
2. Sarvam STT accuracy varies with background noise
3. OpenAI intent extraction may fail on very mixed code-switched speech
4. Reminder scheduler runs every minute (not real-time)
5. Session storage in memory (use Redis for production)

## Troubleshooting

### Common Issues
1. **No webhook received**: Check firewall, HTTPS, Twilio config
2. **Transcription fails**: Verify Sarvam API key, audio format
3. **Booking conflicts**: Check timezone, availability slots
4. **Reminders not sent**: Verify cron job running, Twilio SMS config
