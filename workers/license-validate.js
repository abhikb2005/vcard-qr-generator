const DODO_LICENSE_VALIDATE_URL = 'https://api.dodopayments.com/v1/licenses/validate';
const PRO_FEATURES = ['logo_overlay'];

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlEncodeString(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function parsePrivateKey(pem) {
  const cleaned = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function createJwt(privateKeyPem, payload) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncodeString(JSON.stringify(header));
  const encodedPayload = base64UrlEncodeString(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;

  const keyData = parsePrivateKey(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsigned));
  const encodedSignature = base64UrlEncode(signature);
  return `${unsigned}.${encodedSignature}`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname !== '/license/validate' || request.method !== 'POST') {
      return new Response('Not Found', { status: 404 });
    }

    const headers = { 'Content-Type': 'application/json', ...corsHeaders(origin) };

    try {
      const requestBody = await request.json();
      const licenseKey = requestBody?.license_key?.trim();

      if (!licenseKey) {
        return new Response(JSON.stringify({ valid: false, error: 'license_key is required' }), {
          status: 400,
          headers,
        });
      }

      const apiResponse = await fetch(DODO_LICENSE_VALIDATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.DODO_API_KEY}`,
        },
        body: JSON.stringify({ license_key: licenseKey }),
      });

      if (!apiResponse.ok) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 200,
          headers,
        });
      }

      const validation = await apiResponse.json().catch(() => null);
      const isValid = validation?.valid === true || validation?.status === 'valid';
      if (!isValid) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 200,
          headers,
        });
      }

      const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
      const payload = {
        iat: Math.floor(Date.now() / 1000),
        exp: expiresAt,
        license_key: licenseKey,
        features: PRO_FEATURES,
      };

      const token = await createJwt(env.JWT_PRIVATE_KEY, payload);

      // Return product_id so frontend knows the limit
      return new Response(JSON.stringify({
        valid: true,
        token,
        status: 'success', // match frontend expect
        product_id: validation.product_id || validation.data?.product_id
      }), {
        status: 200,
        headers,
      });
    } catch (err) {
      console.error('License validation failed', err);
      return new Response(JSON.stringify({ valid: false }), {
        status: 500,
        headers,
      });
    }
  },
};
