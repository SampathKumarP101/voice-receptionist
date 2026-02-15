# GitHub Push Instructions

## Before Pushing to GitHub

### ⚠️ CRITICAL: Protect Your API Keys

Your `.env` files contain sensitive credentials that should NEVER be committed to GitHub:

**Backend `.env` contains:**
- Exotel API Key & Token
- Sarvam AI API Key
- OpenAI API Key
- Supabase Service Key
- Database credentials

**Frontend `.env.local` contains:**
- Supabase Anon Key
- API URLs

---

## Method 1: Using Emergent's "Save to GitHub" Feature

This is the easiest method if you have a paid Emergent subscription.

### Steps:

1. **Click "Save to GitHub"** button in Emergent UI
2. **Connect GitHub account** (if not already connected)
3. **Select/Create repository**:
   - Repository name: `ai-voice-receptionist` (or your choice)
   - Description: "AI Voice Receptionist SaaS for Karnataka Clinics - Kannada & English"
   - Visibility: Private (recommended due to API keys in commit history)
4. **Push to GitHub** - Emergent will handle the rest!

### Important:
- `.gitignore` is already configured to exclude `.env` files
- Emergent automatically excludes sensitive files
- Your API keys remain safe

---

## Method 2: Manual Git Push (Alternative)

If you prefer manual control or don't have the GitHub integration:

### Step 1: Initialize Git Repository

```bash
cd /app/voice-receptionist

# Initialize git
git init

# Add all files (gitignore will exclude .env)
git add .

# Verify .env files are NOT staged
git status
# Should NOT see .env files in the list

# If you see .env files, they weren't ignored. Stop and fix .gitignore first!
```

### Step 2: Make Initial Commit

```bash
git commit -m "Initial commit: AI Voice Receptionist SaaS

- Node.js + Express backend with Exotel integration
- Next.js frontend setup
- Sarvam AI STT/TTS for Kannada & English
- OpenAI GPT-5.2 intent extraction
- Supabase PostgreSQL database
- Complete booking logic with conflict detection
- Automated SMS reminders
- Multi-tenant architecture
- Comprehensive documentation"
```

### Step 3: Create GitHub Repository

**Option A: Via GitHub Website**
1. Go to: https://github.com/new
2. Repository name: `ai-voice-receptionist`
3. Description: `AI Voice Receptionist SaaS for Karnataka Clinics`
4. Visibility: **Private** (recommended)
5. DO NOT initialize with README (you already have one)
6. Click: "Create repository"

**Option B: Via GitHub CLI**
```bash
# Install GitHub CLI if not installed
# For Mac: brew install gh
# For Linux: See https://cli.github.com/

gh auth login
gh repo create ai-voice-receptionist --private --source=. --remote=origin
```

### Step 4: Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/ai-voice-receptionist.git

# Push to main branch
git branch -M main
git push -u origin main
```

---

## Verification Checklist

After pushing, verify on GitHub:

- [ ] `.env` files are NOT visible in repository
- [ ] `.env.example` IS visible (without actual keys)
- [ ] `README.md` is displayed on repo homepage
- [ ] All source code is present
- [ ] Documentation files are present
- [ ] `.gitignore` is working

---

## Setting Up Environment Variables on Deployment

When you deploy (Railway, Render, etc.), manually add these environment variables:

### Backend Environment Variables:

```bash
NODE_ENV=production
PORT=8002

SUPABASE_URL=https://smnzkoqxkevvsggzuwkz.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...  # Your actual key
SUPABASE_ANON_KEY=eyJhbG...      # Your actual key

EXOTEL_ACCOUNT_SID=exotel...
EXOTEL_API_KEY=API...
EXOTEL_API_TOKEN=abc...
EXOTEL_SUBDOMAIN=api
EXOTEL_PHONE_NUMBER=022...

SARVAM_API_KEY=sk_o23yt04a...
OPENAI_API_KEY=sk-proj-dfcmr...
OPENAI_MODEL=gpt-5.2

BASE_URL=https://your-app.railway.app
```

### Frontend Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://smnzkoqxkevvsggzuwkz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## Collaborating with Team

If adding team members:

### For Developers:

1. Clone repository:
```bash
git clone https://github.com/YOUR_USERNAME/ai-voice-receptionist.git
cd ai-voice-receptionist
```

2. Copy `.env.example` to `.env`:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

3. Ask team lead for API credentials

4. Add credentials to `.env` files

5. Install dependencies:
```bash
cd backend && npm install
cd ../frontend && npm install
```

6. Start development:
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

---

## Updating GitHub Repository

After making changes:

```bash
# Check what changed
git status

# Add changes
git add .

# Commit with descriptive message
git commit -m "Add real-time call analytics dashboard"

# Push to GitHub
git push origin main
```

---

## Repository Structure on GitHub

Your repository will look like:

```
ai-voice-receptionist/
├── .gitignore ✅
├── README.md
├── ARCHITECTURE.md
├── DEPLOYMENT.md
├── EXOTEL_SETUP.md
├── IMPLEMENTATION_SUMMARY.md
├── database-schema.sql
├── backend/
│   ├── .env.example ✅ (without actual keys)
│   ├── src/
│   └── package.json
└── frontend/
    ├── .env.example ✅
    ├── src/
    └── package.json
```

---

## Security Best Practices

✅ **DO:**
- Keep `.env` files in `.gitignore`
- Use `.env.example` with placeholder values
- Rotate API keys if accidentally committed
- Use private repository for sensitive projects
- Enable GitHub 2FA

❌ **DON'T:**
- Commit `.env` files
- Share API keys in public repos
- Commit database credentials
- Push sensitive customer data
- Use real data in examples

---

## If You Accidentally Committed API Keys

### Immediate Steps:

1. **Rotate all exposed keys immediately:**
   - Exotel: Generate new API token
   - Sarvam: Regenerate API key
   - OpenAI: Create new API key
   - Supabase: Reset service role key

2. **Remove from Git history:**
```bash
# Install BFG Repo-Cleaner
brew install bfg  # or download from rtyley.github.io/bfg-repo-cleaner

# Remove .env files from history
bfg --delete-files .env
bfg --delete-files .env.local

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (CAUTION: This rewrites history)
git push origin main --force
```

3. **Update keys everywhere:**
   - Update in deployment platform
   - Update in local `.env`
   - Update in team documentation

---

## Need Help?

- **GitHub Issues**: For bugs and feature requests
- **Pull Requests**: For contributions
- **Discussions**: For questions and ideas

**Your AI Voice Receptionist is now on GitHub! 🎉**
