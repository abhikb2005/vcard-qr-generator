import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import VCardForm from '@/components/VCardForm'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EditVCardPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        redirect('/login')
    }

    const { data: qrCode, error: qrError } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

    if (qrError || !qrCode) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-4xl space-y-8">
                <div>
                    <Link href="/dashboard" className="flex items-center text-sm text-indigo-600 hover:text-indigo-900 mb-4 transition">
                        <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-2">Edit Your vCard</h1>
                    <p className="text-center text-gray-500">Update your digital business card details anytime.</p>
                </div>

                <VCardForm userId={user.id} initialData={qrCode} />
            </div>
        </div>
    )
}
