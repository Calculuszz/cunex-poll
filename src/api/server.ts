import 'server-only'
import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { createRequester, isApiError } from './client'
import { makeApi } from './endpoints'
import type { Me } from './types'

// ใช้ใน server component: เรียก backend ด้วย cookie ของผู้ใช้ที่ส่งมากับ request นี้
// - API_INTERNAL_URL: URL เต็มของ backend ที่ server ของเว็บเข้าถึงได้ (เช่น http://api:8080/api/v1)
//   ไม่ตั้ง = backend ชั่วคราวในโปรเจกต์นี้ (origin เดียวกับเว็บ)
// - ตอนใช้ backend จริง ให้ backend อยู่ origin เดียวกับเว็บ (rewrite /api/v1 → backend) cookie sid จึงมาถึงทั้งสองฝั่ง
async function serverBase() {
    if (process.env.API_INTERNAL_URL) return process.env.API_INTERNAL_URL
    const h = await headers()
    return `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}/api/v1`
}

export const getServerApi = cache(async () => {
    const base = await serverBase()
    const cookie = (await cookies()).toString()
    return makeApi(createRequester(base, async (): Promise<Record<string, string>> => (cookie ? { cookie } : {}), { cache: 'no-store' }))
})

// ผู้ใช้ปัจจุบัน null = ยังไม่ล็อกอิน (cache ต่อ request เรียกซ้ำหลายที่ได้)
export const getMe = cache(async (): Promise<Me | null> => {
    try {
        return await (await getServerApi()).me()
    } catch (err) {
        if (isApiError(err, 'UNAUTHENTICATED')) return null
        throw err
    }
})

// เรียก API ในหน้า: 404 → หน้า not found, 401 → หน้า login
export async function loadOrNotFound<T>(fn: () => Promise<T>, returnTo: string): Promise<T> {
    try {
        return await fn()
    } catch (err) {
        if (isApiError(err) && err.status === 404) notFound()
        if (isApiError(err, 'UNAUTHENTICATED')) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
        throw err
    }
}
