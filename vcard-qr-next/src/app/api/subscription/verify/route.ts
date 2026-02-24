import { createClient } from '@/utils/supabase/server'
import { DodoPayments } from '@/utils/dodo'
import { NextResponse } from 'next/server'

// Map products back to plan names
const getPlanFromProductId = (productId: string) => {
    if (productId === process.env.DODO_PRODUCT_ID_STARTER) return 'starter'
    if (productId === process.env.DODO_PRODUCT_ID_GROWTH) return 'growth'
    if (productId === process.env.DODO_PRODUCT_ID_BUSINESS) return 'business'
    return 'free'
}

export async function POST(request: Request) {
    console.log('Verify Subscription Route')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
        return NextResponse.json({ error: 'Missing Session ID' }, { status: 400 })
    }

    try {
        const sessionData = await DodoPayments.getCheckoutSessionStatus(sessionId)

        if (sessionData.payment_status === 'succeeded' && sessionData.payment_id) {
            const paymentData = await DodoPayments.getPayment(sessionData.payment_id)
            const plan = getPlanFromProductId(paymentData.product_id)

            // Update profile
            const { error } = await supabase
                .from('profiles')
                .update({
                    subscription_plan: plan,
                    subscription_status: 'active',
                    period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                })
                .eq('id', user.id)

            if (error) throw error

            return NextResponse.json({ success: true, plan })
        } else {
            return NextResponse.json({ success: false, status: sessionData.payment_status })
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
