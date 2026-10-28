import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// กันหน้าที่ต้องล็อกอิน: ไม่มี cookie session (sid) ให้ไปหน้า login พร้อม returnTo
// ตรวจแค่ว่ามี cookie ความถูกต้องของ session และสิทธิ์ (เช่นแอดมิน) ตรวจที่ backend ทุก request อยู่แล้ว
// หน้าแอดมินตรวจ role ซ้ำที่ server component (PollDashboardPage / layout) ไม่พึ่ง proxy อย่างเดียว
const PUBLIC_PATHS = ['/login', '/logout']
// หน้าแรกของโพล /(id) เปิดได้โดยไม่ login: คนที่ได้ลิงก์แชร์เห็นรายละเอียดก่อน จะโหวตค่อย login
const POLL_INTRO = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
    // CUNEX พากลับมาที่ URL คงที่ที่ลงทะเบียนไว้ (หน้าแรก) ไม่ใช่หน้าที่ผู้ใช้ขอ login
    // ไม่ส่ง returnTo ในกรณีนี้ ให้ backend ใช้ cookie return_to ที่ตั้งไว้ตอนกดปุ่ม login (ไม่มี = หน้าแรก)
    const returnTo = back.pathname === '/login' ? back.searchParams.get('returnTo')
        : back.pathname === '/' && !back.search ? null
        : back.pathname + back.search
    if (returnTo) callback.searchParams.set('returnTo', returnTo)
    return NextResponse.redirect(callback)
}

export function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl
    if (pathname.startsWith('/api/')) return
    const viaCunex = cunexCallback(request)
    if (viaCunex) return viaCunex
    if (PUBLIC_PATHS.includes(pathname) || POLL_INTRO.test(pathname)) return
    if (request.cookies.has('sid')) return
    const login = new URL('/login', request.url)
    login.searchParams.set('returnTo', pathname + search)
    return NextResponse.redirect(login)
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?|ttf|otf)$).*)'],
}
