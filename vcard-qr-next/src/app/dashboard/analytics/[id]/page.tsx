import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, ChartBarIcon, MapPinIcon, DevicePhoneMobileIcon, GlobeAltIcon, CalendarIcon, LinkIcon } from '@heroicons/react/24/outline'

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch QR Code details to verify ownership
    const { data: qrData, error: qrError } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (qrError || !qrData) {
        redirect('/dashboard')
    }

    // Fetch all scans for this QR code
    const { data: scans } = await supabase
        .from('scans')
        .select('*')
        .eq('qr_id', id)
        .order('scanned_at', { ascending: false })

    const totalScans = scans?.length || 0

    // Compute basic analytics
    const countries: Record<string, number> = {}
    const referers: Record<string, number> = {}
    
    scans?.forEach((scan) => {
        let c = scan.country === 'unknown' ? 'Global/Unknown' : scan.country
        countries[c] = (countries[c] || 0) + 1
        
        // Simple domain extraction for referer to make it readable
        let ref = scan.referer || 'Direct'
        if (ref !== 'direct' && ref.startsWith('http')) {
            try {
                ref = new URL(ref).hostname
            } catch (e) {}
        }
        referers[ref] = (referers[ref] || 0) + 1
    })

    const topCountries = Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const topReferers = Object.entries(referers).sort((a, b) => b[1] - a[1]).slice(0, 5)

    return (
        <div className="min-h-screen bg-gray-50 font-sans py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <ChartBarIcon className="w-6 h-6 text-indigo-600" />
                            Analytics: {qrData.name || qrData.short_code}
                        </h1>
                        <p className="text-sm text-gray-500">{qrData.target_url}</p>
                    </div>
                </div>

                {/* Top Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Scans</p>
                            <h2 className="text-3xl font-bold text-gray-900">{totalScans}</h2>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg text-green-600">
                            <ChartBarIcon className="w-8 h-8" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Created</p>
                            <h2 className="text-xl font-bold text-gray-900">{new Date(qrData.created_at).toLocaleDateString()}</h2>
                        </div>
                        <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
                            <CalendarIcon className="w-8 h-8" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Short Code</p>
                            <h2 className="text-xl font-bold text-indigo-600 font-mono">/{qrData.short_code}</h2>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
                            <LinkIcon className="w-8 h-8" />
                        </div>
                    </div>
                </div>

                {/* Demographics & Sources */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Locations */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                            <MapPinIcon className="w-5 h-5 text-gray-400" />
                            <h3 className="font-semibold text-gray-900">Top Locations</h3>
                        </div>
                        <div className="p-4">
                            {topCountries.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No location data yet.</p>
                            ) : (
                                <ul className="space-y-4">
                                    {topCountries.map(([country, count]) => (
                                        <li key={country} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">{country}</span>
                                            <div className="flex items-center gap-3 w-1/2">
                                                <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500" style={{ width: `${(count / totalScans) * 100}%` }}></div>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Referrers */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                            <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                            <h3 className="font-semibold text-gray-900">Traffic Sources</h3>
                        </div>
                        <div className="p-4">
                            {topReferers.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No referrer data yet.</p>
                            ) : (
                                <ul className="space-y-4">
                                    {topReferers.map(([ref, count]) => (
                                        <li key={ref} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700 truncate max-w-[150px]">{ref}</span>
                                            <div className="flex items-center gap-3 w-1/2">
                                                <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-purple-500" style={{ width: `${(count / totalScans) * 100}%` }}></div>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
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
