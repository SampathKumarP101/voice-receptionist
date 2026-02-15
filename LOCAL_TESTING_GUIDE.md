# Local Testing Guide - AI Voice Receptionist

Complete step-by-step guide to test your AI Voice Receptionist locally.

---

## Prerequisites Checklist

Before starting, ensure you have:
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Supabase account and project created
- [ ] Code cloned from GitHub

---

## Step 1: Clone Repository

```bash
# Clone your repository
git clone https://github.com/SampathKumarP101/voice-receptionist.git
cd voice-receptionist
```

---

## Step 2: Setup Database (CRITICAL - Do This First!)

### 2.1 Go to Supabase Dashboard
```
URL: https://supabase.com/dashboard
→ Login
→ Select your project
```

### 2.2 Execute Database Schema
```
1. Click: "SQL Editor" (left sidebar)
2. Click: "New Query"
3. Open file: voice-receptionist/database-schema.sql
4. Copy ALL content
5. Paste into Supabase SQL Editor
6. Click: "Run" button
```

### 2.3 Verify Tables Created
```
Go to: "Table Editor" (left sidebar)

You should see these tables:
✓ clinics
✓ users
✓ appointments
✓ availability_slots
✓ call_logs
✓ reminders
✓ faqs

Sample Data:
✓ 1 clinic created: "Kannada Health Clinic"
✓ Availability slots (Mon-Sat)
```

---

## Step 3: Configure Backend

### 3.1 Install Backend Dependencies
```bash
cd backend
npm install
```

### 3.2 Check Environment Variables
```bash
# Verify .env file exists
cat .env

# Should show:
SUPABASE_URL=https://smnzkoqxkevvsggzuwkz.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SARVAM_API_KEY=sk_o23yt04a...
OPENAI_API_KEY=sk-proj-dfcmr...
```

✅ All credentials are already configured!

### 3.3 Start Backend Server
```bash
# Start server
npm run dev

# Expected output:
🏥 AI Voice Receptionist Backend Server
🚀 Server running on port 8002
✓ Supabase: Connected
⚠ Exotel: Not configured (normal - we'll add this later)
✓ Sarvam AI: Configured
✓ OpenAI: Configured
```

### 3.4 Test Backend Health
```bash
# Open new terminal
curl http://localhost:8002/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "...",
  "services": {
    "database": "connected",
    "exotel": "not configured",
    "sarvam": "configured",
    "openai": "configured"
  }
}
```

---

## Step 4: Configure Frontend

### 4.1 Install Frontend Dependencies
```bash
# Open new terminal
cd voice-receptionist/frontend
npm install
```

### 4.2 Check Environment Variables
```bash
# Verify .env.local file
cat .env.local

# Should show:
NEXT_PUBLIC_SUPABASE_URL=https://smnzkoqxkevvsggzuwkz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8002
```

✅ All configured!

### 4.3 Start Frontend Dashboard
```bash
npm run dev

# Expected output:
ready - started server on 0.0.0.0:3000
```

---

## Step 5: Test Dashboard UI

### 5.1 Open Dashboard
```
Browser: http://localhost:3000

→ Auto-redirects to: http://localhost:3000/dashboard
```

### 5.2 Dashboard Home Page Test
```
What you should see:
✓ Navigation bar with "Dashboard", "Appointments", "Settings"
✓ 4 stat cards (Total Appointments, Today's Appointments, Total Calls, Today's Calls)
✓ All showing "0" initially (no data yet)
✓ "Recent Calls" section (empty)
✓ "Upcoming Appointments" section (empty)
```

### 5.3 Create Your First Appointment
```
1. Click: "Appointments" in navigation
2. Click: "+ New Appointment" button
3. Fill form:
   - Patient Name: John Doe
   - Phone Number: +919876543210
   - Date: Tomorrow's date
   - Time: 10:00
   - Notes: Test appointment
4. Click: "Create Appointment"
5. Should see success message
6. Appointment appears in list
```

### 5.4 Test Appointment Actions
```
✓ View appointment details (patient name, phone, date, time)
✓ See status badge (green "confirmed")
✓ Click "Cancel" button
✓ Confirm cancellation
✓ Status changes to "cancelled" (red badge)
```

### 5.5 Test Settings Page
```
1. Click: "Settings" in navigation
2. Update clinic info:
   - Change clinic name
   - Update phone/email
   - Change language preference
3. Click: "Save Changes"
4. Verify success message
5. Check availability schedule:
   - See Mon-Sat working hours
   - Toggle switches to enable/disable days
```

---

## Step 6: Test Backend API Directly

### 6.1 Get Clinic ID
```bash
# In Supabase Dashboard:
→ Table Editor
→ clinics table
→ Copy the "id" (UUID)

Example: 123e4567-e89b-12d3-a456-426614174000
```

### 6.2 Test Appointments API
```bash
# Replace CLINIC_ID with your actual clinic ID

# List all appointments
curl http://localhost:8002/api/appointments/CLINIC_ID

# Create appointment
curl -X POST http://localhost:8002/api/appointments/CLINIC_ID \
  -H "Content-Type: application/json" \
  -d '{
    "patientName": "Jane Smith",
    "patientPhone": "+919876543211",
    "date": "2026-02-20",
    "time": "14:00",
    "notes": "Via API test"
  }'

# Get available slots
curl "http://localhost:8002/api/appointments/CLINIC_ID/slots?date=2026-02-20"
```

### 6.3 Test Call Logs API
```bash
# List call logs (will be empty initially)
curl http://localhost:8002/api/call-logs/CLINIC_ID
```

---

## Step 7: Verify Database Changes

### 7.1 Check Appointments Table
```
Go to Supabase Dashboard:
→ Table Editor
→ appointments table
→ You should see appointments you created
→ Verify: patient_name, phone, date, time, status
```

### 7.2 Check Call Logs Table
```
→ call_logs table
→ Empty for now (will populate when you make voice calls)
```

---

## Step 8: Setup Exotel (Optional - For Voice Testing)

### 8.1 If You Want to Test Voice Calls:
```
Follow: EXOTEL_SETUP.md (in repository)

Steps:
1. Sign up for Exotel (₹200 free credit)
2. Get credentials (Account SID, API Key, Token)
3. Add to backend/.env:
   EXOTEL_ACCOUNT_SID=your_sid
   EXOTEL_API_KEY=your_key
   EXOTEL_API_TOKEN=your_token
   EXOTEL_PHONE_NUMBER=your_exophone
4. Restart backend: npm run dev
5. Setup ngrok for webhooks
6. Configure Exotel applet
7. Make a test call!
```

---

## Troubleshooting

### Backend Not Starting
```bash
# Check if port 8002 is already in use
lsof -i :8002

# Kill existing process
kill -9 <PID>

# Restart
cd backend && npm run dev
```

### Frontend Not Starting
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill existing process
kill -9 <PID>

# Clear cache and restart
rm -rf .next
npm run dev
```

### Database Connection Error
```bash
# Verify Supabase URL and keys in .env files
cat backend/.env | grep SUPABASE
cat frontend/.env.local | grep SUPABASE

# Test connection
curl "https://smnzkoqxkevvsggzuwkz.supabase.co/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY"
```

### Dashboard Shows Empty
```
1. Verify database schema was executed
2. Check browser console for errors (F12)
3. Check backend is running (curl http://localhost:8002/health)
4. Verify environment variables are correct
```

### API Calls Failing
```
1. Check backend logs in terminal
2. Verify CORS is not blocking (should be configured)
3. Test API directly with curl
4. Check Network tab in browser DevTools
```

---

## Testing Checklist

### Backend Tests:
- [ ] Backend starts successfully on port 8002
- [ ] Health check returns "healthy" status
- [ ] Can create appointment via API
- [ ] Can list appointments via API
- [ ] Can cancel appointment via API
- [ ] Can get available slots via API

### Frontend Tests:
- [ ] Dashboard loads at http://localhost:3000
- [ ] Stats cards display (even if showing 0)
- [ ] Navigation works (Dashboard, Appointments, Settings)
- [ ] Can create new appointment via UI
- [ ] Appointment appears in list immediately
- [ ] Can cancel appointment via UI
- [ ] Can update clinic settings
- [ ] Can toggle availability schedule

### Database Tests:
- [ ] All tables exist in Supabase
- [ ] Sample clinic data is present
- [ ] Appointments are saved correctly
- [ ] Status updates work (confirmed → cancelled)

### Integration Tests:
- [ ] Frontend → Backend API communication works
- [ ] Backend → Supabase database queries work
- [ ] Real-time updates in dashboard
- [ ] No CORS errors in browser console

---

## Next Steps After Local Testing

1. **Deploy Backend**: Railway.app or Render.com
2. **Deploy Frontend**: Vercel
3. **Setup Exotel**: Configure voice webhooks
4. **Test End-to-End**: Make real voice calls
5. **Monitor**: Check logs and database

---

## Quick Reference

### URLs:
- Frontend: http://localhost:3000
- Backend: http://localhost:8002
- Backend Health: http://localhost:8002/health
- Supabase Dashboard: https://supabase.com/dashboard

### Important Files:
- Backend config: `/backend/.env`
- Frontend config: `/frontend/.env.local`
- Database schema: `/database-schema.sql`
- Exotel setup: `/EXOTEL_SETUP.md`

### Commands:
```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Test backend
curl http://localhost:8002/health

# View backend logs
tail -f /tmp/backend.log

# View frontend logs
tail -f /tmp/frontend.log
```

---

## Support

If you encounter issues:
1. Check logs in terminal
2. Check browser console (F12)
3. Verify all environment variables
4. Ensure database schema is executed
5. Restart both servers

**Happy Testing! 🚀**
