'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
    const router = useRouter()
    const supabase = createClient()

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    return (
        <button
            onClick={handleSignOut}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
        >
            Sign Out
        </button>
    )
}
