import { Metadata } from 'next';
import { PSEOPage } from '@/types';

interface MetadataOptions {
    page: PSEOPage;
    pathPrefix?: string;
}

export function constructMetadata({ page, pathPrefix = 'guides' }: MetadataOptions): Metadata {
    const { title, description, slug, lastModified } = page;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vcard-qr-next.vercel.app';
    const siteName = 'vCard QR Code Generator';
    const fullPath = `/${pathPrefix}/${slug}`;

    return {
        title: {
            default: title,
            template: `%s | ${siteName}`,
        },
        description: description,
        openGraph: {
            title: title,
            description: description,
            url: `${baseUrl}${fullPath}`,
            siteName: siteName,
            images: [
                {
                    url: `/api/og?title=${encodeURIComponent(title)}`,
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
        },
        alternates: {
            canonical: fullPath,
        },
        other: {
            'last-modified': lastModified,
        },
    };
}
