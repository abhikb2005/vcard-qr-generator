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
        '<div style="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;background:rgba(255,255,255,0.8);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:#1f2937;padding:24px;border-radius:24px;display:flex;flex-direction:column;align-items:center;gap:16px;font-family:Inter,system-ui,sans-serif;font-size:14px;box-shadow:0 10px 40px rgba(0,0,0,0.1);border:1px solid rgba(255,255,255,0.3);width:calc(100% - 32px);max-width:480px;animation:slideUp 0.5s ease-out">' +
        '<style>@keyframes slideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }</style>' +
        '<div style="text-align:center">' +
        '<div style="width:48px;hight:48px;background:#eef2ff;color:#6366f1;border-radius:12px;display:flex;items-center;justify-content:center;margin:0 auto 16px;padding:10px"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>' +
        '<h4 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827">Privacy Preference</h4>' +
        '<p style="margin:0;line-height:1.6;color:#4b5563">We use cookies to analyze traffic and show personalized ads through AdSense. Your data helps us keep this tool free. <a href="/privacy-policy.html" style="color:#6366f1;text-decoration:semibold">Policy</a></p>' +
        '</div>' +
        '<div style="display:flex;gap:12px;width:100%">' +
        '<button id="cookie-reject" style="flex:1;padding:12px;border-radius:12px;border:1px solid #e5e7eb;background:#fff;color:#4b5563;cursor:pointer;font-size:14px;font-weight:600;transition:all 0.2s">Reject All</button>' +
        '<button id="cookie-accept" style="flex:1;padding:12px;border-radius:12px;border:none;background:#6366f1;color:#fff;cursor:pointer;font-size:14px;font-weight:700;box-shadow:0 4px 12px rgba(99,102,241,0.2);transition:all 0.2s">Accept All</button>' +
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
