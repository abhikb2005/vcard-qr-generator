import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function hashIP(ip: string): Promise<string> {
    const encoder = new TextEncoder();
    // Use the current date as a daily salt for the hash
    const data = encoder.encode(ip + new Date().toISOString().split('T')[0]);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ shortId: string }> }) {
    const { shortId } = await params
    
    // Use Service Role admin client to bypass RLS for public scanning
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Fetch the QR code mapping
    const { data: qr, error } = await supabaseAdmin
        .from('qr_codes')
        .select('id, target_url, vcard_data')
        .eq('short_code', shortId)
        .single()

    if (error || !qr) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 2. Async: Log the scan
    const rawIp = request.headers.get('x-forwarded-for') || 'unknown'
    const ipHash = await hashIP(rawIp);
    
    // Check if this IP+QR combo was logged in the last 60 seconds (Rate Limiting)
    const { data: recentScan } = await supabaseAdmin
        .from('scans')
        .select('id')
        .eq('qr_id', qr.id)
        .eq('ip_address', ipHash)
        .gte('scanned_at', new Date(Date.now() - 60000).toISOString())
        .limit(1)
        .maybeSingle()

    if (!recentScan) {
        const userAgent = request.headers.get('user-agent') || 'unknown'
        const referer = request.headers.get('referer') || 'direct'
        // Vercel-specific Geo Headers (will fall back to 'unknown' if hosted elsewhere)
        const country = request.headers.get('x-vercel-ip-country') || 'unknown'
        const city = request.headers.get('x-vercel-ip-city') || 'unknown'

        // Fire and forget
        Promise.all([
            supabaseAdmin.rpc('increment_scan_count', { qr_id: qr.id }),
            supabaseAdmin.from('scans').insert({
                qr_id: qr.id,
                ip_address: ipHash, // GDPR Compliant Hash
                user_agent: userAgent,
                referer: referer,
                country: country,
                city: city,
                device_type: 'unknown'
            })
        ]).catch(console.error)
    }

    // 3. Redirect Logic
    if (qr.vcard_data) {
        const origin = new URL(request.url).origin
        return NextResponse.redirect(`${origin}/p/${shortId}`)
    }

    // Otherwise, standard redirect
    return NextResponse.redirect(qr.target_url)
}
