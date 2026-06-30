(function (root) {
  'use strict';

  var PURCHASE_STORAGE_KEY = 'vcard_ga4_purchase_ids';

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
      page_location: location.href || '',
      event_timestamp: new Date().toISOString()
    };
  }

  function debug(eventName, params) {
    if (isDevelopment() && root.console && typeof root.console.debug === 'function') {
      root.console.debug('[analytics]', eventName, params);
    }
  }

  function trackEvent(eventName, params) {
    var eventParams = Object.assign({}, getBaseParams(), params || {});
    try {
      debug(eventName, eventParams);
      if (typeof root.gtag === 'function') {
        root.gtag('event', eventName, eventParams);
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
      return JSON.parse(root.localStorage.getItem(PURCHASE_STORAGE_KEY) || '[]');
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

  function trackPurchase(purchaseParams) {
    var params = Object.assign({}, purchaseParams || {});
    var transactionId = params.transaction_id;
    if (!transactionId) {
      trackEvent('payment_success', Object.assign({ purchase_tracked: false }, params));
      return false;
    }

    if (hasSentPurchase(transactionId)) {
      debug('purchase_skipped_duplicate', { transaction_id: transactionId });
      return false;
    }

    var value = Number(params.value);
    if (Number.isFinite(value) && value >= 0) {
      params.value = value;
      params.currency = String(params.currency || 'USD').toUpperCase();
      if (Array.isArray(params.items)) {
        params.items = params.items.map(function (item) {
          var normalizedItem = Object.assign({}, item);
          var quantity = Number(normalizedItem.quantity);
          normalizedItem.quantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
          if (!Number.isFinite(Number(normalizedItem.price))) {
            normalizedItem.price = value / normalizedItem.quantity;
          } else {
            normalizedItem.price = Number(normalizedItem.price);
          }
          return normalizedItem;
        });
      }
    }

    trackEvent('purchase', params);
    trackEvent('payment_success', params);
    markPurchaseSent(transactionId);
    return true;
  }

  function sanitizeError(error) {
    var message = error && error.message ? error.message : String(error || 'Unknown QR generation error');
    return message.replace(/\s+/g, ' ').slice(0, 120);
  }

  var api = {
    trackEvent: trackEvent,
    trackPurchase: trackPurchase,
    hasSentPurchase: hasSentPurchase,
    sanitizeError: sanitizeError,
    getBaseParams: getBaseParams
  };

  root.VcardAnalytics = api;
  root.trackEvent = root.trackEvent || trackEvent;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
