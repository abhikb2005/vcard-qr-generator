'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, CheckCircle2, QrCode, Sparkles } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const router = useRouter()
    const [isSignUp, setIsSignUp] = useState(false)
    const [customerSegment, setCustomerSegment] = useState('')
    const supabase = createClient()

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        setIsSignUp(params.get('mode') === 'signup')
        setCustomerSegment(params.get('segment') || '')
    }, [])

    const isEventManager = customerSegment === 'event_manager'
    const dashboardPath = isEventManager ? '/dashboard?segment=event_manager' : '/dashboard'
    const experience = isEventManager
        ? {
            eyebrow: 'Built for solo event managers',
            title: 'Keep every printed event QR useful.',
            description: 'Create one QR for your event, update the destination when plans change, and see what attendees actually scan.',
            benefits: ['Update your agenda, venue map, or registration page after printing', 'Use the same QR on invitations, signs, badges, and table tents', 'Start with one free dynamic QR before deciding to upgrade'],
            accountTitle: 'Create your event QR account',
            accountDescription: 'Make your first QR free. Upgrade only when you need more editable codes and scan analytics.'
        }
        : {
            eyebrow: 'Editable QR codes that keep working',
            title: 'Print once. Update whenever you need.',
            description: 'Create a dynamic QR code, change its destination later, and track the scan activity from one simple dashboard.',
            benefits: ['Keep printed cards, flyers, and signs useful after details change', 'Point scans to the newest page without reprinting', 'Start with one free dynamic QR before deciding to upgrade'],
            accountTitle: 'Create your editable QR account',
            accountDescription: 'Create your first dynamic QR free, then upgrade only when you need more codes or scan analytics.'
        }
    const authCallbackUrl = () => {
        const callback = new URL('/auth/callback', location.origin)
        callback.searchParams.set('next', dashboardPath)
        return callback.toString()
    }

    const trackSignupIntent = (method: 'email' | 'google') => {
        trackEvent('dynamic_qr_signup_started', {
            signup_method: method,
            customer_segment: customerSegment || 'unspecified',
            landing_intent: new URLSearchParams(window.location.search).get('intent') || 'unspecified'
        })
    }

    async function handleGoogleLogin() {
        setLoading(true)
        if (isSignUp) trackSignupIntent('google')
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: authCallbackUrl(),
            },
        })
        if (error) {
            setError(error.message)
            setLoading(false)
        }
    }

    async function handleSignIn() {
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(error.message)
            } else {
                router.push(dashboardPath)
                router.refresh()
            }
        } catch {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    async function handleSignUp() {
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            trackSignupIntent('email')
            const { error, data } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: authCallbackUrl(),
                },
            })

            if (error) {
                setError(error.message)
            } else if (data.user && data.user.identities && data.user.identities.length === 0) {
                setError('This email is already registered. Please sign in instead.')
            } else {
                setMessage('Check your email for the confirmation link.')
            }
        } catch {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isSignUp) {
            await handleSignUp()
            return
        }
        await handleSignIn()
    }

    return (
        <main className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-slate-950/50 lg:grid-cols-[1.08fr_.92fr]">
                <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-700 to-cyan-700 px-7 py-9 text-white sm:px-10 lg:flex lg:flex-col lg:justify-between lg:p-14">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" aria-hidden="true" />
                    <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" aria-hidden="true" />
                    <div className="relative">
                        <a href="https://www.vcardqrcodegenerator.com/" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-700">
                            <QrCode className="h-4 w-4" aria-hidden="true" />
                            vCard QR Pro
                        </a>
                        <p className="mt-12 text-sm font-bold uppercase tracking-[0.18em] text-cyan-100">{experience.eyebrow}</p>
                        <h1 className="mt-4 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{experience.title}</h1>
                        <p className="mt-6 max-w-xl text-lg leading-8 text-indigo-50">{experience.description}</p>
                    </div>

                    <div className="relative mt-10 space-y-4 lg:mt-0">
                        {experience.benefits.map((benefit) => (
                            <div key={benefit} className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" aria-hidden="true" />
                                <p className="text-sm leading-6 text-white">{benefit}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="flex items-center bg-white px-6 py-9 sm:px-10 lg:px-14">
                    <div className="mx-auto w-full max-w-md">
                        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                            {isSignUp ? 'Start with a free QR' : 'Welcome back'}
                        </div>
                        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                            {isSignUp ? experience.accountTitle : 'Sign in to your dashboard'}
                        </h2>
                        <p className="mt-3 text-base leading-7 text-slate-600">
                            {isSignUp ? experience.accountDescription : 'Manage your editable QR codes, destinations, and scan activity.'}
                        </p>

                        {error && (
                            <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                                <p>{error}</p>
                            </div>
                        )}

                        {message && (
                            <div role="status" aria-live="polite" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                                {message} You can close this page after confirming your email.
                            </div>
                        )}

                        <div className="mt-8">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </button>

                            <div className="my-7 flex items-center gap-4" aria-hidden="true">
                                <div className="h-px flex-1 bg-slate-200" />
                                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">or use email</span>
                                <div className="h-px flex-1 bg-slate-200" />
                            </div>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email-address" className="mb-2 block text-sm font-semibold text-slate-800">Email address</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                    required
                                    minLength={6}
                                    className="block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                                    placeholder={isSignUp ? 'Create a password (6+ characters)' : 'Enter your password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? 'Please wait…' : isSignUp ? (isEventManager ? 'Create my free event QR account' : 'Create my free account') : 'Sign in to dashboard'}
                            </button>
                        </form>

                        <div className="mt-7 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
                            {isSignUp ? 'Already have an account?' : 'New to dynamic QR codes?'}{' '}
                            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="font-bold text-indigo-700 underline decoration-indigo-300 underline-offset-4 transition hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
                                {isSignUp ? 'Sign in instead' : 'Create a free account'}
                            </button>
                        </div>
                        <a href="https://www.vcardqrcodegenerator.com/" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Back to vCard QR Generator
                        </a>
                    </div>
                </section>
            </div>
        </main>
    )
}
