import { createClient } from '@/utils/supabase/server'

const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY
const DODO_BASE_URL = 'https://live.dodopayments.com' // Using live mode as test mode was inconsistent

export const DodoPayments = {
    async createCheckoutSession({
        productId,
        email,
        name,
        userId,
        redirectUrl
    }: {
        productId: string;
        email: string;
        name?: string;
        userId: string;
        redirectUrl: string;
    }) {
        if (!DODO_API_KEY) throw new Error('Missing DODO_PAYMENTS_API_KEY')

        const response = await fetch(`${DODO_BASE_URL}/checkouts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DODO_API_KEY}`
            },
            body: JSON.stringify({
                product_cart: [{
                    product_id: productId,
                    quantity: 1
                }],
                customer: {
                    email,
                    name: name || email.split('@')[0]
                },
                metadata: { user_id: userId },
                return_url: redirectUrl
            })
        })

        if (!response.ok) {
            const err = await response.text()
            throw new Error(`Dodo API Error: ${err}`)
        }

        const data = await response.json()
        // The API returns { checkout_url, checkout_id, ... }
        return data
    },

    async getCheckoutSessionStatus(sessionId: string) {
        if (!DODO_API_KEY) throw new Error('Missing DODO_PAYMENTS_API_KEY')

        const response = await fetch(`${DODO_BASE_URL}/checkouts/${sessionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${DODO_API_KEY}`
            }
        })

        if (!response.ok) {
            const err = await response.text()
            throw new Error(`Dodo API Error: ${err}`)
        }

        return response.json()
    },

    async getPayment(paymentId: string) {
        if (!DODO_API_KEY) throw new Error('Missing DODO_PAYMENTS_API_KEY')

        const response = await fetch(`${DODO_BASE_URL}/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${DODO_API_KEY}`
            }
        })

        if (!response.ok) {
            const err = await response.text()
            throw new Error(`Dodo API Error: ${err}`)
        }

        return response.json()
    }
}
