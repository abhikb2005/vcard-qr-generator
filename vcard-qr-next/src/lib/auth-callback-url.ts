export function buildAuthCallbackUrl(
    origin: string,
    next: string,
    attribution: Record<string, unknown>,
    analyticsTest: boolean,
) {
    const destination = new URL(next, origin)
    if (destination.pathname === '/dashboard') {
        for (const [key, value] of Object.entries(attribution)) {
            if (typeof value === 'string' && value) destination.searchParams.set(key, value)
        }
        if (analyticsTest) destination.searchParams.set('analytics_test', '1')
    }
    const callback = new URL('/auth/callback', origin)
    callback.searchParams.set('next', destination.pathname + destination.search)
    return callback.toString()
}
