import { PSEOPage } from '@/types';
import Link from 'next/link';
import Navbar from './Navbar';
import Footer from './Footer';
import {
    CheckCircleIcon,
    ArrowRightIcon,
    BookOpenIcon,
    CalendarIcon,
    Bars3CenterLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function SEOPage({ page }: { page: PSEOPage }) {
    const { title, h1, description, faqs, relatedSlugs, slug, lastModified } = page;

    // 1. Structured Data (JSON-LD)
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": h1,
        "description": description,
        "author": {
            "@type": "Organization",
            "name": "vCard QR Pro Editorial"
        },
        "publisher": {
            "@type": "Organization",
            "name": "vCard QR Code Generator",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.vcardqrcodegenerator.com/logo.png"
            }
        },
        "dateModified": lastModified || new Date().toISOString(),
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://app.vcardqrcodegenerator.com/guides/${slug}`
        }
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(f => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f.answer
            }
        }))
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            {faqs.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />
            )}
            <Navbar />

            {/* 1. BLOG-STYLE HERO / HEADER */}
            <header className="bg-white border-b border-gray-100 py-12 sm:py-20">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium">
                        <Link href="/" className="hover:text-indigo-600 transition">Home</Link>
                        <ChevronRightIcon className="w-3 h-3" />
                        <span className="text-indigo-600">Expert Guides</span>
                    </nav>

                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
                        {h1}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-t border-gray-100 pt-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                                VQ
                            </div>
                            <span className="font-bold text-gray-900 uppercase tracking-tight">vCard QR Pro Editorial</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            <span>Updated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[10px] uppercase tracking-widest">
                            Official Expert Guide
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. MAIN CONTENT AREA (Single Column focused on Readability) */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                    {/* Main Article Column */}
                    <div className="lg:col-span-8">
                        <article className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100">
                            {/* Intro */}
                            <p className="text-xl text-gray-600 leading-relaxed mb-10 italic border-l-4 border-indigo-500 pl-6">
                                {description}
                            </p>

                            {/* Section 1: Core Value */}
                            <div className="space-y-8">
                                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">The Modern Standard for Business Connections</h2>
                                <p className="text-gray-600 leading-relaxed text-lg font-medium">
                                    In today&apos;s digital-first economy, the traditional paper business card has become a bottleneck. By leveraging a dynamic vCard QR code, you bridge the gap between physical encounters and digital databases instantly.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-10">
                                    {[
                                        "Instant Contact Saving",
                                        "Real-time Scan Analytics",
                                        "Update Info Remotely",
                                        "No Re-printing Required",
                                        "Cross-Platform Compatibility",
                                        "Privacy-First Encryption"
                                    ].map((feature, i) => (
                                        <div key={feature} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                                            <CheckCircleIcon className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                                            <span className="font-bold text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section 2: Comparison (Blog Style Cards) */}
                            {/* Section 2: Comparison (Blog Style Cards) */}
                            <div className="mt-16 pt-16 border-t border-gray-100">
                                <h2 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Standard vs. Pro Digital Cards</h2>
                                <div className="space-y-4">
                                    {[
                                        { label: "Logo & Branding", old: "Generic Black & White", new: "Custom Colors & Logo" },
                                        { label: "Contact Management", old: "Static Info", new: "Dynamic & Updatable" },
                                        { label: "Networking Impact", old: "Easily Forgotten", new: "Professional & Memorable" }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-indigo-100 transition group">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-400 line-through font-medium">{item.old}</span>
                                                    <ChevronRightIcon className="w-4 h-4 text-gray-300" />
                                                    <span className="text-lg font-bold text-indigo-600">{item.new}</span>
                                                </div>
                                            </div>
                                            <ChevronRightIcon className="w-5 h-5 text-gray-200 group-hover:text-indigo-400 transition" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section: Quality Gate - City & Job Context */}
                            <div className="mt-16 pt-16 border-t border-gray-100 space-y-12">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-6">Business Networking in Your Local City</h2>
                                    <p className="text-gray-600 leading-relaxed text-lg pb-4">
                                        Success in professional networking often comes down to friction—how easy you make it for others to remember and contact you. In busy urban markets, carrying a stack of paper cards is no longer enough.
                                    </p>
                                    <div className="p-8 rounded-2xl bg-indigo-50 border border-indigo-100">
                                        <h3 className="text-xl font-bold text-indigo-900 mb-4">Why Digital Cards Win Locally</h3>
                                        <ul className="space-y-4">
                                            <li className="flex items-start gap-3">
                                                <CheckCircleIcon className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                                                <span className="text-indigo-800"><strong>Instant Follow-up:</strong> No one likes manual data entry. One scan saves your info directly to their phonebook.</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircleIcon className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                                                <span className="text-indigo-800"><strong>Eco-Friendly:</strong> Reduce paper waste while maintaining a high-tech image.</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircleIcon className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                                                <span className="text-indigo-800"><strong>Always Ready:</strong> Your phone is always with you; you never "run out" of business cards.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-6">Top 3 Use Cases for Professionals</h2>
                                    <div className="grid grid-cols-1 gap-6">
                                        {[
                                            {
                                                title: "Real Estate & Field Sales",
                                                desc: "Add your QR code to lawn signs, flyers, or window displays. Potential clients can save your contact details and viewing times without having to type a thing."
                                            },
                                            {
                                                title: "Conferences & Networking Events",
                                                desc: "Wear your QR code on your badge or set it as your phone's lock screen. It's the ultimate icebreaker and ensures your follow-up rate remains near 100%."
                                            },
                                            {
                                                title: "Professional Services & Consulting",
                                                desc: "Embed your vCard QR code in your email signature and pitch decks. It provides a tactile, interactive way for stakeholders to 'own' your contact information."
                                            }
                                        ].map((useCase, i) => (
                                            <div key={i} className="p-8 border border-gray-100 rounded-2xl bg-white shadow-sm">
                                                <span className="text-indigo-600 font-black text-sm uppercase tracking-widest mb-2 block">Use Case 0{i + 1}</span>
                                                <h4 className="text-xl font-bold text-gray-900 mb-2">{useCase.title}</h4>
                                                <p className="text-gray-600 leading-relaxed">{useCase.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* FAQ Section */}
                            <div className="mt-16 pt-16 border-t border-gray-100">
                                <h2 className="text-3xl font-bold text-gray-900 mb-10 tracking-tight flex items-center gap-3">
                                    <Bars3CenterLeftIcon className="w-8 h-8 text-indigo-500" /> Expert Q&A
                                </h2>
                                <div className="space-y-6">
                                    {faqs.map((faq, index) => (
                                        <div key={index} className="p-8 rounded-2xl bg-gray-50 border border-gray-100">
                                            <h4 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h4>
                                            <p className="text-gray-600 leading-relaxed font-medium">{faq.answer}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </article>
                    </div>

                    {/* Sidebar / Recommended */}
                    <aside className="lg:col-span-4">
                        <div className="sticky top-24 space-y-8">
                            {/* Recommended Guides */}
                            <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <BookOpenIcon className="w-5 h-5 text-indigo-600" /> More Guides
                                </h4>
                                <div className="space-y-5">
                                    {relatedSlugs.slice(0, 5).map((slug, i) => (
                                        <Link key={slug} href={`/guides/${slug}`} className="block group border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                            <h5 className="font-bold text-gray-800 group-hover:text-indigo-600 transition leading-tight mb-1">
                                                {slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </h5>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                <span>Read Expert Guide</span>
                                                <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* CTA Card */}
                            <div className="p-8 rounded-3xl bg-indigo-600 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                                <h4 className="text-xl font-bold mb-4">Go Dynamic Today</h4>
                                <p className="text-indigo-100 text-sm mb-8 leading-relaxed font-medium">Stop wasting money on re-printing cards. Get your first dynamic vCard QR for free.</p>
                                <Link href="/login" className="block w-full text-center bg-white text-indigo-600 py-4 rounded-xl font-bold hover:bg-gray-50 transition shadow-lg">
                                    Start Now — It&apos;s Free
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
}
