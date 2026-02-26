import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPageBySlug, getRelatedSlugs } from '@/data/dummy';
import { constructMetadata } from '@/lib/seo/metadata';
import SEOPage from '@/components/SEOPage';

type Props = {
    params: Promise<{ id: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const page = await getPageBySlug(id);

    if (!page) {
        return {
            title: 'Professional QR Codes',
        };
    }

    return constructMetadata({ page, pathPrefix: 'guides' });
}


export default async function Page({ params }: Props) {
    const { id } = await params;
    const page = await getPageBySlug(id);

    if (!page) {
        notFound();
    }

    // Enrich with related slugs for internal linking
    page.relatedSlugs = await getRelatedSlugs(30);

    return <SEOPage page={page} />;
}
