import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// IMPORTANT: We use the service role key to bypass RLS in webhooks
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const hex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function verifySignature(secret: string, signature: string, timestamp: string, id: string, payload: string) {
    if (!secret || !signature || !timestamp || !id) return false;

    const encoder = new TextEncoder();
    const data = encoder.encode(`${timestamp}.${id}.${payload}`);
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const digest = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const expectedSignature = hex(digest);
    return signature.trim() === expectedSignature;
}

export async function POST(request: NextRequest) {
    const signature = request.headers.get('webhook-signature')
    const timestamp = request.headers.get('webhook-timestamp')
    const webhookId = request.headers.get('webhook-id')
    const secret = process.env.DODO_WEBHOOK_SECRET

    if (!secret || !signature || !timestamp || !webhookId) {
        return NextResponse.json({ error: 'Missing webhook verification headers' }, { status: 401 })
    }

    const payload = await request.text()
    const isValid = await verifySignature(secret, signature, timestamp, webhookId, payload)
    
    if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    try {
        const event = JSON.parse(payload)
        const eventType = event.event || event.type
        
        const customerEmail = event.data?.customer?.email || event.data?.customer_email
        let userId = event.data?.metadata?.userId || event.data?.custom_data?.userId

        // If Dodo didn't pass metadata back but gave us email, we fetch userId via auth.users (requires service role)
        if (!userId && customerEmail) {
            const { data: authUser } = await supabaseAdmin.auth.admin.listUsers()
            const found = authUser?.users?.find(u => u.email === customerEmail)
            if (found) userId = found.id
        }

        if (!userId) {
            return NextResponse.json({ received: true }) // Not a user-specific event we can hook to
        }

        if (eventType === 'subscription.renewed' || eventType === 'payment.succeeded') {
            const nextBillingDate = event.data?.next_billing_date || event.data?.subscription?.next_billing_date
            
            await supabaseAdmin
                .from('profiles')
                .update({
                    subscription_status: 'active',
                    period_end: nextBillingDate ? new Date(nextBillingDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                })
                .eq('id', userId)
        } else if (eventType === 'subscription.cancelled' || eventType === 'payment.failed') {
            await supabaseAdmin
                .from('profiles')
                .update({
                    subscription_status: eventType === 'payment.failed' ? 'past_due' : 'cancelled'
                })
                .eq('id', userId)
        }

        return NextResponse.json({ received: true })
    } catch (err: any) {
        console.error('Webhook error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
