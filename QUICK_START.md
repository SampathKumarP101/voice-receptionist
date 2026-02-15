# 🚀 Quick Start: Making Your First Call

## Step 1: Find Your Exotel Phone Number ☎️

1. Go to: **https://my.exotel.com/8495959789**
2. Look for **"ExoPhones"** or **"Phone Numbers"** tab
3. Copy the number (looks like: **+918012345678**)

## Step 2: Add Phone Number to Config 📝

```bash
# Edit the .env file
nano /app/voice-receptionist/backend/.env

# Find this line and add your number:
EXOTEL_PHONE_NUMBER=+91XXXXXXXXXX

# Save and exit (Ctrl+X, then Y, then Enter)

# Restart backend
pkill -f "node.*server.js" && cd /app/voice-receptionist/backend && node src/server.js &
```

## Step 3: Configure Exotel Webhook 🔗

1. Go to: **https://my.exotel.com/8495959789/settings**
2. Find **"Passthru Applet"** or **"Webhook Settings"**
3. Add webhook URL: `https://curly-onions-fold.loca.lt/api/voice/incoming-call`
4. Method: **POST**
5. Assign this webhook to your ExoPhone number

## Step 4: Make Test Call 📞

**Option A: Call from your mobile**
```
Dial your Exotel phone number
Example: +918012345678
```

**Option B: Test with curl (simulated call)**
```bash
curl -X POST https://curly-onions-fold.loca.lt/api/voice/incoming-call \
  -d "CallSid=test123" \
  -d "From=+919876543210" \
  -d "To=+918012345678" \
  -d "AccountSid=8495959789"
```

## Step 5: Monitor Logs 🔍

```bash
# Watch backend logs
tail -f /tmp/backend.log

# Check call logs in database
cd /app/voice-receptionist/backend && node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://vznzjjimystviujckrfj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bnpqamlteXN0dml1amNrcmZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE0MjIwNSwiZXhwIjoyMDg2NzE4MjA1fQ.VBpHvBWwwZDBfEJTq007A081DneNqwzs5db2ftr6i4M'
);
(async () => {
  const { data } = await supabase.from('call_logs').select('*').limit(10);
  console.log(JSON.stringify(data, null, 2));
})();
"
```

---

## ⚡ Quick Commands

### Check if backend is running
```bash
curl http://localhost:8002/health
```

### Restart backend
```bash
pkill -f "node.*server.js" && cd /app/voice-receptionist/backend && node src/server.js &
```

### Restart tunnel (if URL expires)
```bash
pkill -f localtunnel && lt --port 8002 &
sleep 3
cat /tmp/localtunnel.log
# Update BASE_URL in .env with new URL
```

### Check appointments
```bash
curl http://localhost:8002/api/appointments
```

---

## 🎯 Expected Call Flow

1. **Caller dials your ExoPhone** → `+918012345678`
2. **System greets**: "ನಮಸ್ಕಾರ. ಕ್ಲಿನಿಕ್‌ಗೆ ಸ್ವಾಗತ..." (Kannada)
3. **System prompts**: "Press 1 to book, Press 2 to cancel"
4. **Caller presses 1**
5. **System asks for details**: Name, Date, Time
6. **System confirms booking**
7. **SMS sent to caller's phone**
8. **Call logged in database**

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend not responding | `pkill -f server.js && cd backend && node src/server.js &` |
| Tunnel expired | Restart localtunnel and update BASE_URL |
| Exotel not calling webhook | Check webhook configuration in Exotel dashboard |
| Database error | Check SUPABASE_URL in .env |

---

**Everything is configured and ready! Just need your Exotel phone number to start! 🚀**
