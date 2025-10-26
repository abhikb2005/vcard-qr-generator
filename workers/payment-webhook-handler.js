const hex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function verifySignature({ secret, signature, timestamp, id, payload }) {
  if (!secret || !signature || !timestamp || !id) {
    return false;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(`${timestamp}.${id}.${payload}`);
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const digest = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const expectedSignature = hex(digest);
  const provided = encoder.encode(signature.trim());
  const expected = encoder.encode(expectedSignature);

  if (provided.length !== expected.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < provided.length; i += 1) {
    diff |= provided[i] ^ expected[i];
  }
  return diff === 0;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Webhook-Id,Webhook-Signature,Webhook-Timestamp',
    Vary: 'Origin',
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('Origin')) });
    }

    if (url.pathname !== '/webhook' || request.method !== 'POST') {
      return new Response('Not Found', { status: 404 });
    }

    const origin = request.headers.get('Origin');
    const bodyText = await request.text();

    try {
      const valid = await verifySignature({
        secret: env.DODO_WEBHOOK_SECRET,
        signature: request.headers.get('webhook-signature'),
        timestamp: request.headers.get('webhook-timestamp'),
        id: request.headers.get('webhook-id'),
        payload: bodyText,
      });

      if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }

      const payload = JSON.parse(bodyText || '{}');
      const eventType = payload.event || payload.type;
      if (eventType !== 'payment.succeeded') {
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }

      const productId = payload.product_id || payload.data?.product_id || payload.data?.line_items?.[0]?.product_id;
      if (productId !== 'pdt_ROmfPNXoSRQ16tKgZWURT') {
        return new Response(JSON.stringify({ ignored: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }

      const paymentId = payload.payment_id || payload.data?.payment_id || payload.data?.id;
      const licenseKey = payload.license_key || payload.data?.license_key || payload.data?.license?.key;
      const customerEmail = payload.customer_email || payload.data?.customer_email || payload.data?.customer?.email;
      const status = payload.status || payload.data?.status || 'active';

      if (!paymentId || !licenseKey) {
        return new Response(JSON.stringify({ error: 'Missing payment data' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }

      await env.DB.prepare(
        `INSERT OR IGNORE INTO purchases (payment_id, license_key, customer_email, status)
         VALUES (?1, ?2, ?3, ?4)`
      )
        .bind(paymentId, licenseKey, customerEmail || '', status)
        .run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    } catch (err) {
      console.error('Webhook processing failed', err);
      return new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
  },
};
