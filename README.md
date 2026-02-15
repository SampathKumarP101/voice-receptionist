# AI Voice Receptionist for Karnataka Clinics

Production-ready AI voice receptionist that handles appointment booking via phone calls in Kannada and English.

## Architecture

- **Backend**: Node.js + Express
- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Voice**: Twilio + Sarvam AI (STT/TTS)
- **AI**: OpenAI GPT-5.2 (intent extraction)
- **Notifications**: Twilio SMS/WhatsApp

## Features

✅ Incoming calls with language detection (Kannada/English)
✅ Natural conversation flow with intent extraction
✅ Real-time availability checking
✅ Appointment booking, cancellation, rescheduling
✅ SMS confirmations and reminders
✅ Multi-tenant support
✅ Admin dashboard
✅ Call logging and transcripts

## Quick Start

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Add your API keys to .env
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Add your Supabase URL to .env.local
npm run dev
```

## Environment Variables

See `.env.example` files in backend and frontend directories.

## Deployment

See `DEPLOYMENT.md` for production deployment instructions.
