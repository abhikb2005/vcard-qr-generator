import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const jar = await cookies()
    const signal = jar.get('vcard_signup')?.value
    const [id, method] = (signal || '').split(':')
    if (!user || id !== user.id || !['email', 'google'].includes(method)) return NextResponse.json({ completed: false }, { headers: { 'Cache-Control': 'no-store' } })
    return NextResponse.json({ completed: true, method }, { headers: { 'Cache-Control': 'no-store' } })
}
