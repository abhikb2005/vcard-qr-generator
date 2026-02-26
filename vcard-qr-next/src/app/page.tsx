import Link from 'next/link'
import { UserPlusIcon, BoltIcon, ChartBarIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />

      {/* Hero */}
      <header className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-50"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-gray-900 mb-8">
            The Ultimate <span className="text-indigo-600">Dynamic</span> <br /> vCard QR Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Create professional, dynamic business cards that you can update anytime. Track scans, manage campaigns, and grow your network instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
              Create Your Free vCard <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link href="/p/demo" className="w-full sm:w-auto border border-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition">
              View Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                <BoltIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Dynamic Updates</h3>
              <p className="text-gray-600">Changed your phone number? Update your vCard instantly without re-printing your QR code.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                <ChartBarIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Analytics</h3>
              <p className="text-gray-600">Track how many people are scanning your card. See scan locations, dates, and device types.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-green-600">
                <UserPlusIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">One-Click Save</h3>
              <p className="text-gray-600">Optimized vCard format ensures your contact details are saved directly to their phone with one click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-indigo-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to upgrade your networking game?</h2>
            <p className="text-indigo-100 mb-10 text-lg">Join 10,000+ professionals using dynamic QR codes.</p>
            <Link href="/login" className="bg-white text-indigo-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition shadow-xl">
              Get Started For Free
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
