import { createClient } from '@/utils/supabase/server'
import { DodoPayments } from '@/utils/dodo'
import { NextResponse } from 'next/server'

// Map tiers to Dodo Product IDs (You'll need to create these in Dodo Dashboard)
// For now, we use placeholders or enviroment variables
const PRODUCT_IDS = {
    starter: process.env.DODO_PRODUCT_ID_STARTER?.trim(),
    growth: process.env.DODO_PRODUCT_ID_GROWTH?.trim(),
    business: process.env.DODO_PRODUCT_ID_BUSINESS?.trim()
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tier } = await request.json()
    const productId = PRODUCT_IDS[tier as keyof typeof PRODUCT_IDS]

    if (!productId) {
        return NextResponse.json({ error: `Missing Dodo Product ID configuration for tier: ${tier}` }, { status: 500 })
    }

    try {
        const returnUrl = new URL('/dashboard', request.url)
        returnUrl.searchParams.set('payment_verifying', 'true')

        const data = await DodoPayments.createCheckoutSession({
            productId,
            email: user.email!,
            name: user.user_metadata?.full_name,
            userId: user.id,
            redirectUrl: returnUrl.toString()
        })

        return NextResponse.json({ url: data.checkout_url })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
