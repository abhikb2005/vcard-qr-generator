const fs = require('fs');
const path = require('path');

// 1. Read API Key manually from .env.local
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

if (!API_KEY) {
    console.error('Error: DODO_PAYMENTS_API_KEY not found in .env.local');
    process.exit(1);
}

const BASE_URL = 'https://live.dodopayments.com';

const PRODUCTS = [
    { name: 'Starter Plan', description: '5 Dynamic QR Codes per month', price: 500 }, // $5.00
    { name: 'Growth Plan', description: '50 Dynamic QR Codes per month', price: 900 }, // $9.00
    { name: 'Business Plan', description: 'Unlimited Dynamic QR Codes per month', price: 1900 } // $19.00
];

async function createProduct(product) {
    console.log(`Creating product: ${product.name}...`);
    try {
        const payload = {
            name: product.name,
            description: product.description,
            tax_category: 'saas',
            price: {
                type: 'recurring_price',
                price: product.price,
                currency: 'USD',
                discount: 0,
                purchasing_power_parity: false,
                payment_frequency_count: 1,
                payment_frequency_interval: 'Month',
                subscription_period_count: 1,
                subscription_period_interval: 'Month',
                tax_inclusive: false,
                trial_period_days: 0
            }
        };

        const res = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        console.log(`Status: ${res.status} ${res.statusText}`);

        if (!res.ok) {
            console.error(`Response Body: ${text}`);
            throw new Error(`API Error: ${text}`);
        }

        const json = JSON.parse(text);
        return json.product_id || json.id;
    } catch (e) {
        console.error(`Failed to create ${product.name}:`, e.message);
        return null;
    }
}

async function main() {
    const starterId = await createProduct(PRODUCTS[0]);
    const growthId = await createProduct(PRODUCTS[1]);
    const businessId = await createProduct(PRODUCTS[2]);

    console.log('Returned IDs:', { starterId, growthId, businessId });

    if (starterId && growthId && businessId) {
        const envContent = `\n# Dodo Products (Auto-Generated)\nDODO_PRODUCT_ID_STARTER=${starterId}\nDODO_PRODUCT_ID_GROWTH=${growthId}\nDODO_PRODUCT_ID_BUSINESS=${businessId}\n`;

        fs.appendFileSync(envPath, envContent);
        console.log('Successfully updated .env.local with new Product IDs!');
    } else {
        console.error('Failed to create all products. Check logs.');
    }
}

main();
