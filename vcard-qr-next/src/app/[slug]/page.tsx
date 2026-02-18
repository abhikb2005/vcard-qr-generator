import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle, ShieldCheck, Zap } from "lucide-react";
import keywords from "../../../data/keywords.json";

// Type for the data structure
type KeywordData = {
    job: string;
    city: string;
    slug: string;
    searchVolume: string;
    intent: string;
};

// Generate static params for SSG
export async function generateStaticParams() {
    return keywords.map((keyword) => ({
        slug: keyword.slug,
    }));
}

// Generate dynamic metadata
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const data = keywords.find((k) => k.slug === slug);

    if (!data) return {};

    return {
        title: `QR Code Generator for ${data.job}s in ${data.city} | Create Free vCard`,
        description: `The best free QR Code Generator for ${data.job}s in ${data.city}. Create professional vCards, share contact info instantly, and grow your network in ${data.city}.`,
    };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const data = keywords.find((k) => k.slug === slug);

    if (!data) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <Link href="/" className="flex items-center">
                            <span className="text-xl font-bold text-indigo-600">vCard QR Generator</span>
                        </Link>
                        <div className="hidden md:flex space-x-8">
                            <Link href="https://www.vcardqrcodegenerator.com/#features" className="text-gray-500 hover:text-gray-900">Features</Link>
                            <Link href="https://www.vcardqrcodegenerator.com/bulk-qr-code.html" className="text-gray-500 hover:text-gray-900">Bulk Generator</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="bg-indigo-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 text-center">
                    <span className="inline-block bg-indigo-800 text-indigo-200 text-sm font-semibold px-3 py-1 rounded-full mb-6 border border-indigo-700">
                        For {data.job}s in {data.city}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                        The #1 QR Code Tool for <br />
                        <span className="text-indigo-300">{data.job}s in {data.city}</span>
                    </h1>
                    <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-10">
                        Stand out in the competitive {data.city} market. Create a professional digital business card that clients can scan and save instantly.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            href="https://www.vcardqrcodegenerator.com/"
                            className="bg-white text-indigo-900 font-bold py-4 px-8 rounded-lg hover:bg-indigo-50 transition flex items-center justify-center gap-2"
                        >
                            <Zap className="w-5 h-5" />
                            Create Free QR Code
                        </Link>
                        <Link
                            href="https://www.vcardqrcodegenerator.com/bulk-qr-code.html"
                            className="bg-indigo-800 text-white font-semibold py-4 px-8 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 border border-indigo-700"
                        >
                            Generate for Your Team
                        </Link>
                    </div>
                    <p className="mt-6 text-sm text-indigo-300">No credit card required • Instant download</p>
                </div>
            </div>

            {/* Why Section */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">Why {data.job}s in {data.city} Choose Us</h2>
                        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
                            In a fast-paced city like {data.city}, networking efficiency is everything. Stop losing leads with paper cards.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-6">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Instant Contact Saving</h3>
                            <p className="text-gray-600">
                                Clients in {data.city} are busy. Let them save your number, email, and website to their phone contacts with a single scan.
                            </p>
                        </div>
                        <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Professional & Trustworthy</h3>
                            <p className="text-gray-600">
                                Showcase your professionalism as a top {data.job}. Generic Codes look cheap; ours reflect your brand quality.
                            </p>
                        </div>
                        <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-6">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Trackable Results</h3>
                            <p className="text-gray-600">
                                Know exactly how many people in {data.city} are scanning your card. Use data to optimize your networking strategy.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Localized FAQ */}
            <div className="py-20 bg-gray-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h3 className="font-bold text-lg mb-2">How can a {data.job} use this in {data.city}?</h3>
                            <p className="text-gray-600">
                                Simply generate your code and add it to your business cards, email signature, or flyers. When potential clients in {data.city} scan it, your contact details (vCard) instantly pop up on their phone.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Is it really free for {data.job}s?</h3>
                            <p className="text-gray-600">
                                Yes! Our standard QR code generator is 100% free. Create as many static codes as you need for your business in {data.city}.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Can I create codes for my whole {data.city} team?</h3>
                            <p className="text-gray-600">
                                Absolutely. Use our <Link href="https://www.vcardqrcodegenerator.com/bulk-qr-code.html" className="text-indigo-600 hover:underline">Bulk Generator</Link> to create hundreds of unique vCard QR codes at once from an Excel file.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Final CTA */}
            <div className="py-20 bg-white border-t border-gray-100">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to upgrade your networking in {data.city}?</h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Join thousands of successful {data.job}s who use our tool to connect faster.
                    </p>
                    <Link
                        href="https://www.vcardqrcodegenerator.com/"
                        className="inline-flex items-center justify-center bg-indigo-600 text-white font-bold py-4 px-10 rounded-full hover:bg-indigo-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        Create My Free QR Code <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
