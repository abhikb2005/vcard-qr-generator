export function isFirstSignIn(user: { created_at?: string; last_sign_in_at?: string }, now = Date.now()) {
    const created = Date.parse(user.created_at || '')
    const signedIn = Date.parse(user.last_sign_in_at || '')
    return Number.isFinite(created) && Number.isFinite(signedIn) && signedIn >= created && signedIn - created < 10000 && Math.abs(now - signedIn) < 60000
}
