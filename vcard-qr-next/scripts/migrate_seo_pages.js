const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const pDir = path.join(__dirname, '../../p');

async function migrate() {
    const RESERVED_SLUGS = ['index', '404', 'admin', 'dashboard', 'login'];
    const files = fs.readdirSync(pDir).filter(f => f.endsWith('.txt') && !f.startsWith('__next'));

    console.log(`Found ${files.length} static pages to migrate.`);

    for (const file of files) {
        const slug = file.replace('.txt', '');

        if (RESERVED_SLUGS.includes(slug)) {
            console.log(`Skipping reserved slug: ${slug}`);
            continue;
        }

        // Simple heuristic to extract profession and city
        // Slugs are usually like 'chiropractor-los-angeles'
        const parts = slug.split('-');
        let profession = '';
        let city = '';

        // This is a rough split, can be refined based on data
        if (parts.length >= 3) {
            profession = parts.slice(0, -2).join(' ');
            city = parts.slice(-2).join(' ');
        } else if (parts.length === 2) {
            profession = parts[0];
            city = parts[1];
        }

        const title = `QR Code Generator for ${profession}s in ${city} | Create Free vCard`;
        const description = `The best free QR Code Generator for ${profession}s in ${city}. Create professional vCards, share contact info instantly, and grow your network in ${city}.`;

        const pageData = {
            slug,
            category: 'industries',
            title,
            h1: `The #1 QR Code Tool for ${profession}s in ${city}`,
            description,
            profession,
            city,
            content: {
                faqs: [
                    {
                        question: `How can a ${profession} use this in ${city}?`,
                        answer: `Simply generate your code and add it to your business cards, email signature, or flyers. When potential clients in ${city} scan it, your contact details (vCard) instantly pop up on their phone.`
                    }
                ]
            },
            keywords: [profession, city, 'qr code', 'vcard'],
            is_published: true, // Default to true for historical migration
            published_at: new Date().toISOString()
        };

        // Guardrail: Validate minimum fields
        if (!pageData.title || !pageData.h1 || !pageData.description) {
            console.error(`Skipping ${slug}: Missing title, h1, or description.`);
            continue;
        }

        console.log(`Migrating: ${slug}...`);
        const { error } = await supabase.from('seo_pages').upsert(pageData);
        if (error) console.error(`Error migrating ${slug}:`, error.message);
    }

    console.log('Migration complete!');
}

migrate();
