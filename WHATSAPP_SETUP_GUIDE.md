# 💬 WhatsApp Chatbot Setup Guide

## 🎉 Welcome to Your WhatsApp AI Receptionist!

Your backend is ready to receive WhatsApp messages and book appointments!

---

## 📋 What You Have

**Your Meta Credentials:**
- App ID: `1515312206127688`
- App Secret: `403f86a3096e2352d1a9524a1bdd0f71`
- Business Account ID: `1125294732261949`
- Phone Number ID: `779035141956928`

---

## 🔑 Step 1: Get Your WhatsApp Access Token

### Method 1: Temporary Token (Quick Testing - 24 hours)

1. Go to: https://developers.facebook.com/apps/1515312206127688/whatsapp-business/wa-dev-console/
2. Click on "API Setup" in left sidebar
3. Under "Temporary access token", click **"Generate Token"**
4. Copy the token (starts with `EAAV...`)
5. Add it to `.env` file:
   ```bash
   nano /app/voice-receptionist/backend/.env
   # Update this line:
   WHATSAPP_ACCESS_TOKEN=EAAV...your_token_here
   ```

### Method 2: Permanent Token (Production)

1. Go to: https://business.facebook.com/settings/system-users
2. Click **"Add"** → Create a system user (e.g., "WhatsApp Bot")
3. Click on the system user → **"Add Assets"**
4. Select your WhatsApp app → Check "Full control"
5. Click **"Generate New Token"**
6. Select permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
7. Copy the token and add to `.env`

---

## 🌐 Step 2: Set Up Public URL (Webhook)

### Using Localtunnel (Already Running)

Your tunnel should still be active from earlier. Check:

```bash
curl http://localhost:4040/api/tunnels | python3 -c "import sys, json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])"
```

If it's not running, restart:

```bash
pkill -f localtunnel
lt --port 8002 &
sleep 3
# Get the URL
cat /tmp/localtunnel.log | grep "your url is"
```

**Your WhatsApp Webhook URL will be:**
```
https://your-tunnel-url.loca.lt/api/whatsapp/webhook
```

---

## 🔗 Step 3: Configure Webhook in Meta

1. Go to: https://developers.facebook.com/apps/1515312206127688/whatsapp-business/wa-settings/
2. Click **"Configuration"** in left sidebar
3. Under "Webhook", click **"Edit"**
4. Enter:
   - **Callback URL:** `https://your-tunnel-url.loca.lt/api/whatsapp/webhook`
   - **Verify Token:** `kannada_clinic_2026_secure_token`
5. Click **"Verify and Save"**
6. Subscribe to webhooks:
   - ✅ `messages`
   - ✅ `message_template_status_update`

---

## 📱 Step 4: Add Test Phone Number

Before you can receive messages, add your phone number as a test recipient:

1. Go to: https://developers.facebook.com/apps/1515312206127688/whatsapp-business/wa-dev-console/
2. Click "API Setup"
3. Under "Step 5: Send messages with the API", find "To"
4. Click **"Manage phone number list"**
5. Add your phone number with country code (e.g., `+919876543210`)
6. Verify with the OTP sent to your WhatsApp

---

## 🧪 Step 5: Test Your Chatbot

### Start the Backend

```bash
cd /app/voice-receptionist/backend
node src/server.js > /tmp/whatsapp_backend.log 2>&1 &
```

### Watch Logs

```bash
tail -f /tmp/whatsapp_backend.log
```

### Send Your First Message

1. Open WhatsApp on your phone
2. Send a message to your WhatsApp Business Number
3. The bot will reply with language selection buttons!

**Expected Flow:**
1. You: Send any message
2. Bot: "Welcome! Choose your language: English / ಕನ್ನಡ"
3. You: Click "English" or "ಕನ್ನಡ"
4. Bot: "How can I help you?" with buttons
5. You: Click "Book Appointment"
6. Bot: Asks for name, date, time
7. Bot: Sends confirmation message
8. ✅ Appointment saved to database!

---

## 🎯 Conversation Flow

```
User sends message
    ↓
Bot: Choose Language (English/ಕನ್ನಡ)
    ↓
Bot: Main Menu
    - Book Appointment
    - Cancel Appointment
    - Change Language
    ↓
[If Book Appointment]
    ↓
Bot: What's your name?
    ↓
Bot: Preferred date? (DD/MM/YYYY)
    ↓
Bot: Preferred time? (HH:MM AM/PM)
    ↓
Bot: Confirmation Summary
    ↓
User: Confirms
    ↓
Bot: ✅ Booking confirmed!
    ↓
Database: Appointment saved
    ↓
Admin Dashboard: Shows appointment
```

---

## 🐛 Troubleshooting

### Issue: "Webhook verification failed"

**Fix:**
- Check that verify token in Meta matches: `kannada_clinic_2026_secure_token`
- Verify webhook URL is correct and accessible
- Check backend logs: `tail -f /tmp/whatsapp_backend.log`

### Issue: "Bot not responding to messages"

**Fix:**
```bash
# Check if backend is running
ps aux | grep "node.*server.js"

# Check logs for errors
tail -50 /tmp/whatsapp_backend.log

# Test webhook manually
curl -X POST http://localhost:8002/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[]}'
```

### Issue: "Access token expired"

**Fix:**
- Generate a new token from Meta dashboard
- Update `.env` file with new token
- Restart backend: `pkill -f "node.*server.js" && cd /app/voice-receptionist/backend && node src/server.js &`

### Issue: "Can't send messages to my number"

**Fix:**
- Make sure your number is added as a test recipient in Meta dashboard
- Verify the OTP sent to your WhatsApp
- Check if you're using the correct phone format: `+919876543210`

---

## 📊 Check Appointments in Database

```bash
cd /app/voice-receptionist/backend && node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://vznzjjimystviujckrfj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bnpqamlteXN0dml1amNrcmZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE0MjIwNSwiZXhwIjoyMDg2NzE4MjA1fQ.VBpHvBWwwZDBfEJTq007A081DneNqwzs5db2ftr6i4M'
);
(async () => {
  const { data } = await supabase
    .from('appointments')
    .select('*')
    .eq('created_via', 'whatsapp')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log('WhatsApp Appointments:', JSON.stringify(data, null, 2));
})();
"
```

---

## 🎨 View in Admin Dashboard

The appointments booked via WhatsApp will appear in your Next.js admin dashboard at:
```
http://localhost:3000/appointments
```

---

## 📝 Quick Commands

**Restart Backend:**
```bash
pkill -f "node.*server.js"
cd /app/voice-receptionist/backend
node src/server.js > /tmp/whatsapp_backend.log 2>&1 &
```

**Check Health:**
```bash
curl http://localhost:8002/health | python3 -m json.tool
```

**Watch Logs:**
```bash
tail -f /tmp/whatsapp_backend.log
```

**Get Tunnel URL:**
```bash
cat /tmp/localtunnel.log | grep "your url is"
```

---

## ✅ Checklist

Before testing:
- [ ] WhatsApp access token added to `.env`
- [ ] Backend restarted with new token
- [ ] Webhook configured in Meta dashboard
- [ ] Your phone number added as test recipient
- [ ] Tunnel is active and accessible
- [ ] Backend logs showing no errors

---

## 🚀 You're Ready!

Once you complete the steps above:
1. Send a message from your WhatsApp to the business number
2. Follow the conversation flow
3. Book an appointment
4. Check the admin dashboard!

**The chatbot supports:**
- ✅ Kannada & English languages
- ✅ Interactive buttons + natural text
- ✅ Appointment booking
- ✅ Confirmation messages
- ✅ Persistent conversation state
- ✅ AI-powered intent understanding

---

**Need help? Check the logs or let me know! 💬**
