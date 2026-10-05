import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { DodoPayments } from '@/utils/dodo'
import { NextResponse } from 'next/server'

// Map products back to plan names
const getPlanFromProductId = (productId: string) => {
    if (typeof productId !== 'string' || !productId) return 'free'
    if (productId === process.env.DODO_PRODUCT_ID_STARTER?.trim()) return 'starter'
    if (productId === process.env.DODO_PRODUCT_ID_GROWTH?.trim()) return 'growth'
    if (productId === process.env.DODO_PRODUCT_ID_BUSINESS?.trim()) return 'business'
    return 'free'
}

function createSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase admin configuration')
    }

    return createSupabaseAdminClient(supabaseUrl, serviceRoleKey)
}

export async function POST(request: Request) {
    console.log('Verify Subscription Route')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let input
    try { input = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
    const { sessionId, subscriptionId, paymentId } = input || {}
    if ([sessionId, subscriptionId, paymentId].some(id => id != null && (typeof id !== 'string' || !id || id.length > 200))) return NextResponse.json({ error: 'Invalid payment reference' }, { status: 400 })

    if (!sessionId && !subscriptionId && !paymentId) {
        return NextResponse.json({ error: 'Missing checkout or subscription ID' }, { status: 400 })
    }

    try {
        const supabaseAdmin = createSupabaseAdmin()
        if (subscriptionId && !paymentId && !sessionId) {
            const subscriptionData = await DodoPayments.getSubscription(subscriptionId)
            const subscriptionUserId = subscriptionData.metadata?.user_id || subscriptionData.metadata?.userId

            if (subscriptionData.status !== 'active' || subscriptionUserId !== user.id) {
                return NextResponse.json({ success: false, status: subscriptionData.status }, { status: 403 })
            }

            const plan = getPlanFromProductId(subscriptionData.product_id)
            if (plan === 'free') {
                return NextResponse.json({ success: false, error: 'Unknown subscription product' }, { status: 400 })
            }

            const { error } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: user.id,
                    subscription_plan: plan,
                    subscription_status: 'active',
                    period_end: subscriptionData.next_billing_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                }, { onConflict: 'id' })

            if (error) throw error

            return NextResponse.json({
                success: true,
                plan,
                subscription_id: subscriptionId,
                product_id: subscriptionData.product_id,
                revenue_verified: false,
                currency: (subscriptionData.currency || 'USD').toUpperCase()
            })
        }

        const sessionData = paymentId ? { payment_status: 'succeeded', payment_id: paymentId } : await DodoPayments.getCheckoutSessionStatus(sessionId)

        if (sessionData.payment_status === 'succeeded' && sessionData.payment_id) {
            const paymentData = await DodoPayments.getPayment(sessionData.payment_id)
            const paymentUserId = paymentData.metadata?.user_id || paymentData.metadata?.userId
            if (paymentData.status !== 'succeeded' || paymentUserId !== user.id) return NextResponse.json({ success: false }, { status: 403 })
            const paidSubscriptionId = paymentData.subscription_id
            const paidSubscription = paidSubscriptionId ? await DodoPayments.getSubscription(paidSubscriptionId) : null
            if (paidSubscription && (paidSubscription.status !== 'active' || (paidSubscription.metadata?.user_id || paidSubscription.metadata?.userId) !== user.id)) return NextResponse.json({ success: false }, { status: 403 })
            if (subscriptionId && paidSubscriptionId !== subscriptionId) return NextResponse.json({ success: false }, { status: 403 })
            const productId = paidSubscription?.product_id || paymentData.product_id || paymentData.product_cart?.[0]?.product_id
            const plan = getPlanFromProductId(productId)
            if (plan === 'free') return NextResponse.json({ success: false, error: 'Unknown product' }, { status: 400 })

            const paymentCreatedAt = Date.parse(paymentData.created_at)
            const periodEnd = paidSubscription?.next_billing_date || (Number.isFinite(paymentCreatedAt) ? new Date(paymentCreatedAt + 30 * 24 * 60 * 60 * 1000).toISOString() : null)
            if (!periodEnd || Date.parse(periodEnd) <= Date.now()) return NextResponse.json({ success: false, error: 'No current entitlement period' }, { status: 403 })

            // Provider period/date prevents a replay from extending access.
            const { error } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: user.id,
                    subscription_plan: plan,
                    subscription_status: 'active',
                    period_end: periodEnd
                }, { onConflict: 'id' })

            if (error) throw error

            const currency = typeof paymentData.currency === 'string' ? paymentData.currency.toUpperCase() : undefined
            const minorAmount = paymentData.total_amount ?? paymentData.amount
            let value: number | undefined
            if (typeof minorAmount === 'number' && currency && /^[A-Z]{3}$/.test(currency)) {
                try { value = minorAmount / 10 ** new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits! } catch { /* unknown currency is not revenue */ }
            }
            const revenueVerified = typeof value === 'number' && Number.isFinite(value) && value > 0 && !!currency && /^[A-Z]{3}$/.test(currency)

            return NextResponse.json({
                success: true,
                plan,
                payment_id: sessionData.payment_id,
                product_id: productId,
                revenue_verified: revenueVerified,
                value,
                currency
            })
        } else {
            return NextResponse.json({ success: false, status: sessionData.payment_status })
        }

    } catch {
        return NextResponse.json({ error: 'Unable to verify payment' }, { status: 500 })
    }
}
