'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LinkIcon, TagIcon, PlusIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline'

const generateShortId = (length: number = 6) => {
    return Math.random().toString(36).substring(2, 2 + length)
}

export default function CreateQrForm({ userId }: { userId: string }) {
    const [url, setUrl] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)

        const shortId = generateShortId()

        // Check if valid URL
        let target = url.trim()
        if (!target) {
            alert('Please enter a valid URL')
            setLoading(false)
            return
        }
        if (!target.startsWith('http')) {
            target = 'https://' + target
        }

        const { error } = await supabase.from('qr_codes').insert({
            user_id: userId,
            target_url: target,
            name: name || target,
            short_code: shortId,
        })

        if (error) {
            alert('Error creating QR code: ' + error.message)
        } else {
            setUrl('')
            setName('')
            setSuccess(true)
            router.refresh() // Refresh server components to show the new list

            // Reset success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000)
        }
        setLoading(false)
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <PlusIcon className="w-5 h-5 text-indigo-600" />
                    Create New Dynamic QR
                </h3>
                <p className="text-sm text-gray-500 mt-1">Shorten a URL and track its scans.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                        Target URL <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <LinkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text" // using type="text" because "url" validation can be annoying during typing
                            id="url"
                            required
                            autoComplete="off"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 transition ease-in-out duration-150 text-gray-900 bg-white"
                            placeholder="example.com"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <TagIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            id="name"
                            autoComplete="off"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 transition ease-in-out duration-150 text-gray-900 bg-white"
                            placeholder="My Portfolio"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white 
            ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'} 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200`}
                >
                    {loading ? (
                        <>
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            Creating...
                        </>
                    ) : success ? (
                        <>
                            <CheckIcon className="w-5 h-5" />
                            Created!
                        </>
                    ) : (
                        'Create Dynamic QR Code'
                    )}
                </button>
            </form>
        </div>
    )
}
