'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { UserIcon, PhoneIcon, EnvelopeIcon, BriefcaseIcon, MapPinIcon, GlobeAltIcon, ArrowPathIcon, CheckIcon, LinkIcon } from '@heroicons/react/24/outline'

const generateShortId = (length: number = 6) => {
    return Math.random().toString(36).substring(2, 2 + length)
}

export default function VCardForm({ userId, initialData }: { userId: string, initialData?: any }) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [origin, setOrigin] = useState('')
    const [host, setHost] = useState('')

    useEffect(() => {
        setOrigin(window.location.origin)
        setHost(window.location.host)
    }, [])

    // vCard Fields State
    const [formData, setFormData] = useState({
        firstName: initialData?.vcard_data?.firstName || '',
        lastName: initialData?.vcard_data?.lastName || '',
        organization: initialData?.vcard_data?.organization || '',
        title: initialData?.vcard_data?.title || '',
        email: initialData?.vcard_data?.email || '',
        phone: initialData?.vcard_data?.phone || '',
        mobile: initialData?.vcard_data?.mobile || '',
        website: initialData?.vcard_data?.website || '',
        address: initialData?.vcard_data?.address || '',
        alias: initialData?.alias || '', // Custom Alias
        photoUrl: initialData?.vcard_data?.photoUrl || '',
        linkedin: initialData?.vcard_data?.linkedin || ''
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)

        // Basic Validation
        if (!formData.firstName && !formData.organization) {
            alert('Please provide at least a First Name or Organization.')
            setLoading(false)
            return
        }

        const shortId = initialData?.short_code || generateShortId()
        const publicProfileUrl = `${origin}/p/${shortId}`

        const payload = {
            user_id: userId,
            target_url: publicProfileUrl,
            name: `${formData.firstName} ${formData.lastName} (vCard)`.trim() || formData.organization,
            short_code: shortId,
            alias: formData.alias || null,
            vcard_data: formData
        }

        let result;
        if (initialData?.id) {
            result = await supabase
                .from('qr_codes')
                .update(payload)
                .eq('id', initialData.id)
        } else {
            result = await supabase
                .from('qr_codes')
                .insert(payload)
        }

        const { error } = result;

        if (error) {
            if (error.code === '23505') { // Unique violation
                alert('That alias is already taken. Please try another one.')
            } else {
                alert('Error processing vCard: ' + error.message)
            }
        } else {
            setSuccess(true)
            router.push('/dashboard')
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="border-b border-gray-100 pb-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Digital Business Card</h2>
                <p className="text-sm text-gray-500">Fill in the details you want to share. Scan to save to contacts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Custom Alias Section (New Feature) */}
                <div className="md:col-span-2 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <h3 className="text-sm font-medium text-indigo-900 mb-2 flex items-center gap-2">
                        <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">New</span> Custom Link
                    </h3>
                    <div>
                        <label className="block text-xs font-medium text-indigo-700 mb-1">Custom Alias (Optional)</label>
                        <div className="relative rounded-md shadow-sm flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-indigo-200 bg-indigo-50 text-gray-500 sm:text-sm">
                                {host || '...'}/p/
                            </span>
                            <input type="text" name="alias" value={formData.alias} onChange={handleInputChange}
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-indigo-200 text-gray-900 bg-white"
                                placeholder="john-doe" />
                        </div>
                        <p className="mt-1 text-xs text-indigo-400">Leave blank for a random short link.</p>
                    </div>
                </div>

                {/* Name Section */}
                <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-indigo-500" /> Personal Info
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border text-gray-900 bg-white" placeholder="John" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border text-gray-900 bg-white" placeholder="Doe" />
                        </div>
                    </div>
                </div>

                {/* Work Section */}
                <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <BriefcaseIcon className="w-4 h-4 text-indigo-500" /> Work
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Organization / Company</label>
                            <input type="text" name="organization" value={formData.organization} onChange={handleInputChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border text-gray-900 bg-white" placeholder="Acme Corp" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Job Title</label>
                            <input type="text" name="title" value={formData.title} onChange={handleInputChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border text-gray-900 bg-white" placeholder="Product Manager" />
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4 text-indigo-500" /> Contact Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Direct Phone</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border text-gray-900 bg-white" placeholder="+1 (555) 000-0000" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Mobile</label>
                            <input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border text-gray-900 bg-white" placeholder="+1 (555) 999-9999" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <EnvelopeIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                </div>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border text-gray-900 bg-white" placeholder="you@example.com" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Online Section */}
                <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <GlobeAltIcon className="w-4 h-4 text-indigo-500" /> Online Presence
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Website URL</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <GlobeAltIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                </div>
                                <input type="url" name="website" value={formData.website} onChange={handleInputChange}
                                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border text-gray-900 bg-white" placeholder="https://yourwebsite.com" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <LinkIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                </div>
                                <input type="url" name="linkedin" value={formData.linkedin} onChange={handleInputChange}
                                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border text-gray-900 bg-white" placeholder="https://linkedin.com/in/username" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className={`flex justify-center items-center gap-2 py-2.5 px-6 border border-transparent rounded-lg shadow-md text-sm font-medium text-white 
            ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'} 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200`}
                >
                    {loading ? (
                        <>
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            Creating Card...
                        </>
                    ) : success ? (
                        <>
                            <CheckIcon className="w-5 h-5" />
                            Done! Redirecting...
                        </>
                    ) : (
                        'Create vCard QR'
                    )}
                </button>
            </div>
        </form>
    )
}
