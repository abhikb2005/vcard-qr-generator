import { Suspense } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        }>
            <DashboardClient />
        </Suspense>
    )
}
