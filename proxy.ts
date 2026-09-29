import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    const isAuth = request.cookies.get('token')
    const userRole = request.cookies.get('role')?.value

    // if (pathname.startsWith('/admin')) {
    //     if (!isAuth) {
    //         return NextResponse.redirect(new URL("/login", request.url))
    //     }
    //     if (userRole !== "admin") {
    //         return NextResponse.redirect(new URL("/", request.url))
    //     }
    // }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
