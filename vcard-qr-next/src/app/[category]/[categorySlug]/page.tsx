import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPageBySlug, getAllSlugs } from '@/data/dummy'; // Adjusted import path
import { constructMetadata } from '@/lib/seo/metadata';
import ComparisonPage from '@/templates/ComparisonPage';

// Define params type for Next.js 15 (which create-next-app likely installed)
// Next.js 15 types params as a Promise
type Props = {
    params: Promise<{ category: string; categorySlug: string }>;
};

// 1. Generate Metadata dynamically
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category, categorySlug } = await params;
    const page = await getPageBySlug(categorySlug);

    if (!page || page.category !== category) {
        return {
            title: 'Page Not Found',
        };
    }

    return constructMetadata({ page });
}


// 2. Main Page Component
export default async function Page({ params }: Props) {
    const { category, categorySlug } = await params;
    const page = await getPageBySlug(categorySlug);

    if (!page || page.category !== category) {
        notFound();
    }

    // Choose template based on intent or category here if needed
    // For now, default to ComparisonPage
    return <ComparisonPage page={page} />;
}


// 3. Static Generation (Optional but recommended for pSEO)
export async function generateStaticParams() {
    const pages = await getAllSlugs();
    return pages.map((page) => ({
        category: page.category,
        categorySlug: page.slug,
    }));
}
