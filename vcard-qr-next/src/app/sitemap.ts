import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await createClient()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.vcardqrcodegenerator.com'

    // Fetch only published SEO pages
    const { data: pages } = await supabase
        .from('seo_pages')
        .select('slug, updated_at, category')
        .eq('is_published', true)

    const seoEntries = (pages || []).map((page) => ({
        url: `${baseUrl}/${page.category === 'alternatives' ? 'comparison' : 'guides'}/${page.slug}`,
        lastModified: new Date(page.updated_at),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }))

    // Static Pages
    const staticEntries = [
        '',
        '/login',
        '/dashboard',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 1.0,
    }))

    return [...staticEntries, ...seoEntries]
}
