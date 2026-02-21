import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ shortId: string }> }) {
    const { shortId } = await params
    const supabase = await createClient()

    // 1. Fetch the QR code mapping
    const { data: qr, error } = await supabase
        .from('qr_codes')
        .select('id, target_url, vcard_data')
        .eq('short_code', shortId)
        .single()

    if (error || !qr) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 2. Async: Log the scan
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || 'direct'
    const country = request.headers.get('x-vercel-ip-country') || 'unknown'
    const city = request.headers.get('x-vercel-ip-city') || 'unknown'

    await Promise.all([
        supabase.rpc('increment_scan_count', { qr_id: qr.id }),
        supabase.from('scans').insert({
            qr_id: qr.id,
            ip_address: ip,
            user_agent: userAgent,
            referer: referer,
            country: country,
            city: city,
            device_type: 'unknown'
        })
    ])

    // 3. Redirect Logic
    // If it's a vCard, we redirect to our internal public profile page
    // The 'target_url' for vCards was set to similar public URL, but let's be explicit
    if (qr.vcard_data) {
        const origin = new URL(request.url).origin
        return NextResponse.redirect(`${origin}/p/${shortId}`)
    }

    // Otherwise, standard redirect
    return NextResponse.redirect(qr.target_url)
}
