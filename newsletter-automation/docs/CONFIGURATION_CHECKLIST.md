# Newsletter Automation - Configuration Checklist

Use this checklist to verify your setup is complete and correct before going live.

---

## 📋 Pre-Setup Requirements

- [ ] Google Account (Gmail or Workspace)
- [ ] Domain: ajyl.online (owned and accessible)
- [ ] Access to Hostinger control panel
- [ ] 1-2 hours of setup time available
- [ ] Chrome or Firefox browser

---

## 🔑 Part 1: API Keys & Accounts

### Google Gemini API
- [ ] Created API key at https://makersuite.google.com/app/apikey
- [ ] API key starts with `AIza...`
- [ ] API key copied and stored safely
- [ ] Verified free tier limits: 60 requests/minute

**API Key:** `AIza_________________________________`

---

### Apify API
- [ ] Created account at https://apify.com
- [ ] Used Google Sign-In (recommended)
- [ ] Retrieved API token from Settings → Integrations
- [ ] Token starts with `apify_api_...`
- [ ] Verified $5 monthly free credit available

**API Token:** `apify_api_________________________________`

---

### Brevo API
- [ ] Created account at https://www.brevo.com
- [ ] Verified email address
- [ ] Generated API key from SMTP & API settings
- [ ] Key starts with `xkeysib-...`
- [ ] Verified 300 emails/day free tier

**API Key:** `xkeysib-________________________________`

---

## 📧 Part 2: Brevo Email Configuration

### Email List
- [ ] Created list named "Newsletter Subscribers"
- [ ] Noted list ID from URL (`...lists/[ID]`)
- [ ] List configured for double opt-in (recommended)

**List ID:** `________`

---

### Signup Form
- [ ] Created subscription form
- [ ] Customized branding (colors, logo)
- [ ] Set heading: "Subscribe to AJYL Newsletter"
- [ ] Enabled double opt-in
- [ ] Connected to correct list
- [ ] Tested form (subscribed with test email)
- [ ] Received confirmation email

**Form URL:** `https://sibforms.com/serve/_________________`

---

## 🌐 Part 3: Domain Configuration

### Brevo Domain Setup
- [ ] Added ajyl.online to Brevo
- [ ] Received DNS records (SPF, DKIM, DMARC)

**DNS Records to Add:**

**SPF Record:**
- Type: `TXT`
- Name: `@`
- Content: `v=spf1 include:spf.brevo.com ~all`

**DKIM Record:**
- Type: `TXT`
- Name: `mail._domainkey` *(copy exact name from Brevo)*
- Content: `v=DKIM1; k=rsa; p=...` *(copy full string from Brevo)*

**DMARC Record:**
- Type: `TXT`
- Name: `_dmarc`
- Content: `v=DMARC1; p=none; rua=mailto:your-email@example.com`

---

### Hostinger DNS Configuration
- [ ] Logged in to Hostinger (https://hpanel.hostinger.com)
- [ ] Navigated to ajyl.online → DNS / Name Servers
- [ ] Added SPF TXT record
- [ ] Added DKIM TXT record
- [ ] Added DMARC TXT record
- [ ] Waited 1-2 hours for DNS propagation

---

### Domain Verification
- [ ] Returned to Brevo after DNS propagation
- [ ] Clicked "Verify domain"
- [ ] Domain shows green checkmark "Verified"
- [ ] Added sender: `newsletter@ajyl.online`
- [ ] Sender verified and active

---

## 📊 Part 4: Google Sheet Setup

### Sheet Creation
- [ ] Created new Google Sheet
- [ ] Named: "Newsletter Automation - 2024"
- [ ] Added headers in Row 1:
  - A1: Newsletter Theme
  - B1: Generated Content
  - C1: Approval Status
  - D1: Publish Timestamp
  - E1: Notes
  - F1: System Log

---

### Sheet Formatting
- [ ] Headers formatted (bold, blue background, white text)
- [ ] Row 1 frozen (View → Freeze → 1 row)
- [ ] Column widths adjusted:
  - A: 400px
  - B: 600px
  - C: 150px
  - D: 180px
  - E: 200px
  - F: 300px

---

### Newsletter Themes
- [ ] Added 52 weekly themes (starting Row 2)
- [ ] Themes are specific and actionable
- [ ] Themes align with ICP (mid-career professionals)
- [ ] Column A populated, Columns B-F empty

**Sample themes verified:**
- [ ] Week 1: Career transitions
- [ ] Week 2: Salary negotiation
- [ ] Week 3: Financial planning
- [ ] Week 4: Job search strategies

---

## 💻 Part 5: Google Apps Script

### Script Installation
- [ ] Opened Extensions → Apps Script from Google Sheet
- [ ] Deleted default code
- [ ] Pasted full NewsletterAutomation.gs script
- [ ] Renamed file to "NewsletterAutomation"

---

### Configuration Update
Located CONFIG section (line ~20) and updated:

```javascript
const CONFIG = {
  GEMINI_API_KEY: 'AIza...',           // ✓ Updated
  APIFY_API_KEY: 'apify_api_...',      // ✓ Updated
  BREVO_API_KEY: 'xkeysib-...',        // ✓ Updated
  
  SENDER_EMAIL: 'newsletter@ajyl.online',    // ✓ Correct
  SENDER_NAME: 'AJYL Newsletter',            // ✓ Correct
  ADMIN_EMAIL: 'your-email@gmail.com',       // ✓ Updated
  BREVO_LIST_ID: 2,                          // ✓ Updated
  
  SHEET_NAME: 'Newsletter Schedule',   // ✓ Matches sheet tab
  TIMEZONE: 'Asia/Kolkata',            // ✓ IST confirmed
  
  // ... rest of config
};
```

**Verification checklist:**
- [ ] GEMINI_API_KEY updated with actual key
- [ ] APIFY_API_KEY updated with actual token
- [ ] BREVO_API_KEY updated with actual key
- [ ] SENDER_EMAIL is `newsletter@ajyl.online`
- [ ] ADMIN_EMAIL is your personal email
- [ ] BREVO_LIST_ID matches your list ID
- [ ] SHEET_NAME matches your sheet tab name exactly
- [ ] TIMEZONE is 'Asia/Kolkata' (IST)

---

### Authorization
- [ ] Saved script (Ctrl+S or Cmd+S)
- [ ] Selected `initializeSheet` function
- [ ] Clicked Run (▶️)
- [ ] Completed authorization flow:
  - [ ] Clicked "Review permissions"
  - [ ] Selected Google account
  - [ ] Clicked "Advanced"
  - [ ] Clicked "Go to NewsletterAutomation (unsafe)"
  - [ ] Clicked "Allow"
- [ ] Function completed successfully
- [ ] Received email: "Newsletter Sheet Initialized"

---

### Trigger Installation
- [ ] Selected `setupTriggers` function
- [ ] Clicked Run (▶️)
- [ ] Function completed (5-10 seconds)
- [ ] Received email: "Newsletter Automation System Activated"
- [ ] Verified triggers installed:
  - [ ] Opened Triggers tab (⏰ icon)
  - [ ] Saw: `runAutomationCheck` - Time-driven - Hour timer

---

## 🧪 Part 6: Testing

### API Connection Tests
- [ ] Selected `testAPIs` function
- [ ] Clicked Run (▶️)
- [ ] Received email: "API Test Results"
- [ ] All APIs show ✅ Connected:
  - [ ] ✅ Gemini API: Connected
  - [ ] ✅ Apify API: Connected
  - [ ] ✅ Brevo API: Connected

**If any failed:** See Troubleshooting Guide section on [API Connection Errors]

---

### Complete Workflow Test
- [ ] Selected `testCompleteWorkflow` function
- [ ] Clicked Run (▶️)
- [ ] Execution completed without errors (60-90 seconds)
- [ ] Reviewed execution logs (Executions tab)
- [ ] No red ❌ errors present

---

### Manual Draft Generation Test
**Optional but recommended:**

- [ ] Selected `generateNewsletterDrafts` function
- [ ] Clicked Run
- [ ] Draft appeared in Column B (first empty theme row)
- [ ] Column C changed to "PENDING_APPROVAL" (yellow)
- [ ] Column F shows system log with timestamps
- [ ] Received approval notification email

---

### Approval Workflow Test
- [ ] Found row with "PENDING_APPROVAL" status
- [ ] Reviewed content in Column B
- [ ] Typed `APPROVED` in Column C
- [ ] Column C background changed to green
- [ ] Ready for publish

---

### Manual Publish Test
**Only if you want to test sending immediately:**

- [ ] Selected `publishNewsletters` function
- [ ] Clicked Run
- [ ] Status changed to "SENT" (blue background)
- [ ] Timestamp added to Column D
- [ ] Received newsletter email
- [ ] Checked Brevo dashboard for send confirmation

**⚠️ Warning:** This sends to real subscribers if using `sendToBrevoList`. Use test mode for initial testing.

---

## 🚀 Part 7: Go-Live Verification

### Pre-Launch Final Checks

**Monday (Day Before First Newsletter):**
- [ ] System is running (no manual intervention needed)
- [ ] Triggers are active (checked Triggers tab)
- [ ] At least 4 themes ready in Column A
- [ ] No existing drafts blocking new generation
- [ ] Admin email receiving notifications correctly

---

### Launch Day (First Tuesday)

**Monday 9:45 AM IST - Draft Generation:**
- [ ] Received "Newsletter Draft Ready for Review" email
- [ ] Draft visible in Column B
- [ ] Status shows "PENDING_APPROVAL"
- [ ] Content looks good (no errors)

**Monday 12:00 PM - First Reminder:**
- [ ] Received reminder email (if not approved yet)

**Tuesday 9:45 AM - Publish:**
- [ ] Newsletter sent to subscribers
- [ ] Status changed to "SENT"
- [ ] Timestamp recorded
- [ ] Received confirmation email
- [ ] Subscribers received email

---

## 🌐 Part 8: Website Integration

### Landing Page Update
- [ ] Opened index.html for editing
- [ ] Added newsletter subscription section
- [ ] Inserted Brevo form URL
- [ ] Tested subscribe button redirects correctly
- [ ] Deployed changes to ajyl.online

---

### Footer Link
- [ ] Added "Subscribe to Newsletter" link to footer
- [ ] Link points to Brevo form
- [ ] Tested on mobile and desktop

---

### Optional: Newsletter Page
- [ ] Created /newsletter.html
- [ ] Added benefits section
- [ ] Embedded signup form
- [ ] Added sample content preview
- [ ] Linked from main navigation

---

## 📈 Part 9: Monitoring Setup

### Daily Monitoring
Set up routine to check:
- [ ] Email notifications (errors or confirmations)
- [ ] Execution logs in Apps Script (if issues)

---

### Weekly Monitoring
- [ ] Check Brevo dashboard every Monday
- [ ] Review open rates and click rates
- [ ] Verify subscriber growth
- [ ] Check for bounce/spam complaints

---

### Monthly Review
- [ ] Review entire month's newsletters
- [ ] Identify best-performing themes
- [ ] Plan next month's topics
- [ ] Update prompts if needed
- [ ] Review free tier usage (all services)

---

## 🔐 Security Checklist

- [ ] API keys stored only in Apps Script (not shared publicly)
- [ ] Google Sheet permissions set to "Only me" (not public)
- [ ] Apps Script project not shared with others
- [ ] Domain DNS records have no public editing access
- [ ] Brevo account has 2FA enabled (recommended)
- [ ] Google account has 2FA enabled (recommended)

---

## 💰 Cost Verification

Confirm all services are on free tier:

- [ ] **Google Gemini:** Free (60 RPM)
- [ ] **Apify:** Free ($5/month credit)
- [ ] **Brevo:** Free (300 emails/day)
- [ ] **Google Apps Script:** Free (20,000 calls/day)
- [ ] **Google Sheets:** Free (included with Google account)
- [ ] **Domain (ajyl.online):** Already paid/owned

**Total Monthly Cost: ₹0** ✅

---

## 📞 Support Resources

Have these bookmarked:

- [ ] Setup Guide: `newsletter-automation/docs/SETUP_GUIDE.md`
- [ ] Troubleshooting Guide: `newsletter-automation/docs/TROUBLESHOOTING_GUIDE.md`
- [ ] Google Apps Script dashboard: https://script.google.com
- [ ] Brevo dashboard: https://app.brevo.com
- [ ] Apify console: https://console.apify.com
- [ ] Google AI Studio: https://makersuite.google.com

---

## ✅ Final Sign-Off

Before considering setup complete:

- [ ] All sections above are checked off
- [ ] All API tests pass (✅ green checkmarks)
- [ ] First test newsletter generated successfully
- [ ] First test newsletter sent successfully
- [ ] Received all notification emails correctly
- [ ] Domain verified in Brevo
- [ ] Triggers running automatically
- [ ] No errors in execution logs
- [ ] Subscribers can sign up via form
- [ ] Ready for production use

---

## 🎯 Success Criteria

You'll know the system is working when:

1. **Monday 9:45 AM IST:**
   - You receive draft notification email
   - Draft appears in Google Sheet Column B
   - Status is "PENDING_APPROVAL"

2. **Monday (if not approved):**
   - Reminder emails at 12 PM, 6 PM, 10 PM

3. **Tuesday 9:45 AM IST:**
   - Newsletter sends to subscribers
   - Status changes to "SENT"
   - Timestamp recorded
   - You receive confirmation email

4. **Repeat on Wednesday/Thursday:**
   - Same process for second weekly newsletter

---

## 🔄 Ongoing Maintenance Checklist

### Weekly Tasks
- [ ] Review sent newsletter in Brevo
- [ ] Check open/click rates
- [ ] Plan next 2-3 themes
- [ ] Review any error emails

### Monthly Tasks
- [ ] Review all sent newsletters
- [ ] Analyze best-performing content
- [ ] Update future themes
- [ ] Check free tier limits
- [ ] Backup Google Sheet (Download → CSV)

### Quarterly Tasks
- [ ] Review overall strategy
- [ ] Survey subscribers (optional)
- [ ] Update prompt templates if needed
- [ ] Optimize based on learnings

---

**Print this checklist and check off items as you complete them. Keep it handy for reference during setup!**

---

**Setup Date:** _______________

**Completed By:** _______________

**First Newsletter Sent:** _______________

**Notes:**
____________________________________________
____________________________________________
____________________________________________
____________________________________________
