import { NextResponse } from 'next/server'
import { safeReturnTo } from '@/mock-api/auth'
import { route } from '@/mock-api/http'

// mock: ข้ามหน้า "login with CUNEX" แล้วส่ง token จำลองของบัญชีหลักไป callback ทันที
// ของจริง 302 ไปหน้าล็อกอินของ CUNEX ซึ่งจะเรียก callback พร้อม token
export const GET = route(async (request) => {
    const url = new URL(request.url)
    const returnTo = safeReturnTo(url.searchParams.get('returnTo'))
    const callback = new URL('/api/v1/auth/cunex/callback', url.origin)
    callback.searchParams.set('token', 'mock-cunex-6734414223')
    callback.searchParams.set('returnTo', returnTo)
    return NextResponse.redirect(callback, 302)
})
