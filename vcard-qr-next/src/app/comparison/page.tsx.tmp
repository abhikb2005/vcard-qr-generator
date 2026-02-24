import { PSEOPage } from '@/types';
import Link from 'next/link';

interface ComparisonPageProps {
    page: PSEOPage;
}

export default function ComparisonPage({ page }: ComparisonPageProps) {
    const { h1, description, faqs, relatedSlugs, category } = page;

    return (
        <main className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Hero Section */}
            <section className="mb-12">
                <h1 className="text-4xl font-bold mb-4 text-gray-900">{h1}</h1>
                <p className="text-xl text-gray-600 mb-8">{description}</p>
                <div className="flex gap-4">
                    <Link href="/generator" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                        Create Free QR Code
                    </Link>
                    <Link href="#comparison" className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition">
                        Compare Features
                    </Link>
                </div>
            </section>

            {/* Main Content Area (Dynamic based on data) */}
            <article className="prose lg:prose-xl mb-12">
                {/* Placeholder for future detailed content/comparison tables */}
                <div id="comparison" className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <h2 className="text-2xl font-bold mb-4">Detailed Comparison</h2>
                    <p className="text-gray-600">
                        This section would contain the detailed comparison data, features table, and pros/cons lists generated from the database.
                    </p>
                </div>
            </article>

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
