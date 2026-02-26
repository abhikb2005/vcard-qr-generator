import webhookHandler from './payment-webhook-handler';
import licenseHandler from './license-validate';

const ADS_TXT_LINE = 'google.com, pub-1206702185649949, DIRECT, f08c47fec0942fa0\n';

function notFound() {
  return new Response('Not found', { status: 404 });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/ads.txt') {
      const headers = {
        'content-type': 'text/plain; charset=utf-8',
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

    return notFound();
  },
};
