# Newsletter Automation - Quick Reference Card

**Print this page and keep it handy!**

---

## 📍 First Time Here?

**START → [START_HERE.md](START_HERE.md)**

Choose your path:
- Fast (60 min): [QUICK_START.md](QUICK_START.md)
- Detailed (90 min): [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

---

## 🔑 API Keys Needed

| API | URL | Key Format |
|-----|-----|------------|
| **Gemini** | https://makersuite.google.com/app/apikey | `AIza...` |
| **Apify** | https://apify.com (Settings → Integrations) | `apify_api_...` |
| **Brevo** | https://www.brevo.com (SMTP & API) | `xkeysib-...` |

---

## 📅 Default Schedule

| Day | Time | Action |
|-----|------|--------|
| **Monday** | 9:45 AM IST | Generate draft for Tuesday |
| **Tuesday** | 9:45 AM IST | Publish newsletter |
| **Wednesday** | 9:45 AM IST | Generate draft for Thursday |
| **Thursday** | 9:45 AM IST | Publish newsletter |

**Reminders:** 12 PM, 6 PM, 10 PM (if not approved)

---

## 🎯 Key Functions (Apps Script)

### Setup (Run Once)
```javascript
initializeSheet()    // Format Google Sheet
setupTriggers()      // Install automation
```

### Testing
```javascript
testAPIs()                  // Check all APIs
testCompleteWorkflow()      // End-to-end test
```

### Manual Operations
```javascript
generateNewsletterDrafts()  // Generate now
publishNewsletters()        // Publish now
```

---

## 📊 Google Sheet Columns

| Column | Name | Purpose |
|--------|------|---------|
| **A** | Newsletter Theme | Your input |
| **B** | Generated Content | Auto-filled |
| **C** | Approval Status | Type "APPROVED" |
| **D** | Publish Timestamp | Auto-filled |
| **E** | Notes | Optional |
| **F** | System Log | Auto-filled |

### Status Colors
- 🟡 Yellow = PENDING_APPROVAL
- 🟢 Green = APPROVED
- 🔵 Blue = SENT
- 🔴 Red = ERROR

---

## ⚙️ Configuration (CONFIG in script)

```javascript
GEMINI_API_KEY: 'YOUR_KEY',
APIFY_API_KEY: 'YOUR_KEY',
BREVO_API_KEY: 'YOUR_KEY',
ADMIN_EMAIL: 'your@email.com',
SENDER_EMAIL: 'newsletter@ajyl.online',
BREVO_LIST_ID: 2,  // Your list ID
SHEET_NAME: 'Newsletter Schedule',
TIMEZONE: 'Asia/Kolkata',
```

---

## 🚨 Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| No draft generated | Check triggers installed |
| API error | Verify API keys (no spaces) |
| Email not sending | Verify domain in Brevo |
| Domain not verified | Wait 2 hours after DNS |
| Script timeout | Reduce Apify wait time |

**Full guide:** [docs/TROUBLESHOOTING_GUIDE.md](docs/TROUBLESHOOTING_GUIDE.md)

---

## 📞 Important URLs

| Service | Dashboard |
|---------|-----------|
| **Apps Script** | https://script.google.com |
| **Brevo** | https://app.brevo.com |
| **Apify** | https://console.apify.com |
| **Gemini** | https://makersuite.google.com |
| **Hostinger** | https://hpanel.hostinger.com |

---

## 🔄 Weekly Workflow

### Monday 9:45 AM
1. Receive draft email
2. Open Google Sheet
3. Review Column B
4. Type "APPROVED" in Column C (optional)

### Tuesday 9:45 AM
1. Newsletter auto-publishes
2. Check Brevo dashboard
3. Verify subscribers received

**Repeat Wednesday/Thursday**

**Time: 5 minutes/week**

---

## 💰 Free Tier Limits

| Service | Limit | Our Usage |
|---------|-------|-----------|
| Gemini | 60/min | 2/week ✅ |
| Apify | $5/month | $0.80 ✅ |
| Brevo | 300/day | 16/week ✅ |
| Apps Script | 20k/day | 200/day ✅ |

**All FREE up to 1,000 subscribers**

---

## 📋 Pre-Launch Checklist

- [ ] All 3 API keys configured
- [ ] Domain verified in Brevo
- [ ] Triggers installed
- [ ] testAPIs() passed
- [ ] Test newsletter sent
- [ ] 52 themes in sheet
- [ ] Signup form on website

**Full list:** [docs/CONFIGURATION_CHECKLIST.md](docs/CONFIGURATION_CHECKLIST.md)

---

## 📚 Documentation Map

| File | Purpose | When to Use |
|------|---------|-------------|
| **START_HERE.md** | Entry point | First visit |
| **QUICK_START.md** | Fast setup | Getting started |
| **README.md** | Overview | Understanding system |
| **SETUP_GUIDE.md** | Detailed setup | Step-by-step |
| **TROUBLESHOOTING_GUIDE.md** | Fix issues | When stuck |
| **CONFIGURATION_CHECKLIST.md** | Verify setup | Before launch |
| **WEBSITE_INTEGRATION.md** | Add signup | After setup |

---

## 🎯 Support Priority

**First:** Read documentation
1. Check [docs/TROUBLESHOOTING_GUIDE.md](docs/TROUBLESHOOTING_GUIDE.md)
2. Run `testAPIs()` in Apps Script
3. Check execution logs (Apps Script → Executions)

**Second:** Verify configuration
1. Review [docs/CONFIGURATION_CHECKLIST.md](docs/CONFIGURATION_CHECKLIST.md)
2. Check API keys (no extra spaces)
3. Verify domain status in Brevo

**Third:** Manual recovery
1. Run `generateNewsletterDrafts()` manually
2. Check Column F for error logs
3. Review email notifications

---

## ⚡ Emergency Procedures

### System Not Working on Newsletter Day?

**Immediate Fix:**
```javascript
function emergencySend() {
  const theme = 'YOUR THEME';
  const content = 'COPY FROM COLUMN B';
  sendNewsletterViaBrevo(theme, content);
}
```

**Or:**
1. Log in to Brevo
2. Create campaign manually
3. Paste content
4. Send

**Then:** Diagnose issue after sending

---

## 🎨 Customization Quick Tips

**Change schedule:**
```javascript
PUBLISH_DAYS: [2, 4],  // [1,3,5] for Mon/Wed/Fri
PUBLISH_HOUR: 9,       // Change hour
```

**Change content style:**
- Edit `buildNewsletterPrompt()` function
- Modify ICP and FOCUS in CONFIG

**Change email design:**
- Edit `wrapNewsletterHTML()` function
- Use templates/email-templates.html

---

## 📊 Success Metrics (Track in Brevo)

| Metric | Target | Good | Needs Work |
|--------|--------|------|------------|
| **Open Rate** | 20-30% | >25% | <15% |
| **Click Rate** | 2-5% | >3% | <1% |
| **Unsubscribe** | <0.5% | <0.3% | >1% |
| **Bounce** | <2% | <1% | >3% |

---

## 🚀 Next Steps After Setup

1. ✅ Add signup to website ([WEBSITE_INTEGRATION.md](docs/WEBSITE_INTEGRATION.md))
2. ✅ Share on LinkedIn
3. ✅ Add to email signature
4. ✅ Build subscriber list
5. ✅ Monitor first sends
6. ✅ Optimize based on data

---

## 💡 Pro Tips

1. **Review first 5 newsletters** closely, then trust the system
2. **Backup Google Sheet** monthly (Download → CSV)
3. **Keep 4-8 weeks ahead** in theme planning
4. **Track what works** (best themes, open rates)
5. **Refine prompts** based on subscriber feedback

---

## 🎉 You're All Set!

**Setup time:** 60-90 minutes  
**Weekly time:** 5 minutes  
**Monthly cost:** ₹0  
**Value:** Priceless  

**Questions?** Check the comprehensive guides in `/docs/`

**Ready to launch?** Follow [START_HERE.md](START_HERE.md)

---

**Keep this reference handy for quick lookups!**

*Last updated: January 2024*
