# Newsletter Automation System - Troubleshooting Guide

This guide covers common issues and their solutions. Issues are organized by symptom.

---

## Quick Diagnostic Checklist

Before diving into specific issues, run through this checklist:

- [ ] All API keys are correctly entered in CONFIG section
- [ ] Domain is verified in Brevo (green checkmark)
- [ ] Triggers are installed in Apps Script
- [ ] Sheet name matches CONFIG.SHEET_NAME
- [ ] Your timezone is set correctly (IST/Asia/Kolkata)
- [ ] Free tier limits haven't been exceeded

---

## Table of Contents

1. [Setup Issues](#setup-issues)
2. [API Connection Errors](#api-connection-errors)
3. [Draft Generation Problems](#draft-generation-problems)
4. [Email Issues](#email-issues)
5. [Scheduling Problems](#scheduling-problems)
6. [Content Quality Issues](#content-quality-issues)
7. [Performance Issues](#performance-issues)
8. [Quota and Limit Errors](#quota-and-limit-errors)

---

## Setup Issues

### ❌ "Sheet not found" Error

**Symptom:** Script fails with `Sheet "Newsletter Schedule" not found`

**Cause:** Sheet name doesn't match CONFIG.SHEET_NAME

**Solution:**
1. Check your sheet tab name (bottom of Google Sheet)
2. Update CONFIG.SHEET_NAME in script to match exactly
3. Or rename your sheet tab to match CONFIG

```javascript
SHEET_NAME: 'Newsletter Schedule',  // Must match tab name exactly (case-sensitive)
```

---

### ❌ Authorization Failed

**Symptom:** "Authorization required" won't complete

**Causes:**
- Pop-up blocker preventing authorization
- Using incognito mode
- Corporate Google Workspace with restrictions

**Solutions:**

**For Pop-up Blocker:**
1. Allow pop-ups from script.google.com
2. Try authorization again

**For Incognito Mode:**
1. Switch to regular browser window
2. Authorize there

**For Corporate Account:**
1. Use personal Google account instead
2. Or contact IT to allow Apps Script permissions
3. Or use a separate personal account for automation

---

### ❌ Triggers Won't Install

**Symptom:** `setupTriggers()` runs but no triggers appear

**Causes:**
- Script not saved before running
- Authorization incomplete
- Apps Script quota exceeded (rare)

**Solutions:**
1. Save script (Ctrl+S) before running
2. Re-authorize the script
3. Delete existing triggers manually:
   - Apps Script → Triggers (⏰ icon)
   - Click ⋮ next to each trigger
   - Delete
   - Run `setupTriggers()` again

---

## API Connection Errors

### ❌ Gemini API: "API key not valid"

**Error Code:** 400

**Causes:**
- API key copied incorrectly (spaces, line breaks)
- API key doesn't have proper permissions
- Gemini API not enabled

**Solutions:**

1. **Verify API Key:**
   - Go to https://makersuite.google.com/app/apikey
   - Copy key again carefully
   - Paste in CONFIG (no spaces before/after)

2. **Generate New Key:**
   - Delete old key in Google AI Studio
   - Create new key
   - Update script

3. **Test Manually:**
   ```javascript
   function testGemini() {
     const prompt = 'Say hello';
     const result = callGeminiAPI(prompt);
     Logger.log(result);
   }
   ```

---

### ❌ Apify API: "Unauthorized" or "Invalid token"

**Error Code:** 401

**Causes:**
- API token expired or invalid
- Token doesn't have required permissions
- Free tier exhausted (rare)

**Solutions:**

1. **Verify Token:**
   - Log in to Apify: https://console.apify.com/
   - Settings → Integrations → API tokens
   - Copy "Personal API token"
   - Update CONFIG.APIFY_API_KEY

2. **Check Free Tier:**
   - Apify dashboard → Billing
   - Verify you have credit remaining
   - Free tier: $5/month (renews monthly)

3. **Generate New Token:**
   - Apify → Settings → Integrations
   - Create new token
   - Update script

---

### ❌ Brevo API: "Unauthorized" (401)

**Error Code:** 401

**Causes:**
- API key incorrect
- API key doesn't have email sending permissions
- Domain not verified

**Solutions:**

1. **Verify API Key:**
   - Brevo dashboard → SMTP & API
   - Copy API key v3
   - Update CONFIG.BREVO_API_KEY

2. **Check Permissions:**
   - When generating API key, ensure "Send emails" is checked
   - If not, generate new key with correct permissions

3. **Verify Domain:**
   - Brevo → Senders, Domains & Dedicated IPs → Domains
   - ajyl.online should show green checkmark
   - If not, see [Domain Verification Issues](#-domain-not-verifying-in-brevo)

---

### ❌ Brevo API: "Sender not found" (404)

**Error Code:** 404

**Causes:**
- Sender email not verified in Brevo
- Wrong sender email in CONFIG

**Solutions:**

1. **Add Sender:**
   - Brevo → Senders, Domains & Dedicated IPs → Senders
   - Click "Add a sender"
   - Email: newsletter@ajyl.online
   - Verify via confirmation link

2. **Update CONFIG:**
   ```javascript
   SENDER_EMAIL: 'newsletter@ajyl.online',  // Must match verified sender
   ```

---

## Draft Generation Problems

### ❌ No Drafts Generated on Monday

**Symptom:** Monday 9:45 AM passes, nothing happens

**Causes:**
- Trigger not running
- Timezone misconfiguration
- No themes in sheet
- Themes already have content

**Solutions:**

1. **Check Trigger Execution:**
   - Apps Script → Executions (▶️ icon)
   - Look for executions around 9:45 AM
   - If none, trigger isn't installed → Run `setupTriggers()`

2. **Verify Timezone:**
   ```javascript
   TIMEZONE: 'Asia/Kolkata',  // Must be IST
   ```
   - Check your Google Calendar timezone matches
   - Google Apps Script inherits from your account timezone

3. **Check Sheet Data:**
   - Column A must have themes
   - Column B should be empty (if not, it skips)
   - Column C should be empty (if not, it skips)

4. **Manual Test:**
   ```javascript
   // Run this function to test immediately
   function manualDraftTest() {
     generateNewsletterDrafts();
   }
   ```

---

### ❌ Draft Generation Stuck at "GENERATING..."

**Symptom:** Status changes to "GENERATING..." but never completes

**Causes:**
- Apify scraping timeout (60 seconds)
- Gemini API rate limit hit
- Script execution timeout (6 minutes max)
- Network error

**Solutions:**

1. **Check Execution Logs:**
   - Apps Script → Executions
   - Find the stuck execution
   - Look for error messages

2. **Reduce Apify Timeout:**
   - Find `scrapeDataWithApify()` function
   - Reduce `maxPagesPerQuery` to 3
   - Reduce timeout attempts to 20

3. **Use Fallback Data:**
   - Script should auto-fallback if Apify fails
   - If not, check try-catch in `scrapeDataWithApify()`

4. **Manual Recovery:**
   - Change status from "GENERATING..." to "" (empty)
   - Run `generateNewsletterDrafts()` again

---

### ❌ Generated Content is Empty or Error

**Symptom:** Column B is empty or shows "ERROR"

**Causes:**
- Gemini API failed
- Content blocked by safety filters
- Network error

**Solutions:**

1. **Check System Log (Column F):**
   - Look for specific error message
   - Common: "Gemini generation failed: [reason]"

2. **Test Gemini Directly:**
   ```javascript
   function testGeminiDirect() {
     const theme = 'Test Newsletter Theme';
     const data = [{title: 'Test', description: 'Test data'}];
     const content = generateNewsletterContent(theme, data);
     Logger.log(content);
   }
   ```

3. **Check Theme Content:**
   - Avoid controversial topics (may trigger safety filters)
   - Themes should be professional and career-focused

4. **Retry:**
   - Clear Column B and Column C
   - Run `generateNewsletterDrafts()` again

---

## Email Issues

### ❌ No Approval Notification Received

**Symptom:** Draft generated but no email notification

**Causes:**
- ADMIN_EMAIL incorrect in CONFIG
- Email in spam folder
- MailApp quota exceeded (100/day)
- Corporate email blocking

**Solutions:**

1. **Check Spam Folder:**
   - Look for emails from "me@google.com" (Apps Script default sender)
   - Mark as "Not Spam"

2. **Verify ADMIN_EMAIL:**
   ```javascript
   ADMIN_EMAIL: 'your-correct-email@example.com',
   ```

3. **Check Quota:**
   - Apps Script → Executions → Quotas
   - "Email recipients" should be under 100/day

4. **Test Email Manually:**
   ```javascript
   function testEmailSend() {
     sendEmail(
       CONFIG.ADMIN_EMAIL,
       'Test Email',
       '<p>If you receive this, emails are working!</p>'
     );
   }
   ```

---

### ❌ Reminder Emails Not Sending

**Symptom:** Draft created, no reminders at 12 PM, 6 PM, 10 PM

**Causes:**
- Reminder timing logic incorrect
- Execution log missing generation timestamp
- Trigger not running hourly

**Solutions:**

1. **Verify Triggers:**
   - Apps Script → Triggers
   - Should have hourly trigger for `runAutomationCheck`

2. **Check Execution History:**
   - Apps Script → Executions
   - Filter by "runAutomationCheck"
   - Should run every hour

3. **Manual Reminder Test:**
   ```javascript
   function testReminders() {
     checkAndSendReminders();
   }
   ```

4. **Check System Log (Column F):**
   - Should show "Reminder 1 sent", "Reminder 2 sent", etc.
   - If missing, reminders aren't being triggered

---

### ❌ Newsletter Not Sending to Subscribers

**Symptom:** Status changes to "SENT" but subscribers don't receive

**Causes:**
- Sending to admin email only (test mode)
- Brevo list ID incorrect
- List has no subscribers
- Using transactional API instead of campaign API

**Solutions:**

1. **Check Brevo Dashboard:**
   - Campaigns → All campaigns
   - Look for sent campaigns
   - Check recipient count

2. **Switch to List Sending:**
   - In script, replace `sendNewsletterViaBrevo()` with `sendToBrevoList()`
   - Line ~650 in `publishNewsletters()` function

3. **Verify List ID:**
   - Brevo → Contacts → Lists
   - Click your list, check URL: `...lists/[ID]`
   - Update CONFIG.BREVO_LIST_ID

4. **Add Test Subscribers:**
   - Brevo → Contacts
   - Manually add 2-3 test emails
   - Try sending again

---

## Scheduling Problems

### ❌ Wrong Publish Time

**Symptom:** Newsletters sending at wrong time (not 9:45 AM IST)

**Causes:**
- Timezone mismatch
- Server time vs. local time confusion
- Trigger timing incorrect

**Solutions:**

1. **Verify Account Timezone:**
   - Google Calendar → Settings → General → Time zone
   - Should be: "(GMT+05:30) India Standard Time - Kolkata"

2. **Update Script Timezone:**
   ```javascript
   TIMEZONE: 'Asia/Kolkata',
   ```

3. **Test Current Time:**
   ```javascript
   function checkTimezone() {
     const now = new Date();
     Logger.log('Current time: ' + now.toString());
     Logger.log('Hour: ' + now.getHours());
     Logger.log('Day: ' + now.getDay());
   }
   ```

4. **Manual Publish Test:**
   ```javascript
   function testPublishNow() {
     publishNewsletters();
   }
   ```

---

### ❌ Publishing on Wrong Days

**Symptom:** Newsletters sending on days other than Tuesday/Thursday

**Causes:**
- PUBLISH_DAYS configuration incorrect
- Day calculation logic error

**Solutions:**

1. **Verify PUBLISH_DAYS:**
   ```javascript
   PUBLISH_DAYS: [2, 4],  // 0=Sunday, 1=Monday, 2=Tuesday, ..., 4=Thursday
   ```

2. **Check Day Logic:**
   - In `runAutomationCheck()` function
   - Ensure day comparisons use correct values

3. **Add Debug Logging:**
   ```javascript
   function debugSchedule() {
     const now = new Date();
     Logger.log('Current day: ' + now.getDay());  // 0-6
     Logger.log('Expected publish days: ' + CONFIG.PUBLISH_DAYS);
   }
   ```

---

## Content Quality Issues

### ❌ Content is Too Generic

**Symptom:** Generated newsletters lack specificity or relevance

**Causes:**
- Apify scraping returned poor results
- Theme too broad
- Gemini prompt needs refinement

**Solutions:**

1. **Improve Theme Specificity:**
   - Bad: "Career advice"
   - Good: "Salary negotiation for 15-year experienced tech professionals in Bangalore"

2. **Edit Prompt Template:**
   - Find `buildNewsletterPrompt()` function
   - Add more specific instructions
   - Include examples of desired output style

3. **Enhance ICP Description:**
   ```javascript
   ICP: 'mid-career professionals in Indian metros (Bangalore, Mumbai, Delhi, Pune) with 12-18 years of experience in tech/product roles, typically at Senior/Staff/Principal level, making ₹40-80 LPA, managing teams of 5-15 people',
   ```

4. **Manual Content Review:**
   - Approve drafts you like
   - Edit poor drafts before approving
   - Use good examples to refine prompts

---

### ❌ Content Contains Errors or Hallucinations

**Symptom:** Generated content has factual errors or made-up data

**Causes:**
- Gemini generating without sufficient context
- Scraped data misleading
- Prompt asking for specific data it doesn't have

**Solutions:**

1. **Add Verification Step:**
   - Always review drafts before approving
   - Check any specific numbers or claims
   - Edit in Column B before approving

2. **Adjust Prompt:**
   - Add: "Only include factual information. If you don't have specific data, provide general guidance instead."
   - Reduce temperature (more conservative):
     ```javascript
     temperature: 0.5,  // Lower = more factual
     ```

3. **Use Auto-Publish Cautiously:**
   - For critical newsletters, always manual approve
   - Reserve auto-publish for less sensitive content

---

### ❌ Content is Too Long/Short

**Symptom:** Newsletters are consistently too long (10+ min read) or too short (1 min)

**Causes:**
- Gemini maxOutputTokens setting
- Prompt instructions unclear about length

**Solutions:**

1. **Adjust Token Limit:**
   - In `callGeminiAPI()` function:
     ```javascript
     maxOutputTokens: 1500,  // Decrease for shorter content
     maxOutputTokens: 3000,  // Increase for longer content
     ```
   - 1000 tokens ≈ 750 words

2. **Add Length Instructions:**
   - In `buildNewsletterPrompt()`:
     ```
     TARGET LENGTH: 800-1200 words (5-7 minute read)
     ```

3. **Specify Structure:**
   ```
   STRUCTURE:
   - Opening: 100 words
   - Section 1: 200 words
   - Section 2: 200 words
   - Section 3: 200 words
   - Closing & CTA: 100 words
   ```

---

## Performance Issues

### ⏱️ Script Execution Timeout

**Error:** `Exceeded maximum execution time`

**Causes:**
- Apify scraping taking too long (>60 seconds)
- Multiple drafts generating simultaneously
- Network latency

**Solutions:**

1. **Reduce Apify Wait Time:**
   - In `scrapeDataWithApify()`:
     ```javascript
     let attempts = 0;
     while (status === 'RUNNING' && attempts < 20) {  // Reduced from 30
       Utilities.sleep(2000);
       // ...
     }
     ```

2. **Process One Theme at a Time:**
   - Modify `generateNewsletterDrafts()` to process only first pending theme
   - Let hourly trigger handle next themes

3. **Use Fallback Faster:**
   - Reduce Apify timeout
   - Accept fallback data more readily

4. **Split into Multiple Runs:**
   - Generate drafts on Monday 9:45 AM
   - Generate drafts on Wednesday 9:45 AM
   - Don't try to generate multiple at once

---

### ⏱️ Apify Scraping Always Timing Out

**Symptom:** Apify consistently fails with timeout

**Causes:**
- Apify actor taking longer than expected
- Free tier slower performance
- Search query too broad

**Solutions:**

1. **Use Simpler Actor:**
   - Replace Google Search Scraper with simpler one
   - Or skip Apify entirely (use fallback)

2. **Disable Apify Temporarily:**
   - In `scrapeDataWithApify()`, immediately return fallback:
     ```javascript
     function scrapeDataWithApify(theme) {
       Logger.log('⚠️ Apify disabled, using fallback');
       return [{
         title: 'Manual research needed',
         description: 'Newsletter generated from theme only.',
         url: ''
       }];
     }
     ```

3. **Accept Fallback Content:**
   - Gemini can generate good content from theme alone
   - Apify data is enhancement, not requirement

---

## Quota and Limit Errors

### ❌ "Service invoked too many times"

**Error:** UrlFetchApp quota exceeded

**Causes:**
- Too many API calls in 24 hours
- Free tier limit: 20,000/day (rarely hit)

**Solutions:**

1. **Check Quota Usage:**
   - Apps Script → Executions → Quotas
   - See current usage

2. **Wait 24 Hours:**
   - Quotas reset daily (Pacific Time)

3. **Reduce API Calls:**
   - Cache Apify results
   - Don't regenerate same content multiple times

---

### ❌ Brevo "Daily limit exceeded"

**Error:** 300 emails per day limit reached

**Causes:**
- Too many sends in one day
- Multiple test sends counted

**Solutions:**

1. **Upgrade Brevo Plan:**
   - Free: 300/day
   - Lite: $25/month for unlimited
   - Or wait until next day (resets midnight UTC)

2. **Batch Subscribers:**
   - If >300 subscribers, split into multiple days
   - Or upgrade to paid plan

3. **Reduce Test Sends:**
   - Use Logger.log() instead of test emails
   - Only send real tests when needed

---

### ❌ Gemini "Resource exhausted"

**Error:** Rate limit exceeded (60 requests/minute)

**Causes:**
- Trying to generate multiple drafts too quickly
- Rapid testing

**Solutions:**

1. **Add Delays:**
   ```javascript
   Utilities.sleep(2000);  // Wait 2 seconds between API calls
   ```

2. **Space Out Generation:**
   - Generate one draft, wait a minute
   - Let hourly trigger handle spacing naturally

3. **Request Quota Increase:**
   - Google Cloud Console → APIs & Services
   - Request higher quota (usually approved quickly)

---

## Emergency Procedures

### 🚨 System Completely Broken Before Newsletter Day

**Scenario:** It's Tuesday morning, system isn't working, newsletter needs to send

**Emergency Fix:**

1. **Manual Newsletter Send:**
   ```javascript
   function emergencySend() {
     const theme = 'YOUR THEME HERE';
     const content = 'YOUR CONTENT HERE';  // Copy from Column B
     sendNewsletterViaBrevo(theme, content);
   }
   ```

2. **Quick Brevo Send:**
   - Log in to Brevo dashboard
   - Campaigns → Create campaign
   - Paste content manually
   - Send immediately

3. **Post-Crisis:**
   - Run `testAPIs()` to diagnose issues
   - Fix underlying problem
   - Document what went wrong

---

### 🚨 Sent Newsletter with Error to All Subscribers

**Scenario:** Approved wrong content, sent to everyone

**Immediate Actions:**

1. **Send Correction:**
   - Craft brief apology + correction email
   - Send via Brevo immediately
   - Example: "Quick correction to today's newsletter..."

2. **Learn & Prevent:**
   - Always preview in Column B before approving
   - Use test list for risky content
   - Add approval checklist to routine

---

## Diagnostic Functions

Add these to your script for debugging:

```javascript
/**
 * Comprehensive system diagnostic
 */
function runFullDiagnostic() {
  Logger.log('=== NEWSLETTER SYSTEM DIAGNOSTIC ===\n');
  
  // 1. Configuration
  Logger.log('1. CONFIGURATION:');
  Logger.log('   Gemini API Key: ' + (CONFIG.GEMINI_API_KEY.startsWith('AIza') ? '✅ Valid format' : '❌ Invalid format'));
  Logger.log('   Apify API Key: ' + (CONFIG.APIFY_API_KEY.startsWith('apify_api_') ? '✅ Valid format' : '❌ Invalid format'));
  Logger.log('   Brevo API Key: ' + (CONFIG.BREVO_API_KEY.startsWith('xkeysib-') ? '✅ Valid format' : '❌ Invalid format'));
  Logger.log('   Admin Email: ' + CONFIG.ADMIN_EMAIL);
  Logger.log('   Sender Email: ' + CONFIG.SENDER_EMAIL);
  Logger.log('   Timezone: ' + CONFIG.TIMEZONE);
  
  // 2. Sheet
  Logger.log('\n2. GOOGLE SHEET:');
  try {
    const sheet = getNewsletterSheet();
    const data = sheet.getDataRange().getValues();
    Logger.log('   ✅ Sheet found: ' + CONFIG.SHEET_NAME);
    Logger.log('   Rows: ' + data.length);
    Logger.log('   Themes: ' + data.filter(row => row[0]).length);
  } catch (e) {
    Logger.log('   ❌ Sheet error: ' + e.message);
  }
  
  // 3. Triggers
  Logger.log('\n3. TRIGGERS:');
  const triggers = ScriptApp.getProjectTriggers();
  Logger.log('   Installed: ' + triggers.length);
  triggers.forEach(t => {
    Logger.log('   - ' + t.getHandlerFunction());
  });
  
  // 4. APIs
  Logger.log('\n4. API TESTS:');
  testAPIs();
  
  // 5. Recent Executions
  Logger.log('\n5. RECENT ACTIVITY:');
  Logger.log('   Check Executions tab for detailed logs');
  
  Logger.log('\n=== END DIAGNOSTIC ===');
}

/**
 * Quick health check
 */
function quickHealthCheck() {
  const health = {
    apis: true,
    sheet: true,
    triggers: true
  };
  
  // Check APIs
  try {
    testBrevoConnection();
  } catch (e) {
    health.apis = false;
  }
  
  // Check sheet
  try {
    getNewsletterSheet();
  } catch (e) {
    health.sheet = false;
  }
  
  // Check triggers
  health.triggers = ScriptApp.getProjectTriggers().length > 0;
  
  // Report
  const status = (health.apis && health.sheet && health.triggers) ? '✅ ALL SYSTEMS OPERATIONAL' : '❌ ISSUES DETECTED';
  Logger.log(status);
  Logger.log('APIs: ' + (health.apis ? '✅' : '❌'));
  Logger.log('Sheet: ' + (health.sheet ? '✅' : '❌'));
  Logger.log('Triggers: ' + (health.triggers ? '✅' : '❌'));
  
  return health;
}
```

---

## Getting Additional Help

### Check Official Documentation

- **Google Apps Script:** https://developers.google.com/apps-script
- **Gemini API:** https://ai.google.dev/docs
- **Apify:** https://docs.apify.com/
- **Brevo:** https://developers.brevo.com/

### Review System Logs

- Apps Script → Executions
- Filter by date/function
- Look for red ❌ errors
- Click for stack trace

### Community Support

- **Stack Overflow:** Tag `google-apps-script`
- **Apify Forum:** https://community.apify.com/
- **Brevo Support:** https://help.brevo.com/

---

## Preventive Maintenance

Run these weekly to catch issues early:

```javascript
// Monday morning routine (before draft generation)
function weeklyCheck() {
  Logger.log('🔍 Weekly system check...');
  quickHealthCheck();
  testAPIs();
  Logger.log('✅ Weekly check complete');
}
```

Set a calendar reminder to manually run this every Monday at 9:00 AM (before automation runs).

---

## Last Resort: Full Reset

If everything is broken and you can't diagnose:

1. **Backup Data:**
   - File → Download → CSV (from Google Sheet)

2. **Delete All Triggers:**
   - Apps Script → Triggers
   - Delete everything

3. **Clear Script:**
   - Delete and re-paste fresh code

4. **Reconfigure:**
   - Update all API keys
   - Run `initializeSheet()`
   - Run `setupTriggers()`
   - Run `testAPIs()`

5. **Restore Data:**
   - File → Import (back into Google Sheet)

This gives you a clean slate without losing your themes and history.

---

**Remember:** Most issues are configuration errors (API keys, sheet names, emails). Double-check these first before diving deeper.
