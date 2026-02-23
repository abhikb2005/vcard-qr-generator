'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import CreateQrForm from '@/components/CreateQrForm'
import LogoutButton from '@/components/LogoutButton'
import { LinkIcon, QrCodeIcon, ChartBarIcon, ArrowTopRightOnSquareIcon, CalendarIcon, UserPlusIcon, TrashIcon, ArrowPathIcon, WalletIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { QRCodeCanvas } from 'qrcode.react'
import { useRouter, useSearchParams } from 'next/navigation'

const LIMITS = {
    free: 1,
    starter: 5,
    growth: 50,
    business: Infinity
}

export default function DashboardClient() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [qrCodes, setQrCodes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [verifyingPayment, setVerifyingPayment] = useState(false)
    const [origin, setOrigin] = useState('')

    // Pricing Modal State
    const [showPricing, setShowPricing] = useState(false)
    const [loadingTier, setLoadingTier] = useState<string | null>(null)

    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        async function getData() {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error || !user) {
                router.push('/login')
                return
            }
            setUser(user)
            setOrigin(window.location.origin)

            // Fetch Profile (Subscription)
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            setProfile(profileData || { subscription_plan: 'free' })

            // Fetch QR Codes
            const { data: qrData } = await supabase
                .from('qr_codes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            setQrCodes(qrData || [])
            setLoading(false)

            // Handle Payment Verification
            const sessionId = searchParams.get('session_id')
            if (searchParams.get('payment_verifying') === 'true' && sessionId) {
                setVerifyingPayment(true)
                verifyPayment(sessionId)
            }
        }
        getData()
    }, [router, supabase, searchParams])

    const verifyPayment = async (sessionId: string) => {
        try {
            const res = await fetch('/api/subscription/verify', {
                method: 'POST',
                body: JSON.stringify({ sessionId })
            })
            const json = await res.json()
            if (json.success) {
                alert(`Payment Successful! You are now on the ${json.plan.toUpperCase()} plan.`)
                // Refresh data
                window.location.href = '/dashboard'
            } else {
                alert('Payment verification failed. Please contact support.')
            }
        } catch (e) {
            alert('Error verifying payment.')
        } finally {
            setVerifyingPayment(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this QR code?')) return

        const { error } = await supabase.from('qr_codes').delete().eq('id', id)
        if (error) {
            alert('Error deleting: ' + error.message)
        } else {
            setQrCodes(prev => prev.filter(q => q.id !== id))
        }
    }

    const handleUpgrade = async (tier: string) => {
        setLoadingTier(tier)
        try {
            const res = await fetch('/api/subscription/checkout', {
                method: 'POST',
                body: JSON.stringify({ tier })
            })
            const json = await res.json()
            if (json.url) {
                window.location.href = json.url
            } else {
                alert('Error creating checkout: ' + (json.error || 'Unknown error'))
            }
        } catch (e) {
            alert('Error initiating checkout.')
        } finally {
            setLoadingTier(null)
        }
    }

    const limit = LIMITS[(profile?.subscription_plan as keyof typeof LIMITS) || 'free']
    const used = qrCodes.length
    const isLimitReached = used >= limit

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    )

    if (verifyingPayment) return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
            <ArrowPathIcon className="w-12 h-12 animate-spin text-indigo-600" />
            <h2 className="text-xl font-semibold">Verifying Payment...</h2>
            <p className="text-gray-500">Please wait while we confirm your subscription.</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-600 p-1.5 rounded-lg">
                                <QrCodeIcon className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                vCard QR Pro
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowPricing(!showPricing)}
                                className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                            >
                                {profile?.subscription_plan?.toUpperCase()} Plan ({used}/{limit === Infinity ? '∞' : limit})
                            </button>
                            <LogoutButton />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Pricing Modal / Overlay */}
            {showPricing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPricing(false)}>
                    <div className="bg-white rounded-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Plan</h2>
                            <p className="text-gray-500">Scale your QR code usage with our simple plans.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Starter */}
                            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <h3 className="text-lg font-bold text-gray-900">Starter</h3>
                                <div className="mt-2 mb-4"><span className="text-3xl font-bold text-gray-900">$5</span><span className="text-gray-500">/mo</span></div>
                                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                                    <li>✓ 5 Dynamic QRs</li>
                                    <li>✓ Basic Analytics</li>
                                    <li>✓ Custom Aliases</li>
                                </ul>
                                <button
                                    onClick={() => handleUpgrade('starter')}
                                    disabled={loadingTier === 'starter'}
                                    className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {loadingTier === 'starter' ? 'Loading...' : 'Upgrade to Starter'}
                                </button>
                            </div>
                            {/* Growth */}
                            <div className="border border-purple-200 bg-purple-50 rounded-xl p-6 relative shadow-md">
                                <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg font-bold">POPULAR</div>
                                <h3 className="text-lg font-bold text-purple-900">Growth</h3>
                                <div className="mt-2 mb-4"><span className="text-3xl font-bold text-purple-900">$9</span><span className="text-purple-600">/mo</span></div>
                                <ul className="space-y-2 text-sm text-purple-800 mb-6">
                                    <li>✓ 50 Dynamic QRs</li>
                                    <li>✓ Advanced Analytics</li>
                                    <li>✓ Priority Support</li>
                                </ul>
                                <button
                                    onClick={() => handleUpgrade('growth')}
                                    disabled={loadingTier === 'growth'}
                                    className="w-full bg-purple-600 text-white rounded-lg py-2 font-medium hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {loadingTier === 'growth' ? 'Loading...' : 'Upgrade to Growth'}
                                </button>
                            </div>
                            {/* Business */}
                            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <h3 className="text-lg font-bold text-gray-900">Business</h3>
                                <div className="mt-2 mb-4"><span className="text-3xl font-bold text-gray-900">$19</span><span className="text-gray-500">/mo</span></div>
                                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                                    <li>✓ Unlimited Dynamic QRs</li>
                                    <li>✓ Team Features</li>
                                    <li>✓ API Access</li>
                                </ul>
                                <button
                                    onClick={() => handleUpgrade('business')}
                                    disabled={loadingTier === 'business'}
                                    className="w-full bg-gray-900 text-white rounded-lg py-2 font-medium hover:bg-gray-800 disabled:opacity-50"
                                >
                                    {loadingTier === 'business' ? 'Loading...' : 'Upgrade to Business'}
                                </button>
                            </div>
                        </div>
                        <button onClick={() => setShowPricing(false)} className="mt-8 text-sm text-gray-500 hover:text-gray-900 w-full text-center">Close</button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                <div className="px-4 py-2 sm:px-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Create Form */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* New vCard CTA */}
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                                <h3 className="text-xl font-bold mb-2 relative z-10">Create Digital Business Card</h3>
                                <p className="text-indigo-100 text-sm mb-6 relative z-10">Share your contact info instantly with a professional vCard QR code.</p>
                                <Link
                                    href={isLimitReached ? '#' : '/vcard/new'}
                                    onClick={(e) => {
                                        if (isLimitReached) {
                                            e.preventDefault()
                                            setShowPricing(true)
                                        }
                                    }}
                                    className={`inline-flex items-center justify-center w-full px-4 py-3 
                                        ${isLimitReached ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-indigo-600 hover:bg-indigo-50'} 
                                        font-semibold rounded-lg shadow-sm transition-colors relative z-10`}
                                >
                                    <UserPlusIcon className="w-5 h-5 mr-2" />
                                    {isLimitReached ? 'Limit Reached' : 'Build vCard'}
                                </Link>
                            </div>

                            {/* Logic to gate standard URL QRs too if needed. Assuming same limit. */}
                            {user && !isLimitReached ? (
                                <CreateQrForm userId={user.id} />
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                                    <WalletIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-semibold text-gray-900">Limit Reached</h3>
                                    <p className="text-sm text-gray-500 mb-4">You have used {used}/{limit} QR codes. Upgrade to create more.</p>
                                    <button
                                        onClick={() => setShowPricing(true)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                                    >
                                        Upgrade Plan
                                    </button>
                                </div>
                            )}

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-blue-800 mb-2">Pro Tip</h4>
                                <p className="text-xs text-blue-600 leading-relaxed">
                                    Dynamic QR codes allow you to change the target URL anytime.
                                </p>
                            </div>
                        </div>

                        {/* Right Column: List */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <ChartBarIcon className="w-6 h-6 text-gray-400" />
                                    Your Campaigns
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                        {qrCodes.length} / {limit === Infinity ? '∞' : limit} Used
                                    </span>
                                </div>
                            </div>

                            {qrCodes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center bg-white p-16 rounded-2xl shadow-sm border border-gray-200 text-center border-dashed">
                                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                                        <QrCodeIcon className="w-12 h-12 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No QR codes yet</h3>
                                    <p className="text-gray-500 mt-1 max-w-sm">Create your first dynamic QR code using the form on the left to get started.</p>
                                </div>
                            ) : (
                                <ul className="space-y-4">
                                    {qrCodes.map((qr) => (
                                        <li key={qr.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden group">
                                            <div className="p-5 flex flex-col sm:flex-row gap-5">

                                                {/* QR Code Canvas */}
                                                <div className="flex-shrink-0 bg-white p-2 border border-gray-100 rounded-lg">
                                                    <QRCodeCanvas
                                                        value={`${origin}/u/${qr.short_code}`}
                                                        size={120}
                                                        level={"H"}
                                                        includeMargin={true}
                                                        className="rounded-md"
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h4 className="text-lg font-semibold text-gray-900 truncate flex items-center gap-2">
                                                                {qr.name || 'Untitled QR'}
                                                                {qr.vcard_data && (
                                                                    <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-bold">vCard</span>
                                                                )}
                                                            </h4>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${qr.scan_count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                                {qr.scan_count} Scans
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                                            <LinkIcon className="w-4 h-4" />
                                                            <span className="truncate max-w-xs sm:max-w-md" title={qr.target_url}>
                                                                {qr.target_url}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center text-xs text-indigo-600 font-mono bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md">
                                                                <span className="select-all">{origin}/u/{qr.short_code}</span>
                                                            </div>
                                                            {qr.alias && (
                                                                <div className="flex items-center text-xs text-purple-600 font-mono bg-purple-50 border border-purple-100 px-2 py-1 rounded-md" title="Custom Alias">
                                                                    <span className="select-all">/p/{qr.alias}</span>
                                                                </div>
                                                            )}
                                                            <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                                                                <CalendarIcon className="w-3 h-3" />
                                                                {new Date(qr.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex items-center gap-3 justify-end sm:justify-start">
                                                        <a
                                                            href={`/u/${qr.short_code}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                                                        >
                                                            Test Link <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            onClick={() => handleDelete(qr.id)}
                                                            className="inline-flex items-center gap-1 px-3 py-2 border border-red-200 shadow-sm text-sm font-medium rounded-lg text-red-600 bg-white hover:bg-red-50 focus:outline-none transition-colors"
                                                        >
                                                            <TrashIcon className="w-4 h-4" /> Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
