'use client'

type AnalyticsParams = Record<string, unknown>

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void
    }
}

const PURCHASE_STORAGE_KEY = 'vcard_ga4_purchase_ids'

function isDevelopment() {
    return process.env.NODE_ENV !== 'production'
}

function getBaseParams() {
    if (typeof window === 'undefined') return {}

    return {
        page_path: window.location.pathname,
        page_title: document.title,
        page_location: window.location.href,
        event_timestamp: new Date().toISOString()
    }
}

function debug(eventName: string, params: AnalyticsParams) {
    if (isDevelopment()) {
        console.debug('[analytics]', eventName, params)
    }
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
    const eventParams = {
        ...getBaseParams(),
        ...params
    }

    try {
        debug(eventName, eventParams)
        window.gtag?.('event', eventName, eventParams)
    } catch (error) {
        debug('analytics_error', {
            event_name: eventName,
            error_message: error instanceof Error ? error.message : 'unknown'
        })
    }
}

function getSentPurchases() {
    try {
        return JSON.parse(localStorage.getItem(PURCHASE_STORAGE_KEY) || '[]') as string[]
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

export function trackPurchase(params: AnalyticsParams & { transaction_id?: string }) {
    const transactionId = params.transaction_id

    if (!transactionId) {
        trackEvent('payment_success', { ...params, purchase_tracked: false })
        return false
    }

    if (hasSentPurchase(transactionId)) {
        debug('purchase_skipped_duplicate', { transaction_id: transactionId })
        return false
    }

    trackEvent('purchase', params)
    trackEvent('payment_success', params)
    markPurchaseSent(transactionId)
    return true
}

export function sanitizeError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error || 'Unknown error')
    return message.replace(/\s+/g, ' ').slice(0, 120)
}
