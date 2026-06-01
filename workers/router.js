import webhookHandler from './payment-webhook-handler';
import licenseHandler from './license-validate';

const ADS_TXT_LINE = 'google.com, pub-1206702185649949, DIRECT, f08c47fec0942fa0\n';
const API_VERSION = '2026-05-21';
const BASE_URL = 'https://vcardqrcodegenerator.com';
const SITE_URL = 'https://www.vcardqrcodegenerator.com';
const DODO_BASE_URL = 'https://live.dodopayments.com';
const STATIC_LOGO_PLANS = {
  logo_vcard_one_time: {
    plan_id: 'logo_vcard_one_time',
    plan_name: 'Logo vCard QR Code',
    fallback_value: 4.99,
    currency: 'USD',
  },
  logo_generic_one_time: {
    plan_id: 'logo_generic_one_time',
    plan_name: 'Generic Logo QR Code',
    fallback_value: 4.99,
    currency: 'USD',
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

function mcpServerCard() {
  return {
    name: 'vcard-qr-code-generator',
    displayName: 'vCard QR Code Generator MCP',
    description: 'Public MCP tools for vCard QR Code Generator product context and vCard contact payload creation.',
    version: API_VERSION,
    serverUrl: `${BASE_URL}/mcp`,
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

async function verifyStaticLogoPayment(request, env) {
  if (request.method !== 'POST') {
    return apiError('method_not_allowed', 'Use POST for payment verification.', 405, 'Send a JSON body with payment_id and plan_id.', {}, { 'cache-control': 'no-store' });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return apiError('invalid_json', 'Request body must be valid JSON.', 400, 'Send { "payment_id": "...", "plan_id": "..." }.', {}, { 'cache-control': 'no-store' });
  }

  const paymentId = String(body.payment_id || '').trim();
  const plan = STATIC_LOGO_PLANS[body.plan_id] || STATIC_LOGO_PLANS.logo_vcard_one_time;
  if (!/^pay_[A-Za-z0-9_-]+$/.test(paymentId)) {
    return apiError('invalid_payment_id', 'A valid Dodo payment_id is required.', 400, 'Use the payment_id returned by Dodo after checkout.', {}, { 'cache-control': 'no-store' });
  }

  if (!env.DODO_API_KEY) {
    return apiError('payment_verification_unavailable', 'Payment verification is not configured.', 500, 'Set DODO_API_KEY on the Worker.', {}, { 'cache-control': 'no-store' });
  }

  const response = await fetch(`${DODO_BASE_URL}/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Bearer ${env.DODO_API_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return json({
      success: false,
      status: 'verification_failed',
      payment_id: paymentId,
    }, 200, { 'cache-control': 'no-store' });
  }

  const payment = await response.json();
  const status = paymentStatus(payment);
  const productId = paymentProductId(payment);
  const allowedProductIds = [env.DODO_LICENSE_PRODUCT_ID, 'pdt_ROmfPNXoSRQ16tKgZWURT'].filter(Boolean);
  const productAllowed = !productId || allowedProductIds.includes(productId);
  const succeeded = status === 'succeeded' && productAllowed;

  return json({
    success: succeeded,
    status,
    payment_id: payment.payment_id || paymentId,
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
      if (wantsMarkdown(request)) {
        return markdown(homepageMarkdown());
      }
      if (url.hostname === 'www.vcardqrcodegenerator.com') {
        return fetch(`${SITE_URL}/index.html`, request);
      }
      return Response.redirect(`${SITE_URL}/`, 301);
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

    if (url.pathname === '/mcp' || url.pathname === '/mcp/') {
      return handleMcp(request);
    }

    if (url.pathname === '/mcp/manifest.json') {
      return json(mcpManifest());
    }

    if (url.pathname === '/.well-known/mcp') {
      return json({
        name: 'vcard-qr-code-generator',
        url: `${BASE_URL}/mcp`,
        transport: 'streamable_http',
        manifest: `${SITE_URL}/mcp/manifest.json`,
        openapi: `${SITE_URL}/openapi.json`,
      });
    }

    if (url.pathname === '/.well-known/mcp/server-card.json') {
      return json(mcpServerCard());
    }

    if (url.pathname === '/.well-known/agent.json') {
      return json(agentDiscovery());
    }

    return notFound();
  },
};
