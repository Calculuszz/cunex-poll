import { NextResponse } from 'next/server'
import { route } from '@/mock-api/http'

// mock ยังไม่ได้ตั้งค่า Google จึงตอบแบบเดียวกับ backend จริงตอนไม่ได้ตั้งค่า
export const GET = route(async (request) =>
    NextResponse.redirect(new URL('/login?error=google_unavailable', new URL(request.url).origin), 302))
