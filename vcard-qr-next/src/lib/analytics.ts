'use client'

type AnalyticsParams = Record<string, unknown>

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void
    }
}

export function canTrack() {
    if (typeof window === 'undefined') return false
    try {
        if (window.location.hostname !== 'app.vcardqrcodegenerator.com' && window.location.hostname !== 'www.vcardqrcodegenerator.com') return false
        if (new URLSearchParams(window.location.search).get('analytics_test') === '1' || sessionStorage.getItem('vcard_analytics_test') === '1') return false
        return localStorage.getItem('cookie_consent') === 'accepted'
    } catch { return false }
}

const PURCHASE_STORAGE_KEY = 'vcard_ga4_purchase_ids'
const SIGNUP_STORAGE_KEY = 'vcard_ga4_signup_sent'
const ATTRIBUTION_STORAGE_KEY = 'vcard_ga4_attribution'
const ATTRIBUTION_KEYS = ['customer_segment', 'landing_variant', 'landing_page', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_adgroup', 'utm_term', 'utm_content'] as const

function isDevelopment() {
    return process.env.NODE_ENV !== 'production'
}

function getBaseParams() {
    if (typeof window === 'undefined') return {}

    return {
        page_path: window.location.pathname,
        page_title: document.title,
        page_location: window.location.origin + window.location.pathname,
        event_timestamp: new Date().toISOString()
    }
}

function debug(eventName: string, params: AnalyticsParams) {
    if (isDevelopment()) {
        console.debug('[analytics]', eventName, params)
    }
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
    if (!canTrack()) return false
    const eventParams = {
        ...getBaseParams(),
        ...params
    }

    try {
        debug(eventName, eventParams)
        if (typeof window.gtag !== 'function') return false
        window.gtag('event', eventName, eventParams)
        return true
    } catch (error) {
        debug('analytics_error', {
            event_name: eventName,
            error_message: error instanceof Error ? error.message : 'unknown'
        })
    }
}

function getSentPurchases() {
    try {
        const ids = JSON.parse(localStorage.getItem(PURCHASE_STORAGE_KEY) || '[]')
        return Array.isArray(ids) ? ids.filter(id => typeof id === 'string') as string[] : []
    } catch {
        return []
    }
}

function markPurchaseSent(transactionId: string) {
    try {
        const sentPurchases = getSentPurchases()
        if (!sentPurchases.includes(transactionId)) {
            sentPurchases.push(transactionId)
            localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(sentPurchases.slice(-50)))
        }
    } catch {
        // Idempotency storage is best-effort. Analytics must never break checkout.
    }
}

export function hasSentPurchase(transactionId: string) {
    return getSentPurchases().includes(transactionId)
}

export function getAttributionParams(): AnalyticsParams {
    if (!canTrack()) return {}
    let stored: AnalyticsParams = {}
    try { stored = JSON.parse(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || '{}') } catch { /* best effort */ }
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) stored = {}
    const search = new URLSearchParams(window.location.search)
    for (const key of ATTRIBUTION_KEYS) {
        const value = search.get(key) || stored[key]
        if (typeof value === 'string' && value) stored[key] = value.slice(0, 100)
    }
    const segment = search.get('customer_segment') || search.get('segment') || stored.customer_segment
    if (segment) stored.customer_segment = segment
    return Object.fromEntries(ATTRIBUTION_KEYS.filter(key => typeof stored[key] === 'string').map(key => [key, String(stored[key]).slice(0, 100)]))
}

export function captureAttribution() {
    if (!canTrack()) return {}
    const attribution = getAttributionParams()
    try { sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution)) } catch { /* best effort */ }
    return attribution
}

export function trackSignUp(params: AnalyticsParams = {}, accountId = 'session') {
    if (!canTrack() || typeof window.gtag !== 'function') return false
    const signupKey = SIGNUP_STORAGE_KEY + ':' + accountId
    try {
        if (localStorage.getItem(signupKey) === '1') return false
    } catch { /* best effort */ }
    if (!trackEvent('sign_up', { ...getAttributionParams(), ...params })) return false
    try { localStorage.setItem(signupKey, '1') } catch { /* best effort */ }
    return true
}

export function trackPurchase(params: AnalyticsParams & { transaction_id?: string }) {
    if (!canTrack() || typeof window.gtag !== 'function') return false
    const transactionId = params.transaction_id

    if (!transactionId) {
        trackEvent('payment_success', { ...params, purchase_tracked: false })
        return false
    }

    if (hasSentPurchase(transactionId)) {
        debug('purchase_skipped_duplicate', { transaction_id: transactionId })
        return false
    }

    if (!trackEvent('purchase', params)) return false
    trackEvent('payment_success', params)
    markPurchaseSent(transactionId)
    return true
}

export function sanitizeError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error || 'Unknown error')
    return message.replace(/\s+/g, ' ').slice(0, 120)
}
