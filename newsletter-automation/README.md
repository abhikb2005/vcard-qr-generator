# Newsletter Automation System

**A complete, zero-cost automated newsletter system powered by Google Apps Script, Gemini AI, Apify, and Brevo.**

---

## 🎯 Overview

This system automatically generates, approves, and publishes newsletters twice a week with minimal manual intervention. Perfect for busy professionals who want to maintain consistent email communication with their audience without the overhead.

### Key Features

- ✅ **Fully Automated**: Generates drafts 24 hours before publication
- ✅ **AI-Powered**: Uses Google Gemini for content generation
- ✅ **Data-Driven**: Scrapes current data via Apify for relevant insights
- ✅ **Approval Workflow**: Optional manual review with reminders
- ✅ **Auto-Publishing**: Sends even if not manually approved
- ✅ **Zero Cost**: Uses only free tiers of all services
- ✅ **Professional**: Custom domain email via Brevo
- ✅ **Reliable**: Built-in error handling and retry logic

---

## 📅 How It Works

### Weekly Schedule (Example: Tuesday & Thursday at 9:45 AM IST)

**Monday 9:45 AM:**
- System reads newsletter theme from Google Sheet
- Calls Apify to scrape relevant market data
- Calls Gemini AI to generate newsletter content
- Writes draft to Google Sheet
- Sends approval notification email to you

**Monday (Throughout the Day):**
- 12:00 PM: Reminder email if not approved
- 6:00 PM: Second reminder
- 10:00 PM: Final reminder with auto-publish warning

**Tuesday 9:45 AM:**
- If approved: Sends newsletter immediately
- If not approved: Sends anyway (auto-publish)
- Updates status to "SENT" with timestamp
- Repeats Wednesday/Thursday for second weekly newsletter

---

## 💰 Cost Breakdown

All services used are **completely free**:

| Service | Free Tier | Our Usage | Cost |
|---------|-----------|-----------|------|
| **Google Gemini** | 60 requests/min | ~2 requests/week | ₹0 |
| **Apify** | $5 credit/month | ~$0.80/month | ₹0 |
| **Brevo** | 300 emails/day | ~8-16/week | ₹0 |
| **Google Apps Script** | 20,000 calls/day | ~200/day | ₹0 |
| **Google Sheets** | Unlimited (with account) | 1 sheet | ₹0 |
| **Total** | - | - | **₹0/month** |

Supports up to **~1,000 subscribers** before hitting any limits.

---

## 📁 File Structure

```
newsletter-automation/
├── scripts/
│   └── NewsletterAutomation.gs     # Main Google Apps Script code
├── templates/
│   ├── google-sheet-template.csv   # 52-week theme template
│   └── email-templates.html        # Sample Brevo email templates
├── docs/
│   ├── SETUP_GUIDE.md              # Step-by-step setup instructions
│   ├── TROUBLESHOOTING_GUIDE.md    # Common issues and solutions
│   └── CONFIGURATION_CHECKLIST.md  # Pre-flight verification checklist
└── README.md                        # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Google Account (free)
- Domain with DNS access (e.g., ajyl.online via Hostinger)
- 60-90 minutes for initial setup

### Setup Steps

1. **Get API Keys** (15 min)
   - Google Gemini API: https://makersuite.google.com/app/apikey
   - Apify API: https://apify.com
   - Brevo API: https://www.brevo.com

2. **Configure Domain** (20 min)
   - Add DNS records for Brevo
   - Verify domain in Brevo
   - Set up sender email

3. **Create Google Sheet** (10 min)
   - Copy template structure
   - Add 52 newsletter themes
   - Format columns

4. **Install Script** (15 min)
   - Copy Apps Script code
   - Update API keys in CONFIG
   - Authorize permissions

5. **Test System** (20 min)
   - Run API tests
   - Generate test draft
   - Send test email

**Total Setup Time: ~60-90 minutes**

📖 **Detailed instructions:** See [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md)

---

## 📋 System Requirements

### APIs & Services

1. **Google Gemini API**
   - Free tier: 60 requests/minute
   - Used for: AI content generation
   - Get it: https://makersuite.google.com/app/apikey

2. **Apify API**
   - Free tier: $5 credit/month (renews)
   - Used for: Web scraping market data
   - Get it: https://apify.com

3. **Brevo (formerly Sendinblue)**
   - Free tier: 300 emails/day
   - Used for: Sending newsletters
   - Get it: https://www.brevo.com

4. **Google Apps Script**
   - Free tier: 20,000 executions/day
   - Used for: Automation orchestration
   - Built into Google Sheets

### Domain Requirements

- Custom domain (e.g., ajyl.online)
- DNS access to add TXT records
- Ability to verify domain ownership

---

## 🎨 Customization

### Changing Publication Schedule

Edit the CONFIG section in `NewsletterAutomation.gs`:

```javascript
const CONFIG = {
  // ...
  PUBLISH_DAYS: [2, 4],      // Change to [1, 3, 5] for Mon/Wed/Fri
  PUBLISH_HOUR: 9,           // Change to 10 for 10 AM
  PUBLISH_MINUTE: 45,        // Change to 0 for on the hour
  TIMEZONE: 'Asia/Kolkata',  // Change to your timezone
  // ...
};
```

### Customizing Content Style

Edit the prompt in `buildNewsletterPrompt()` function:

```javascript
function buildNewsletterPrompt(theme, scrapedData) {
  // Modify ICP, FOCUS, INSTRUCTIONS, STRUCTURE, etc.
  // Add your own style guidelines
  // Include examples of desired output
}
```

### Changing Email Design

1. Use templates in `templates/email-templates.html`
2. Edit `wrapNewsletterHTML()` function
3. Add your branding, colors, logo

---

## 🔧 Configuration

### Essential Settings (Must Update)

In `NewsletterAutomation.gs` CONFIG section:

```javascript
GEMINI_API_KEY: 'YOUR_ACTUAL_KEY_HERE',
APIFY_API_KEY: 'YOUR_ACTUAL_KEY_HERE',
BREVO_API_KEY: 'YOUR_ACTUAL_KEY_HERE',
ADMIN_EMAIL: 'your-email@example.com',
SENDER_EMAIL: 'newsletter@yourdomain.com',
BREVO_LIST_ID: 2,  // Your actual list ID
```

### Optional Settings (Can Keep Defaults)

```javascript
SHEET_NAME: 'Newsletter Schedule',
ICP: 'mid-career professionals in Indian metros...',
FOCUS: 'professional lifestyle, finances...',
REMINDER_TIMES: [2.25, 8.25, 12.25],  // Hours after draft
```

---

## 📊 Google Sheet Structure

| Column | Name | Purpose | Example |
|--------|------|---------|---------|
| A | Newsletter Theme | User input | "Salary Negotiation for Mid-Career..." |
| B | Generated Content | Auto-populated | HTML email content |
| C | Approval Status | User/System | PENDING_APPROVAL → APPROVED → SENT |
| D | Publish Timestamp | Auto-populated | "2024-01-16 09:45:00" |
| E | Notes | User input (optional) | "Changed CTA link" |
| F | System Log | Auto-populated | Execution history & errors |

### Status Colors

- 🟡 Yellow: PENDING_APPROVAL
- 🟢 Green: APPROVED
- 🔵 Blue: SENT
- 🔴 Red: ERROR

---

## 🧪 Testing

### Run Built-in Tests

In Google Apps Script:

1. **Test API Connections:**
   ```javascript
   testAPIs()  // Verifies all 3 APIs are working
   ```

2. **Test Complete Workflow:**
   ```javascript
   testCompleteWorkflow()  // End-to-end test
   ```

3. **Manual Draft Generation:**
   ```javascript
   generateNewsletterDrafts()  // Generate draft immediately
   ```

4. **Manual Publishing:**
   ```javascript
   publishNewsletters()  // Send pending newsletters now
   ```

### Verify Triggers

Apps Script → Triggers tab should show:
- `runAutomationCheck` running every hour

---

## 🐛 Troubleshooting

### Common Issues

**Problem:** No drafts generated on Monday
- Check triggers are installed
- Verify timezone is correct (IST)
- Ensure themes exist in Column A with empty B/C

**Problem:** API errors
- Verify API keys are correct (no extra spaces)
- Check free tier limits haven't been exceeded
- Test each API individually with `testAPIs()`

**Problem:** Emails not sending
- Verify domain is verified in Brevo (green checkmark)
- Check sender email is verified
- Ensure ADMIN_EMAIL is correct

📖 **Full troubleshooting guide:** See [`docs/TROUBLESHOOTING_GUIDE.md`](docs/TROUBLESHOOTING_GUIDE.md)

---

## 📚 Documentation

- **[Setup Guide](docs/SETUP_GUIDE.md)** - Complete step-by-step setup instructions
- **[Troubleshooting Guide](docs/TROUBLESHOOTING_GUIDE.md)** - Solutions to common problems
- **[Configuration Checklist](docs/CONFIGURATION_CHECKLIST.md)** - Pre-launch verification
- **[Email Templates](templates/email-templates.html)** - Sample Brevo email designs

---

## 🔐 Security

### Best Practices

- ✅ API keys stored only in Apps Script (private)
- ✅ Google Sheet set to "Private" (not public)
- ✅ Apps Script project not shared
- ✅ Enable 2FA on Google and Brevo accounts
- ✅ Regularly review Apps Script execution logs

### What NOT to Do

- ❌ Never commit API keys to version control
- ❌ Don't share your Apps Script project publicly
- ❌ Don't make Google Sheet public
- ❌ Don't paste API keys in sheet cells

---

## 🚦 System Status Monitoring

### Daily Checks

- Check email for error notifications (if any)
- Verify "SENT" status appears in sheet after publish

### Weekly Checks

- Review Brevo dashboard for open/click rates
- Check Google Apps Script execution logs
- Verify subscriber count growing

### Monthly Checks

- Review all sent newsletters
- Check free tier usage (should be <50%)
- Backup Google Sheet (Download as CSV)
- Update themes for next month

---

## 🎯 Success Metrics

Track these in Brevo dashboard:

- **Open Rate**: Target 20-30% (industry average)
- **Click Rate**: Target 2-5%
- **Unsubscribe Rate**: Keep <0.5%
- **Bounce Rate**: Keep <2%
- **Subscriber Growth**: Track weekly

---

## 🔄 Maintenance

### Weekly Tasks (5 min)

- Review last newsletter performance
- Update next 2-3 themes in Column A
- Check for error emails

### Monthly Tasks (15 min)

- Backup Google Sheet
- Review execution logs
- Plan next month's themes
- Update prompt if needed

### Quarterly Tasks (30 min)

- Deep dive into analytics
- Survey subscribers (optional)
- Refine content strategy
- Update documentation

---

## 🎓 Learning Resources

### APIs Used

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Apify Documentation](https://docs.apify.com/)
- [Brevo API Reference](https://developers.brevo.com/)
- [Apps Script Guide](https://developers.google.com/apps-script)

### Email Best Practices

- [Email Marketing Guide](https://www.brevo.com/blog/email-marketing-guide/)
- [Newsletter Design Tips](https://www.litmus.com/blog/email-design-101/)
- [Copywriting for Emails](https://copyblogger.com/email-copywriting/)

---

## 💡 Tips & Best Practices

### Content Strategy

1. **Be Specific**: Generic themes → poor content
2. **Use Data**: Numbers and stats increase credibility
3. **Actionable**: Every newsletter should have clear takeaways
4. **Consistent**: Stick to schedule (builds trust)

### Technical Tips

1. **Always Test**: Run `testCompleteWorkflow()` before going live
2. **Monitor Logs**: Check Apps Script execution logs weekly
3. **Backup Data**: Download Google Sheet monthly
4. **Update Themes**: Stay 4-8 weeks ahead in planning

### Growth Hacks

1. **Forward-Friendly**: Make newsletters easy to share
2. **Add CTAs**: Drive traffic to your website/products
3. **Segment**: Use Brevo lists for targeted content
4. **Re-engagement**: Send to inactive subscribers quarterly

---

## 🤝 Contributing

This system is designed for personal/business use. Feel free to:

- Customize for your needs
- Improve the code
- Share learnings (not your API keys!)
- Fork and modify

---

## 📄 License

This project is provided as-is for personal and commercial use.

**Note:** Respect the terms of service for all APIs used:
- Google Gemini: https://ai.google.dev/terms
- Apify: https://apify.com/terms-of-use
- Brevo: https://www.brevo.com/legal/termsofuse/

---

## ⚠️ Disclaimer

- This system sends automated emails. Ensure compliance with:
  - CAN-SPAM Act (US)
  - GDPR (EU)
  - Local email marketing laws
- Always include unsubscribe links (Brevo adds automatically)
- Only email people who opted in
- Review AI-generated content before publishing

---

## 🙋 FAQ

### Can I use this for other newsletter types?

Yes! Just change:
- Newsletter themes (Column A)
- ICP and FOCUS in CONFIG
- Prompt template in `buildNewsletterPrompt()`

### What if I exceed free tier limits?

- **Gemini**: Rarely hit (60/min is plenty)
- **Apify**: Upgrade for $49/month or reduce scraping
- **Brevo**: Upgrade for $25/month (unlimited emails)

### Can I send daily newsletters?

Yes! Change `PUBLISH_DAYS` to `[1, 2, 3, 4, 5]` for weekdays.

### Does this work outside India?

Yes! Change:
- `TIMEZONE` in CONFIG
- `countryCode: 'in'` in Apify scraping
- ICP to match your audience

### Can I customize the AI writing style?

Yes! Edit the prompt in `buildNewsletterPrompt()` with:
- Tone instructions (formal/casual)
- Length preferences
- Structure requirements
- Example content

---

## 📞 Support

For issues or questions:

1. Check [Troubleshooting Guide](docs/TROUBLESHOOTING_GUIDE.md)
2. Review Apps Script execution logs
3. Test individual components with built-in test functions
4. Verify configuration with [Checklist](docs/CONFIGURATION_CHECKLIST.md)

---

## 🎉 Acknowledgments

Built using:
- **Google Apps Script** - Automation platform
- **Google Gemini** - AI content generation
- **Apify** - Web scraping platform
- **Brevo** - Email service provider

---

**Ready to get started?** → See [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md)

**Need help?** → See [`docs/TROUBLESHOOTING_GUIDE.md`](docs/TROUBLESHOOTING_GUIDE.md)

**Pre-launch checklist?** → See [`docs/CONFIGURATION_CHECKLIST.md`](docs/CONFIGURATION_CHECKLIST.md)

---

Made with ❤️ for busy professionals who want to stay connected with their audience without the overhead.
