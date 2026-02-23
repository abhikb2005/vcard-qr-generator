import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import { UserCircleIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, GlobeAltIcon, ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

export default async function VCardProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch the QR code mapping & vcard data
    const { data: qr, error } = await supabase
        .from('qr_codes')
        .select('vcard_data')
        .select('vcard_data')
        .or(`short_code.eq.${id},alias.eq.${id}`)
        .single()

    if (error || !qr || !qr.vcard_data) {
        return notFound()
    }

    const vcard = qr.vcard_data as any

    // Helper to generate vCard string for download
    // We'll embed this in a "data:text/vcard" link or handle it via a client component if complex
    // For simplicity, let's build a data URI
    const vcardString = `BEGIN:VCARD
VERSION:3.0
N:${vcard.lastName};${vcard.firstName};;;
FN:${vcard.firstName} ${vcard.lastName}
ORG:${vcard.organization}
TITLE:${vcard.title}
TEL;TYPE=WORK,VOICE:${vcard.phone}
TEL;TYPE=CELL,VOICE:${vcard.mobile}
EMAIL:${vcard.email}
URL:${vcard.website}
END:VCARD`

    const vcardDownloadUrl = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcardString)}`

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">

                {/* Header / Cover */}
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                    <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                            {vcard.photoUrl ? (
                                <img src={vcard.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <UserCircleIcon className="w-24 h-24 text-gray-400" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-20 pb-8 px-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">{vcard.firstName} {vcard.lastName}</h1>
                    <p className="text-sm text-gray-500 font-medium">{vcard.title}</p>
                    <p className="text-sm text-indigo-600 mb-6">{vcard.organization}</p>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 mb-8">
                        <a
                            href={vcardDownloadUrl}
                            download={`${vcard.firstName}_${vcard.lastName}.vcf`}
                            className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition shadow-lg shadow-gray-200"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" /> Save Contact
                        </a>
                        {/* 
                <button className="flex-1 bg-gray-100 text-gray-900 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition">
                    <ShareIcon className="w-4 h-4" /> Share
                </button>
                */}
                    </div>

                    {/* Contact List */}
                    <div className="space-y-4 text-left">
                        {vcard.mobile && (
                            <a href={`tel:${vcard.mobile}`} className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition border border-gray-100">
                                <div className="bg-green-100 p-2 rounded-lg mr-4">
                                    <PhoneIcon className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Mobile</p>
                                    <p className="text-sm font-medium text-gray-900">{vcard.mobile}</p>
                                </div>
                            </a>
                        )}

                        {vcard.email && (
                            <a href={`mailto:${vcard.email}`} className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition border border-gray-100">
                                <div className="bg-blue-100 p-2 rounded-lg mr-4">
                                    <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-sm font-medium text-gray-900 truncate">{vcard.email}</p>
                                </div>
                            </a>
                        )}

                        {vcard.website && (
                            <a href={vcard.website} target="_blank" rel="noreferrer" className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition border border-gray-100">
                                <div className="bg-purple-100 p-2 rounded-lg mr-4">
                                    <GlobeAltIcon className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Website</p>
                                    <p className="text-sm font-medium text-gray-900 truncate">{vcard.website}</p>
                                </div>
                            </a>
                        )}

                        {vcard.address && (
                            <div className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition border border-gray-100">
                                <div className="bg-orange-100 p-2 rounded-lg mr-4">
                                    <MapPinIcon className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Location</p>
                                    <p className="text-sm font-medium text-gray-900">{vcard.address}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 text-center">
                    <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
                        Created with vCard QR Pro
                    </Link>
                </div>
            </div>
        </div>
    )
}
