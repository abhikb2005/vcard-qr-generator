import webhookHandler from './payment-webhook-handler';
import licenseHandler from './license-validate';

const ADS_TXT_LINE = 'google.com, pub-1206702185649949, DIRECT, f08c47fec0942fa0\n';
const API_VERSION = '2026-05-21';
const BASE_URL = 'https://api.vcardqrcodegenerator.com';
const SITE_URL = 'https://www.vcardqrcodegenerator.com';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization',
  'access-control-max-age': '86400',
};

function notFound() {
  return json({ error: 'not_found', message: 'Not found' }, 404);
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': status === 200 ? 'public, max-age=300' : 'no-store',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
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
      { url: SITE_URL, description: 'Static documentation host' },
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
      '/v1/vcard': {
        post: {
          operationId: 'createVCardPayload',
          summary: 'Create a vCard QR payload',
          description: 'Returns standard vCard text suitable for QR encoding. The free website generator keeps QR rendering client-side for privacy.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/VCardRequest' } } },
          },
          responses: {
            '200': {
              description: 'vCard payload created',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/VCardResponse' } } },
            },
            '400': {
              description: 'Missing or invalid input',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
    },
    components: {
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
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
          required: ['error', 'message'],
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

async function handleVCard(request) {
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed', message: 'Use POST with a JSON body.' }, 405);
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, 400);
  }

  const vcard = buildVCard(input);
  if (!vcard) {
    return json({ error: 'missing_full_name', message: 'fullName is required.' }, 400);
  }

  return json({
    vcard,
    qrPayload: vcard,
    generatorUrl: SITE_URL,
    privacyNote: 'The public API returns the vCard payload. Browser QR rendering remains available on the free generator, where contact data can stay on device.',
  });
}

async function handleMcp(request) {
  if (request.method === 'GET') {
    return json(mcpManifest());
  }

  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed', message: 'Use GET for the manifest or POST for JSON-RPC.' }, 405);
  }

  let rpc;
  try {
    rpc = await request.json();
  } catch {
    return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400);
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
        return json({ jsonrpc: '2.0', id, error: { code: -32602, message: 'fullName is required.' } }, 400);
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

  return json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } }, 404);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
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

    if (url.pathname === '/openapi.json' || url.pathname === '/api/openapi.json') {
      return json(openApiSpec());
    }

    if (url.pathname === '/v1/health') {
      return json({ ok: true, service: 'vcard-qr-generator-api', version: API_VERSION });
    }

    if (url.pathname === '/v1/product') {
      return json(getProductContext());
    }

    if (url.pathname === '/v1/vcard') {
      return handleVCard(request);
    }

    if (url.pathname === '/mcp' || url.pathname === '/mcp/') {
      return handleMcp(request);
    }

    if (url.pathname === '/mcp/manifest.json') {
      return json(mcpManifest());
    }

    return notFound();
  },
};
