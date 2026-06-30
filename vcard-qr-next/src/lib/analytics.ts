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

    const normalizedParams = { ...params }
    const value = Number(normalizedParams.value)
    if (Number.isFinite(value) && value >= 0) {
        normalizedParams.value = value
        normalizedParams.currency = String(normalizedParams.currency || 'USD').toUpperCase()
        if (Array.isArray(normalizedParams.items)) {
            normalizedParams.items = normalizedParams.items.map((item) => {
                const normalizedItem = { ...(item as Record<string, unknown>) }
                const quantity = Number(normalizedItem.quantity)
                normalizedItem.quantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1
                const price = Number(normalizedItem.price)
                normalizedItem.price = Number.isFinite(price) ? price : value / Number(normalizedItem.quantity)
                return normalizedItem
            })
        }
    }

    trackEvent('purchase', normalizedParams)
    trackEvent('payment_success', normalizedParams)
    markPurchaseSent(transactionId)
    return true
}

export function sanitizeError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error || 'Unknown error')
    return message.replace(/\s+/g, ' ').slice(0, 120)
}
