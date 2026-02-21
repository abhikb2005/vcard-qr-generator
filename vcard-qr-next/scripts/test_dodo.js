const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
let API_KEY = null;

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DODO_PAYMENTS_API_KEY=(.*)/);
    if (match && match[1]) {
        API_KEY = match[1].trim();
    }
} catch (e) {
    console.error('Could not read .env.local');
    process.exit(1);
}

const BASE_URL = 'https://live.dodopayments.com';

async function tryPayload(label, payload) {
    console.log(`\n--- Testing: ${label} ---`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
        const res = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log(`Full Response: ${text}`);

        if (res.ok) {
            console.log('SUCCESS!');
            return JSON.parse(text);
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
    return null;
}

async function main() {
    // 1. One Time Price CORRECT STRUCTURE
    await tryPayload('One Time Price (Correct)', {
        name: 'Test OT Correct',
        description: 'Testing Payload with price object',
        price: {
            type: "one_time_price",
            price: 500,
            currency: 'USD',
            discount: 0,
            purchasing_power_parity: false,
            pay_what_you_want: false,
            tax_inclusive: false
        },
        tax_category: 'saas'
    });

    // 2. Recurring Price CORRECT STRUCTURE (Monthly)
    await tryPayload('Recurring Price (Correct Monthly)', {
        name: 'Test Recurring Correct',
        description: 'Testing Payload with price object',
        price: {
            type: "recurring_price",
            price: 500,
            currency: 'USD',
            discount: 0,
            purchasing_power_parity: false,
            payment_frequency_count: 1,
            payment_frequency_interval: "Month",
            subscription_period_count: 1,
            subscription_period_interval: "Month",
            tax_inclusive: false,
            trial_period_days: 0
        },
        tax_category: 'saas'
    });
}

main();
