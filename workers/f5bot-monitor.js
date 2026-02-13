const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TELEGRAM_API_BASE = 'https://api.telegram.org';
const RELEVANCE_THRESHOLD = 0.5;
const DEFAULT_NOTIFY_THRESHOLD = 0.25;
const DEFAULT_DEDUPE_TTL_DAYS = 30;

const PRODUCT_CONTEXT = [
  'Product: vcardqrcodegenerator.com',
  'What it does: vCard QR code generator',
  'Free: standard QR code generation, no signup, no tracking, works offline as a PWA',
  'Paid: logo QR codes and bulk generation',
  'Open source',
].join('\n');

const ANALYSIS_SYSTEM_PROMPT = [
  'You analyze community posts to decide if they are relevant opportunities for helpful engagement.',
  PRODUCT_CONTEXT,
  'Return ONLY valid JSON with this exact shape:',
  '{',
  '  "is_relevant": true/false,',
  '  "relevance_score": 0.0 to 1.0,',
  '  "reasoning": "Why this is or is not relevant",',
  '  "category": "asking-for-tool | comparing-tools | mentioning-competitor | general-discussion | unrelated",',
  '  "suggested_reply": "Helpful, conversational, non-salesy reply. Answer first. Mention vcardqrcodegenerator.com naturally if relevant. Always state: free for standard QR codes, paid for logo and bulk. No emojis. Sound human, not AI.",',
  '  "action": "reply | monitor | ignore"',
  '}',
  'If not relevant, keep suggested_reply short and optional.',
].join('\n');

export default {
  async email(message, env, ctx) {
    const processedUrlStore = env.PROCESSED_URLS;
    const notifyThreshold = resolveNotifyThreshold(env);
    const forceNotifyAll = isTruthy(env.FORCE_NOTIFY_ALL);
    const dedupeTtlSeconds = resolveDedupeTtlSeconds(env);
    const subject = message.headers?.get('subject') || '';
    let rawEmail = '';
    let alert = null;
    let parsingIssues = [];
    let dedupeKey = null;
    let shouldMarkProcessed = false;

    try {
      console.log('Incoming email', { from: message.from, to: message.to, subject });
      rawEmail = await new Response(message.raw).text();
      const parsed = parseF5BotAlert(rawEmail, message);
      alert = parsed.alert;
      parsingIssues = parsed.parsingIssues;

      const dedupeUrl = normalizePostUrl(alert.url);
      if (processedUrlStore && dedupeUrl) {
        const keywordForDedupe = normalizeForDedupeKey(alert.keyword);
        const dedupeBasis = keywordForDedupe ? `${dedupeUrl}::${keywordForDedupe}` : dedupeUrl;
        dedupeKey = `url:${await sha256Hex(dedupeBasis)}`;
        const alreadySeen = await processedUrlStore.get(dedupeKey);
        if (alreadySeen) {
          console.log('Duplicate F5Bot URL, skipping notification:', dedupeUrl);
          return;
        }
      }

      let analysis = null;
      let analysisError = null;
      try {
        analysis = await analyzeWithGroq(alert, env);
      } catch (err) {
        analysisError = err;
        console.error('Groq analysis failed:', err);
      }

      const relevanceScore = Number(analysis?.relevance_score ?? 0);
      const modelAction = String(analysis?.action || '').toLowerCase();
      const modelCategory = String(analysis?.category || '').toLowerCase();
      const parseFailed = parsingIssues.length > 0;
      const shouldNotify =
        forceNotifyAll ||
        parseFailed ||
        Boolean(analysisError) ||
        relevanceScore >= notifyThreshold ||
        modelAction === 'reply' ||
        modelAction === 'monitor' ||
        modelCategory === 'mentioning-competitor' ||
        modelCategory === 'comparing-tools';
      console.log('Alert decision', {
        url: alert?.url || '',
        keyword: alert?.keyword || '',
        relevanceScore,
        modelAction,
        modelCategory,
        parseFailed,
        analysisFailed: Boolean(analysisError),
        forceNotifyAll,
        notifyThreshold,
        shouldNotify,
      });

      if (shouldNotify) {
        await sendTelegramAlert({
          env,
          alert,
          analysis,
          parsingIssues,
          analysisError,
        });
        shouldMarkProcessed = true;
      } else {
        // Keep low-confidence misses eligible for future alerts instead of suppressing forever.
        shouldMarkProcessed = false;
      }
    } catch (err) {
      console.error('Email handling failed:', err);
      const fallbackAlert = alert || buildFallbackAlert(message, rawEmail);
      try {
        await sendTelegramAlert({
          env,
          alert: fallbackAlert,
          analysis: null,
          parsingIssues: parsingIssues.length > 0 ? parsingIssues : ['email processing failed'],
          analysisError: err,
        });
        shouldMarkProcessed = true;
      } catch (telegramErr) {
        console.error('Fallback Telegram send failed:', telegramErr);
      }
    } finally {
      if (processedUrlStore && dedupeKey && shouldMarkProcessed) {
        const value = JSON.stringify({
          processed_at: new Date().toISOString(),
          url: alert?.url || null,
          title: alert?.title || null,
          keyword: alert?.keyword || null,
        });
        await processedUrlStore.put(dedupeKey, value, { expirationTtl: dedupeTtlSeconds });
      }
    }
  },
};

async function analyzeWithGroq(alert, env) {
  if (!env.GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY');
  }

  const userPayload = {
    source: alert.source || 'Unknown',
    title: alert.title || 'Unknown',
    url: alert.url || '',
    snippet: alert.snippet || '',
    keyword: alert.keyword || '',
  };

  const requestBody = {
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze this F5Bot alert for outreach relevance:\n${JSON.stringify(userPayload, null, 2)}`,
      },
    ],
  };

  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const body = await safeReadText(response);
    throw new Error(`Groq API ${response.status}: ${truncate(body, 500)}`);
  }

  const data = await response.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('Groq response missing content');
  }

  const parsed = tryParseJsonObject(content);
  if (!parsed) {
    throw new Error(`Groq returned non-JSON content: ${truncate(content, 500)}`);
  }

  return normalizeAnalysis(parsed);
}

function normalizeAnalysis(input) {
  const allowedCategories = new Set([
    'asking-for-tool',
    'comparing-tools',
    'mentioning-competitor',
    'general-discussion',
    'unrelated',
  ]);
  const allowedActions = new Set(['reply', 'monitor', 'ignore']);

  const isRelevant = Boolean(input?.is_relevant);
  const parsedScore = Number(input?.relevance_score);
  const score = Number.isFinite(parsedScore) ? clamp(parsedScore, 0, 1) : isRelevant ? 0.7 : 0.2;

  const category = allowedCategories.has(String(input?.category))
    ? String(input.category)
    : score >= RELEVANCE_THRESHOLD
      ? 'general-discussion'
      : 'unrelated';

  const action = allowedActions.has(String(input?.action))
    ? String(input.action)
    : score >= 0.7
      ? 'reply'
      : score >= RELEVANCE_THRESHOLD
        ? 'monitor'
        : 'ignore';

  return {
    is_relevant: isRelevant || score >= RELEVANCE_THRESHOLD,
    relevance_score: score,
    reasoning: cleanText(input?.reasoning, 700) || 'No reasoning provided.',
    category,
    suggested_reply: cleanText(input?.suggested_reply, 1800),
    action,
  };
}

async function sendTelegramAlert({ env, alert, analysis, parsingIssues, analysisError }) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    throw new Error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
  }

  const messageText = buildTelegramMessage({
    alert,
    analysis,
    parsingIssues,
    analysisError,
  });

  const response = await fetch(
    `${TELEGRAM_API_BASE}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        text: messageText,
      }),
    }
  );

  if (!response.ok) {
    const body = await safeReadText(response);
    throw new Error(`Telegram API ${response.status}: ${truncate(body, 500)}`);
  }
}

function buildTelegramMessage({ alert, analysis, parsingIssues, analysisError }) {
  const title = cleanText(alert?.title, 240) || 'Unknown';
  const source = cleanText(alert?.source, 40) || 'Unknown';
  const keyword = cleanText(alert?.keyword, 160) || 'Unknown';
  const url = cleanText(alert?.url, 1000) || '';
  const snippet = cleanText(alert?.snippet, 600) || 'No snippet extracted.';

  const score = Number(analysis?.relevance_score);
  const scoreDisplay = Number.isFinite(score) ? formatRelevance(score) : 'Unavailable';
  const category = cleanText(analysis?.category, 80) || 'unavailable';
  const action = cleanText(analysis?.action, 40) || 'monitor';
  const reasoningBase = cleanText(analysis?.reasoning, 700);
  const reasoningFallback = buildFailureReason(parsingIssues, analysisError);
  const reasoning = reasoningBase || reasoningFallback || 'No reasoning available.';
  const suggestedReply = cleanText(analysis?.suggested_reply, 1800) || 'No suggestion available.';

  const urlLine = url
    ? `<a href="${escapeHtmlAttribute(url)}">${escapeHtml(truncate(url, 140))}</a>`
    : 'Unavailable';

  const lines = [
    '<b>F5Bot Alert</b>',
    `<b>Source:</b> ${escapeHtml(source)}`,
    `<b>Post title:</b> ${escapeHtml(title)}`,
    `<b>Post URL:</b> ${urlLine}`,
    `<b>Matched keyword:</b> ${escapeHtml(keyword)}`,
    `<b>Relevance score:</b> ${escapeHtml(scoreDisplay)}`,
    `<b>Category:</b> ${escapeHtml(category)}`,
    `<b>Recommended action:</b> ${escapeHtml(action)}`,
    `<b>Why relevant:</b> ${escapeHtml(reasoning)}`,
    `<b>Snippet:</b> ${escapeHtml(snippet)}`,
    '<b>Suggested reply:</b>',
    `<pre>${escapeHtml(suggestedReply)}</pre>`,
  ];

  return truncate(lines.join('\n'), 3900);
}

function buildFailureReason(parsingIssues, analysisError) {
  const parts = [];
  if (parsingIssues?.length) {
    parts.push(`Parsing fallback used (${parsingIssues.join(', ')})`);
  }
  if (analysisError) {
    const message = analysisError instanceof Error ? analysisError.message : String(analysisError);
    parts.push(`Analysis fallback used (${truncate(message, 220)})`);
  }
  return parts.join(' | ');
}

function parseF5BotAlert(rawEmail, message) {
  const mime = parseMimeMessage(rawEmail);
  const subjectHeader = decodeMimeWords(mime.headers.subject || message.headers.get('subject') || '');
  const textBody = cleanText(mime.text, 50_000);
  const htmlBody = mime.html || '';
  const combinedText = [textBody, htmlToText(htmlBody)].filter(Boolean).join('\n');
  const normalizedText = normalizeNewlines(combinedText);
  const lines = normalizedText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const url = extractPostUrl(normalizedText, htmlBody, subjectHeader);
  const source = extractSource(normalizedText, subjectHeader, url);
  const keyword = extractKeyword(lines, subjectHeader, source);
  const title = extractTitle(lines, subjectHeader, keyword, source, url);
  const snippet = extractSnippet(lines, title, keyword, source, url);

  const parsingIssues = [];
  if (!url) parsingIssues.push('missing_url');
  if (!title) parsingIssues.push('missing_title');
  if (!source) parsingIssues.push('missing_source');

  return {
    alert: {
      source: source || 'Unknown',
      title: title || subjectHeader || 'Unknown',
      url: url || '',
      snippet: snippet || '',
      keyword: keyword || '',
      envelope_from: message.from || '',
      envelope_to: message.to || '',
      subject: subjectHeader || '',
    },
    parsingIssues,
  };
}

function buildFallbackAlert(message, rawEmail) {
  const subject = cleanText(message?.headers?.get('subject') || '', 300);
  const roughUrl = extractFirstUrl(rawEmail || '') || '';
  return {
    source: 'Unknown',
    title: subject || 'Unparsed email alert',
    url: roughUrl,
    snippet: cleanText(rawEmail || '', 500),
    keyword: '',
    envelope_from: message?.from || '',
    envelope_to: message?.to || '',
    subject,
  };
}

function extractSource(text, subject, url) {
  const inferred = inferSourceFromUrl(url);
  if (inferred) return inferred;

  const sourceText = `${subject}\n${text}`.toLowerCase();
  if (/\breddit\b/.test(sourceText)) return 'Reddit';
  if (/\bhacker\s*news\b/.test(sourceText) || /\bnews\.ycombinator\.com\b/.test(sourceText) || /\bhn\b/.test(sourceText)) {
    return 'Hacker News';
  }
  if (/\blobsters?\b/.test(sourceText) || /\blobste\.rs\b/.test(sourceText)) {
    return 'Lobsters';
  }

  return '';
}

function inferSourceFromUrl(url) {
  if (!url) return '';
  const lower = url.toLowerCase();
  if (lower.includes('reddit.com')) return 'Reddit';
  if (lower.includes('news.ycombinator.com')) return 'Hacker News';
  if (lower.includes('lobste.rs')) return 'Lobsters';
  return '';
}

function extractKeyword(lines, subject, source) {
  const keywordPatterns = [
    /(?:matched|triggered)\s+keyword\s*[:\-]\s*(.+)$/i,
    /^keyword\s*[:\-]\s*(.+)$/i,
    /(?:keyword|alert)\s+match(?:ed)?\s*[:\-]\s*(.+)$/i,
  ];

  for (const line of lines) {
    for (const pattern of keywordPatterns) {
      const match = line.match(pattern);
      if (match?.[1]) {
        return cleanKeyword(match[1]);
      }
    }
  }

  const markerIndex = lines.findIndex((line) => /^f5bot\s+alert$/i.test(line));
  if (markerIndex >= 0) {
    for (let i = markerIndex + 1; i < lines.length; i += 1) {
      const candidate = lines[i];
      if (isMetaLine(candidate, source)) continue;
      if (looksLikeUrl(candidate)) continue;
      return cleanKeyword(candidate);
    }
  }

  const subjectMatch = subject.match(/for\s+(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/i);
  if (subjectMatch) {
    return cleanKeyword(subjectMatch[1] || subjectMatch[2] || subjectMatch[3] || '');
  }

  return '';
}

function extractTitle(lines, subject, keyword, source, url) {
  const cleanedSubject = cleanSubject(subject);
  if (cleanedSubject && !isGenericTitle(cleanedSubject) && cleanedSubject !== keyword) {
    return cleanedSubject;
  }

  for (const line of lines) {
    if (isMetaLine(line, source)) continue;
    if (looksLikeUrl(line)) continue;
    if (line === keyword) continue;
    if (url && line.includes(url)) continue;
    if (line.length < 8) continue;
    if (line.length > 280) continue;
    return line;
  }

  return '';
}

function extractSnippet(lines, title, keyword, source, url) {
  const quoted = lines.find((line) => /^["'`].+["'`]$/.test(line) && line.length >= 20);
  if (quoted) {
    return stripWrappingQuotes(quoted);
  }

  const filtered = lines.filter((line) => {
    if (line === title || line === keyword) return false;
    if (isMetaLine(line, source)) return false;
    if (looksLikeUrl(line)) return false;
    if (url && line.includes(url)) return false;
    return line.length >= 30;
  });

  if (filtered.length === 0) return '';
  return filtered.sort((a, b) => b.length - a.length)[0];
}

function extractPostUrl(text, html, subject) {
  const rawCandidates = new Set();

  for (const url of extractUrls(text || '')) {
    rawCandidates.add(url);
  }
  for (const url of extractUrls(subject || '')) {
    rawCandidates.add(url);
  }
  for (const url of extractUrlsFromHtml(html || '')) {
    rawCandidates.add(url);
  }

  const candidates = Array.from(rawCandidates)
    .flatMap((url) => expandUrlCandidates(url))
    .map((url) => normalizePostUrl(url))
    .filter(Boolean)
    .filter((url) => !isIgnoredUrl(url));

  const uniqueCandidates = Array.from(new Set(candidates));

  if (uniqueCandidates.length === 0) {
    return '';
  }

  const preferred = uniqueCandidates.find((url) => isPlatformUrl(url));
  if (preferred) return preferred;

  const f5botRedirect = uniqueCandidates.find((url) => isF5BotRoutableUrl(url));
  if (f5botRedirect) return f5botRedirect;

  return uniqueCandidates[0];
}

function resolveNotifyThreshold(env) {
  const raw = Number(env?.MIN_RELEVANCE_SCORE);
  if (!Number.isFinite(raw)) return DEFAULT_NOTIFY_THRESHOLD;
  return clamp(raw, 0, 1);
}

function isTruthy(value) {
  return /^(1|true|yes|on)$/i.test(String(value || '').trim());
}

function resolveDedupeTtlSeconds(env) {
  const rawDays = Number(env?.DEDUPE_TTL_DAYS);
  const days = Number.isFinite(rawDays) ? clamp(rawDays, 1, 365) : DEFAULT_DEDUPE_TTL_DAYS;
  return Math.round(days * 24 * 60 * 60);
}

function normalizeForDedupeKey(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function isIgnoredUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    const whole = `${host}${path}${parsed.search.toLowerCase()}`;
    if (whole.includes('unsubscribe')) return true;
    if (isAssetUrl(path)) return true;
    if ((host === 'f5bot.com' || host.endsWith('.f5bot.com')) && isF5BotManagementPath(path)) {
      return true;
    }
    return false;
  } catch {
    const lower = String(url || '').toLowerCase();
    return lower.includes('unsubscribe');
  }
}

function isPlatformUrl(url) {
  const lower = url.toLowerCase();
  return lower.includes('reddit.com') || lower.includes('news.ycombinator.com') || lower.includes('lobste.rs');
}

function isF5BotRoutableUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    return (host === 'f5bot.com' || host.endsWith('.f5bot.com')) && !isF5BotManagementPath(path);
  } catch {
    return false;
  }
}

function isF5BotManagementPath(path) {
  const value = String(path || '').toLowerCase();
  if (!value || value === '/') return true;
  return (
    value.startsWith('/account') ||
    value.startsWith('/alerts') ||
    value.startsWith('/settings') ||
    value.startsWith('/unsubscribe') ||
    value.startsWith('/login') ||
    value.startsWith('/help') ||
    value.startsWith('/privacy') ||
    value.startsWith('/terms')
  );
}

function isAssetUrl(path) {
  return /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf)$/i.test(String(path || ''));
}

function expandUrlCandidates(rawUrl) {
  const candidates = new Set();
  const seed = cleanExtractedUrl(rawUrl);
  if (!seed) return [];
  candidates.add(seed);

  const decodedSeed = decodeMaybeUrl(seed);
  if (decodedSeed) {
    candidates.add(decodedSeed);
  }

  try {
    const parsed = new URL(seed);
    const paramNames = ['url', 'u', 'target', 'dest', 'destination', 'redirect', 'redir', 'to', 'link', 'out'];
    for (const param of paramNames) {
      const value = parsed.searchParams.get(param);
      const expanded = decodeMaybeUrl(value);
      if (expanded) {
        candidates.add(expanded);
      }
    }

    const allValues = Array.from(parsed.searchParams.values());
    for (const value of allValues) {
      const embedded = extractFirstUrl(decodeURIComponentSafe(value));
      if (embedded) {
        candidates.add(embedded);
      }
    }

    const fromFragment = extractFirstUrl(decodeURIComponentSafe(parsed.hash || ''));
    if (fromFragment) {
      candidates.add(fromFragment);
    }
  } catch {
    const embedded = extractFirstUrl(decodeURIComponentSafe(seed));
    if (embedded) {
      candidates.add(embedded);
    }
  }

  return Array.from(candidates);
}

function decodeMaybeUrl(input) {
  if (!input) return '';
  let value = String(input).trim();
  if (!value) return '';

  for (let i = 0; i < 3; i += 1) {
    const decoded = decodeURIComponentSafe(value);
    if (decoded === value) break;
    value = decoded;
  }

  if (/^https?:\/\//i.test(value)) {
    return cleanExtractedUrl(value);
  }
  return '';
}

function decodeURIComponentSafe(value) {
  try {
    return decodeURIComponent(String(value || ''));
  } catch {
    return String(value || '');
  }
}

function parseMimeMessage(rawEmail) {
  return parseMimeEntity(rawEmail || '');
}

function parseMimeEntity(rawEntity) {
  const { headerText, bodyText } = splitHeadersAndBody(rawEntity);
  const headers = parseHeaders(headerText);
  const contentType = String(headers['content-type'] || 'text/plain');
  const transferEncoding = String(headers['content-transfer-encoding'] || '').toLowerCase();
  const charset = extractHeaderParam(contentType, 'charset') || 'utf-8';

  if (/multipart\//i.test(contentType)) {
    const boundary = extractHeaderParam(contentType, 'boundary');
    if (!boundary) {
      const text = decodeTransferEncoding(bodyText, transferEncoding, charset);
      return { headers, text, html: '' };
    }

    const parts = splitMultipartBody(bodyText, boundary);
    let text = '';
    let html = '';
    for (const part of parts) {
      const parsedPart = parseMimeEntity(part);
      if (parsedPart.text) text += `${parsedPart.text}\n`;
      if (parsedPart.html) html += `${parsedPart.html}\n`;
    }

    return { headers, text: text.trim(), html: html.trim() };
  }

  const decodedBody = decodeTransferEncoding(bodyText, transferEncoding, charset);
  if (/text\/html/i.test(contentType)) {
    return { headers, text: '', html: decodedBody };
  }
  if (/text\/plain/i.test(contentType) || !headers['content-type']) {
    return { headers, text: decodedBody, html: '' };
  }

  return { headers, text: '', html: '' };
}

function splitHeadersAndBody(raw) {
  const normalized = normalizeNewlines(raw);
  const separatorIndex = normalized.indexOf('\n\n');
  if (separatorIndex < 0) {
    return { headerText: normalized, bodyText: '' };
  }
  return {
    headerText: normalized.slice(0, separatorIndex),
    bodyText: normalized.slice(separatorIndex + 2),
  };
}

function parseHeaders(headerText) {
  const headers = {};
  const lines = normalizeNewlines(headerText).split('\n');
  let currentName = '';
  let currentValue = '';

  const commit = () => {
    if (!currentName) return;
    const key = currentName.toLowerCase();
    const value = decodeMimeWords(currentValue.trim());
    if (headers[key]) {
      headers[key] = `${headers[key]}, ${value}`;
    } else {
      headers[key] = value;
    }
  };

  for (const line of lines) {
    if (!line) continue;
    if (/^\s/.test(line) && currentName) {
      currentValue += ` ${line.trim()}`;
      continue;
    }

    commit();
    const colon = line.indexOf(':');
    if (colon < 0) {
      currentName = '';
      currentValue = '';
      continue;
    }
    currentName = line.slice(0, colon).trim();
    currentValue = line.slice(colon + 1).trim();
  }
  commit();

  return headers;
}

function splitMultipartBody(body, boundary) {
  const normalizedBody = normalizeNewlines(body);
  const delimiter = `--${boundary}`;
  const closingDelimiter = `--${boundary}--`;
  const sections = normalizedBody.split(delimiter);
  const parts = [];

  for (let i = 1; i < sections.length; i += 1) {
    let section = sections[i];
    if (section.startsWith('--') || section.includes(closingDelimiter)) {
      break;
    }
    section = section.replace(/^\n/, '').replace(/\n$/, '');
    if (section.trim()) {
      parts.push(section);
    }
  }

  return parts;
}

function decodeTransferEncoding(body, transferEncoding, charset) {
  const normalized = body || '';
  const encoding = (transferEncoding || '').toLowerCase();

  if (encoding.includes('quoted-printable')) {
    return decodeQuotedPrintable(normalized, charset);
  }
  if (encoding.includes('base64')) {
    return decodeBase64ToString(normalized, charset);
  }
  return normalized;
}

function decodeQuotedPrintable(input, charset) {
  const softBreakRemoved = input.replace(/=\n/g, '');
  const decodedBinary = softBreakRemoved.replace(/=([A-Fa-f0-9]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  const bytes = new Uint8Array(decodedBinary.length);
  for (let i = 0; i < decodedBinary.length; i += 1) {
    bytes[i] = decodedBinary.charCodeAt(i);
  }
  try {
    return new TextDecoder(charset || 'utf-8').decode(bytes);
  } catch {
    return decodedBinary;
  }
}

function decodeBase64ToString(input, charset) {
  const cleaned = input.replace(/\s+/g, '');
  if (!cleaned) return '';
  try {
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    try {
      return new TextDecoder(charset || 'utf-8').decode(bytes);
    } catch {
      return new TextDecoder().decode(bytes);
    }
  } catch {
    return input;
  }
}

function extractHeaderParam(headerValue, param) {
  const regex = new RegExp(`${param}\\s*=\\s*(?:"([^"]+)"|([^;\\s]+))`, 'i');
  const match = String(headerValue || '').match(regex);
  return (match?.[1] || match?.[2] || '').trim();
}

function decodeMimeWords(value) {
  if (!value || !value.includes('=?')) return value || '';
  return value.replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g, (_, charset, encoding, encodedText) => {
    if (encoding.toUpperCase() === 'B') {
      return decodeBase64ToString(encodedText, charset);
    }
    const qDecoded = encodedText
      .replace(/_/g, ' ')
      .replace(/=([A-Fa-f0-9]{2})/g, (m, hex) => String.fromCharCode(parseInt(hex, 16)));
    const bytes = new Uint8Array(qDecoded.length);
    for (let i = 0; i < qDecoded.length; i += 1) {
      bytes[i] = qDecoded.charCodeAt(i);
    }
    try {
      return new TextDecoder(charset || 'utf-8').decode(bytes);
    } catch {
      return qDecoded;
    }
  });
}

function htmlToText(html) {
  if (!html) return '';
  const withoutScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const withBreaks = withoutScript
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n');
  const stripped = withBreaks.replace(/<[^>]+>/g, ' ');
  return decodeHtmlEntities(stripped);
}

function decodeHtmlEntities(text) {
  if (!text) return '';
  const entityMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  };
  let output = text.replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (entity) => entityMap[entity] || entity);
  output = output.replace(/&#(\d+);/g, (_, num) => {
    const code = Number(num);
    return Number.isFinite(code) ? String.fromCharCode(code) : '';
  });
  output = output.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    const code = parseInt(hex, 16);
    return Number.isFinite(code) ? String.fromCharCode(code) : '';
  });
  return output;
}

function extractUrls(text) {
  const regex = /https?:\/\/[^\s<>"')\]]+/gi;
  const matches = text.match(regex) || [];
  return matches.map(cleanExtractedUrl).filter(Boolean);
}

function extractUrlsFromHtml(html) {
  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
  const urls = [];
  for (const match of html.matchAll(hrefRegex)) {
    urls.push(cleanExtractedUrl(decodeHtmlEntities(match[1] || '')));
  }
  return urls.filter(Boolean);
}

function cleanExtractedUrl(url) {
  if (!url) return '';
  let cleaned = url.trim();
  cleaned = cleaned.replace(/[),.;!?]+$/g, '');
  return cleaned;
}

function normalizePostUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    parsed.hash = '';

    const keptParams = [];
    for (const [key, value] of parsed.searchParams.entries()) {
      const lower = key.toLowerCase();
      if (lower.startsWith('utm_')) continue;
      if (lower === 'ref' || lower === 'ref_src' || lower === 'source') continue;
      keptParams.push([key, value]);
    }

    keptParams.sort(([a], [b]) => a.localeCompare(b));
    parsed.search = '';
    for (const [key, value] of keptParams) {
      parsed.searchParams.append(key, value);
    }

    return parsed.toString();
  } catch {
    return '';
  }
}

function tryParseJsonObject(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    const firstBrace = value.indexOf('{');
    const lastBrace = value.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const candidate = value.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function formatRelevance(score) {
  const clamped = clamp(score, 0, 1);
  const percent = Math.round(clamped * 100);
  const slots = 5;
  const filled = Math.round(clamped * slots);
  const bar = `${'#'.repeat(filled)}${'-'.repeat(slots - filled)}`;
  return `[${bar}] ${percent}%`;
}

function cleanSubject(subject) {
  const trimmed = cleanText(subject, 300);
  return trimmed.replace(/^f5bot\s*alert[:\-\s]*/i, '').trim();
}

function isGenericTitle(value) {
  if (!value) return true;
  return /^f5bot(\s+alert)?$/i.test(value);
}

function cleanKeyword(value) {
  const cleaned = stripWrappingQuotes(cleanText(value, 200));
  return cleaned.replace(/^keyword\s*[:\-]\s*/i, '').trim();
}

function stripWrappingQuotes(value) {
  return String(value || '').replace(/^["'`]+|["'`]+$/g, '').trim();
}

function isMetaLine(line, source) {
  const lower = line.toLowerCase();
  if (!lower) return true;
  if (lower.includes('unsubscribe')) return true;
  if (lower.includes('manage alerts')) return true;
  if (lower.includes('view on')) return true;
  if (lower.startsWith('f5bot alert')) return true;
  if (lower.startsWith('matched keyword')) return true;
  if (lower.startsWith('keyword:')) return true;
  if (/^https?:\/\//.test(lower)) return true;
  if (source && lower === source.toLowerCase()) return true;
  if (lower === 'reddit' || lower === 'hacker news' || lower === 'lobsters') return true;
  return false;
}

function looksLikeUrl(value) {
  return /^https?:\/\//i.test(value || '');
}

function extractFirstUrl(text) {
  const urls = extractUrls(text || '');
  return urls.length > 0 ? urls[0] : '';
}

async function safeReadText(response) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const array = new Uint8Array(digest);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

function cleanText(value, maxLength) {
  const text = String(value || '')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
  return maxLength ? truncate(text, maxLength) : text;
}

function truncate(value, maxLength) {
  const text = String(value || '');
  if (!maxLength || text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function normalizeNewlines(value) {
  return String(value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlAttribute(value) {
  return escapeHtml(value)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
