# 🔗 Exotel Webhook Configuration Guide

## ✅ Your ExoPhones
- **Primary:** 080-472-59725 (+918047259725)
- **Secondary:** 095-158-86363 (+919515886363)
- **Credits:** 499 available
- **Account:** Free trial (no verification needed!)

---

## 🎯 Quick Setup (2 Minutes)

### Option A: Using Passthru Applet (Recommended)

1. **Go to Exotel Dashboard:**
   - Visit: https://my.exotel.com/8495959789/exophones

2. **Click on your ExoPhone:** `080-472-59725`

3. **Look for "Connect To" or "App" section**
   - You should see a dropdown or edit button

4. **Select "Passthru" or "URL" option**

5. **Enter Webhook URL:**
   ```
   https://curly-onions-fold.loca.lt/api/voice/incoming-call
   ```

6. **Set Method:** `POST`

7. **Click Save/Update**

---

### Option B: Using Flow Builder (Alternative)

If you see "Flow Builder" or "Visual Flow":

1. **Create New Flow:**
   - Go to: https://my.exotel.com/8495959789/settings/apps
   - Click "Create New App" or "New Flow"
   - Name it: "AI Voice Receptionist"

2. **Add HTTP Request Block:**
   - Drag "HTTP Request" or "Webhook" block
   - URL: `https://curly-onions-fold.loca.lt/api/voice/incoming-call`
   - Method: POST
   - Pass call parameters: ✓ (enable)

3. **Connect to ExoPhone:**
   - Assign this flow to `080-472-59725`

4. **Save and Activate**

---

### Option C: Using Call Settings (Easiest)

1. **Go to:** https://my.exotel.com/8495959789/calls/settings

2. **Look for "Call Settings" tab**

3. **Find "Incoming Call URL" or "Webhook URL"**

4. **Enter:**
   - **URL:** `https://curly-onions-fold.loca.lt/api/voice/incoming-call`
   - **Method:** POST
   - **On Answer:** Selected
   - **Pass Call Info:** Yes

5. **Apply to ExoPhone:** Select `080-472-59725`

6. **Save**

---

## 🧪 Test Your Configuration

### Method 1: Make a Real Call (Best Test)
```
📞 Dial: 080-472-59725
```

**Expected:**
1. Call connects
2. You hear greeting in Kannada or English
3. System asks you to press 1 for booking
4. Backend logs show activity

### Method 2: Simulate Webhook (Immediate Test)
```bash
curl -X POST https://curly-onions-fold.loca.lt/api/voice/incoming-call \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST123456" \
  -d "From=+919876543210" \
  -d "To=+918047259725" \
  -d "AccountSid=8495959789" \
  -d "Direction=inbound"
```

**Expected Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="female" language="hi">ನಮಸ್ಕಾರ...</Say>
  <Gather NumDigits="1" Action="..." Method="POST" Timeout="5">
    <Say>...</Say>
  </Gather>
  <Redirect>...</Redirect>
</Response>
```

### Method 3: Check Backend Logs
```bash
tail -f /tmp/backend.log
```

Watch for:
```
📞 Incoming call: TEST123456 from +919876543210 to +918047259725
```

---

## 🔍 Where to Find Webhook Settings

**Common Locations in Exotel Dashboard:**

1. **ExoPhones Page:**
   - MANAGE → ExoPhones → Click on number → Connect To → Passthru

2. **Call Settings:**
   - CALLS → Call Settings → Incoming Call Webhook

3. **Apps Page:**
   - TOOLS → App Bazaar → Create App → Passthru Applet

4. **API Settings:**
   - MY ACCOUNT → Company Info → API Settings → Webhook URL

---

## 📸 Visual Guide

Look for these UI elements:

**Buttons/Links to click:**
- "Edit" (next to ExoPhone)
- "Configure"
- "Call Settings" (in left sidebar)
- "Connect To" (dropdown)
- "Passthru" (option)
- "URL" or "Webhook"

**Fields to fill:**
- **URL/Webhook URL:** `https://curly-onions-fold.loca.lt/api/voice/incoming-call`
- **Method:** POST
- **App Name:** AI Voice Receptionist (optional)

---

## ⚠️ Important Notes

1. **Tunnel URL Expiry:**
   - Localtunnel URLs (`curly-onions-fold.loca.lt`) can expire
   - If webhook stops working, check if tunnel is still active
   - Restart if needed: `pkill -f localtunnel && lt --port 8002 &`

2. **Test Mode:**
   - Your account is in trial mode - perfect for testing!
   - 499 credits should be enough for extensive testing

3. **Call Flow:**
   - When someone calls your ExoPhone, Exotel sends a webhook to our URL
   - Our backend responds with ExoML instructions
   - Exotel executes those instructions (play greeting, gather input, etc.)

---

## 🐛 Troubleshooting

### "Webhook not called"
**Fix:** 
- Check if webhook URL is correctly entered
- Verify ExoPhone is connected to the webhook/passthru app
- Test URL manually with curl

### "Call connects but no greeting"
**Fix:**
- Check backend logs for errors
- Verify tunnel is still active: `curl https://curly-onions-fold.loca.lt/health`
- Restart backend if needed

### "Clinic not found" error
**Fix:**
- Already fixed! Database updated to match your ExoPhone: +918047259725

---

## ✅ Verification Checklist

Before making test call:
- [ ] Webhook URL entered in Exotel dashboard
- [ ] Method set to POST
- [ ] Webhook assigned to ExoPhone 080-472-59725
- [ ] Backend running: `curl http://localhost:8002/health`
- [ ] Tunnel active: `curl https://curly-onions-fold.loca.lt/health`
- [ ] Database has correct clinic phone: +918047259725

---

## 🎯 After Setup - What to Expect

**Call Flow:**
1. User dials: **080-472-59725**
2. Exotel receives call
3. Exotel calls webhook: `POST https://curly-onions-fold.loca.lt/api/voice/incoming-call`
4. Backend looks up clinic by phone (+918047259725)
5. Backend returns ExoML greeting
6. Exotel plays greeting to caller
7. Caller presses 1 for booking
8. Backend processes booking, creates appointment, sends SMS

**You can monitor:**
- Backend logs: `tail -f /tmp/backend.log`
- Database: Check `call_logs` and `appointments` tables
- Exotel dashboard: Call history at https://my.exotel.com/8495959789/calls

---

**Once configured, call 080-472-59725 to test! 🚀**
