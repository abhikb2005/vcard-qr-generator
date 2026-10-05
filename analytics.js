(function (root) {
  'use strict';

  function canTrack() {
    try {
      var host = root.location && root.location.hostname;
      if (host !== 'www.vcardqrcodegenerator.com' && host !== 'app.vcardqrcodegenerator.com') return false;
      if (new URLSearchParams(root.location.search || '').get('analytics_test') === '1' || root.sessionStorage.getItem('vcard_analytics_test') === '1') return false;
      return root.localStorage.getItem('cookie_consent') === 'accepted';
    } catch (error) { return false; }
  }

  var PURCHASE_STORAGE_KEY = 'vcard_ga4_purchase_ids';
  var SIGNUP_STORAGE_KEY = 'vcard_ga4_signup_sent';
  var ATTRIBUTION_STORAGE_KEY = 'vcard_ga4_attribution';
  var ATTRIBUTION_KEYS = ['customer_segment', 'landing_variant', 'landing_page', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_adgroup', 'utm_term', 'utm_content'];

  function isDevelopment() {
    var host = root.location && root.location.hostname;
    return !host || host === 'localhost' || host === '127.0.0.1' || host === '::1';
  }

  function getBaseParams() {
    var location = root.location || {};
    var document = root.document || {};
    return {
      page_path: location.pathname || '',
      page_title: document.title || '',
      page_location: (location.origin || '') + (location.pathname || ''),
      event_timestamp: new Date().toISOString()
    };
  }

  function debug(eventName, params) {
    if (isDevelopment() && root.console && typeof root.console.debug === 'function') {
      root.console.debug('[analytics]', eventName, params);
    }
  }

  function trackEvent(eventName, params) {
    if (!canTrack()) return false;
    var eventParams = Object.assign({}, getBaseParams(), params || {});
    try {
      debug(eventName, eventParams);
      if (typeof root.gtag === 'function') {
        root.gtag('event', eventName, eventParams);
        return true;
      }
    } catch (error) {
      debug('analytics_error', {
        event_name: eventName,
        error_message: error && error.message ? error.message : 'unknown'
      });
    }
  }

  function getSentPurchases() {
    try {
      var ids = JSON.parse(root.localStorage.getItem(PURCHASE_STORAGE_KEY) || '[]');
      return Array.isArray(ids) ? ids : [];
    } catch (error) {
      return [];
    }
  }

  function markPurchaseSent(transactionId) {
    try {
      var sentPurchases = getSentPurchases();
      if (sentPurchases.indexOf(transactionId) === -1) {
        sentPurchases.push(transactionId);
        root.localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(sentPurchases.slice(-50)));
      }
    } catch (error) {
      debug('purchase_idempotency_error', { error_message: error && error.message ? error.message : 'unknown' });
    }
  }

  function hasSentPurchase(transactionId) {
    return getSentPurchases().indexOf(transactionId) !== -1;
  }

  function getAttributionParams() {
    if (!canTrack()) return {};
    var stored = {};
    try { stored = JSON.parse(root.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || '{}'); } catch (error) {}
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) stored = {};
    var search = root.location && root.location.search ? new URLSearchParams(root.location.search) : null;
    ATTRIBUTION_KEYS.forEach(function (key) {
      var value = search && search.get(key) || stored[key];
      if (typeof value === 'string' && value) stored[key] = value.slice(0, 100);
    });
    var segment = search && (search.get('customer_segment') || search.get('segment')) || stored.customer_segment;
    if (segment) stored.customer_segment = segment;
    var safe = {};
    ATTRIBUTION_KEYS.forEach(function(key) { if (typeof stored[key] === 'string') safe[key] = stored[key].slice(0, 100); });
    return safe;
  }

  function captureAttribution() {
    if (!canTrack()) return {};
    var attribution = getAttributionParams();
    try { root.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution)); } catch (error) {}
    return attribution;
  }

  function trackSignUp(params) {
    if (!canTrack() || typeof root.gtag !== 'function') return false;
    try {
      if (root.sessionStorage.getItem(SIGNUP_STORAGE_KEY) === '1') return false;
      root.sessionStorage.setItem(SIGNUP_STORAGE_KEY, '1');
    } catch (error) {}
    trackEvent('sign_up', Object.assign({}, getAttributionParams(), params || {}));
    return true;
  }

  function trackPurchase(purchaseParams) {
    if (!canTrack() || typeof root.gtag !== 'function') return false;
    var params = purchaseParams || {};
    var transactionId = params.transaction_id;
    if (!transactionId) {
      trackEvent('payment_success', Object.assign({ purchase_tracked: false }, params));
      return false;
    }

    if (hasSentPurchase(transactionId)) {
      debug('purchase_skipped_duplicate', { transaction_id: transactionId });
      return false;
    }

    if (!trackEvent('purchase', params)) return false;
    trackEvent('payment_success', params);
    markPurchaseSent(transactionId);
    return true;
  }

  function sanitizeError(error) {
    var message = error && error.message ? error.message : String(error || 'Unknown QR generation error');
    return message.replace(/\s+/g, ' ').slice(0, 120);
  }

  var api = {
    canTrack: canTrack,
    trackEvent: trackEvent,
    trackPurchase: trackPurchase,
    hasSentPurchase: hasSentPurchase,
    getAttributionParams: getAttributionParams,
    captureAttribution: captureAttribution,
    trackSignUp: trackSignUp,
    sanitizeError: sanitizeError,
    getBaseParams: getBaseParams
  };

  root.VcardAnalytics = api;
  root.trackEvent = root.trackEvent || trackEvent;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
