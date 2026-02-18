import { PSEOPage } from '@/types';

export const dummyPages: PSEOPage[] = [
    {
        slug: 'hovercode-alternative',
        category: 'alternatives',
        intent: 'transactional',
        title: 'Best Hovercode Alternative for 2024 (Free & Dynamic)',
        h1: 'Why We Are The Best Hovercode Alternative',
        description: 'Looking for a Hovercode alternative? Our free dynamic QR generator offers better analytics, unlimited scans, and custom designs without the monthly fee.',
        keywords: ['hovercode alternative', 'free dynamic qr code', 'best qr generator'],
        faqs: [
            {
                question: 'Is this really free?',
                answer: 'Yes, unlike Hovercode, our core dynamic QR features are free forever.'
            },
            {
                question: 'Can I track scans?',
                answer: 'Absolutely. We provide detailed analytics on scan location, device, and time.'
            }
        ],
        relatedSlugs: ['bitly-alternative', 'qr-monkey-alternative'],
        lastModified: new Date().toISOString()
    },
    {
        slug: 'real-estate-qr-codes',
        category: 'industries',
        intent: 'informational',
        title: 'QR Codes for Real Estate: The Ultimate Guide',
        h1: 'How Realtors Are Using QR Codes to Sell More Homes',
        description: 'Learn how customized QR codes on "For Sale" signs can boost lead generation by 40%. Full guide for real estate agents.',
        keywords: ['real estate qr codes', 'realtor marketing', 'qr code for sale sign'],
        faqs: [
            {
                question: 'Where should I put the QR code?',
                answer: 'Place it prominently on your yard sign, open house flyers, and business cards.'
            }
        ],
        relatedSlugs: ['restaurant-qr-codes', 'retail-qr-codes'],
        lastModified: new Date().toISOString()
    }
];

export async function getPageBySlug(slug: string): Promise<PSEOPage | undefined> {
    // Simulate DB call
    return dummyPages.find(p => p.slug === slug);
}

export async function getAllSlugs() {
    return dummyPages.map(p => ({ category: p.category, slug: p.slug }));
}
