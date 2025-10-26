import webhookHandler from './payment-webhook-handler';
import licenseHandler from './license-validate';

function notFound() {
  return new Response('Not found', { status: 404 });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/webhook' || url.pathname === '/webhook/') {
      return webhookHandler.fetch(request, env, ctx);
    }

    if (url.pathname === '/license/validate') {
      return licenseHandler.fetch(request, env, ctx);
    }

    return notFound();
  },
};
