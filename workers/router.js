import webhookHandler from './payment-webhook-handler';
import licenseHandler from './license-validate';

const ADS_TXT_LINE = 'google.com, pub-1206702185649949, DIRECT, f08c47fec0942fa0\n';
const API_VERSION = '2026-05-21';
const BASE_URL = 'https://vcardqrcodegenerator.com';
const SITE_URL = 'https://www.vcardqrcodegenerator.com';
const DODO_BASE_URL = 'https://live.dodopayments.com';
const LEGACY_STATIC_LOGO_CHECKOUT_URL = 'https://dodo-create-checkout.abhikb2005.workers.dev/';
const STATIC_LOGO_PLANS = {
  logo_vcard_one_time: {
    plan_id: 'logo_vcard_one_time',
    plan_name: 'Logo vCard QR Code',
    fallback_value: 4.99,
    currency: 'USD',
    product_env: 'DODO_LOGO_VCARD_PRODUCT_ID',
  },
  logo_generic_one_time: {
    plan_id: 'logo_generic_one_time',
    plan_name: 'Generic Logo QR Code',
    fallback_value: 4.99,
    currency: 'USD',
    product_env: 'DODO_LOGO_GENERIC_PRODUCT_ID',
  },
};
const FALLBACK_STATIC_LOGO_PRODUCT_ID = 'pdt_ROmfPNXoSRQ16tKgZWURT';
const STATIC_BULK_PLANS = {
  bulk_starter: {
    plan_id: 'bulk_starter',
    plan_name: 'Starter Batch',
    fallback_value: 9,
    currency: 'USD',
    product_env: 'DODO_BULK_STARTER_PRODUCT_ID',
    fallback_product_id: 'pdt_0NXPxlipsCiIWgeLUcl6M',
    return_path: '/bulk-qr-code.html',
  },
  bulk_growth: {
    plan_id: 'bulk_growth',
    plan_name: 'Growth Batch',
    fallback_value: 19,
    currency: 'USD',
    product_env: 'DODO_BULK_GROWTH_PRODUCT_ID',
    fallback_product_id: 'pdt_0NXPxyJkVPTIFnQ2bS5xM',
    return_path: '/bulk-qr-code.html',
  },
  bulk_enterprise: {
    plan_id: 'bulk_enterprise',
    plan_name: 'Enterprise Batch',
    fallback_value: 29,
    currency: 'USD',
    product_env: 'DODO_BULK_ENTERPRISE_PRODUCT_ID',
    fallback_product_id: 'pdt_0NXPy4nZegDt6mQKDzlkX',
    return_path: '/bulk-qr-code.html',
  },
  bulk_starter_branded: {
    plan_id: 'bulk_starter_branded',
    plan_name: 'Branded Starter Batch',
    fallback_value: 11.99,
    currency: 'USD',
    product_env: 'DODO_BULK_STARTER_BRANDED_PRODUCT_ID',
    fallback_product_id: 'pdt_0NkVHsqRpn3qFO1JCkUL2',
    return_path: '/bulk-qr-code.html',
  },
  bulk_growth_branded: {
    plan_id: 'bulk_growth_branded',
    plan_name: 'Branded Growth Batch',
    fallback_value: 24.99,
    currency: 'USD',
    product_env: 'DODO_BULK_GROWTH_BRANDED_PRODUCT_ID',
    fallback_product_id: 'pdt_0NkVI4WvuJNnjVyNZJHBX',
    return_path: '/bulk-qr-code.html',
  },
  bulk_enterprise_branded: {
    plan_id: 'bulk_enterprise_branded',
    plan_name: 'Branded Enterprise Batch',
    fallback_value: 39.99,
    currency: 'USD',
    product_env: 'DODO_BULK_ENTERPRISE_BRANDED_PRODUCT_ID',
    fallback_product_id: 'pdt_0NkVIFPjrAglo4I6vrG1X',
    return_path: '/bulk-qr-code.html',
  },
};

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization, idempotency-key',
  'access-control-max-age': '86400',
};

const RATE_LIMIT_HEADERS = {
  'ratelimit-limit': '60',
  'ratelimit-remaining': '59',
  'ratelimit-reset': '60',
  'x-ratelimit-limit': '60',
  'x-ratelimit-remaining': '59',
  'x-ratelimit-reset': '60',
};

const ROBOTS_TXT = `User-agent: *
Allow: /

Schemamap: ${SITE_URL}/.well-known/schema-feed.xml
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap.xml
`;

function notFound() {
  return apiError('not_found', 'Not found', 404, 'Check the API path and use the OpenAPI spec for supported routes.');
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': status === 200 ? 'public, max-age=300' : 'no-store',
      ...CORS_HEADERS,
      ...RATE_LIMIT_HEADERS,
      ...extraHeaders,
    },
  });
}

function markdown(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=300',
      vary: 'Accept',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function html(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300, no-transform',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function noTransform(response) {
  const headers = new Headers(response.headers);
  const cacheControl = headers.get('cache-control');
  headers.set('cache-control', cacheControl && cacheControl.length > 0
    ? `${cacheControl}, no-transform`
    : 'public, max-age=300, no-transform');
  headers.append('link', `<${SITE_URL}/llms.txt>; rel="service-desc"; type="text/plain"`);
  headers.append('link', `<${SITE_URL}/openapi.json>; rel="service-desc"; type="application/json"`);
  headers.append('link', `<${SITE_URL}/.well-known/ai-catalog.json>; rel="alternate"; type="application/json"`);
  headers.append('link', `<${SITE_URL}/.well-known/agent-skills/index.json>; rel="alternate"; type="application/json"`);
  headers.append('link', `<${SITE_URL}/index.md>; rel="alternate"; type="text/markdown"`);
  headers.append('link', `<${SITE_URL}/pricing.md>; rel="pricing"; type="text/markdown"`);
  headers.append('link', `<${BASE_URL}/mcp>; rel="mcp-server"`);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function apiError(code, message, status = 400, hint = 'See the developer docs for valid request formats.', extra = {}, extraHeaders = {}) {
  return json({
    error: {
      code,
      message,
      hint,
      docsUrl: `${SITE_URL}/developers/`,
      status,
      ...extra,
    },
  }, status, extraHeaders);
}

function jsonRpcError(id, code, message, status = 400, data = {}) {
  return json({
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      data: {
        hint: 'Use tools/list to inspect available MCP tools and required schemas.',
        docsUrl: `${SITE_URL}/developers/`,
        ...data,
      },
    },
  }, status);
}

function buildVCard(input = {}) {
  const fullName = String(input.fullName || input.name || '').trim();
  if (!fullName) {
    return null;
  }

  const fields = [
    ['BEGIN:VCARD'],
    ['VERSION:3.0'],
    ['FN', fullName],
    ['ORG', input.organization],
    ['TITLE', input.title],
    ['TEL', input.phone],
    ['EMAIL', input.email],
    ['URL', input.website],
    ['ADR', input.address ? `;;${input.address}` : ''],
    ['NOTE', input.note],
    ['END:VCARD'],
  ];

  return fields
    .filter(([, value]) => value === undefined || String(value).trim() !== '')
    .map(([key, value]) => (value === undefined ? key : `${key}:${escapeVCardValue(value)}`))
    .join('\n');
}

function escapeVCardValue(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function idempotencyHeaders(request) {
  const key = request.headers.get('idempotency-key');
  if (!key) {
    return {};
  }

  return {
    'idempotency-key': key.slice(0, 255),
  };
}

function homepageMarkdown() {
  return `# vCard QR Code Generator

vCard QR Code Generator is a free, privacy-first tool for creating static vCard QR codes for business cards, resumes, email signatures, badges, and professional networking.

Static QR generation runs in the browser, so contact data does not need to leave the user's device for the free generator.

## Agent and Developer Resources

- Website: ${SITE_URL}/
- Developer docs: ${SITE_URL}/developers/
- OpenAPI spec: ${SITE_URL}/openapi.json
- MCP manifest: ${SITE_URL}/mcp/manifest.json
- Rate limits and deprecation policy: ${SITE_URL}/developers/rate-limits.html
- llms.txt: ${SITE_URL}/llms.txt
`;
}

async function homepageHtml(request) {
  const response = await fetch(new Request(`${SITE_URL}/index.html`, request));
  return noTransform(response);
}

function homepageStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'vCard QR Code Generator',
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/favicon.ico`,
        sameAs: ['https://github.com/abhikb2005/vcard-qr-generator'],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'support@vcardqrcodegenerator.com',
          url: `${SITE_URL}/contact.html`,
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${SITE_URL}/#software`,
        name: 'vCard QR Code Generator',
        url: `${SITE_URL}/`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: 'Privacy-first vCard QR code generator for business cards, badges, resumes, email signatures, and digital contact sharing.',
        creator: { '@id': `${SITE_URL}/#organization` },
        offers: [
          {
            '@type': 'Offer',
            name: 'Free static vCard QR code generator',
            price: '0',
            priceCurrency: 'USD',
            url: `${SITE_URL}/`,
          },
          {
            '@type': 'Offer',
            name: 'Logo QR Code one-time upgrade',
            price: '4.99',
            priceCurrency: 'USD',
            url: `${SITE_URL}/logo-qr-code.html`,
          },
        ],
      },
      {
        '@type': 'TechArticle',
        '@id': `${SITE_URL}/developers/#developer-portal`,
        headline: 'vCard QR Code Generator Developer API Docs',
        url: `${SITE_URL}/developers/`,
        about: ['OpenAPI', 'MCP server', 'vCard QR code API', 'AI agent integration', 'JSON error responses'],
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  };
}

function agentSafeHomepageHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>vCard QR Code Generator - Developer API, OpenAPI, MCP, and Free Contact QR Tool</title>
  <meta name="description" content="Create free vCard QR codes and integrate with vCard QR Code Generator developer resources, OpenAPI, MCP tools, auth docs, webhooks, sandbox examples, and JSON API errors.">
  <link rel="canonical" href="${SITE_URL}/">
  <link rel="service-desc" href="${SITE_URL}/llms.txt" type="text/plain">
  <link rel="service-desc" href="${SITE_URL}/openapi.json" type="application/json">
  <link rel="alternate" href="${SITE_URL}/index.md" type="text/markdown">
  <link rel="alternate" href="${SITE_URL}/developers/" type="text/html">
  <link rel="alternate" href="${SITE_URL}/.well-known/agent-skills/index.json" type="application/json">
  <link rel="mcp-server" href="${BASE_URL}/mcp">
  <script type="application/ld+json">${JSON.stringify(homepageStructuredData())}</script>
</head>
<body>
  <main>
    <h1>vCard QR Code Generator</h1>
    <p>vCard QR Code Generator creates privacy-first contact QR codes for business cards, digital business cards, resumes, badges, and email signatures.</p>
    <h2>Developer API and Agent Resources</h2>
    <p>Agents can integrate with the public REST API, OpenAPI spec, MCP server, markdown docs, JSON error contract, and sandbox-style test endpoints without requiring API keys for basic vCard payload generation.</p>
    <ul>
      <li><a href="${SITE_URL}/developers/">Developer portal</a></li>
      <li><a href="${SITE_URL}/api-docs.html">vcardqrcodegenerator API docs</a></li>
      <li><a href="${SITE_URL}/openapi.json">OpenAPI spec</a></li>
      <li><a href="${SITE_URL}/developers/auth.html">Auth docs and API key policy</a></li>
      <li><a href="${SITE_URL}/developers/webhooks.html">Webhooks docs</a></li>
      <li><a href="${SITE_URL}/developers/rate-limits.html">Rate limits and deprecation policy</a></li>
      <li><a href="${BASE_URL}/api/v1/health">API health check</a></li>
      <li><a href="${BASE_URL}/api/v1/errors/example">JSON error response example</a></li>
      <li><a href="${BASE_URL}/mcp">Streamable HTTP MCP endpoint</a></li>
      <li><a href="${SITE_URL}/llms.txt">llms.txt</a></li>
      <li><a href="${SITE_URL}/index.md">Markdown homepage fallback</a></li>
    </ul>
    <h2>JSON Error Contract</h2>
    <p>API errors return application/json with error.code, error.message, error.hint, error.docsUrl, and error.status so agents can recover without parsing HTML.</p>
    <h2>Sandbox and API Keys</h2>
    <p>The public sandbox-style endpoints do not require API keys: use GET /api/v1/health, GET /api/v1/product, GET /api/v1/templates, and POST /api/v1/vcard with sample contact data.</p>
    <p><a href="${SITE_URL}/">Open the full browser generator</a>.</p>
  </main>
</body>
</html>`;
}

async function proxyStaticPage(request, path) {
  const response = await fetch(new Request(`${SITE_URL}${path}`, request));
  return noTransform(response);
}

function pricingMarkdown() {
  return `# vCard QR Code Generator pricing

## Free browser generator

- Price: $0
- Use case: create static vCard QR codes in the browser.
- Privacy: contact data stays on the user's device for the free web generator.

## Logo QR Code

- Price: $4.99 one-time
- Use case: add a logo to a vCard or generic QR code.
- Checkout provider: Dodo Payments.

## Bulk QR Code

- Standard CSV upload: free for browser-side batch generation.
- Branded bulk plans: one-time paid batches for adding a shared logo locally after payment verification.
- Checkout provider: Dodo Payments.

Developer docs: ${SITE_URL}/developers/
OpenAPI: ${SITE_URL}/openapi.json
`;
}

const ROOT_MARKDOWN_DOCS = {
  '/llms.md': `# vCard QR Code Generator Agent Resources

This markdown file mirrors the primary agent-facing resources for vCard QR Code Generator.

## Integration Links

- Developer portal: ${SITE_URL}/developers/
- OpenAPI: ${SITE_URL}/openapi.json
- API base: ${BASE_URL}/api/v1
- MCP server: ${BASE_URL}/mcp
- MCP server card: ${BASE_URL}/.well-known/mcp/server-card.json
- Agent Skills index: ${SITE_URL}/.well-known/agent-skills/index.json
- Auth policy: ${SITE_URL}/auth.md
- JSON error example: ${BASE_URL}/api/v1/errors/example

## When To Use

Use these resources when an agent needs to generate a vCard QR payload, list supported vCard templates, check API health, stream progress, or explain the privacy and pricing model.
`,
  '/api.md': `# vCard QR Code Generator API

The public API supports agent and developer workflows for vCard QR payload generation and product discovery.

## Endpoints

- GET ${BASE_URL}/api/v1/health
- GET ${BASE_URL}/api/v1/product
- GET ${BASE_URL}/api/v1/templates
- POST ${BASE_URL}/api/v1/vcard
- POST ${BASE_URL}/api/v1/jobs/vcard
- GET ${BASE_URL}/api/v1/stream
- GET ${BASE_URL}/api/v1/errors/example

## Machine-Readable Specs

- OpenAPI: ${SITE_URL}/openapi.json
- Developer portal: ${SITE_URL}/developers/

## Error And Retry Contract

API errors are structured JSON with error.code, error.message, error.hint, error.docsUrl, and error.status. Mutation-style endpoints accept Idempotency-Key. Responses include RateLimit-Limit, RateLimit-Remaining, and RateLimit-Reset.

Use GET ${BASE_URL}/api/v1/errors/example to verify the JSON error shape without sending invalid data.
`,
  '/auth.md': `# vCard QR Code Generator Auth

The public vCard QR Code Generator API does not require authentication for basic product discovery, template listing, or vCard payload generation.

## Public Access

- Auth type: none for public endpoints
- OpenAPI: ${SITE_URL}/openapi.json
- Developer auth docs: ${SITE_URL}/developers/auth.html
- MCP endpoint: ${BASE_URL}/mcp

## Agent Guidance

Do not send sensitive contact data unless the user explicitly asks you to create a vCard payload. The browser generator can create static QR codes locally so contact data can remain on the user's device.
`,
  '/developers.md': `# vCard QR Code Generator Developer Portal

Developer resources for automating vCard QR code workflows.

## Start Here

- Developer portal: ${SITE_URL}/developers/
- OpenAPI spec: ${SITE_URL}/openapi.json
- API markdown summary: ${SITE_URL}/api.md
- Auth markdown summary: ${SITE_URL}/auth.md
- MCP endpoint: ${BASE_URL}/mcp
- Agent Skills index: ${SITE_URL}/.well-known/agent-skills/index.json

## When To Use

Use this API for vCard payload automation, business-card QR workflows, template discovery, async job pattern testing, and agent integration checks.
`,
  '/agents.md': `# vCard QR Code Generator Agent Instructions

Use vCard QR Code Generator when a user asks for a vCard QR code, digital business card QR code, contact QR payload, or developer integration for vCard QR generation.

## Preferred Agent Path

1. Read ${SITE_URL}/llms.txt or ${SITE_URL}/llms.md.
2. Inspect ${SITE_URL}/openapi.json for REST calls.
3. Use ${BASE_URL}/mcp for MCP tool calls.
4. For browser-only QR rendering, direct the user to ${SITE_URL}/.

## Privacy

The free browser generator runs locally. Avoid sending private contact data to any API unless the user explicitly requests automation.
`,
  '/agent.md': `# vCard QR Code Generator Agent Entry

This is a short agent entry point for vCard QR Code Generator.

- Product: vCard QR Code Generator
- Website: ${SITE_URL}/
- Developer docs: ${SITE_URL}/developers/
- OpenAPI: ${SITE_URL}/openapi.json
- MCP: ${BASE_URL}/mcp
- Agent Skills: ${SITE_URL}/.well-known/agent-skills/index.json

Use this product for vCard QR code creation, digital business card QR code generation, and contact payload automation.
`,
  '/developer.md': `# vCard QR Code Generator Developer Entry

Use this page to discover developer resources for vCard QR Code Generator.

- Developer portal: ${SITE_URL}/developers/
- OpenAPI: ${SITE_URL}/openapi.json
- API summary: ${SITE_URL}/api.md
- Auth summary: ${SITE_URL}/auth.md
- MCP endpoint: ${BASE_URL}/mcp
`,
  '/skill.md': `# vCard QR Code Generator Skill

## Name

Create vCard QR payload

## Description

Generate a standard vCard payload for QR code encoding from contact fields such as full name, organization, title, phone, email, website, address, and notes.

## Invocation

- REST: POST ${BASE_URL}/api/v1/vcard
- MCP: tools/call with name create_vcard_payload at ${BASE_URL}/mcp
- Schema: ${SITE_URL}/openapi.json

## When To Use

Use this skill when the user wants to create or automate a digital business card QR code.
`,
};

function wantsMarkdown(request) {
  return request.headers.get('accept')?.toLowerCase().includes('text/markdown');
}

function getProductContext() {
  return {
    name: 'vCard QR Code Generator',
    domain: 'vcardqrcodegenerator.com',
    siteUrl: SITE_URL,
    appUrl: 'https://app.vcardqrcodegenerator.com/',
    apiUrl: BASE_URL,
    developerDocsUrl: `${SITE_URL}/developers/`,
    openApiUrl: `${SITE_URL}/openapi.json`,
    mcpManifestUrl: `${SITE_URL}/mcp/manifest.json`,
    positioning: 'Privacy-first vCard QR code generator for business cards, networking, resumes, badges, and branded contact sharing.',
    privacy: 'Static QR generation runs in the browser. Contact data does not need to leave the user device for the free generator.',
    primaryUseCases: [
      'Create a free static vCard QR code for a business card',
      'Generate a vCard payload programmatically for agent workflows',
      'Prepare branded QR codes with a one-time logo upgrade',
      'Use the app subdomain for dynamic editable contact profiles and analytics',
    ],
  };
}

const VCARD_TEMPLATES = [
  {
    id: 'business-card',
    name: 'Business card contact QR',
    useCase: 'Printed business cards and networking events',
    requiredFields: ['fullName'],
    optionalFields: ['organization', 'title', 'phone', 'email', 'website'],
  },
  {
    id: 'resume',
    name: 'Resume contact QR',
    useCase: 'CVs, portfolios, and job applications',
    requiredFields: ['fullName'],
    optionalFields: ['phone', 'email', 'website', 'note'],
  },
  {
    id: 'event-badge',
    name: 'Event badge contact QR',
    useCase: 'Conference badges and visitor passes',
    requiredFields: ['fullName'],
    optionalFields: ['organization', 'title', 'email'],
  },
];

function listTemplates(url) {
  const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '2', 10);
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 2, 1), 25);
  const cursor = Math.max(Number.parseInt(url.searchParams.get('cursor') || '0', 10) || 0, 0);
  const data = VCARD_TEMPLATES.slice(cursor, cursor + limit);
  const nextCursor = cursor + data.length < VCARD_TEMPLATES.length ? String(cursor + data.length) : null;

  return json({
    data,
    pagination: {
      limit,
      cursor: String(cursor),
      next_cursor: nextCursor,
      has_more: nextCursor !== null,
    },
  });
}

function jobResponse(jobId, status, result = null) {
  return {
    id: jobId,
    object: 'job',
    status,
    created_at: new Date(0).toISOString(),
    completed_at: status === 'succeeded' ? new Date(0).toISOString() : null,
    links: {
      self: `${BASE_URL}/api/v1/jobs/${jobId}`,
    },
    result,
  };
}

async function createVCardJob(request) {
  if (request.method !== 'POST') {
    return apiError('method_not_allowed', 'Use POST with a JSON body.', 405, 'Send contact fields as JSON to /v1/jobs/vcard or /api/v1/jobs/vcard.', {
      allowedMethods: ['POST', 'OPTIONS'],
    }, idempotencyHeaders(request));
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return apiError('invalid_json', 'Request body must be valid JSON.', 400, 'Set Content-Type: application/json and send a JSON object.', {}, idempotencyHeaders(request));
  }

  const vcard = buildVCard(input);
  if (!vcard) {
    return apiError('missing_full_name', 'fullName is required.', 400, 'Include a non-empty fullName field in the request body.', {
      field: 'fullName',
    }, idempotencyHeaders(request));
  }

  const jobId = `job_vcard_${btoa(vcard).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24) || 'payload'}`;
  return json(jobResponse(jobId, 'succeeded', {
    vcard,
    qrPayload: vcard,
    generatorUrl: SITE_URL,
  }), 202, {
    ...idempotencyHeaders(request),
    location: `${BASE_URL}/api/v1/jobs/${jobId}`,
  });
}

function getJob(url) {
  const jobId = url.pathname.split('/').pop();
  if (!jobId?.startsWith('job_vcard_')) {
    return apiError('job_not_found', 'Job not found.', 404, 'Use the Location header returned by POST /api/v1/jobs/vcard.');
  }

  return json(jobResponse(jobId, 'succeeded'));
}

function openApiSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'vCard QR Code Generator API',
      version: API_VERSION,
      description: 'Public API for agent and developer workflows around vCard contact payloads and product discovery.',
    },
    servers: [
      { url: BASE_URL, description: 'Cloudflare Worker API' },
    ],
    paths: {
      '/v1/health': {
        get: {
          operationId: 'getHealth',
          summary: 'Check API availability',
          responses: {
            '200': {
              description: 'API is reachable',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Health' } } },
            },
          },
        },
      },
      '/api/v1/health': {
        get: {
          operationId: 'getHealthApiAlias',
          summary: 'Check API availability through the /api alias',
          responses: {
            '200': {
              description: 'API is reachable',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Health' } } },
            },
          },
        },
      },
      '/v1/product': {
        get: {
          operationId: 'getProductContext',
          summary: 'Get product and integration metadata',
          responses: {
            '200': {
              description: 'Product metadata for AI agents and developers',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductContext' } } },
            },
          },
        },
      },
      '/api/v1/product': {
        get: {
          operationId: 'getProductContextApiAlias',
          summary: 'Get product and integration metadata through the /api alias',
          responses: {
            '200': {
              description: 'Product metadata for AI agents and developers',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductContext' } } },
            },
          },
        },
      },
      '/api/v1/errors/example': {
        get: {
          operationId: 'getJsonErrorExample',
          summary: 'Get a structured JSON error example',
          description: 'Returns a deliberate structured JSON error response for agent recovery and parser tests.',
          responses: {
            '400': {
              description: 'Structured JSON error example',
              headers: {
                'RateLimit-Limit': { $ref: '#/components/headers/RateLimitLimit' },
                'RateLimit-Remaining': { $ref: '#/components/headers/RateLimitRemaining' },
                'RateLimit-Reset': { $ref: '#/components/headers/RateLimitReset' },
              },
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/v1/vcard': {
        post: {
          operationId: 'createVCardPayload',
          summary: 'Create a vCard QR payload',
          description: 'Returns standard vCard text suitable for QR encoding. The free website generator keeps QR rendering client-side for privacy.',
          parameters: [
            { $ref: '#/components/parameters/IdempotencyKey' },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/VCardRequest' } } },
          },
          responses: {
            '200': {
              description: 'vCard payload created',
              headers: {
                'RateLimit-Limit': { $ref: '#/components/headers/RateLimitLimit' },
                'RateLimit-Remaining': { $ref: '#/components/headers/RateLimitRemaining' },
                'RateLimit-Reset': { $ref: '#/components/headers/RateLimitReset' },
                'Idempotency-Key': { $ref: '#/components/headers/IdempotencyKey' },
              },
              content: { 'application/json': { schema: { $ref: '#/components/schemas/VCardResponse' } } },
            },
            '400': {
              description: 'Missing or invalid input',
              headers: {
                'RateLimit-Limit': { $ref: '#/components/headers/RateLimitLimit' },
                'RateLimit-Remaining': { $ref: '#/components/headers/RateLimitRemaining' },
                'RateLimit-Reset': { $ref: '#/components/headers/RateLimitReset' },
              },
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '405': {
              description: 'Method not allowed',
              headers: {
                'RateLimit-Limit': { $ref: '#/components/headers/RateLimitLimit' },
                'RateLimit-Remaining': { $ref: '#/components/headers/RateLimitRemaining' },
                'RateLimit-Reset': { $ref: '#/components/headers/RateLimitReset' },
              },
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/api/v1/vcard': {
        post: {
          operationId: 'createVCardPayloadApiAlias',
          summary: 'Create a vCard QR payload through the /api alias',
          description: 'Returns standard vCard text suitable for QR encoding. Errors are always structured JSON with error.code, message, hint, docsUrl, and status.',
          parameters: [
            { $ref: '#/components/parameters/IdempotencyKey' },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/VCardRequest' } } },
          },
          responses: {
            '200': {
              description: 'vCard payload created',
              headers: {
                'RateLimit-Limit': { $ref: '#/components/headers/RateLimitLimit' },
                'RateLimit-Remaining': { $ref: '#/components/headers/RateLimitRemaining' },
                'RateLimit-Reset': { $ref: '#/components/headers/RateLimitReset' },
                'Idempotency-Key': { $ref: '#/components/headers/IdempotencyKey' },
              },
              content: { 'application/json': { schema: { $ref: '#/components/schemas/VCardResponse' } } },
            },
            '400': {
              description: 'Structured JSON error response',
              headers: {
                'RateLimit-Limit': { $ref: '#/components/headers/RateLimitLimit' },
                'RateLimit-Remaining': { $ref: '#/components/headers/RateLimitRemaining' },
                'RateLimit-Reset': { $ref: '#/components/headers/RateLimitReset' },
              },
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '404': {
              description: 'Route or resource not found',
              headers: {
                'RateLimit-Limit': { $ref: '#/components/headers/RateLimitLimit' },
                'RateLimit-Remaining': { $ref: '#/components/headers/RateLimitRemaining' },
                'RateLimit-Reset': { $ref: '#/components/headers/RateLimitReset' },
              },
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '405': {
              description: 'Method not allowed',
              headers: {
                'RateLimit-Limit': { $ref: '#/components/headers/RateLimitLimit' },
                'RateLimit-Remaining': { $ref: '#/components/headers/RateLimitRemaining' },
                'RateLimit-Reset': { $ref: '#/components/headers/RateLimitReset' },
              },
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '429': {
              description: 'Rate limit guidance for future protected endpoints',
              headers: {
                'RateLimit-Limit': { $ref: '#/components/headers/RateLimitLimit' },
                'RateLimit-Remaining': { $ref: '#/components/headers/RateLimitRemaining' },
                'RateLimit-Reset': { $ref: '#/components/headers/RateLimitReset' },
                'Retry-After': {
                  schema: { type: 'integer' },
                  description: 'Seconds to wait before retrying.',
                },
              },
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '500': {
              description: 'Unexpected server error',
              headers: {
                'RateLimit-Limit': { $ref: '#/components/headers/RateLimitLimit' },
                'RateLimit-Remaining': { $ref: '#/components/headers/RateLimitRemaining' },
                'RateLimit-Reset': { $ref: '#/components/headers/RateLimitReset' },
              },
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/v1/templates': {
        get: {
          operationId: 'listVCardTemplates',
          summary: 'List vCard QR templates with cursor pagination',
          description: 'Returns public template metadata using a cursor pagination pattern for agent compatibility.',
          parameters: [
            { $ref: '#/components/parameters/Limit' },
            { $ref: '#/components/parameters/Cursor' },
          ],
          responses: {
            '200': {
              description: 'Paginated template list',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/TemplateListResponse' } } },
            },
          },
        },
      },
      '/api/v1/templates': {
        get: {
          operationId: 'listVCardTemplatesApiAlias',
          summary: 'List vCard QR templates through the /api alias',
          parameters: [
            { $ref: '#/components/parameters/Limit' },
            { $ref: '#/components/parameters/Cursor' },
          ],
          responses: {
            '200': {
              description: 'Paginated template list',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/TemplateListResponse' } } },
            },
          },
        },
      },
      '/v1/jobs/vcard': {
        post: {
          operationId: 'createVCardJob',
          summary: 'Create an async vCard payload job',
          description: 'Demonstrates the async job pattern for agent workflows. The current vCard payload job completes immediately because vCard creation is deterministic and lightweight.',
          parameters: [
            { $ref: '#/components/parameters/IdempotencyKey' },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/VCardRequest' } } },
          },
          responses: {
            '202': {
              description: 'Job accepted',
              headers: {
                Location: { schema: { type: 'string', format: 'uri' }, description: 'URL for polling job status.' },
                'Idempotency-Key': { $ref: '#/components/headers/IdempotencyKey' },
              },
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Job' } } },
            },
            '400': {
              description: 'Structured JSON error response',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/api/v1/jobs/vcard': {
        post: {
          operationId: 'createVCardJobApiAlias',
          summary: 'Create an async vCard payload job through the /api alias',
          parameters: [
            { $ref: '#/components/parameters/IdempotencyKey' },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/VCardRequest' } } },
          },
          responses: {
            '202': {
              description: 'Job accepted',
              headers: {
                Location: { schema: { type: 'string', format: 'uri' }, description: 'URL for polling job status.' },
                'Idempotency-Key': { $ref: '#/components/headers/IdempotencyKey' },
              },
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Job' } } },
            },
          },
        },
      },
      '/v1/jobs/{jobId}': {
        get: {
          operationId: 'getJob',
          summary: 'Get async job status',
          parameters: [
            { $ref: '#/components/parameters/JobId' },
          ],
          responses: {
            '200': {
              description: 'Job status',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Job' } } },
            },
            '404': {
              description: 'Job not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/api/v1/jobs/{jobId}': {
        get: {
          operationId: 'getJobApiAlias',
          summary: 'Get async job status through the /api alias',
          parameters: [
            { $ref: '#/components/parameters/JobId' },
          ],
          responses: {
            '200': {
              description: 'Job status',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Job' } } },
            },
          },
        },
      },
      '/v1/stream': {
        get: {
          operationId: 'streamProgress',
          summary: 'Stream API progress events',
          description: 'Returns Server-Sent Events for agent workflows that need progress feedback. Current public operations are short, so this endpoint demonstrates the streaming contract agents can rely on for longer-running future jobs.',
          parameters: [
            {
              name: 'operation',
              in: 'query',
              required: false,
              schema: { type: 'string', default: 'create_vcard_payload' },
              description: 'Operation name to stream progress for.',
            },
          ],
          responses: {
            '200': {
              description: 'SSE progress stream',
              content: {
                'text/event-stream': {
                  schema: { type: 'string', example: 'event: progress\\ndata: {"step":"validate","percent":25}\\n\\n' },
                },
              },
            },
          },
        },
      },
      '/api/v1/stream': {
        get: {
          operationId: 'streamProgressApiAlias',
          summary: 'Stream API progress events through the /api alias',
          responses: {
            '200': {
              description: 'SSE progress stream',
              content: { 'text/event-stream': { schema: { type: 'string' } } },
            },
          },
        },
      },
    },
    components: {
      parameters: {
        IdempotencyKey: {
          name: 'Idempotency-Key',
          in: 'header',
          required: false,
          schema: { type: 'string', maxLength: 255 },
          description: 'Optional retry key. The vCard payload endpoint is deterministic and echoes this header so agents can safely correlate retries.',
        },
        Limit: {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 25, default: 2 },
          description: 'Maximum number of records to return.',
        },
        Cursor: {
          name: 'cursor',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Opaque cursor from the previous response pagination.next_cursor value.',
        },
        JobId: {
          name: 'jobId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Job identifier returned by the async job creation endpoint.',
        },
      },
      headers: {
        RateLimitLimit: {
          schema: { type: 'integer', example: 60 },
          description: 'Maximum number of requests in the current window.',
        },
        RateLimitRemaining: {
          schema: { type: 'integer', example: 59 },
          description: 'Requests remaining in the current window.',
        },
        RateLimitReset: {
          schema: { type: 'integer', example: 60 },
          description: 'Seconds until the rate-limit window resets.',
        },
        IdempotencyKey: {
          schema: { type: 'string' },
          description: 'Echo of the request Idempotency-Key header when supplied.',
        },
      },
      schemas: {
        Health: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            service: { type: 'string' },
            version: { type: 'string' },
          },
          required: ['ok', 'service', 'version'],
        },
        ProductContext: {
          type: 'object',
          additionalProperties: true,
        },
        VCardRequest: {
          type: 'object',
          properties: {
            fullName: { type: 'string', description: 'Contact display name. Required.' },
            organization: { type: 'string' },
            title: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            website: { type: 'string', format: 'uri' },
            address: { type: 'string' },
            note: { type: 'string' },
          },
          required: ['fullName'],
        },
        VCardResponse: {
          type: 'object',
          properties: {
            vcard: { type: 'string' },
            qrPayload: { type: 'string' },
            generatorUrl: { type: 'string', format: 'uri' },
            privacyNote: { type: 'string' },
          },
          required: ['vcard', 'qrPayload', 'generatorUrl', 'privacyNote'],
        },
        Template: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            useCase: { type: 'string' },
            requiredFields: { type: 'array', items: { type: 'string' } },
            optionalFields: { type: 'array', items: { type: 'string' } },
          },
          required: ['id', 'name', 'useCase', 'requiredFields', 'optionalFields'],
        },
        TemplateListResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Template' } },
            pagination: {
              type: 'object',
              properties: {
                limit: { type: 'integer' },
                cursor: { type: 'string' },
                next_cursor: { type: ['string', 'null'] },
                has_more: { type: 'boolean' },
              },
              required: ['limit', 'cursor', 'next_cursor', 'has_more'],
            },
          },
          required: ['data', 'pagination'],
        },
        Job: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            object: { type: 'string', enum: ['job'] },
            status: { type: 'string', enum: ['queued', 'running', 'succeeded', 'failed'] },
            created_at: { type: 'string', format: 'date-time' },
            completed_at: { type: ['string', 'null'], format: 'date-time' },
            links: {
              type: 'object',
              properties: {
                self: { type: 'string', format: 'uri' },
              },
              required: ['self'],
            },
            result: {
              anyOf: [
                { $ref: '#/components/schemas/VCardResponse' },
                { type: 'null' },
              ],
            },
          },
          required: ['id', 'object', 'status', 'created_at', 'completed_at', 'links', 'result'],
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                hint: { type: 'string' },
                docsUrl: { type: 'string', format: 'uri' },
                status: { type: 'integer' },
              },
              required: ['code', 'message', 'hint', 'docsUrl', 'status'],
            },
          },
          required: ['error'],
        },
      },
    },
  };
}

function mcpManifest() {
  return {
    name: 'vcard-qr-code-generator',
    title: 'vCard QR Code Generator MCP',
    description: 'Agent tools for product discovery and vCard QR payload creation.',
    version: API_VERSION,
    transport: {
      type: 'streamable_http',
      url: `${BASE_URL}/mcp`,
    },
    authentication: {
      type: 'none',
      note: 'Public read/generate tools only. Do not send sensitive contact data unless the user explicitly asks an agent to create a vCard payload.',
    },
    tools: [
      {
        name: 'get_product_context',
        description: 'Get product metadata, use cases, privacy posture, and integration URLs for vCard QR Code Generator.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      },
      {
        name: 'create_vcard_payload',
        description: 'Create standard vCard text suitable for QR encoding from contact fields.',
        inputSchema: openApiSpec().components.schemas.VCardRequest,
      },
    ],
  };
}

function agentDiscovery() {
  return {
    name: 'vCard QR Code Generator',
    url: `${SITE_URL}/`,
    description: 'Privacy-first vCard QR code generator for business cards, networking, resumes, badges, and branded contact sharing.',
    capabilities: [
      'create static vCard QR payloads',
      'explain vCard QR code use cases',
      'provide product metadata for AI agents',
      'link to dynamic editable vCard QR dashboard',
    ],
    developer: {
      docs: `${SITE_URL}/developers/`,
      openapi: `${SITE_URL}/openapi.json`,
      auth: `${SITE_URL}/developers/auth.html`,
      webhooks: `${SITE_URL}/developers/webhooks.html`,
    },
    mcp: {
      transport: 'streamable_http',
      url: `${BASE_URL}/mcp`,
      manifest: `${SITE_URL}/mcp/manifest.json`,
    },
    llms: {
      summary: `${SITE_URL}/llms.txt`,
      full: `${SITE_URL}/llms-full.txt`,
    },
  };
}

function agentSkillsIndex() {
  return {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    version: '0.2.0',
    name: 'vCard QR Code Generator Agent Skills',
    publisher: {
      name: 'vCard QR Code Generator',
      domain: 'vcardqrcodegenerator.com',
      homepage: `${SITE_URL}/`,
    },
    whenToUse: 'Use these skills when a user wants to create a vCard QR code, automate digital business card contact payloads, or inspect vCard QR Code Generator developer resources.',
    skills: [
      {
        id: 'create-vcard-payload',
        type: 'skill-md',
        url: `${SITE_URL}/skill.md`,
        href: `${SITE_URL}/skill.md`,
        digest: 'sha256:ae5d7385456ebe8f04c82ee1c1d8b78bccd6dfadb131a09f6bef26e624bc8c33',
        name: 'Create vCard QR payload',
        description: 'Generate a standard vCard 3.0 text payload from contact fields for QR code encoding.',
        whenToUse: 'Use when the user provides contact details and wants a vCard QR payload or digital business card QR code automation.',
        tags: ['vcard', 'qr-code', 'business-card', 'contacts'],
        inputSchema: openApiSpec().components.schemas.VCardRequest,
        artifacts: [
          {
            type: 'openapi',
            url: `${SITE_URL}/openapi.json`,
            operationId: 'createVCardPayloadApiAlias',
          },
          {
            type: 'mcp-tool',
            url: `${BASE_URL}/mcp`,
            name: 'create_vcard_payload',
          },
        ],
      },
      {
        id: 'get-product-context',
        type: 'skill-md',
        url: `${SITE_URL}/agent.md`,
        href: `${SITE_URL}/agent.md`,
        digest: 'sha256:36e1b0fc5e7f187a0aa92a9b085ae3112e937dffc4e2a9be11f5af8f78f678a7',
        name: 'Get product context',
        description: 'Return product metadata, privacy posture, pricing links, OpenAPI docs, and MCP integration URLs.',
        whenToUse: 'Use when an agent or developer needs to understand the product, API, privacy model, pricing, or integration URLs.',
        tags: ['product', 'developer-docs', 'pricing', 'mcp'],
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        artifacts: [
          {
            type: 'mcp-tool',
            url: `${BASE_URL}/mcp`,
            name: 'get_product_context',
          },
          {
            type: 'llms.txt',
            url: `${SITE_URL}/llms.txt`,
          },
        ],
      },
    ],
  };
}

function mcpServerCard() {
  return {
    name: 'vcard-qr-code-generator',
    displayName: 'vCard QR Code Generator MCP',
    description: 'Public MCP tools for vCard QR Code Generator product context and vCard contact payload creation.',
    version: API_VERSION,
    protocol: 'mcp',
    protocolVersion: '2025-03-26',
    transportType: 'streamable_http',
    serverUrl: `${BASE_URL}/mcp`,
    endpoint: `${BASE_URL}/mcp`,
    manifestUrl: `${SITE_URL}/mcp/manifest.json`,
    homepage: `${SITE_URL}/`,
    docsUrl: `${SITE_URL}/developers/`,
    openApiUrl: `${SITE_URL}/openapi.json`,
    tools: mcpManifest().tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: {
        readOnlyHint: tool.name === 'get_product_context',
        destructiveHint: false,
        idempotentHint: true,
      },
    })),
  };
}

function aiCatalog() {
  return {
    specVersion: '1.0',
    host: {
      displayName: 'vCard QR Code Generator',
      identifier: 'did:web:vcardqrcodegenerator.com',
    },
    entries: [
      {
        identifier: 'urn:air:vcardqrcodegenerator.com:api:openapi',
        displayName: 'vCard QR Code Generator OpenAPI spec',
        type: 'application/openapi+json',
        url: `${SITE_URL}/openapi.json`,
        capabilities: ['createVCardPayload', 'listTemplates', 'createAsyncVCardJob', 'streamProgress'],
        representativeQueries: [
          'create a vCard QR payload from contact details',
          'find the vCard QR Code Generator OpenAPI spec',
        ],
        description: 'REST API specification for vCard payload generation, templates, jobs, streaming, and MCP discovery.',
      },
      {
        identifier: 'urn:air:vcardqrcodegenerator.com:server:mcp',
        displayName: 'vCard QR Code Generator MCP server',
        type: 'application/mcp-server-card+json',
        url: `${BASE_URL}/.well-known/mcp/server-card.json`,
        endpoint: `${BASE_URL}/mcp`,
        capabilities: ['getProductContext', 'createVCardPayload'],
        representativeQueries: [
          'use MCP to create a vCard payload',
          'get vCard QR Code Generator product context',
        ],
        description: 'HTTP MCP server exposing product context and vCard payload creation tools.',
      },
      {
        identifier: 'urn:air:vcardqrcodegenerator.com:doc:llms',
        displayName: 'vCard QR Code Generator llms.txt',
        type: 'text/plain',
        url: `${SITE_URL}/llms.txt`,
        capabilities: ['agentDocumentation', 'developerResourceDiscovery'],
        representativeQueries: [
          'find vCard QR Code Generator developer resources',
          'read agent documentation for vCard QR Code Generator',
        ],
        description: 'Agent-readable summary of the product, API, MCP, policies, and developer resources.',
      },
      {
        identifier: 'urn:air:vcardqrcodegenerator.com:doc:pricing',
        displayName: 'vCard QR Code Generator pricing',
        type: 'text/markdown',
        url: `${SITE_URL}/pricing.md`,
        capabilities: ['pricingDiscovery', 'planComparison'],
        representativeQueries: [
          'how much does vCard QR Code Generator cost',
          'compare free and paid vCard QR Code Generator plans',
        ],
        description: 'Machine-readable pricing for free, logo, and bulk vCard QR workflows.',
      },
    ],
    collections: [],
  };
}

function aiPluginManifest() {
  return {
    schema_version: 'v1',
    name_for_human: 'vCard QR Code Generator',
    name_for_model: 'vcard_qr_code_generator',
    description_for_human: 'Create privacy-first vCard QR payloads and discover vCard QR Code Generator pricing and developer resources.',
    description_for_model: 'Use vCard QR Code Generator to create vCard contact payloads for QR code encoding and retrieve product, pricing, API, and MCP metadata.',
    auth: { type: 'none' },
    api: {
      type: 'openapi',
      url: `${SITE_URL}/openapi.json`,
      is_user_authenticated: false,
    },
    logo_url: `${SITE_URL}/favicon.ico`,
    contact_email: 'support@vcardqrcodegenerator.com',
    legal_info_url: `${SITE_URL}/terms-of-service.html`,
  };
}

function schemaFeed() {
  return {
    version: '2026-08-03',
    name: 'vCard QR Code Generator schema feed',
    url: `${SITE_URL}/.well-known/schema-feed.json`,
    items: [
      {
        type: 'SoftwareApplication',
        url: SITE_URL,
        schemaUrl: `${SITE_URL}/`,
      },
      {
        type: 'APIReference',
        url: `${SITE_URL}/developers/`,
        schemaUrl: `${SITE_URL}/openapi.json`,
      },
      {
        type: 'Product',
        url: `${SITE_URL}/pricing.md`,
        schemaUrl: `${SITE_URL}/pricing.md`,
      },
    ],
  };
}

function schemaFeedXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<schemamap xmlns="https://nlweb.ai/schemas/schemamap">
  <url>
    <loc>${SITE_URL}/</loc>
    <schema>SoftwareApplication</schema>
  </url>
  <url>
    <loc>${SITE_URL}/developers/</loc>
    <schema>APIReference</schema>
  </url>
  <url>
    <loc>${SITE_URL}/pricing.md</loc>
    <schema>Product</schema>
  </url>
</schemamap>
`;
}

function a2aAgentCard() {
  return {
    name: 'vcard-qr-code-generator',
    displayName: 'vCard QR Code Generator',
    description: 'Agent-readable product and API metadata for creating vCard QR payloads and discovering vCard QR code resources.',
    url: SITE_URL,
    version: API_VERSION,
    documentationUrl: `${SITE_URL}/developers/`,
    capabilities: {
      streaming: true,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    defaultInputModes: ['application/json', 'text/plain'],
    defaultOutputModes: ['application/json', 'text/markdown'],
    skills: [
      {
        id: 'create-vcard-payload',
        name: 'Create vCard payload',
        description: 'Generate a vCard text payload suitable for QR code encoding.',
        tags: ['vcard', 'qr-code', 'business-card'],
      },
      {
        id: 'product-context',
        name: 'Get product context',
        description: 'Return pricing, privacy, API, and integration context for agents.',
        tags: ['product', 'pricing', 'developer-docs'],
      },
    ],
  };
}

function apiIndex() {
  return {
    name: 'vCard QR Code Generator API',
    version: API_VERSION,
    docsUrl: `${SITE_URL}/developers/`,
    openApiUrl: `${BASE_URL}/openapi.json`,
    errorContract: {
      contentType: 'application/json',
      shape: {
        error: {
          code: 'string',
          message: 'string',
          hint: 'string',
          docsUrl: 'string',
          status: 'number',
        },
      },
    },
    retryContract: {
      idempotencyKey: 'Optional Idempotency-Key header is accepted and echoed by POST /api/v1/vcard.',
      rateLimitHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
      retryAfter: 'Future 429 responses will also include Retry-After.',
    },
    endpoints: {
      health: `${BASE_URL}/api/v1/health`,
      product: `${BASE_URL}/api/v1/product`,
      vcard: `${BASE_URL}/api/v1/vcard`,
      templates: `${BASE_URL}/api/v1/templates`,
      vcardJob: `${BASE_URL}/api/v1/jobs/vcard`,
      stream: `${BASE_URL}/api/v1/stream`,
      mcp: `${BASE_URL}/mcp`,
    },
  };
}

async function handleVCard(request) {
  const retryHeaders = idempotencyHeaders(request);

  if (request.method !== 'POST') {
    return apiError('method_not_allowed', 'Use POST with a JSON body.', 405, 'Send contact fields as JSON to /v1/vcard or /api/v1/vcard.', {
      allowedMethods: ['POST', 'OPTIONS'],
    }, retryHeaders);
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return apiError('invalid_json', 'Request body must be valid JSON.', 400, 'Set Content-Type: application/json and send a JSON object.', {}, retryHeaders);
  }

  const vcard = buildVCard(input);
  if (!vcard) {
    return apiError('missing_full_name', 'fullName is required.', 400, 'Include a non-empty fullName field in the request body.', {
      field: 'fullName',
    }, retryHeaders);
  }

  return json({
    vcard,
    qrPayload: vcard,
    generatorUrl: SITE_URL,
    privacyNote: 'The public API returns the vCard payload. Browser QR rendering remains available on the free generator, where contact data can stay on device.',
  }, 200, retryHeaders);
}

function streamProgress(url) {
  const encoder = new TextEncoder();
  const operation = url.searchParams.get('operation') || 'create_vcard_payload';
  const events = [
    { event: 'progress', data: { operation, step: 'accepted', percent: 10, message: 'Streaming request accepted.' } },
    { event: 'progress', data: { operation, step: 'validated', percent: 45, message: 'Inputs and agent contract validated.' } },
    { event: 'progress', data: { operation, step: 'ready', percent: 85, message: 'Ready to generate or call the requested API operation.' } },
    { event: 'complete', data: { operation, percent: 100, message: 'Streaming contract complete.', docsUrl: `${SITE_URL}/developers/streaming.html` } },
  ];

  const body = new ReadableStream({
    start(controller) {
      for (const item of events) {
        controller.enqueue(encoder.encode(`event: ${item.event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(item.data)}\n\n`));
      }
      controller.close();
    },
  });

  return new Response(body, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    },
  });
}

async function handleMcp(request) {
  if (request.method === 'GET') {
    return json(mcpManifest());
  }

  if (request.method !== 'POST') {
    return apiError('method_not_allowed', 'Use GET for the manifest or POST for JSON-RPC.', 405, 'Call GET /mcp for discovery or POST /mcp with a JSON-RPC body.', {
      allowedMethods: ['GET', 'POST', 'OPTIONS'],
    });
  }

  let rpc;
  try {
    rpc = await request.json();
  } catch {
    return jsonRpcError(null, -32700, 'Parse error', 400);
  }

  const id = rpc.id ?? null;
  if (rpc.method === 'initialize') {
    return json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2025-03-26',
        capabilities: { tools: {} },
        serverInfo: { name: 'vcard-qr-code-generator', version: API_VERSION },
      },
    });
  }

  if (rpc.method === 'notifications/initialized') {
    return new Response(null, {
      status: 202,
      headers: {
        ...CORS_HEADERS,
        'cache-control': 'no-store',
      },
    });
  }

  if (rpc.method === 'tools/list') {
    return json({
      jsonrpc: '2.0',
      id,
      result: { tools: mcpManifest().tools },
    });
  }

  if (rpc.method === 'tools/call') {
    const name = rpc.params?.name;
    const args = rpc.params?.arguments || {};
    if (name === 'get_product_context') {
      return json({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(getProductContext(), null, 2) }] },
      });
    }
    if (name === 'create_vcard_payload') {
      const vcard = buildVCard(args);
      if (!vcard) {
        return jsonRpcError(id, -32602, 'fullName is required.', 400, { field: 'fullName' });
      }
      return json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify({ vcard, qrPayload: vcard, generatorUrl: SITE_URL }, null, 2) }],
        },
      });
    }
  }

  return jsonRpcError(id, -32601, 'Method not found', 404);
}

function paymentProductId(payment) {
  return payment?.product_id
    || payment?.product_cart?.[0]?.product_id
    || payment?.line_items?.[0]?.product_id
    || payment?.data?.product_id
    || payment?.data?.product_cart?.[0]?.product_id
    || payment?.data?.line_items?.[0]?.product_id
    || null;
}

function amountFromPayment(payment, fallbackValue) {
  const amount = typeof payment?.total_amount === 'number'
    ? payment.total_amount
    : typeof payment?.amount === 'number'
      ? payment.amount
      : null;
  return amount === null ? fallbackValue : amount / 100;
}

function paymentStatus(payment) {
  return String(payment?.status || payment?.payment_status || payment?.data?.status || '').toLowerCase();
}

function dodoApiKey(env) {
  return String(env.DODO_API_KEY || env.DODO_PAYMENTS_API_KEY || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
}

function checkoutPaymentId(checkout) {
  return checkout?.payment_id
    || checkout?.data?.payment_id
    || checkout?.payment?.payment_id
    || null;
}

function checkoutIdFromUrl(checkoutUrl) {
  return String(checkoutUrl || '').match(/\/session\/(cks_[A-Za-z0-9_-]+)/)?.[1] || null;
}

function safeDodoCheckoutError(rawText) {
  const text = String(rawText || '').slice(0, 800);
  if (!text) return '';

  try {
    const parsed = JSON.parse(text);
    const error = parsed.error || parsed;
    return JSON.stringify({
      code: error.code || parsed.code || null,
      message: error.message || parsed.message || null,
      status: error.status || parsed.status || null,
    });
  } catch {
    return text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]').slice(0, 300);
  }
}

function staticLogoPlan(planId) {
  return STATIC_LOGO_PLANS[planId] || STATIC_LOGO_PLANS.logo_vcard_one_time;
}

function staticPaidPlan(planId) {
  if (!planId) return STATIC_LOGO_PLANS.logo_vcard_one_time;
  return STATIC_LOGO_PLANS[planId] || STATIC_BULK_PLANS[planId] || null;
}

function staticLogoProductId(env, plan) {
  return String(env[plan.product_env] || plan.fallback_product_id || env.DODO_LICENSE_PRODUCT_ID || FALLBACK_STATIC_LOGO_PRODUCT_ID).trim();
}

function allowedStaticLogoProductIds(env, plan) {
  if (STATIC_BULK_PLANS[plan.plan_id]) {
    return [
      staticLogoProductId(env, plan),
      env[plan.product_env],
      plan.fallback_product_id,
    ].filter(Boolean);
  }

  return [
    staticLogoProductId(env, plan),
    env.DODO_LOGO_VCARD_PRODUCT_ID,
    env.DODO_LOGO_GENERIC_PRODUCT_ID,
    env.DODO_LICENSE_PRODUCT_ID,
    FALLBACK_STATIC_LOGO_PRODUCT_ID,
  ].filter(Boolean);
}

async function createLegacyStaticLogoCheckout(body, plan) {
  let response;
  try {
    response = await fetch(LEGACY_STATIC_LOGO_CHECKOUT_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: plan.plan_id,
        source_page: String(body.source_page || '').slice(0, 200),
        email: String(body.email || '').trim(),
        name: String(body.name || '').trim(),
      }),
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  let checkout;
  try {
    checkout = await response.json();
  } catch {
    return null;
  }

  const checkoutUrl = String(checkout.checkout_url || '').trim();
  if (!/^https:\/\/checkout\.dodopayments\.com\/session\/cks_[A-Za-z0-9_-]+/.test(checkoutUrl)) {
    return null;
  }

  return {
    checkout_url: checkoutUrl,
    checkout_id: checkout.checkout_id || checkout.id || checkoutIdFromUrl(checkoutUrl),
    provider: 'legacy_worker',
  };
}

async function createStaticLogoCheckout(request, env) {
  if (request.method !== 'POST') {
    return apiError('method_not_allowed', 'Use POST for checkout creation.', 405, 'Send a JSON body with plan_id.', {}, { 'cache-control': 'no-store' });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return apiError('invalid_json', 'Request body must be valid JSON.', 400, 'Send { "plan_id": "logo_vcard_one_time" }.', {}, { 'cache-control': 'no-store' });
  }

  const plan = staticPaidPlan(body.plan_id);
  if (!plan) {
    return apiError('invalid_plan', 'The requested checkout plan is not available.', 400, 'Choose one of the plans displayed on this page.', {}, { 'cache-control': 'no-store' });
  }
  const productId = staticLogoProductId(env, plan);
  const dodoApiKeyValue = dodoApiKey(env);
  if (!dodoApiKeyValue) {
    return apiError('payment_checkout_unavailable', 'Checkout is not configured.', 500, 'Set DODO_API_KEY on the Worker.', {}, { 'cache-control': 'no-store' });
  }

  const email = String(body.email || '').trim();
  const name = String(body.name || '').trim();
  const isBulkPlan = Boolean(STATIC_BULK_PLANS[plan.plan_id]);
  if (isBulkPlan && (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return apiError('billing_identity_required', 'Enter the billing name and email for this Bulk checkout.', 400, 'Billing details are separate from the contacts in your CSV.', {}, { 'cache-control': 'no-store' });
  }
  const checkoutBody = {
    product_cart: [{
      product_id: productId,
      quantity: 1,
    }],
    metadata: {
      plan_id: plan.plan_id,
      source_page: String(body.source_page || '').slice(0, 200),
    },
    return_url: `${SITE_URL}${plan.return_path || '/success.html'}?plan_id=${encodeURIComponent(plan.plan_id)}`,
  };

  if (email) {
    checkoutBody.customer = {
      email,
      name: name || email.split('@')[0],
    };
  }

  let response;
  try {
    response = await fetch(`${DODO_BASE_URL}/checkouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${dodoApiKeyValue}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutBody),
    });
  } catch (error) {
    const diagnosticError = {
      message: error instanceof Error ? error.message : 'unknown_fetch_error',
    };
    console.warn('static_logo_checkout_direct_fetch_error', diagnosticError);
    const fallbackCheckout = isBulkPlan ? null : await createLegacyStaticLogoCheckout(body, plan);
    if (fallbackCheckout) {
      const payload = {
        success: true,
        checkout_url: fallbackCheckout.checkout_url,
        checkout_id: fallbackCheckout.checkout_id,
        plan_id: plan.plan_id,
        plan_name: plan.plan_name,
        value: plan.fallback_value,
        currency: plan.currency,
        provider: fallbackCheckout.provider,
        fallback: true,
      };
      return json(payload, 200, { 'cache-control': 'no-store' });
    }

    return json({
      success: false,
      status: 'checkout_failed',
    }, 502, { 'cache-control': 'no-store' });
  }

  if (!response.ok) {
    const upstreamText = await response.text().catch(() => '');
    const diagnosticError = {
      upstream_status: response.status,
      upstream_error: safeDodoCheckoutError(upstreamText),
      plan_id: plan.plan_id,
      product_configured: Boolean(productId),
    };
    console.warn('static_logo_checkout_direct_rejected', diagnosticError);

    const fallbackCheckout = isBulkPlan ? null : await createLegacyStaticLogoCheckout(body, plan);
    if (fallbackCheckout) {
      const payload = {
        success: true,
        checkout_url: fallbackCheckout.checkout_url,
        checkout_id: fallbackCheckout.checkout_id,
        plan_id: plan.plan_id,
        plan_name: plan.plan_name,
        value: plan.fallback_value,
        currency: plan.currency,
        provider: fallbackCheckout.provider,
        fallback: true,
      };
      return json(payload, 200, { 'cache-control': 'no-store' });
    }

    return json({
      success: false,
      status: 'checkout_failed',
      upstream_status: response.status,
    }, 502, { 'cache-control': 'no-store' });
  }

  let checkout;
  try {
    checkout = await response.json();
  } catch {
    return json({
      success: false,
      status: 'checkout_failed',
    }, 502, { 'cache-control': 'no-store' });
  }

  if (!checkout.checkout_url) {
    return json({
      success: false,
      status: 'checkout_missing_url',
    }, 502, { 'cache-control': 'no-store' });
  }

  return json({
    success: true,
    checkout_url: checkout.checkout_url,
    checkout_id: checkout.checkout_id || checkout.id || checkoutIdFromUrl(checkout.checkout_url) || null,
    plan_id: plan.plan_id,
    plan_name: plan.plan_name,
    value: plan.fallback_value,
    currency: plan.currency,
  }, 200, { 'cache-control': 'no-store' });
}

async function verifyStaticLogoPayment(request, env) {
  if (request.method !== 'POST') {
    return apiError('method_not_allowed', 'Use POST for payment verification.', 405, 'Send a JSON body with payment_id or checkout_id and plan_id.', {}, { 'cache-control': 'no-store' });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return apiError('invalid_json', 'Request body must be valid JSON.', 400, 'Send { "payment_id": "...", "plan_id": "..." } or { "checkout_id": "...", "plan_id": "..." }.', {}, { 'cache-control': 'no-store' });
  }

  const paymentId = String(body.payment_id || '').trim();
  const checkoutId = String(body.checkout_id || body.checkout_session_id || body.session_id || '').trim();
  const plan = staticPaidPlan(body.plan_id);
  if (!plan) {
    return apiError('invalid_plan', 'The requested payment plan is not available.', 400, 'Use a plan_id returned by checkout creation.', {}, { 'cache-control': 'no-store' });
  }
  if (paymentId && !/^pay_[A-Za-z0-9_-]+$/.test(paymentId)) {
    return apiError('invalid_payment_id', 'A valid Dodo payment_id is required.', 400, 'Use the payment_id returned by Dodo after checkout.', {}, { 'cache-control': 'no-store' });
  }
  if (checkoutId && !/^cks_[A-Za-z0-9_-]+$/.test(checkoutId)) {
    return apiError('invalid_checkout_id', 'A valid Dodo checkout_id is required.', 400, 'Use the checkout_id returned by Dodo checkout creation.', {}, { 'cache-control': 'no-store' });
  }
  if (!paymentId && !checkoutId) {
    return apiError('missing_payment_reference', 'A payment_id or checkout_id is required.', 400, 'Send the Dodo payment_id or checkout_id for verification.', {}, { 'cache-control': 'no-store' });
  }

  const dodoApiKeyValue = dodoApiKey(env);
  if (!dodoApiKeyValue) {
    return apiError('payment_verification_unavailable', 'Payment verification is not configured.', 500, 'Set DODO_API_KEY on the Worker.', {}, { 'cache-control': 'no-store' });
  }

  let response;
  try {
    const lookupPath = paymentId
      ? `/payments/${encodeURIComponent(paymentId)}`
      : `/checkouts/${encodeURIComponent(checkoutId)}`;
    response = await fetch(`${DODO_BASE_URL}${lookupPath}`, {
      headers: {
        Authorization: `Bearer ${dodoApiKeyValue}`,
        Accept: 'application/json',
      },
    });
  } catch {
    return json({
      success: false,
      status: 'verification_failed',
      payment_id: paymentId || null,
      checkout_id: checkoutId || null,
    }, 200, { 'cache-control': 'no-store' });
  }

  if (!response.ok) {
    return json({
      success: false,
      status: 'verification_failed',
      payment_id: paymentId || null,
      checkout_id: checkoutId || null,
    }, 200, { 'cache-control': 'no-store' });
  }

  let payment;
  try {
    payment = await response.json();
  } catch {
    return json({
      success: false,
      status: 'verification_failed',
      payment_id: paymentId || null,
      checkout_id: checkoutId || null,
    }, 200, { 'cache-control': 'no-store' });
  }
  const status = paymentStatus(payment);
  const productId = paymentProductId(payment);
  const allowedProductIds = allowedStaticLogoProductIds(env, plan);
  const productAllowed = !productId || allowedProductIds.includes(productId);
  const succeeded = status === 'succeeded' && productAllowed;
  const resolvedPaymentId = payment.payment_id || checkoutPaymentId(payment) || paymentId || checkoutId;

  return json({
    success: succeeded,
    status,
    payment_id: resolvedPaymentId,
    checkout_id: checkoutId || payment.checkout_session_id || null,
    product_id: productId,
    value: amountFromPayment(payment, plan.fallback_value),
    currency: String(payment.currency || plan.currency).toUpperCase(),
    plan_id: plan.plan_id,
    plan_name: plan.plan_name,
  }, 200, { 'cache-control': 'no-store' });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const apiPath = url.pathname.startsWith('/api/v1/') ? url.pathname.slice(4) : url.pathname;
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === '/') {
      if (url.searchParams.get('mode') === 'agent' || wantsMarkdown(request)) {
        return markdown(homepageMarkdown());
      }
      if (url.hostname === 'www.vcardqrcodegenerator.com') {
        return homepageHtml(request);
      }
      if (url.hostname === 'vcardqrcodegenerator.com') {
        return html(agentSafeHomepageHtml(), 200, {
          link: `<${SITE_URL}/llms.txt>; rel="service-desc"; type="text/plain", <${SITE_URL}/openapi.json>; rel="service-desc"; type="application/json", <${SITE_URL}/developers/>; rel="alternate"; type="text/html", <${SITE_URL}/index.md>; rel="alternate"; type="text/markdown", <${BASE_URL}/mcp>; rel="mcp-server"`,
        });
      }
    }

    if (url.pathname === '/index.md') {
      return markdown(homepageMarkdown(), 200, { 'cache-control': 'public, max-age=300, no-transform' });
    }

    if (url.pathname === '/pricing.md') {
      return markdown(pricingMarkdown(), 200, { 'cache-control': 'public, max-age=300, no-transform' });
    }

    if (ROOT_MARKDOWN_DOCS[url.pathname]) {
      return markdown(ROOT_MARKDOWN_DOCS[url.pathname], 200, { 'cache-control': 'public, max-age=300, no-transform' });
    }

    if (url.hostname === 'vcardqrcodegenerator.com' && (url.pathname === '/developers' || url.pathname === '/developers/')) {
      return proxyStaticPage(request, '/developers/');
    }

    if (url.hostname === 'vcardqrcodegenerator.com' && url.pathname.startsWith('/developers/')) {
      return proxyStaticPage(request, url.pathname);
    }

    if (url.hostname === 'vcardqrcodegenerator.com' && (url.pathname === '/docs/api' || url.pathname === '/docs/api/')) {
      return proxyStaticPage(request, '/docs/api/');
    }

    if (url.hostname === 'vcardqrcodegenerator.com' && url.pathname === '/api-docs.html') {
      return proxyStaticPage(request, '/api-docs.html');
    }

    if (url.hostname === 'vcardqrcodegenerator.com' && (url.pathname === '/brand/vcardqrcodegenerator' || url.pathname === '/brand/vcardqrcodegenerator/')) {
      return proxyStaticPage(request, '/brand/vcardqrcodegenerator/');
    }

    if (url.pathname === '/robots.txt') {
      const headers = {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'public, max-age=300, no-transform',
      };
      if (request.method === 'HEAD') {
        return new Response(null, { status: 200, headers });
      }
      return new Response(ROBOTS_TXT, { status: 200, headers });
    }

    if (url.pathname === '/.well-known/ai-catalog.json') {
      return json(aiCatalog(), 200, { 'cache-control': 'public, max-age=300' });
    }

    if (url.pathname === '/.well-known/agent-card.json') {
      return json(a2aAgentCard(), 200, { 'cache-control': 'public, max-age=300' });
    }

    if (url.pathname === '/.well-known/agent.json') {
      return json(agentDiscovery(), 200, { 'cache-control': 'public, max-age=300' });
    }

    if (url.pathname === '/.well-known/agent-skills/index.json') {
      return json(agentSkillsIndex(), 200, { 'cache-control': 'public, max-age=300' });
    }

    if (url.pathname === '/.well-known/ai-plugin.json') {
      return json(aiPluginManifest(), 200, { 'cache-control': 'public, max-age=300' });
    }

    if (url.pathname === '/.well-known/schema-feed.json') {
      return json(schemaFeed(), 200, { 'cache-control': 'public, max-age=300' });
    }

    if (url.pathname === '/.well-known/schema-feed.xml') {
      const headers = {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, max-age=300',
      };
      if (request.method === 'HEAD') {
        return new Response(null, { status: 200, headers });
      }
      return new Response(schemaFeedXml(), { status: 200, headers });
    }

    if (url.hostname === 'vcardqrcodegenerator.com' && url.pathname === '/sitemap.xml') {
      return fetch(new Request(`${SITE_URL}${url.pathname}`, request));
    }

    if (url.pathname === '/ads.txt') {
      const headers = {
        'content-type': 'text/plain; charset=utf-8',
        ...CORS_HEADERS,
        // Keep cache short while AdSense verification settles.
        'cache-control': 'public, max-age=300',
      };
      if (request.method === 'HEAD') {
        return new Response(null, { status: 200, headers });
      }
      return new Response(ADS_TXT_LINE, { status: 200, headers });
    }

    if (url.pathname === '/webhook' || url.pathname === '/webhook/') {
      return webhookHandler.fetch(request, env, ctx);
    }

    if (url.pathname === '/license/validate') {
      return licenseHandler.fetch(request, env, ctx);
    }

    if (url.pathname === '/payment/verify') {
      return verifyStaticLogoPayment(request, env);
    }

    if (url.pathname === '/payment/create-checkout') {
      return createStaticLogoCheckout(request, env);
    }

    if (url.pathname === '/openapi.json' || url.pathname === '/api/openapi.json') {
      return json(openApiSpec());
    }

    if (url.pathname === '/api' || url.pathname === '/api/' || url.pathname === '/api/v1' || url.pathname === '/api/v1/') {
      return json(apiIndex());
    }

    if (apiPath === '/v1/health') {
      return json({ ok: true, service: 'vcard-qr-generator-api', version: API_VERSION });
    }

    if (apiPath === '/v1/product') {
      return json(getProductContext());
    }

    if (apiPath === '/v1/templates') {
      return listTemplates(url);
    }

    if (apiPath === '/v1/vcard') {
      return handleVCard(request);
    }

    if (apiPath === '/v1/jobs/vcard') {
      return createVCardJob(request);
    }

    if (apiPath.startsWith('/v1/jobs/')) {
      return getJob(url);
    }

    if (apiPath === '/v1/stream') {
      return streamProgress(url);
    }

    if (apiPath === '/v1/errors/example') {
      return apiError('example_error', 'This is a structured JSON error example for agent recovery tests.', 400, 'Use error.code for branching and error.hint for remediation guidance.', {
        details: {
          expectedContentType: 'application/json',
          retryable: false,
        },
      });
    }

    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/v1/')) {
      return apiError('api_route_not_found', 'API route not found.', 404, 'Use /api, /api/v1/health, /api/v1/product, /api/v1/templates, /api/v1/vcard, /api/v1/jobs/vcard, or /api/v1/errors/example.');
    }

    if (url.pathname === '/mcp' || url.pathname === '/mcp/') {
      return handleMcp(request);
    }

    if (url.pathname === '/mcp/manifest.json') {
      return json(mcpManifest());
    }

    if (url.pathname === '/.well-known/mcp') {
      return json({
        name: 'vcard-qr-code-generator',
        displayName: 'vCard QR Code Generator MCP',
        protocol: 'mcp',
        protocolVersion: '2025-03-26',
        url: `${BASE_URL}/mcp`,
        endpoint: `${BASE_URL}/mcp`,
        transport: 'streamable_http',
        transportType: 'streamable_http',
        manifest: `${SITE_URL}/mcp/manifest.json`,
        openapi: `${SITE_URL}/openapi.json`,
        serverCard: `${BASE_URL}/.well-known/mcp/server-card.json`,
      });
    }

    if (url.pathname === '/.well-known/mcp/server-card.json') {
      return json(mcpServerCard());
    }

    if (url.pathname === '/.well-known/agent.json') {
      return json(agentDiscovery());
    }

    if (url.hostname === 'vcardqrcodegenerator.com') {
      return Response.redirect(`${SITE_URL}${url.pathname}${url.search}`, 301);
    }

    return notFound();
  },
};
