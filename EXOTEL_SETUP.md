# Exotel Setup Guide - AI Voice Receptionist

## Why Exotel for India? 🇮🇳

✅ **Indian Phone Numbers** - Get local +91 numbers  
✅ **30-40% Cheaper** - ₹0.8-1.0/min vs Twilio's ₹1.2-1.5/min  
✅ **Built-in TRAI Compliance** - DND scrubbing automatic  
✅ **INR Billing** - No forex risk  
✅ **IST Support** - Better for Indian operations  

---

## Step 1: Sign Up for Exotel Account

### Free Trial
```
1. Go to: https://exotel.com/signup
2. Select: "Start Free Trial"
3. Fill in:
   - Name
   - Email
   - Phone number
   - Company name
4. Verify email and phone
5. You'll get ₹200 free credit!
```

### Verify Your Account
- Upload business documents (PAN/GST)
- KYC verification (takes 1-2 business days)
- During trial, you can test with your own number

---

## Step 2: Get Your Credentials

After signup, get these from Exotel Dashboard:

### Navigate to API Settings
```
Dashboard > Settings > API Settings
```

### Copy These 4 Values:

**1. Account SID** (Example: `exotelXXXXXXXXXXXX`)
```
This is your account identifier
Found at top of API Settings page
```

**2. API Key** (Example: `APIXXXXXXXXXXXXXXXX`)
```
Also called "SID" in some docs
Acts as username for authentication
```

**3. API Token** (Example: `abcd1234efgh5678ijkl`)
```
Acts as password for authentication
Keep this SECRET!
```

**4. Subdomain** (Usually: `api` or `api-in`)
```
Check your dashboard URL
If it's: https://my-in.exotel.com → subdomain is "api-in"
If it's: https://my.exotel.com → subdomain is "api"
```

---

## Step 3: Buy an ExoPhone (Virtual Number)

### Get Your First Indian Number

```
1. Go to: Dashboard > Phone Numbers
2. Click: "Buy Number"
3. Select:
   - State: Karnataka
   - City: Bangalore
   - Number Type: Local
4. Choose a number (₹300-500/month)
5. Purchase it
```

### Copy Your ExoPhone Number
```
Format: 02240XXXXXX (Indian landline format)
This is what patients will call
```

---

## Step 4: Add Credentials to Backend

```bash
cd /app/voice-receptionist/backend

# Edit .env file
nano .env
```

### Add These Lines:

```bash
# Exotel Configuration
EXOTEL_ACCOUNT_SID=exotelXXXXXXXXXXXX
EXOTEL_API_KEY=APIXXXXXXXXXXXXXXXX
EXOTEL_API_TOKEN=abcd1234efgh5678ijkl
EXOTEL_SUBDOMAIN=api
EXOTEL_PHONE_NUMBER=02240XXXXXX
```

**Save and exit** (Ctrl+X, then Y, then Enter)

---

## Step 5: Start Backend & ngrok

### Terminal 1: Start Backend
```bash
cd /app/voice-receptionist/backend
npm run dev

# Should see:
# ✓ Exotel client initialized
# 🚀 Server running on port 8002
```

### Terminal 2: Start ngrok
```bash
ngrok http 8002

# You'll see output like:
# Forwarding  https://abc123def456.ngrok-free.app -> http://localhost:8002
```

**Copy the ngrok HTTPS URL** (e.g., `https://abc123def456.ngrok-free.app`)

---

## Step 6: Configure Exotel Webhooks

### Create an Applet (Call Flow)

**1. Go to Dashboard > Applets**

**2. Click "Create New Applet"**

**3. Name it:** `AI Voice Receptionist`

**4. Add "Connect" Applet Block:**
```
Block Type: Connect
Name: Incoming Call Handler
Webhook URL: https://YOUR-NGROK-URL.ngrok-free.app/api/voice/incoming-call
Method: POST
```

**5. Set Passthru URL (Optional):**
```
For advanced flows, set:
https://YOUR-NGROK-URL.ngrok-free.app/api/voice/process-input
```

**6. Add Status Callback:**
```
Callback URL: https://YOUR-NGROK-URL.ngrok-free.app/api/voice/call-end
Method: POST
Events: completed, busy, failed, no-answer
```

**7. Save Applet**

### Assign Applet to Your ExoPhone

```
1. Go to: Dashboard > Phone Numbers
2. Click on your ExoPhone number
3. Under "Voice Settings":
   - Select: "Applet"
   - Choose: "AI Voice Receptionist"
4. Click: "Save"
```

---

## Step 7: Test Your Setup!

### Make a Test Call

```
1. Call your ExoPhone number: 02240XXXXXX
2. You should hear: "Welcome to our clinic..."
3. Press 1 to book appointment
4. Follow the prompts
```

### Check Backend Logs

In Terminal 1, you should see:
```
📞 Incoming call: [CallSid] from [Your Number] to [ExoPhone]
🔢 Input for [CallSid]: 1
📧 SMS sent successfully
```

### Verify in Database

```sql
-- In Supabase SQL Editor
SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 5;
SELECT * FROM appointments ORDER BY created_at DESC LIMIT 5;
```

---

## Step 8: Update BASE_URL in .env

Once testing works, update for production:

```bash
# In .env file, change:
BASE_URL=https://abc123def456.ngrok-free.app

# Later for production:
BASE_URL=https://your-app.railway.app
```

**Restart backend** after changing .env:
```bash
# Press Ctrl+C to stop
npm run dev  # Start again
```

---

## Troubleshooting

### Issue: "Exotel not configured" message

**Solution:**
```bash
# Check .env file has all 5 values:
cat /app/voice-receptionist/backend/.env | grep EXOTEL

# Should show:
EXOTEL_ACCOUNT_SID=exotel...
EXOTEL_API_KEY=API...
EXOTEL_API_TOKEN=...
EXOTEL_SUBDOMAIN=api
EXOTEL_PHONE_NUMBER=022...
```

### Issue: "Webhook not received"

**Solution:**
1. Check ngrok is running
2. Verify ngrok URL in Exotel applet
3. Check firewall/antivirus
4. Try hitting webhook manually:
```bash
curl -X POST https://YOUR-NGROK-URL/api/voice/incoming-call \
  -d "CallSid=test123&From=919876543210&To=02240123456"
```

### Issue: "Call connects but no audio"

**Solution:**
1. Check ExoML response in logs
2. Verify BASE_URL is correct
3. Test applet in Exotel simulator first

### Issue: "SMS not sending"

**Solution:**
1. Check Exotel SMS credits
2. Verify ExoPhone number is correct
3. Check logs for error messages
4. Try manual SMS via Exotel dashboard

---

## Cost Tracking

### Free Trial
- ₹200 credit
- ~200-250 test calls
- Valid for 30 days

### Post-Trial Pricing
- **ExoPhone**: ₹300-500/month
- **Voice calls**: ₹0.80-1.00/minute
- **SMS**: ₹0.20-0.30/SMS
- **Total per booking**: ~₹4-5

### Monthly Cost (100 calls)
- Voice: ₹400
- SMS: ₹30
- Number: ₹400
- **Total: ₹830/month** (vs ₹1,045 with Twilio)

---

## Production Checklist

- [ ] KYC verified on Exotel
- [ ] Business documents uploaded
- [ ] ExoPhone purchased
- [ ] Applet configured
- [ ] Webhooks tested
- [ ] Database schema executed
- [ ] SMS confirmations working
- [ ] Call logs being saved
- [ ] Reminders scheduler running
- [ ] Deploy backend to Railway/Render
- [ ] Update BASE_URL to production
- [ ] Test end-to-end with real call

---

## Support

### Exotel Support
- Email: support@exotel.com
- Phone: 080-71184000
- Hours: 9 AM - 6 PM IST

### Documentation
- API Docs: https://developer.exotel.com
- Applets Guide: https://support.exotel.com/applets
- ExoML Reference: https://developer.exotel.com/exoml

---

## Next Steps

1. ✅ Complete this setup
2. Test with real calls
3. Build Next.js dashboard for appointment management
4. Deploy to production
5. Add more features (SMS reminders working, call analytics)

**Your AI receptionist is ready to take calls in Kannada & English!** 🎉
