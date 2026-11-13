const CHECKOUT_KEY = 'vcard_pending_dynamic_checkout'

export function rememberCheckout(sessionId: unknown, attempt: unknown) {
    if (typeof sessionId !== 'string' || !sessionId || typeof attempt !== 'string' || !attempt) return
    try {
        sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify({ sessionId, attempt, expires: Date.now() + 24 * 60 * 60 * 1000 }))
    } catch { /* provider return references still work without storage */ }
}

export function getCheckoutReturn(params: Pick<URLSearchParams, 'get'>) {
    if (params.get('payment_verifying') !== 'true') return null
    let sessionId = params.get('session_id')
    const subscriptionId = params.get('subscription_id')
    const paymentId = params.get('payment_id')
    const attempt = params.get('checkout_attempt')

    if (!sessionId && !paymentId && subscriptionId && attempt) {
        try {
            const pending = JSON.parse(sessionStorage.getItem(CHECKOUT_KEY) || 'null')
            if (pending?.attempt === attempt && typeof pending.sessionId === 'string' && pending.expires > Date.now()) sessionId = pending.sessionId
        } catch { /* fall back to entitlement-only verification */ }
    }

    return sessionId || subscriptionId || paymentId ? { sessionId, subscriptionId, paymentId } : null
}
