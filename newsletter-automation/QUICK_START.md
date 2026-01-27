# Newsletter Automation - Quick Start Guide

**Get your automated newsletter system running in 60 minutes.**

This is the fast-track guide. For detailed explanations, see [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md).

---

## ⚡ 60-Minute Setup

### Step 1: Get API Keys (15 min)

**Google Gemini:**
1. Visit: https://makersuite.google.com/app/apikey
2. Click "Get API Key" → "Create API key in new project"
3. Copy key (starts with `AIza...`)

**Apify:**
1. Visit: https://apify.com → Sign up with Google
2. Settings → Integrations → Copy "Personal API token"

**Brevo:**
1. Visit: https://www.brevo.com → Sign up
2. Your name (top right) → SMTP & API → Generate API key
3. Copy key (starts with `xkeysib-...`)

✅ **You now have 3 API keys**

---

### Step 2: Setup Brevo Email (15 min)

**Create List:**
1. Brevo → Contacts → Lists → Create a list
2. Name: "Newsletter Subscribers"
3. Note the List ID (from URL: `...lists/[ID]`)

**Create Form:**
1. Contacts → Forms → Create a form
2. Choose template → Customize colors
3. Settings → Select your list
4. Copy form URL (e.g., `https://sibforms.com/serve/xxxxx`)

**Add Domain:**
1. Settings → Senders, Domains & Dedicated IPs → Domains
2. Add domain: `ajyl.online`
3. Copy the 3 DNS records shown

**Update DNS (Hostinger):**
1. Log in to https://hpanel.hostinger.com
2. Websites → ajyl.online → DNS / Name Servers
3. Add 3 TXT records from Brevo:
   - SPF record (name: `@`)
   - DKIM record (name: `mail._domainkey`)
   - DMARC record (name: `_dmarc`)
4. Wait 1-2 hours for verification

**Verify Domain:**
1. Return to Brevo → Click "Verify domain"
2. Should show green checkmark
3. Add sender: `newsletter@ajyl.online`

✅ **Email system ready**

---

### Step 3: Create Google Sheet (10 min)

1. Go to https://sheets.google.com
2. Create blank sheet
3. Name: "Newsletter Automation - 2024"

**Add Headers (Row 1):**
- A1: `Newsletter Theme`
- B1: `Generated Content`
- C1: `Approval Status`
- D1: `Publish Timestamp`
- E1: `Notes`
- F1: `System Log`

**Format:**
- Bold Row 1
- Blue background, white text
- Freeze Row 1 (View → Freeze → 1 row)

**Add Themes (Starting Row 2):**
```
Week 1: Navigating the 15-Year Career Mark: When to Stay vs. When to Move
Week 2: Salary Negotiation Strategies for Mid-Career Professionals in 2024
Week 3: Building Your Safety Net: Financial Planning for Career Transitions
Week 4: The Hidden Job Market: How Senior Professionals Find Opportunities
```

Copy from [`templates/google-sheet-template.csv`](templates/google-sheet-template.csv) for all 52 weeks.

✅ **Sheet ready**

---

### Step 4: Install Apps Script (15 min)

**Open Script Editor:**
1. In your Google Sheet: Extensions → Apps Script
2. Delete default code
3. Copy ALL code from [`scripts/NewsletterAutomation.gs`](scripts/NewsletterAutomation.gs)
4. Paste into editor
5. Rename file: "NewsletterAutomation"

**Update Configuration (around line 20):**

```javascript
const CONFIG = {
  GEMINI_API_KEY: 'AIza_YOUR_KEY_HERE',
  APIFY_API_KEY: 'apify_api_YOUR_KEY_HERE',
  BREVO_API_KEY: 'xkeysib-YOUR_KEY_HERE',
  
  SENDER_EMAIL: 'newsletter@ajyl.online',
  SENDER_NAME: 'AJYL Newsletter',
  ADMIN_EMAIL: 'your-email@gmail.com',  // YOUR EMAIL
  BREVO_LIST_ID: 2,  // YOUR LIST ID
  
  SHEET_NAME: 'Newsletter Schedule',  // Match your tab name
  TIMEZONE: 'Asia/Kolkata',
  
  // Rest is fine as-is
};
```

**Save:**
- Click save icon (💾) or Ctrl+S

**Run initializeSheet:**
1. Select `initializeSheet` in dropdown
2. Click Run (▶️)
3. Authorize when prompted:
   - Review permissions
   - Choose account
   - Advanced → Go to NewsletterAutomation (unsafe)
   - Allow
4. Wait for completion
5. Check email for "Sheet Initialized" confirmation

**Run setupTriggers:**
1. Select `setupTriggers` in dropdown
2. Click Run (▶️)
3. Wait for completion
4. Check email for "System Activated" confirmation
5. Verify triggers: Click Triggers icon (⏰) in left sidebar

✅ **Automation installed**

---

### Step 5: Test Everything (10 min)

**Test APIs:**
1. Select `testAPIs` in dropdown
2. Click Run (▶️)
3. Check email: All 3 should show ✅ Connected

**Test Draft Generation:**
1. Select `testCompleteWorkflow` in dropdown
2. Click Run (▶️)
3. Wait 60-90 seconds
4. Check execution log (no red errors)

**Verify Sheet:**
- Column B should have generated content
- Column C should show "PENDING_APPROVAL"
- Status should be yellow

✅ **System working!**

---

## 🎯 What Happens Next

**Monday 9:45 AM IST:**
- System generates newsletter draft
- You receive email with preview
- Draft appears in Google Sheet

**Monday (Throughout Day):**
- Reminders at 12 PM, 6 PM, 10 PM (if not approved)

**Tuesday 9:45 AM IST:**
- Newsletter sends to subscribers
- Status updates to "SENT"
- You receive confirmation

**Repeats Wednesday/Thursday for second weekly newsletter**

---

## 🔄 Your Weekly Routine

1. **Check Email Monday/Wednesday:**
   - Review draft notification
   - Click link to open Google Sheet

2. **Review Content in Sheet:**
   - Read Column B content
   - Looks good? Type `APPROVED` in Column C
   - Needs edits? Edit in Column B, then approve

3. **Or Do Nothing:**
   - System auto-publishes next day at 9:45 AM
   - Even if you don't approve

4. **Rinse and Repeat:**
   - Twice a week, every week

---

## 🚨 Common Issues

**"Authorization required" won't complete:**
- Allow pop-ups from script.google.com
- Use regular browser window (not incognito)

**API test fails:**
- Double-check API keys (no extra spaces)
- Verify keys are active in respective dashboards

**No draft generated Monday:**
- Check Triggers are installed (⏰ icon)
- Verify timezone is Asia/Kolkata
- Run `generateNewsletterDrafts()` manually

**Domain not verifying in Brevo:**
- Wait 2-4 hours after adding DNS records
- Check DNS records added correctly in Hostinger
- Use DNS checker: https://mxtoolbox.com/

**Newsletter not sending:**
- Verify domain verified (green checkmark)
- Check sender email verified
- Ensure status is PENDING_APPROVAL or APPROVED

📖 **Full troubleshooting:** [`docs/TROUBLESHOOTING_GUIDE.md`](docs/TROUBLESHOOTING_GUIDE.md)

---

## 📋 Quick Reference

### Key Functions to Run Manually

```javascript
// Setup (run once)
initializeSheet()      // Format sheet
setupTriggers()        // Install automation

// Testing
testAPIs()            // Check API connections
testCompleteWorkflow() // End-to-end test

// Manual Operations
generateNewsletterDrafts()  // Generate draft now
publishNewsletters()        // Send pending newsletters
checkAndSendReminders()     // Send reminders now
```

### Configuration Keys You Must Update

```javascript
GEMINI_API_KEY    // Your Gemini API key
APIFY_API_KEY     // Your Apify token
BREVO_API_KEY     // Your Brevo API key
ADMIN_EMAIL       // Your email for notifications
SENDER_EMAIL      // newsletter@ajyl.online
BREVO_LIST_ID     // Your Brevo list ID
SHEET_NAME        // Must match sheet tab name
```

### Important URLs

- **Google AI Studio:** https://makersuite.google.com/app/apikey
- **Apify Dashboard:** https://console.apify.com
- **Brevo Dashboard:** https://app.brevo.com
- **Apps Script:** https://script.google.com
- **Hostinger Panel:** https://hpanel.hostinger.com

---

## 🎨 Customization Quick Tips

**Change publish schedule:**
```javascript
PUBLISH_DAYS: [2, 4],  // [1,3,5] for Mon/Wed/Fri
PUBLISH_HOUR: 9,       // 10 for 10 AM
PUBLISH_MINUTE: 45,    // 0 for on the hour
```

**Change content style:**
- Edit prompt in `buildNewsletterPrompt()` function
- Modify ICP and FOCUS in CONFIG
- Adjust temperature (0.5 = conservative, 0.9 = creative)

**Disable Apify scraping:**
- In `scrapeDataWithApify()`, return fallback data immediately
- Gemini will generate from theme alone

---

## 📊 Cost Monitoring

**Free Tier Limits:**
- Google Gemini: 60 requests/min (we use ~2/week) ✅
- Apify: $5/month credit (we use ~$0.80) ✅
- Brevo: 300 emails/day (we use ~8-16/week) ✅
- Apps Script: 20,000 calls/day (we use ~200) ✅

**Total: ₹0/month for up to 1,000 subscribers**

---

## 🚀 Go Live Checklist

Before publishing your first newsletter:

- [ ] All 3 API keys added and tested
- [ ] Domain verified in Brevo (green checkmark)
- [ ] Sender email verified
- [ ] Google Sheet has 4+ themes ready
- [ ] Triggers installed and showing in Apps Script
- [ ] Test draft generated successfully
- [ ] Test newsletter sent to your email
- [ ] Brevo signup form live on website
- [ ] At least 5 test subscribers added
- [ ] Approval workflow tested

✅ **Once all checked, you're ready to go live!**

---

## 📞 Need Help?

**Check these first:**
1. [Full Setup Guide](docs/SETUP_GUIDE.md) - Detailed instructions
2. [Troubleshooting Guide](docs/TROUBLESHOOTING_GUIDE.md) - Common issues
3. [Configuration Checklist](docs/CONFIGURATION_CHECKLIST.md) - Pre-flight check

**Still stuck?**
- Review Apps Script execution logs
- Run diagnostic functions (`testAPIs()`, etc.)
- Check all API keys are correct

---

## 🎉 You're Done!

Your automated newsletter system is now running. 

**What you achieved:**
- ✅ Fully automated content generation
- ✅ AI-powered newsletter writing
- ✅ Professional email delivery
- ✅ Approval workflow with reminders
- ✅ Zero ongoing cost
- ✅ Scalable to 1,000+ subscribers

**Next steps:**
1. Add signup form to ajyl.online ([Website Integration Guide](docs/WEBSITE_INTEGRATION.md))
2. Promote newsletter on LinkedIn
3. Add to email signature
4. Wait for Monday 9:45 AM for first automated draft!

---

**Time to launch: 60 minutes** ✅  
**Monthly cost: ₹0** ✅  
**Manual work: 5 min/week** ✅  

Enjoy your automated newsletter system! 🚀
