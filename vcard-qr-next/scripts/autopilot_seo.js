const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

/**
 * AUTOPILOT SEO SCRIPT
 * 1. Finds unpublished pages in Supabase.
 * 2. Picks a random number (1-9).
 * 3. Marks them as published.
 * 4. Pings sitemap (or Google Indexing API if configured).
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for bypass RLS
);

async function runAutopilot() {
    console.log('--- SEO Autopilot Start ---');

    // 1. Decide how many to publish today (1-9)
    const countToPublish = Math.floor(Math.random() * 9) + 1;
    console.log(`Target: Publishing ${countToPublish} new pages.`);

    // 2. Fetch unpublished pages (fetch more than needed to shuffle)
    const { data: candidates, error: fetchError } = await supabase
        .from('seo_pages')
        .select('id, slug, title')
        .eq('is_published', false)
        .limit(50); // Fetch a pool to shuffle from

    if (fetchError) {
        console.error('Error fetching unpublished pages:', fetchError.message);
        return;
    }

    if (!candidates || candidates.length === 0) {
        console.log('No unpublished pages found. Pool is empty.');
        return;
    }

    // Shuffle and pick
    const shuffled = candidates.sort(() => 0.5 - Math.random());
    const unpublished = shuffled.slice(0, countToPublish);

    console.log(`Picked ${unpublished.length} random pages from a pool of ${candidates.length}.`);

    // 3. Mark as published
    const ids = unpublished.map(p => p.id);
    const { error: updateError } = await supabase
        .from('seo_pages')
        .update({
            is_published: true,
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .in('id', ids);

    if (updateError) {
        console.error('Error updating status:', updateError.message);
        return;
    }

    console.log('Successfully published:');
    unpublished.forEach(p => console.log(` - ${p.slug} (${p.title})`));

    // 4. Submit to Google (Sitemap Ping)
    // Note: Google deprecated the explicit /ping URL in 2024, 
    // but the best way now is to ensure your sitemap is dynamic and valid.
    // Some people still use the Indexing API for URL_UPDATED.

    const sitemapUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/sitemap.xml`;
    console.log(`Sitemap: ${sitemapUrl} will now include these pages.`);

    // Optional: Indexing API call here if they have credentials.json

    console.log('--- SEO Autopilot Complete ---');
}

runAutopilot();
