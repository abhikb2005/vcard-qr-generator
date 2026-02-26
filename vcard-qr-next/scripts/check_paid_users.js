const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error("Count Error:", countError.message);
    } else {
        console.log(`\nTotal Profiles (with Anon Key): ${count}`);
    }

    console.log("\nQuerying unique user IDs from QR codes...");
    const { data: userIds, error: userError } = await supabase
        .from('qr_codes')
        .select('user_id');

    if (userError) {
        console.error("User Error:", userError.message);
        return;
    }

    const uniqueIds = Array.from(new Set(userIds.map(u => u.user_id)));
    console.log(`Unique user IDs found in QR codes: ${uniqueIds.length}`);
    uniqueIds.forEach(id => console.log(id));
}

main();
