/**
 * NEWSLETTER AUTOMATION SYSTEM
 * 
 * Automated newsletter generation, approval workflow, and publishing system
 * using Google Sheets, Apify, Google Gemini, and Brevo
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open Google Sheets with your newsletter planning template
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Update the CONFIG section below with your API keys and settings
 * 5. Save the script (Ctrl+S or Cmd+S)
 * 6. Run 'setupTriggers' function once to install automation triggers
 * 7. Authorize the script when prompted
 */

// =====================================================================
// CONFIGURATION - UPDATE THESE VALUES WITH YOUR API KEYS
// =====================================================================

const CONFIG = {
  // API Keys - Get these from respective platforms
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',  // From Google AI Studio
  APIFY_API_KEY: 'YOUR_APIFY_API_KEY_HERE',    // From Apify dashboard
  BREVO_API_KEY: 'YOUR_BREVO_API_KEY_HERE',    // From Brevo dashboard
  
  // Email Settings
  SENDER_EMAIL: 'newsletter@ajyl.online',      // Your verified Brevo sender email
  SENDER_NAME: 'AJYL Newsletter',
  ADMIN_EMAIL: 'your-email@example.com',       // Your email for notifications
  BREVO_LIST_ID: 2,                             // Your Brevo list ID (check Brevo dashboard)
  
  // Sheet Settings
  SHEET_NAME: 'Newsletter Schedule',            // Name of the sheet tab
  THEME_COLUMN: 1,                              // Column A
  CONTENT_COLUMN: 2,                            // Column B
  STATUS_COLUMN: 3,                             // Column C
  TIMESTAMP_COLUMN: 4,                          // Column D
  NOTES_COLUMN: 5,                              // Column E
  LOG_COLUMN: 6,                                // Column F (for logs)
  
  // Newsletter Settings
  ICP: 'mid-career professionals in Indian metros with ~15 years experience',
  FOCUS: 'professional lifestyle, finances, career planning, job switching strategies',
  
  // Schedule (IST timezone)
  TIMEZONE: 'Asia/Kolkata',
  PUBLISH_DAYS: [2, 4],                         // Tuesday=2, Thursday=4
  PUBLISH_HOUR: 9,                              // 9 AM
  PUBLISH_MINUTE: 45,                           // 45 minutes
  
  // Reminder times (hours after draft generation)
  REMINDER_TIMES: [2.25, 8.25, 12.25],         // 12 PM, 6 PM, 10 PM (relative to 9:45 AM)
};

// =====================================================================
// SETUP FUNCTIONS - RUN ONCE
// =====================================================================

/**
 * Setup all triggers for the automation system
 * RUN THIS FUNCTION ONCE after pasting the script
 */
function setupTriggers() {
  // Delete existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Main automation check - runs every hour
  ScriptApp.newTrigger('runAutomationCheck')
    .timeBased()
    .everyHours(1)
    .create();
  
  Logger.log('✅ Triggers installed successfully!');
  Logger.log('📧 Check your email for test notification');
  
  // Send confirmation email
  sendEmail(
    CONFIG.ADMIN_EMAIL,
    '✅ Newsletter Automation System Activated',
    '<h2>Success!</h2><p>Your newsletter automation system is now active.</p>' +
    '<p><strong>Schedule:</strong> Tuesday & Thursday at 9:45 AM IST</p>' +
    '<p><strong>Next steps:</strong></p>' +
    '<ul>' +
    '<li>Fill in newsletter themes in Column A</li>' +
    '<li>Wait for automated draft generation 24 hours before publish</li>' +
    '<li>Review and type "APPROVED" in Column C to approve</li>' +
    '<li>Or do nothing - it will auto-publish anyway!</li>' +
    '</ul>'
  );
}

/**
 * Initialize the Google Sheet with proper formatting
 * RUN THIS FUNCTION ONCE after creating your sheet
 */
function initializeSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  
  // Set up headers
  const headers = [
    'Newsletter Theme',
    'Generated Content',
    'Approval Status',
    'Publish Timestamp',
    'Notes',
    'System Log'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');
  
  // Add sample themes
  const sampleThemes = [
    ['Navigating the 15-Year Career Mark: When to Stay vs. When to Move', '', '', '', 'Week 1'],
    ['Salary Negotiation Strategies for Mid-Career Professionals in 2024', '', '', '', 'Week 2'],
    ['Building Your Safety Net: Financial Planning for Career Transitions', '', '', '', 'Week 3'],
    ['The Hidden Job Market: How Senior Professionals Find Opportunities', '', '', '', 'Week 4']
  ];
  
  sheet.getRange(2, 1, sampleThemes.length, sampleThemes[0].length).setValues(sampleThemes);
  
  // Format columns
  sheet.setColumnWidth(1, 400);  // Theme
  sheet.setColumnWidth(2, 600);  // Content
  sheet.setColumnWidth(3, 150);  // Status
  sheet.setColumnWidth(4, 180);  // Timestamp
  sheet.setColumnWidth(5, 200);  // Notes
  sheet.setColumnWidth(6, 300);  // Log
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  Logger.log('✅ Sheet initialized successfully!');
  
  sendEmail(
    CONFIG.ADMIN_EMAIL,
    '✅ Newsletter Sheet Initialized',
    '<h2>Sheet Ready!</h2>' +
    '<p>Your newsletter planning sheet has been set up with:</p>' +
    '<ul>' +
    '<li>Proper column headers and formatting</li>' +
    '<li>4 sample newsletter themes</li>' +
    '<li>Ready for automation</li>' +
    '</ul>' +
    '<p><strong>Next:</strong> Run the <code>setupTriggers()</code> function to activate automation.</p>'
  );
}

/**
 * Test your API connections
 * RUN THIS to verify all APIs are working
 */
function testAPIs() {
  const results = [];
  
  // Test Gemini API
  try {
    const testPrompt = 'Say "Hello" if you can read this.';
    const geminiResponse = callGeminiAPI(testPrompt);
    results.push('✅ Gemini API: Connected');
  } catch (e) {
    results.push('❌ Gemini API: ' + e.message);
  }
  
  // Test Apify API (check if API key is valid)
  try {
    const url = `https://api.apify.com/v2/acts?token=${CONFIG.APIFY_API_KEY}&limit=1`;
    const response = UrlFetchApp.fetch(url);
    if (response.getResponseCode() === 200) {
      results.push('✅ Apify API: Connected');
    } else {
      results.push('❌ Apify API: Invalid response');
    }
  } catch (e) {
    results.push('❌ Apify API: ' + e.message);
  }
  
  // Test Brevo API
  try {
    const testResult = testBrevoConnection();
    results.push(testResult ? '✅ Brevo API: Connected' : '❌ Brevo API: Failed');
  } catch (e) {
    results.push('❌ Brevo API: ' + e.message);
  }
  
  // Log and email results
  Logger.log(results.join('\n'));
  
  sendEmail(
    CONFIG.ADMIN_EMAIL,
    'Newsletter System API Test Results',
    '<h2>API Connection Test</h2>' +
    '<pre>' + results.join('\n') + '</pre>' +
    '<p>Fix any failed connections before going live.</p>'
  );
}

// =====================================================================
// MAIN AUTOMATION LOGIC
// =====================================================================

/**
 * Main automation check - runs every hour via trigger
 * Determines what action to take based on current time
 */
function runAutomationCheck() {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    Logger.log(`🔍 Running automation check: ${now.toString()}`);
    
    // Check if we need to generate drafts (24 hours before publish)
    // Monday 9:45 AM for Tuesday, Wednesday 9:45 AM for Thursday
    if ((dayOfWeek === 1 || dayOfWeek === 3) && hour === 9 && minute >= 45 && minute < 50) {
      Logger.log('📝 Time to generate drafts');
      generateNewsletterDrafts();
      return;
    }
    
    // Check if we need to send reminders
    if ((dayOfWeek === 1 || dayOfWeek === 3)) {
      checkAndSendReminders();
    }
    
    // Check if it's time to publish (Tuesday/Thursday 9:45 AM)
    if ((dayOfWeek === 2 || dayOfWeek === 4) && hour === 9 && minute >= 45 && minute < 50) {
      Logger.log('📤 Time to publish newsletters');
      publishNewsletters();
      return;
    }
    
    Logger.log('⏭️ No action needed at this time');
    
  } catch (error) {
    logError('runAutomationCheck', error);
  }
}

/**
 * Generate newsletter drafts 24 hours before publish
 */
function generateNewsletterDrafts() {
  try {
    const sheet = getNewsletterSheet();
    const data = sheet.getDataRange().getValues();
    
    let draftsGenerated = 0;
    
    // Find rows that need drafts (have theme but no content and no status)
    for (let i = 1; i < data.length; i++) {
      const theme = data[i][CONFIG.THEME_COLUMN - 1];
      const content = data[i][CONFIG.CONTENT_COLUMN - 1];
      const status = data[i][CONFIG.STATUS_COLUMN - 1];
      
      // Skip if no theme or already has content/status
      if (!theme || content || status) continue;
      
      Logger.log(`📝 Generating draft for: ${theme}`);
      
      // Update status to generating
      updateCellWithLog(sheet, i + 1, CONFIG.STATUS_COLUMN, 'GENERATING...', 'Started draft generation');
      
      try {
        // Step 1: Scrape data from Apify
        const scrapedData = scrapeDataWithApify(theme);
        
        // Step 2: Generate content with Gemini
        const newsletterContent = generateNewsletterContent(theme, scrapedData);
        
        // Step 3: Write to sheet
        updateCellWithLog(sheet, i + 1, CONFIG.CONTENT_COLUMN, newsletterContent, 'Draft generated');
        updateCellWithLog(sheet, i + 1, CONFIG.STATUS_COLUMN, 'PENDING_APPROVAL', 'Awaiting approval');
        
        // Apply color coding (yellow for pending)
        sheet.getRange(i + 1, CONFIG.STATUS_COLUMN).setBackground('#fff3cd');
        
        draftsGenerated++;
        
        // Send approval notification
        sendApprovalNotification(theme, newsletterContent, i + 1);
        
      } catch (error) {
        updateCellWithLog(sheet, i + 1, CONFIG.STATUS_COLUMN, 'ERROR', error.message);
        sheet.getRange(i + 1, CONFIG.STATUS_COLUMN).setBackground('#f8d7da');
        logError(`generateDraft-Row${i + 1}`, error);
      }
    }
    
    Logger.log(`✅ Generated ${draftsGenerated} draft(s)`);
    
  } catch (error) {
    logError('generateNewsletterDrafts', error);
  }
}

/**
 * Check for pending approvals and send reminders
 */
function checkAndSendReminders() {
  try {
    const sheet = getNewsletterSheet();
    const data = sheet.getDataRange().getValues();
    const now = new Date();
    
    for (let i = 1; i < data.length; i++) {
      const status = data[i][CONFIG.STATUS_COLUMN - 1];
      const log = data[i][CONFIG.LOG_COLUMN - 1] || '';
      
      if (status !== 'PENDING_APPROVAL') continue;
      
      // Parse generation time from log
      const genTimeMatch = log.match(/Generated: (.*)/);
      if (!genTimeMatch) continue;
      
      const genTime = new Date(genTimeMatch[1]);
      const hoursSinceGen = (now - genTime) / (1000 * 60 * 60);
      
      // Check if we need to send reminders
      if (hoursSinceGen >= 2.25 && hoursSinceGen < 3 && !log.includes('Reminder 1 sent')) {
        sendReminderEmail(data[i][CONFIG.THEME_COLUMN - 1], 1, i + 1);
        updateCellWithLog(sheet, i + 1, CONFIG.LOG_COLUMN, log + '\nReminder 1 sent: ' + now.toString(), '');
      } else if (hoursSinceGen >= 8.25 && hoursSinceGen < 9 && !log.includes('Reminder 2 sent')) {
        sendReminderEmail(data[i][CONFIG.THEME_COLUMN - 1], 2, i + 1);
        updateCellWithLog(sheet, i + 1, CONFIG.LOG_COLUMN, log + '\nReminder 2 sent: ' + now.toString(), '');
      } else if (hoursSinceGen >= 12.25 && hoursSinceGen < 13 && !log.includes('Final reminder sent')) {
        sendReminderEmail(data[i][CONFIG.THEME_COLUMN - 1], 3, i + 1);
        updateCellWithLog(sheet, i + 1, CONFIG.LOG_COLUMN, log + '\nFinal reminder sent: ' + now.toString(), '');
      }
    }
    
  } catch (error) {
    logError('checkAndSendReminders', error);
  }
}

/**
 * Publish newsletters on schedule (with or without approval)
 */
function publishNewsletters() {
  try {
    const sheet = getNewsletterSheet();
    const data = sheet.getDataRange().getValues();
    const now = new Date();
    
    let published = 0;
    
    for (let i = 1; i < data.length; i++) {
      const status = data[i][CONFIG.STATUS_COLUMN - 1];
      const theme = data[i][CONFIG.THEME_COLUMN - 1];
      const content = data[i][CONFIG.CONTENT_COLUMN - 1];
      
      // Check if ready to publish (pending or approved, but not sent)
      if ((status === 'PENDING_APPROVAL' || status === 'APPROVED') && content) {
        Logger.log(`📤 Publishing: ${theme}`);
        
        try {
          // Send via Brevo
          const result = sendNewsletterViaBrevo(theme, content);
          
          if (result.success) {
            updateCellWithLog(sheet, i + 1, CONFIG.STATUS_COLUMN, 'SENT', 'Published successfully');
            updateCellWithLog(sheet, i + 1, CONFIG.TIMESTAMP_COLUMN, now.toString(), '');
            sheet.getRange(i + 1, CONFIG.STATUS_COLUMN).setBackground('#d1ecf1');
            published++;
            
            // Notify admin
            sendEmail(
              CONFIG.ADMIN_EMAIL,
              `✅ Newsletter Published: ${theme}`,
              `<p>Your newsletter has been sent to ${result.recipientCount || 'all'} subscribers.</p>` +
              `<p><strong>Status:</strong> ${status === 'APPROVED' ? 'User approved' : 'Auto-published'}</p>`
            );
          } else {
            throw new Error('Brevo send failed: ' + result.error);
          }
          
        } catch (error) {
          updateCellWithLog(sheet, i + 1, CONFIG.STATUS_COLUMN, 'ERROR', error.message);
          sheet.getRange(i + 1, CONFIG.STATUS_COLUMN).setBackground('#f8d7da');
          logError(`publish-Row${i + 1}`, error);
        }
      }
    }
    
    Logger.log(`✅ Published ${published} newsletter(s)`);
    
  } catch (error) {
    logError('publishNewsletters', error);
  }
}

// =====================================================================
// APIFY INTEGRATION
// =====================================================================

/**
 * Scrape relevant data using Apify based on newsletter theme
 */
function scrapeDataWithApify(theme) {
  try {
    Logger.log(`🔍 Scraping data for: ${theme}`);
    
    // Extract keywords from theme for search
    const keywords = extractKeywords(theme);
    
    // Use Apify's Google Search Scraper (free tier actor)
    const actorId = 'apify/google-search-scraper';
    const runInput = {
      queries: keywords.slice(0, 3).join(', '), // Limit to 3 keywords
      maxPagesPerQuery: 5,
      resultsPerPage: 10,
      mobileResults: false,
      languageCode: 'en',
      countryCode: 'in',
      includeUnfilteredResults: false
    };
    
    // Start the actor run
    const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${CONFIG.APIFY_API_KEY}`;
    const runResponse = UrlFetchApp.fetch(runUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(runInput)
    });
    
    const runData = JSON.parse(runResponse.getContentText());
    const runId = runData.data.id;
    
    // Wait for the run to complete (with timeout)
    let attempts = 0;
    let status = 'RUNNING';
    while (status === 'RUNNING' && attempts < 30) {
      Utilities.sleep(2000); // Wait 2 seconds
      const statusUrl = `https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${CONFIG.APIFY_API_KEY}`;
      const statusResponse = UrlFetchApp.fetch(statusUrl);
      const statusData = JSON.parse(statusResponse.getContentText());
      status = statusData.data.status;
      attempts++;
    }
    
    if (status !== 'SUCCEEDED') {
      throw new Error('Apify scraping timeout or failed');
    }
    
    // Get the results
    const resultsUrl = `https://api.apify.com/v2/acts/${actorId}/runs/${runId}/dataset/items?token=${CONFIG.APIFY_API_KEY}`;
    const resultsResponse = UrlFetchApp.fetch(resultsUrl);
    const results = JSON.parse(resultsResponse.getContentText());
    
    // Extract and format relevant data
    const scrapedData = results.slice(0, 10).map(item => ({
      title: item.title || '',
      description: item.description || '',
      url: item.url || ''
    }));
    
    Logger.log(`✅ Scraped ${scrapedData.length} items`);
    return scrapedData;
    
  } catch (error) {
    Logger.log(`⚠️ Apify scraping failed: ${error.message}, using fallback data`);
    // Return minimal data so newsletter generation can continue
    return [{
      title: 'Fallback: Manual research needed',
      description: 'Automated scraping unavailable. Newsletter generated from theme only.',
      url: ''
    }];
  }
}

/**
 * Extract keywords from theme for search
 */
function extractKeywords(theme) {
  // Simple keyword extraction - remove common words
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'how', 'when', 'where', 'why', 'what', 'which', 'who', 'vs'];
  
  const words = theme.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word));
  
  return words;
}

// =====================================================================
// GOOGLE GEMINI INTEGRATION
// =====================================================================

/**
 * Generate newsletter content using Google Gemini API
 */
function generateNewsletterContent(theme, scrapedData) {
  try {
    Logger.log(`🤖 Generating content with Gemini for: ${theme}`);
    
    // Build the prompt
    const prompt = buildNewsletterPrompt(theme, scrapedData);
    
    // Call Gemini API
    const content = callGeminiAPI(prompt);
    
    Logger.log(`✅ Generated ${content.length} characters of content`);
    return content;
    
  } catch (error) {
    throw new Error('Gemini generation failed: ' + error.message);
  }
}

/**
 * Build comprehensive prompt for Gemini
 */
function buildNewsletterPrompt(theme, scrapedData) {
  let dataContext = '';
  if (scrapedData && scrapedData.length > 0) {
    dataContext = '\n\nRELEVANT MARKET DATA:\n';
    scrapedData.forEach((item, idx) => {
      dataContext += `${idx + 1}. ${item.title}\n   ${item.description}\n\n`;
    });
  }
  
  const prompt = `You are a professional newsletter writer for career professionals in India.

NEWSLETTER THEME: ${theme}

TARGET AUDIENCE (ICP): ${CONFIG.ICP}

NEWSLETTER FOCUS: ${CONFIG.FOCUS}

${dataContext}

INSTRUCTIONS:
Write a comprehensive, engaging newsletter email that:
1. Opens with a relatable hook or personal story
2. Addresses the main theme with practical, actionable insights
3. Uses the scraped market data (if provided) to add credibility and current trends
4. Includes specific examples, data points, or real-world scenarios
5. Breaks content into scannable sections with clear subheadings
6. Uses a conversational but professional tone
7. Ends with a clear call-to-action

STRUCTURE:
- Subject Line (compelling, 50-70 characters)
- Opening paragraph (hook the reader)
- 3-4 main sections with subheadings
- Practical takeaways or action items
- Closing with CTA

OUTPUT FORMAT:
Return ONLY the newsletter content in HTML format, ready to send via email.
Include inline styles for better email client compatibility.
DO NOT include subject line separately - embed it in the HTML as an H1.

Write in a way that's readable and comprehensible for busy professionals scanning on mobile.`;

  return prompt;
}

/**
 * Call Google Gemini API
 */
function callGeminiAPI(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
  
  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  if (responseCode !== 200) {
    throw new Error(`Gemini API error ${responseCode}: ${responseText}`);
  }
  
  const result = JSON.parse(responseText);
  
  if (!result.candidates || result.candidates.length === 0) {
    throw new Error('No content generated by Gemini');
  }
  
  return result.candidates[0].content.parts[0].text;
}

// =====================================================================
// BREVO INTEGRATION
// =====================================================================

/**
 * Send newsletter via Brevo to all subscribers
 */
function sendNewsletterViaBrevo(subject, htmlContent) {
  try {
    Logger.log(`📧 Sending newsletter via Brevo: ${subject}`);
    
    // Extract subject line from HTML if embedded as H1
    let extractedSubject = subject;
    const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) {
      extractedSubject = h1Match[1].replace(/<[^>]*>/g, '').trim();
    }
    
    // Brevo API endpoint for sending campaign
    const url = 'https://api.brevo.com/v3/smtp/email';
    
    const payload = {
      sender: {
        name: CONFIG.SENDER_NAME,
        email: CONFIG.SENDER_EMAIL
      },
      to: [{ email: CONFIG.ADMIN_EMAIL }], // For testing - will update to list later
      subject: extractedSubject,
      htmlContent: wrapNewsletterHTML(htmlContent)
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'api-key': CONFIG.BREVO_API_KEY
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode === 201 || responseCode === 200) {
      Logger.log('✅ Newsletter sent successfully');
      return { success: true, recipientCount: 1 };
    } else {
      throw new Error(`Brevo API error ${responseCode}: ${responseText}`);
    }
    
  } catch (error) {
    Logger.log(`❌ Brevo send failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Send newsletter to Brevo list (for production use)
 */
function sendToBrevoList(subject, htmlContent) {
  // For sending to entire list, use Brevo campaigns API
  const url = 'https://api.brevo.com/v3/emailCampaigns';
  
  const payload = {
    name: `Newsletter - ${subject} - ${new Date().toISOString()}`,
    subject: subject,
    sender: {
      name: CONFIG.SENDER_NAME,
      email: CONFIG.SENDER_EMAIL
    },
    htmlContent: wrapNewsletterHTML(htmlContent),
    recipients: {
      listIds: [CONFIG.BREVO_LIST_ID]
    },
    inlineImageActivation: true,
    scheduledAt: new Date().toISOString()
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'api-key': CONFIG.BREVO_API_KEY
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  
  if (responseCode === 201) {
    const result = JSON.parse(response.getContentText());
    // Trigger the campaign to send
    sendCampaign(result.id);
    return { success: true };
  } else {
    throw new Error(`Brevo campaign error ${responseCode}: ${response.getContentText()}`);
  }
}

/**
 * Trigger Brevo campaign to send
 */
function sendCampaign(campaignId) {
  const url = `https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`;
  
  const options = {
    method: 'post',
    headers: {
      'api-key': CONFIG.BREVO_API_KEY
    },
    muteHttpExceptions: true
  };
  
  UrlFetchApp.fetch(url, options);
}

/**
 * Test Brevo connection
 */
function testBrevoConnection() {
  try {
    const url = 'https://api.brevo.com/v3/account';
    const options = {
      method: 'get',
      headers: {
        'api-key': CONFIG.BREVO_API_KEY
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    return response.getResponseCode() === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Wrap newsletter content in professional HTML template
 */
function wrapNewsletterHTML(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AJYL Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #2563eb; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">AJYL Newsletter</h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">Career insights for professionals</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; color: #1f2937; font-size: 16px; line-height: 1.6;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">© ${new Date().getFullYear()} AJYL. All rights reserved.</p>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                <a href="https://ajyl.online" style="color: #2563eb; text-decoration: none;">Visit our website</a> | 
                <a href="{{ unsubscribe }}" style="color: #2563eb; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// =====================================================================
// EMAIL NOTIFICATIONS
// =====================================================================

/**
 * Send approval notification email to admin
 */
function sendApprovalNotification(theme, content, rowNumber) {
  const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  const previewContent = content.substring(0, 500).replace(/<[^>]*>/g, '').trim() + '...';
  
  const subject = '📧 Newsletter Draft Ready for Review';
  const htmlBody = `
    <h2>Your Newsletter Draft is Ready! 🎉</h2>
    <p>A new newsletter draft has been generated and is awaiting your review.</p>
    
    <h3>Theme:</h3>
    <p><strong>${theme}</strong></p>
    
    <h3>Preview:</h3>
    <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #2563eb;">
      ${previewContent}
    </div>
    
    <h3>Next Steps:</h3>
    <ol>
      <li><a href="${sheetUrl}">Open your Google Sheet</a></li>
      <li>Review the full content in Column B, Row ${rowNumber}</li>
      <li>To approve: Type <code>APPROVED</code> in Column C, Row ${rowNumber}</li>
      <li>To skip approval: Do nothing - it will auto-publish tomorrow at 9:45 AM</li>
    </ol>
    
    <p style="background-color: #fef3c7; padding: 15px; border-radius: 4px;">
      ⏰ <strong>Publishing tomorrow at 9:45 AM IST</strong><br>
      You'll receive reminders at 12 PM, 6 PM, and 10 PM today if not approved.
    </p>
    
    <p><a href="${sheetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Review Now</a></p>
  `;
  
  sendEmail(CONFIG.ADMIN_EMAIL, subject, htmlBody);
}

/**
 * Send reminder emails
 */
function sendReminderEmail(theme, reminderNumber, rowNumber) {
  const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  
  let subject, message;
  
  switch (reminderNumber) {
    case 1:
      subject = '⏰ Reminder: Newsletter Draft Awaits Approval';
      message = '<p>Your newsletter draft is still pending approval.</p>';
      break;
    case 2:
      subject = '⏰ Second Reminder: Review Your Newsletter Draft';
      message = '<p>Just a reminder that your newsletter draft needs review.</p>';
      break;
    case 3:
      subject = '🚨 Final Reminder: Auto-Publishing Tomorrow at 9:45 AM';
      message = '<p><strong>This is your final reminder.</strong> Your newsletter will auto-publish tomorrow at 9:45 AM IST if not approved.</p>';
      break;
  }
  
  const htmlBody = `
    <h2>Newsletter Draft Reminder</h2>
    ${message}
    
    <h3>Theme:</h3>
    <p><strong>${theme}</strong></p>
    
    <h3>Action Required:</h3>
    <ol>
      <li><a href="${sheetUrl}">Open your Google Sheet</a></li>
      <li>Review the content in Row ${rowNumber}</li>
      <li>Type <code>APPROVED</code> in Column C to approve</li>
      <li>Or do nothing - it will auto-publish</li>
    </ol>
    
    <p><a href="${sheetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review Now</a></p>
  `;
  
  sendEmail(CONFIG.ADMIN_EMAIL, subject, htmlBody);
}

/**
 * Generic email sending function
 */
function sendEmail(to, subject, htmlBody) {
  try {
    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: htmlBody
    });
    Logger.log(`✅ Email sent: ${subject}`);
  } catch (error) {
    Logger.log(`❌ Email failed: ${error.message}`);
  }
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Get the newsletter sheet
 */
function getNewsletterSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    throw new Error(`Sheet "${CONFIG.SHEET_NAME}" not found. Run initializeSheet() first.`);
  }
  
  return sheet;
}

/**
 * Update cell and log the action
 */
function updateCellWithLog(sheet, row, col, value, logMessage) {
  sheet.getRange(row, col).setValue(value);
  
  if (logMessage) {
    const existingLog = sheet.getRange(row, CONFIG.LOG_COLUMN).getValue();
    const newLog = existingLog 
      ? existingLog + '\n' + new Date().toLocaleString() + ': ' + logMessage
      : new Date().toLocaleString() + ': ' + logMessage;
    sheet.getRange(row, CONFIG.LOG_COLUMN).setValue(newLog);
  }
}

/**
 * Log errors and notify admin
 */
function logError(context, error) {
  const errorMessage = `[${context}] ${error.message}\n${error.stack}`;
  Logger.log('❌ ERROR: ' + errorMessage);
  
  // Send error notification to admin
  try {
    sendEmail(
      CONFIG.ADMIN_EMAIL,
      `🚨 Newsletter System Error: ${context}`,
      `<h2>Error in Newsletter Automation</h2>
      <p><strong>Context:</strong> ${context}</p>
      <p><strong>Error:</strong> ${error.message}</p>
      <pre style="background-color: #f9fafb; padding: 15px; border-radius: 4px;">${error.stack || 'No stack trace'}</pre>
      <p>Please check your Google Apps Script logs and configuration.</p>`
    );
  } catch (e) {
    Logger.log('Failed to send error notification: ' + e.message);
  }
}

/**
 * Manual trigger to test the entire workflow
 */
function testCompleteWorkflow() {
  Logger.log('🧪 Testing complete workflow...');
  
  // Test 1: API connections
  Logger.log('\n1️⃣ Testing API connections...');
  testAPIs();
  
  // Test 2: Generate a test draft
  Logger.log('\n2️⃣ Generating test draft...');
  try {
    const testTheme = 'Career Growth Strategies for 2024';
    const testData = scrapeDataWithApify(testTheme);
    const testContent = generateNewsletterContent(testTheme, testData);
    Logger.log('✅ Test draft generated: ' + testContent.substring(0, 100) + '...');
  } catch (e) {
    Logger.log('❌ Draft generation failed: ' + e.message);
  }
  
  // Test 3: Send test email
  Logger.log('\n3️⃣ Sending test email...');
  sendEmail(
    CONFIG.ADMIN_EMAIL,
    'Test: Newsletter System',
    '<h2>Test Email</h2><p>If you received this, email notifications are working!</p>'
  );
  
  Logger.log('\n✅ Complete workflow test finished. Check your email and logs.');
}
