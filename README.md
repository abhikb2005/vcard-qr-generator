# vCard QR Code Generator & AJYL Tools

**Live site:** https://vcardqrcodegenerator.com/  
**Domain:** https://ajyl.online

---

## 📱 vCard QR Code Generator

Free, fast, and private QR code creation for digital business cards—everything runs in the browser so your contact data never leaves your device.

### Features
- Generate vCard QR codes instantly
- High error correction for reliable scanning
- Download ready-to-share PNG files
- Built-in dark mode for easy reading
- No data storage or server processing

### Usage
Fill in your contact details, watch the QR code render in real time, then download or share the image anywhere you need it.

---

## 📧 Newsletter Automation System (NEW!)

**Zero-cost automated newsletter system** for busy professionals. Generates AI-powered content, scrapes current data, and sends professional emails—completely automated.

### Features
- ✅ AI-powered content generation (Google Gemini)
- ✅ Web scraping for current data (Apify)
- ✅ Professional email delivery (Brevo)
- ✅ Custom domain support (newsletter@ajyl.online)
- ✅ Approval workflow with reminders
- ✅ Auto-publishes even if not approved
- ✅ **Completely FREE** (up to 1,000 subscribers)

### Quick Start
1. Navigate to `/newsletter-automation/`
2. Read **[START_HERE.md](newsletter-automation/START_HERE.md)** to choose your setup path
3. Follow **[QUICK_START.md](newsletter-automation/QUICK_START.md)** (60 min) or **[SETUP_GUIDE.md](newsletter-automation/docs/SETUP_GUIDE.md)** (90 min)
4. Launch your newsletter!

### What's Included
- 850+ lines of Google Apps Script code
- 7,200+ lines of comprehensive documentation
- 52 pre-written newsletter themes
- 4 professional email templates
- Built-in testing & diagnostics
- Complete troubleshooting guide

**Full documentation:** [newsletter-automation/](newsletter-automation/)

---

## 🗂️ Project Structure

```
/
├── index.html                    # vCard QR generator (main site)
├── logo-qr-code.html            # Premium logo QR builder
├── blog/                        # Programmatic SEO blog posts
├── scripts/                     # Python automation scripts
├── workers/                     # Cloudflare Workers (license validation)
└── newsletter-automation/       # NEW: Automated newsletter system
    ├── START_HERE.md           # Begin here!
    ├── QUICK_START.md          # 60-min setup
    ├── README.md               # System overview
    ├── scripts/                # Google Apps Script code
    ├── templates/              # Email & sheet templates
    └── docs/                   # Comprehensive guides
```

---

## 🚀 Development

### vCard Generator
Edit `index.html` for UI changes, update assets in the `data/` and `templates/` folders, and open `index.html` locally in a browser to preview updates.

### Newsletter Automation
All code is in `/newsletter-automation/scripts/NewsletterAutomation.gs`. Copy-paste into Google Apps Script. No local development needed.

### Blog Posts
Generate new blog posts using Python scripts in `/scripts/`:
- `build_pages.py` - Generate pSEO pages from templates
- `autocomplete.py` - Generate keyword variations

---

## 📊 Tech Stack

### vCard Generator
- HTML/CSS/JavaScript
- Tailwind CSS (via CDN)
- davidshimjs/qrcodejs
- qr-code-styling (premium)

### Newsletter Automation
- Google Apps Script
- Google Gemini API (AI)
- Apify API (web scraping)
- Brevo API (email)
- Google Sheets (data)

### Infrastructure
- GitHub Pages (hosting)
- Cloudflare Workers (license API)
- Custom domain: ajyl.online

---

## 💰 Cost Summary

| Service | Cost |
|---------|------|
| **vCard Generator** | Free (GitHub Pages) |
| **Newsletter System** | Free (up to 1,000 subscribers) |
| **Domain** | ~₹500/year (ajyl.online) |
| **Total** | **₹500/year** |

---

## 📄 License

This project is released into the public domain. See [LICENSE](LICENSE) for details.

Newsletter automation system is provided as-is for personal and commercial use. Respect terms of service for all integrated APIs (Google Gemini, Apify, Brevo).

---

## 🎯 Quick Links

**vCard Generator:**
- [Live Site](https://vcardqrcodegenerator.com/)
- [ajyl.online](https://ajyl.online)

**Newsletter Automation:**
- [Start Here](newsletter-automation/START_HERE.md)
- [Quick Setup (60 min)](newsletter-automation/QUICK_START.md)
- [Full Documentation](newsletter-automation/README.md)

**Development:**
- [Blog Generation Scripts](scripts/)
- [Cloudflare Workers](workers/)

---

**Made with ❤️ for professionals everywhere.**
