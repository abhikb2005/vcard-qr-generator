const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

/**
 * POOL GENERATOR
 * Generates hundreds of draft pSEO pages based on professions and cities.
 * This populates the "Pending" pool for the Autopilot to publish slowly.
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const professions = [
    'Dentist', 'Lawyer', 'Accountant', 'Roofer', 'Painter',
    'Tutor', 'Plumber', 'Electrician', 'Carpenter', 'Mechanic',
    'Barber', 'Esthetician', 'Massage Therapist', 'Physiotherapist'
];

const cities = [
    'London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool',
    'Toronto', 'Vancouver', 'Montreal', 'Sydney', 'Melbourne',
    'Brisbane', 'Perth', 'Auckland', 'Dublin'
];

async function populatePool() {
    console.log('Generating Draft Pool...');
    let count = 0;

    for (const prof of professions) {
        for (const city of cities) {
            const slug = `${prof.toLowerCase()}-${city.toLowerCase()}`.replace(/\s+/g, '-');

            const pageData = {
                slug,
                category: 'industries',
                title: `QR Code Generator for ${prof}s in ${city} | Free vCard`,
                h1: `Digital Business Cards for ${prof}s in ${city}`,
                description: `Create a professional dynamic vCard QR code for your ${prof} business in ${city}. No printing required.`,
                profession: prof,
                city: city,
                is_published: false, // KEPT AS DRAFT
                content: {
                    faqs: [
                        {
                            question: `Why do ${prof}s in ${city} need QR codes?`,
                            answer: `Contactless sharing is the new standard in ${city}. A vCard QR code ensures clients can save your details instantly.`
                        }
                    ]
                },
                keywords: [prof, city, 'qr code', 'vcard']
            };

            const { error } = await supabase.from('seo_pages').upsert(pageData, { onConflict: 'slug' });
            if (!error) {
                count++;
            } else if (error.code !== '23505') { // Skip duplicates silently
                console.error(`Error with ${slug}:`, error.message);
            }
        }
    }

    console.log(`Pool expansion complete. Added/Updated ${count} draft pages.`);
}

populatePool();
