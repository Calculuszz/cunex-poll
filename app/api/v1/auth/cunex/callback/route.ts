import { NextResponse } from 'next/server'
import { findUser, safeReturnTo, startSession } from '@/mock-api/auth'
import { route } from '@/mock-api/http'

// แลก token ของ CUNEX เป็น session แล้ว 302 กลับ returnTo (ไม่พา token ไปด้วย)
// mock: token รูปแบบ mock-<cunexUserId> · ของจริงเรียก /profile ของ CUNEX แล้ว upsert ผู้ใช้ + คณะ
export const GET = route(async (request) => {
    const url = new URL(request.url)
    const token = url.searchParams.get('token') ?? ''
    const fail = (error: string) => NextResponse.redirect(new URL(`/login?error=${error}`, url.origin), 302)
    if (!token.startsWith('mock-')) return fail('token_expired')
    const user = await findUser('u.cunex_user_id', token.slice('mock-'.length))
    if (!user) return fail('cunex_unavailable')
    await startSession(user.id)
    return NextResponse.redirect(new URL(safeReturnTo(url.searchParams.get('returnTo')), url.origin), 302)
})
