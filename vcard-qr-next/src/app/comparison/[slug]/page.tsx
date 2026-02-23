import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPageBySlug } from '@/data/dummy';
import { constructMetadata } from '@/lib/seo/metadata';
import ComparisonPage from '@/templates/ComparisonPage';

type Props = {
    params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const page = await getPageBySlug(slug);

    if (!page) {
        return {
            title: 'Page Not Found',
        };
    }

    return constructMetadata({ page });
}


export default async function Page({ params }: Props) {
    const { slug } = await params;
    const page = await getPageBySlug(slug);

    if (!page) {
        notFound();
    }

    return <ComparisonPage page={page} />;
}
