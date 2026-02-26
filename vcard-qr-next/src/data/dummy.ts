import { PSEOPage } from '@/types';
import { createClient } from '@/utils/supabase/server';

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
        slug: 'chiropractor-los-angeles',
        category: 'industries',
        intent: 'informational',
        title: 'QR Code Generator for Chiropractors in Los Angeles | Create Free vCard',
        h1: 'The #1 QR Code Tool for Chiropractors in Los Angeles',
        description: 'The best free QR Code Generator for Chiropractors in Los Angeles. Create professional vCards and share contact info instantly.',
        keywords: ['chiropractor', 'los angeles', 'qr code'],
        faqs: [
            {
                question: 'How can a Chiropractor use this in Los Angeles?',
                answer: 'Simply generate your code and add it to your business cards or flyers. When potential clients in Los Angeles scan it, your contact details (vCard) instantly pop up on their phone.'
            }
        ],
        relatedSlugs: [],
        lastModified: new Date().toISOString()
    },
    {
        slug: 'real-estate-agent-new-york',
        category: 'industries',
        intent: 'informational',
        title: 'QR Code Generator for Real Estate Agents in New York | Create Free vCard',
        h1: 'The #1 QR Code Tool for Real Estate Agents in New York',
        description: 'The best free QR Code Generator for Real Estate Agents in New York. Create professional vCards and share contact info instantly.',
        keywords: ['real estate', 'new york', 'qr code'],
        faqs: [
            {
                question: 'How can a Real Estate Agent use this in New York?',
                answer: 'Simply generate your code and add it to your listings or business cards.'
            }
        ],
        relatedSlugs: [],
        lastModified: new Date().toISOString()
    }
];

export async function getPageBySlug(slug: string): Promise<PSEOPage | undefined> {
    try {
        const supabase = await createClient();
        const { data: page, error } = await supabase
            .from('seo_pages')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .single();

        if (page && !error) {
            return {
                slug: page.slug,
                category: page.category,
                intent: 'informational',
                title: page.title,
                h1: page.h1,
                description: page.description,
                keywords: page.keywords || [],
                faqs: page.content?.faqs || [],
                relatedSlugs: [],
                lastModified: page.updated_at
            };
        }
    } catch (e) {
        console.error('DB fetch failed, falling back to dummy data', e);
    }

    // NO FALLBACK TO DUMMY DATA FOR PUBLIC PAGES
    // This ensures only published DB pages resolve, preventing "shadowing"
    return undefined;
}

export async function getAllSlugs() {
    return dummyPages.map(p => ({ category: p.category, slug: p.slug }));
}

export async function getRelatedSlugs(limit: number = 20): Promise<string[]> {
    try {
        const supabase = await createClient();
        const { data: pages } = await supabase
            .from('seo_pages')
            .select('slug')
            .limit(limit);

        if (pages) {
            return pages.map(p => p.slug);
        }
    } catch (e) {
        console.error('Failed to fetch related slugs', e);
    }
    return dummyPages.map(p => p.slug);
}

export async function getQRCodeByShortCode(shortCode: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('short_code', shortCode)
        .single();

    if (error) return null;
    return data;
}
