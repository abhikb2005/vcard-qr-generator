import { createClient } from '@/utils/supabase/server'
import { DodoPayments } from '@/utils/dodo'
import { NextResponse } from 'next/server'

// Map products back to plan names
const getPlanFromProductId = (productId: string) => {
    if (productId === process.env.DODO_PRODUCT_ID_STARTER?.trim()) return 'starter'
    if (productId === process.env.DODO_PRODUCT_ID_GROWTH?.trim()) return 'growth'
    if (productId === process.env.DODO_PRODUCT_ID_BUSINESS?.trim()) return 'business'
    return 'free'
}

const PLAN_PRICES = {
    starter: 5,
    growth: 9,
    business: 19,
    free: 0
}

export async function POST(request: Request) {
    console.log('Verify Subscription Route')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, subscriptionId } = await request.json()

    if (!sessionId && !subscriptionId) {
        return NextResponse.json({ error: 'Missing checkout or subscription ID' }, { status: 400 })
    }

    try {
        if (subscriptionId) {
            const subscriptionData = await DodoPayments.getSubscription(subscriptionId)
            const subscriptionUserId = subscriptionData.metadata?.user_id || subscriptionData.metadata?.userId

            if (subscriptionData.status !== 'active' || subscriptionUserId !== user.id) {
                return NextResponse.json({ success: false, status: subscriptionData.status }, { status: 403 })
            }

            const plan = getPlanFromProductId(subscriptionData.product_id)
            if (plan === 'free') {
                return NextResponse.json({ success: false, error: 'Unknown subscription product' }, { status: 400 })
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    subscription_plan: plan,
                    subscription_status: 'active',
                    period_end: subscriptionData.next_billing_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                })
                .eq('id', user.id)

            if (error) throw error

            return NextResponse.json({
                success: true,
                plan,
                subscription_id: subscriptionId,
                product_id: subscriptionData.product_id,
                value: PLAN_PRICES[plan as keyof typeof PLAN_PRICES],
                currency: (subscriptionData.currency || 'USD').toUpperCase()
            })
        }

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

            const value =
                typeof paymentData.total_amount === 'number' ? paymentData.total_amount / 100 :
                    typeof paymentData.amount === 'number' ? paymentData.amount / 100 :
                        PLAN_PRICES[plan as keyof typeof PLAN_PRICES]
            const currency = (paymentData.currency || 'USD').toUpperCase()

            return NextResponse.json({
                success: true,
                plan,
                payment_id: sessionData.payment_id,
                product_id: paymentData.product_id,
                value,
                currency
            })
        } else {
            return NextResponse.json({ success: false, status: sessionData.payment_status })
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
