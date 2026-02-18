import { Metadata } from 'next';
import { PSEOPage } from '@/types';

export function constructMetadata({ page }: { page: PSEOPage }): Metadata {
    const { title, description, slug, category, lastModified } = page;

    // Can add conditional logic or site-wide defaults here
    // e.g., siteName: 'QR Code Generator'

    return {
        title: {
            default: title,
            template: `%s | Dynamic QR Generator`,
        },
        description: description,
        openGraph: {
            title: title,
            description: description,
            url: `https://vcard-qr-generator.com/${category}/${slug}`, // TODO: Update domain later
            siteName: 'Dynamic QR Generator',
            images: [
                {
                    url: `/api/og?title=${encodeURIComponent(title)}`, // Future: Dynamic OG Image generation
                    width: 1200,
                    height: 630,
                },
            ],
            locale: 'en_US',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            // creator: '@yourhandle',
        },
        alternates: {
            canonical: `/${category}/${slug}`,
        },
        other: {
            'last-modified': lastModified,
        },
    };
}
