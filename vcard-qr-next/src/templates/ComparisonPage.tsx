import { PSEOPage } from '@/types';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface ComparisonPageProps {
    page: PSEOPage;
}

export default function ComparisonPage({ page }: ComparisonPageProps) {
    const { h1, description, faqs, relatedSlugs, category } = page;

    return (
        <main className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Section: Comparison Features Table */}
            <article className="mb-16">
                <div id="comparison" className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-3xl font-bold mb-8 text-gray-900 tracking-tight">Standard vCard vs. Pro Digital Experience</h2>
                    <div className="space-y-4">
                        {[
                            { label: "Updates", old: "Fixed on paper", new: "Dynamic & Remote" },
                            { label: "Data", old: "None", new: "Full Analytics" },
                            { label: "Cost", old: "Per printing run", new: "Free/Subscription" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-gray-50 border border-transparent hover:border-indigo-100 transition group">
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
            </article>

            {/* Section: Quality Gate - City & Job Context */}
            <section className="mb-16 space-y-12">
                <div className="bg-indigo-900 text-white rounded-3xl p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <h2 className="text-3xl font-bold mb-6 tracking-tight relative z-10">Business Networking in Your Local Market</h2>
                    <p className="text-indigo-100 leading-relaxed text-lg mb-8 relative z-10">
                        In today&apos;s digital-first economy, the traditional paper business card has become a bottleneck. By leveraging a dynamic vCard QR code, you bridge the gap between physical encounters and digital databases instantly.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                            <h4 className="font-bold text-white mb-2">Instant ROI</h4>
                            <p className="text-sm text-indigo-100">Every scan is a lead captured. No more lost paper cards or manual data entry.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                            <h4 className="font-bold text-white mb-2">Professional Polish</h4>
                            <p className="text-sm text-indigo-100">Stand out with a modern, tech-forward approach that shows you value your clients&apos; time.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: "Real Estate", desc: "Add to yard signs and flyers. Let buyers save your number with one scan." },
                        { title: "Consulting", desc: "Embed in pitch decks and email signatures for instant credibility." },
                        { title: "Events", desc: "The perfect icebreaker at conferences and networking meetups." }
                    ].map((useCase, i) => (
                        <div key={i} className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition">
                            <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold mb-6">0{i + 1}</span>
                            <h4 className="text-xl font-bold text-gray-900 mb-3">{useCase.title}</h4>
                            <p className="text-gray-600 leading-relaxed text-sm">{useCase.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Section (Crucial for Schema & Long-tail) */}
            {faqs && faqs.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <details key={index} className="group border border-gray-200 rounded-lg p-4 open:bg-gray-50">
                                <summary className="font-semibold cursor-pointer list-none flex justify-between items-center text-lg">
                                    {faq.question}
                                    <span className="transform group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="mt-3 text-gray-600 leading-relaxed pl-4 border-l-2 border-blue-500">
                                    {faq.answer}
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
            )}

            {/* Internal Linking (Hub & Spoke) */}
            {relatedSlugs && relatedSlugs.length > 0 && (
                <section className="border-t pt-8">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">Related Comparisons</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {relatedSlugs.map((slug) => (
                            <li key={slug}>
                                <Link href={`/comparison/${slug}`} className="text-blue-600 hover:underline block p-2 hover:bg-blue-50 rounded">
                                    {slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </main>
    );
}
