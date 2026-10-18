import { NextResponse } from 'next/server'
import { route } from '@/mock-api/http'

export const GET = route(async (request) =>
    NextResponse.redirect(new URL('/login?error=google_failed', new URL(request.url).origin), 302))
