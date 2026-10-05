import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isFirstSignIn } from '@/lib/signup'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const requestedNext = searchParams.get('next') ?? '/dashboard'
    const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//')
        ? requestedNext
        : '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const consentAccepted = (await cookies()).get('vcard_consent')?.value === 'accepted'
            const redirect = (url: string) => {
                const response = NextResponse.redirect(url)
                if (consentAccepted && data.user && isFirstSignIn(data.user)) {
                    response.cookies.set('vcard_signup', data.user.id + ':' + (data.user.app_metadata.provider === 'google' ? 'google' : 'email'), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 3600 })
                }
                return response
            }
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return redirect(`https://${forwardedHost}${next}`)
            } else {
                return redirect(`${origin}${next}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
