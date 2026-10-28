import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// กันหน้าที่ต้องล็อกอิน: ไม่มี cookie session (sid) ให้ไปหน้า login พร้อม returnTo
// ตรวจแค่ว่ามี cookie ความถูกต้องของ session และสิทธิ์ (เช่นแอดมิน) ตรวจที่ backend ทุก request อยู่แล้ว
// หน้าแอดมินตรวจ role ซ้ำที่ server component (PollDashboardPage / layout) ไม่พึ่ง proxy อย่างเดียว
const PUBLIC_PATHS = ['/login', '/logout']

// CUNEX เปิดเว็บพร้อม ?token= (และ lang, ref1, ref2) ที่ URL ไหนก็ได้ที่ตั้งไว้ในเมนู
// ส่งต่อให้ callback ของ backend แลก token เป็น session แล้วกลับมาหน้าเดิม (ตัดค่าพวกนี้ออก)
const CUNEX_PARAMS = ['token', 'lang', 'ref1', 'ref2']

function cunexCallback(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) return null
    const back = new URL(request.nextUrl)
    for (const p of CUNEX_PARAMS) back.searchParams.delete(p)
    const callback = new URL('/api/v1/auth/cunex/callback', request.url)
    callback.searchParams.set('token', token)
    callback.searchParams.set('returnTo', back.pathname === '/login' ? '/' : back.pathname + back.search)
    return NextResponse.redirect(callback)
}

export function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl
    if (pathname.startsWith('/api/')) return
    const viaCunex = cunexCallback(request)
    if (viaCunex) return viaCunex
    if (PUBLIC_PATHS.includes(pathname)) return
    if (request.cookies.has('sid')) return
    const login = new URL('/login', request.url)
    login.searchParams.set('returnTo', pathname + search)
    return NextResponse.redirect(login)
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?|ttf|otf)$).*)'],
}
