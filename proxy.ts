import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// กันหน้าที่ต้องล็อกอิน: ไม่มี cookie session (sid) ให้ไปหน้า login พร้อม returnTo
// ตรวจแค่ว่ามี cookie ความถูกต้องของ session และสิทธิ์ (เช่นแอดมิน) ตรวจที่ backend ทุก request อยู่แล้ว
// หน้าแอดมินตรวจ role ซ้ำที่ server component (PollDashboardPage / layout) ไม่พึ่ง proxy อย่างเดียว
const PUBLIC_PATHS = ['/login', '/logout']

export function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl
    if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/api/')) return
    if (request.cookies.has('sid')) return
    const login = new URL('/login', request.url)
    login.searchParams.set('returnTo', pathname + search)
    return NextResponse.redirect(login)
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?|ttf|otf)$).*)'],
}
