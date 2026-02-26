import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="py-12 border-t border-gray-100 text-center text-gray-500 text-sm bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <p>&copy; {new Date().getFullYear()} vCard QR Pro. All rights reserved.</p>
                <div className="mt-4 flex justify-center gap-6">
                    <Link href="/p/hovercode-alternative" className="hover:text-gray-900">Alternatives</Link>
                    <a href="#" className="hover:text-gray-900">Privacy</a>
                    <a href="#" className="hover:text-gray-900">Terms</a>
                </div>
            </div>
        </footer>
    )
}
