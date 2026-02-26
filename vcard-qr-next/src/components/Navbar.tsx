import Link from 'next/link'
import { QrCodeIcon } from '@heroicons/react/24/outline'

export default function Navbar() {
    return (
        <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="bg-indigo-600 p-1.5 rounded-lg flex items-center justify-center logo-icon transition-transform group-hover:scale-105" style={{ width: '32px', height: '32px' }}>
                            <QrCodeIcon className="h-6 w-6 text-white" style={{ width: '24px', height: '24px' }} />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            vCard QR Pro
                        </span>
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                        Sign In
                    </Link>
                    <Link href="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm">
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    )
}
