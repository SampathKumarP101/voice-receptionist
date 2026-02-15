# 📞 Voice Call Testing Guide

## ✅ Current Status
- ✅ Backend Server: **RUNNING** on port 8002
- ✅ Database: **CONNECTED** (Supabase)
- ✅ Public Tunnel: **https://curly-onions-fold.loca.lt**
- ✅ Exotel: **CONFIGURED** (Account SID: 8495959789)
- ✅ AI Services: Sarvam AI & OpenAI **READY**

---

## 🔍 Missing Information

### ⚠️ EXOTEL_PHONE_NUMBER (ExoPhone/Caller ID)
You need to find your **Exotel Phone Number** (also called ExoPhone or Caller ID).

**How to find it:**
1. Go to: https://my.exotel.com/8495959789
2. Log in with your Exotel account
3. Look for one of these sections:
   - **"ExoPhones"** or **"Phone Numbers"** or **"Virtual Numbers"**
   - You should see a phone number like `+918012345678` or `080-12345678`
4. Copy this number

**Add it to your .env file:**
```bash
# Open the .env file
nano /app/voice-receptionist/backend/.env

# Find this line:
EXOTEL_PHONE_NUMBER=

# Add your number (example):
EXOTEL_PHONE_NUMBER=+918012345678
```

---

## 🔧 Step-by-Step: Configure Exotel Webhook

### 1. Go to Exotel Dashboard
Visit: https://my.exotel.com/8495959789/settings/site#api-settings

### 2. Find "Webhook Configuration" or "App Settings"
Look for:
- **"Passthru Applet"** or
- **"App Webhook URL"** or
- **"Connected App URL"**

### 3. Set the Webhook URL
Add this URL as your webhook endpoint:
```
https://curly-onions-fold.loca.lt/api/voice/incoming-call
```

**Settings:**
- **Method:** POST
- **Content-Type:** application/x-www-form-urlencoded
- **Fallback URL:** (leave blank for now)

### 4. Assign Webhook to Your ExoPhone
- Find your ExoPhone number in the dashboard
- Click "Edit" or "Configure"
- Under **"Connect to:"** select **"Passthru / URL"**
- Choose the webhook you just created
- **Save**

---

## 📱 How to Make a Test Call

### Method 1: Call Your ExoPhone Directly
```
Simply dial your Exotel phone number from any mobile phone.
Example: +918012345678
```

**Expected Flow:**
1. You hear: "Welcome to our clinic. How can I help you today?"
2. Press **1** to book an appointment
3. System will ask for your name
4. System will ask for appointment date/time
5. System confirms and sends SMS

### Method 2: Test with Exotel Dashboard (Recommended for First Test)
1. Go to: https://my.exotel.com/8495959789/calls
2. Look for "Make a Test Call" or "Call Testing"
3. Enter your mobile number
4. Click "Call"
5. The system will call you and route to your webhook

---

## 🧪 Testing Backend Without Calling

### 1. Test Health Endpoint
```bash
curl https://curly-onions-fold.loca.lt/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "environment": "development",
  "services": {
    "database": "connected",
    "exotel": "configured",
    "sarvam": "configured",
    "openai": "configured"
  }
}
```

### 2. Test Exotel Webhook Manually
```bash
curl -X POST https://curly-onions-fold.loca.lt/api/voice/incoming-call \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=test123" \
  -d "From=+919876543210" \
  -d "To=+918012345678" \
  -d "AccountSid=8495959789"
```

**Expected Response:**
Should return ExoML XML like:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="female" language="hi">Welcome message...</Say>
  <Gather ...>
  </Gather>
</Response>
```

### 3. Check Backend Logs
```bash
tail -f /tmp/backend.log
```

You should see:
- `📞 Incoming call: ...`
- Database queries
- AI service calls

### 4. Check Database (Verify Call Logs)
```bash
cd /app/voice-receptionist/backend && node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://vznzjjimystviujckrfj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bnpqamlteXN0dml1amNrcmZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE0MjIwNSwiZXhwIjoyMDg2NzE4MjA1fQ.VBpHvBWwwZDBfEJTq007A081DneNqwzs5db2ftr6i4M'
);
async function check() {
  const { data } = await supabase.from('call_logs').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Recent Calls:', JSON.stringify(data, null, 2));
}
check();
"
```

---

## 🐛 Troubleshooting

### Issue: "Clinic not found"
**Fix:** Make sure the "To" number matches a clinic in the database.
Current clinic phone: `+918012345678`

### Issue: "Exotel not responding"
**Fix:** Check if webhook is properly configured in Exotel dashboard.

### Issue: "Tunnel URL not working"
**Fix:** Localtunnel URLs expire. Restart tunnel:
```bash
pkill -f localtunnel
lt --port 8002 &
# Get new URL and update .env BASE_URL
```

### Issue: "Backend not running"
**Fix:** Restart backend:
```bash
cd /app/voice-receptionist/backend
node src/server.js &
```

---

## 📊 What Happens During a Call

1. **User calls ExoPhone** → Exotel receives call
2. **Exotel sends webhook** → `POST /api/voice/incoming-call`
3. **Backend processes**:
   - Looks up clinic by phone number
   - Creates call log in database
   - Returns ExoML response with greeting
4. **User presses 1** → Exotel sends `POST /api/voice/process-input`
5. **Backend processes booking**:
   - Asks for name, date, time
   - Uses Sarvam AI for Speech-to-Text
   - Uses OpenAI to extract intent
   - Checks availability in database
   - Creates appointment
   - Uses Sarvam AI for Text-to-Speech confirmation
   - Sends SMS via Exotel
6. **Call ends** → Exotel sends call completion webhook

---

## ✅ Next Steps

1. **Find your Exotel Phone Number** and add to `.env`
2. **Configure Exotel Webhook** in dashboard
3. **Make a test call** to your ExoPhone
4. **Check logs** to see the flow
5. **Verify appointment** was created in Supabase

---

## 📞 Need Help?

If you encounter issues:
1. Check backend logs: `tail -f /tmp/backend.log`
2. Check Exotel call logs: https://my.exotel.com/8495959789/calls
3. Check Supabase database: https://supabase.com/dashboard/project/vznzjjimystviujckrfj
4. Verify all services are configured in `/health` endpoint

---

**Backend is LIVE and ready for calls! 🚀**
