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

      {/* Trust Bar / Industry Use Cases */}
      <section className="bg-gray-50 border-y border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-bold text-indigo-600 uppercase tracking-widest mb-12">
            Trusted by Professionals in Every Industry
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200/50 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-6">🏠</div>
              <h3 className="font-bold text-xl mb-3">For Realtors</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Place on "For Sale" signs. Capture buyer leads instantly instead of losing them to voicemail.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200/50 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-6">🤝</div>
              <h3 className="font-bold text-xl mb-3">For Sales Teams</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Ditch paper cards. Seamless contact exchange at conferences builds your pipeline faster.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200/50 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-6">🩺</div>
              <h3 className="font-bold text-xl mb-3">For Doctors</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Let patients save clinic details and appointment booking links in one tap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
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

      {/* How It Works */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-16">How It Works — In 3 Simple Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="flex flex-col items-center">
              <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6">1</div>
              <h3 className="text-xl font-bold mb-4">Enter Details</h3>
              <p className="text-indigo-100 opacity-80 decoration-none">Fill in your contact information: name, phone, email, company, and job title.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6">2</div>
              <h3 className="text-xl font-bold mb-4">Generate QR Code</h3>
              <p className="text-indigo-100 opacity-80 decoration-none">Click generate and instantly create your professional vCard QR code.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6">3</div>
              <h3 className="text-xl font-bold mb-4">Share & Network</h3>
              <p className="text-indigo-100 opacity-80 decoration-none">Add it to your business cards or share digitally via email or social media.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-16 text-center">Frequently Asked Questions</h2>
          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-bold mb-4">Are vCard QR codes really free?</h3>
              <p className="text-gray-600">Yes! Static vCard QR codes are free forever. We also offer premium dynamic features and logo customization for a one-time fee.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Do I need an app to scan the QR code?</h3>
              <p className="text-gray-600">No. Most modern smartphones (iOS and Android) can scan QR codes using their built-in camera app.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Can I edit my vCard after generating the code?</h3>
              <p className="text-gray-600">With our dynamic vCard generator, you can update your details anytime without changing the QR code itself.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-indigo-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-indigo-600 rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to upgrade your networking game?</h2>
            <p className="text-indigo-100 mb-10 text-lg">Join 10,000+ professionals using dynamic QR codes.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login" className="w-full sm:w-auto bg-white text-indigo-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition shadow-xl">
                Get Started For Free
              </Link>
              <Link href="/p/demo" className="w-full sm:w-auto border border-white/30 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition">
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
