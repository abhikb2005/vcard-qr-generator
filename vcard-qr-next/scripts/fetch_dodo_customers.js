const DODO_API_KEY = "uh0GPS61F0WxXWW4.3IMeq1vMPokEivVedy013O1LtXW3fNE-XSiDkXaNTDL0fBgN".trim();
const DODO_BASE_URL = 'https://live.dodopayments.com';

async function fetchAll(endpoint) {
    let allItems = [];
    let pageNumber = 1;
    const pageSize = 100;

    while (true) {
        console.log(`Fetching page ${pageNumber} of ${endpoint}...`);
        const response = await fetch(`${DODO_BASE_URL}/${endpoint}?page_size=${pageSize}&page_number=${pageNumber}`, {
            headers: {
                'Authorization': `Bearer ${DODO_API_KEY}`
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Dodo API Error: ${err}`);
        }

        const data = await response.json();
        console.log("Data sample:", JSON.stringify(data.items?.[0] || data?.[0] || data, null, 2));
        const items = data.items || data || [];

        if (items.length === 0) break;

        allItems = allItems.concat(items);
        if (items.length < pageSize) break;
        pageNumber++;
    }

    return allItems;
}

async function main() {
    try {
        console.log("Fetching payments...");
        const payments = await fetchAll('payments');

        console.log("\n--- ALL PAYMENTS ---");
        payments.forEach(p => console.log(JSON.stringify(p, null, 2)));

        console.log(`\nSummary: ${payments.length} payments.`);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

main();
