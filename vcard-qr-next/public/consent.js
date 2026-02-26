// Google Consent Mode v2 + Cookie Consent Banner
(function () {
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  // Default: deny all until user consents
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  // Check if user already consented
  var consent = localStorage.getItem('cookie_consent');
  if (consent === 'accepted') {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    });
  } else if (consent === 'rejected') {
    // Keep denied — no update needed
  }

  // Build and inject the banner (only if no choice made yet)
  if (!consent) {
    document.addEventListener('DOMContentLoaded', function () {
      var banner = document.createElement('div');
      banner.id = 'cookie-consent-banner';
      banner.innerHTML =
        '<div style="position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#1f2937;color:#f3f4f6;padding:16px 20px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;font-family:Inter,system-ui,sans-serif;font-size:14px;box-shadow:0 -2px 10px rgba(0,0,0,.3)">' +
          '<p style="margin:0;max-width:600px;line-height:1.5">We use cookies for analytics and ads. You can accept or reject non-essential cookies. <a href="/privacy-policy.html" style="color:#818cf8;text-decoration:underline">Privacy Policy</a></p>' +
          '<div style="display:flex;gap:8px">' +
            '<button id="cookie-reject" style="padding:8px 18px;border-radius:6px;border:1px solid #6b7280;background:transparent;color:#f3f4f6;cursor:pointer;font-size:14px">Reject</button>' +
            '<button id="cookie-accept" style="padding:8px 18px;border-radius:6px;border:none;background:#6366f1;color:#fff;cursor:pointer;font-size:14px;font-weight:600">Accept</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(banner);

      document.getElementById('cookie-accept').addEventListener('click', function () {
        localStorage.setItem('cookie_consent', 'accepted');
        gtag('consent', 'update', {
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
          analytics_storage: 'granted'
        });
        banner.remove();
      });

      document.getElementById('cookie-reject').addEventListener('click', function () {
        localStorage.setItem('cookie_consent', 'rejected');
        banner.remove();
      });
    });
  }
})();
