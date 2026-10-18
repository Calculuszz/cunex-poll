import 'server-only'
import { NextResponse } from 'next/server'
import type { Problem } from '@/api/types'

// error ตามสัญญา: application/problem+json (RFC 9457) · code เป็นชื่อคงที่ให้หน้าเว็บใช้ตัดสินใจ
export class ApiProblem extends Error {
    headers: Record<string, string> = {}
    constructor(public status: number, public code: string, public title: string, public extra: Partial<Problem> = {}) {
        super(title)
    }
}

export const problem = (status: number, code: string, title: string, extra: Partial<Problem> = {}) =>
    new ApiProblem(status, code, title, extra)

export function problemResponse(p: ApiProblem) {
    const body: Problem = { type: 'about:blank', title: p.title, status: p.status, code: p.code, ...p.extra }
    return new NextResponse(JSON.stringify(body), {
        status: p.status,
        headers: { 'Content-Type': 'application/problem+json', 'Cache-Control': 'no-store', ...p.headers },
    })
}

export const json = (data: unknown, status = 200, headers?: HeadersInit) =>
    NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } })

export const noContent = () => new NextResponse(null, { status: 204 })

// CSRF: request ที่ไม่ใช่ GET ต้องส่ง Origin ตรงกับ origin ของแอป
function checkOrigin(request: Request) {
    if (request.method === 'GET' || request.method === 'HEAD') return
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    if (!origin || !host || new URL(origin).host !== host) {
        throw problem(403, 'BAD_ORIGIN', 'Origin ไม่ตรงกับแอป')
    }
}

type Ctx<P> = { params: Promise<P> }

// ห่อ route handler: ตรวจ Origin และแปลง ApiProblem ที่ throw ออกมาเป็น problem+json
export function route<P = Record<string, never>>(fn: (request: Request, params: P) => Promise<Response>) {
    return async (request: Request, ctx: Ctx<P>) => {
        try {
            checkOrigin(request)
            return await fn(request, await ctx.params)
        } catch (err) {
            if (err instanceof ApiProblem) return problemResponse(err)
            console.error('[mock-api]', err)
            return problemResponse(problem(500, 'INTERNAL', 'เกิดข้อผิดพลาดในระบบ'))
        }
    }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
    const text = await request.text()
    if (!text) return {}
    try {
        const body = JSON.parse(text)
        if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new Error()
        return body
    } catch {
        throw problem(400, 'BAD_JSON', 'body ต้องเป็น JSON object')
    }
}

// cursor แบบทึบ (opaque) ข้างในเป็น offset · backend จริงจะใช้อะไรก็ได้ หน้าเว็บแค่ส่งค่าที่ได้กลับมา
export const encodeCursor = (offset: number) => Buffer.from(JSON.stringify({ o: offset })).toString('base64url')
export function decodeCursor(cursor: string | null): number {
    if (!cursor) return 0
    try {
        const o = JSON.parse(Buffer.from(cursor, 'base64url').toString()).o
        return Number.isInteger(o) && o >= 0 ? o : 0
    } catch {
        throw problem(400, 'BAD_CURSOR', 'cursor ไม่ถูกต้อง')
    }
}

export function pageParams(request: Request, defaultLimit = 20) {
    const url = new URL(request.url)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || defaultLimit))
    return { url, limit, offset: decodeCursor(url.searchParams.get('cursor')) }
}

// ดึงมาเกิน 1 แถวเพื่อรู้ว่ามีหน้าถัดไปไหม
export function toPage<T>(rows: T[], limit: number, offset: number) {
    const items = rows.slice(0, limit)
    return { items, nextCursor: rows.length > limit ? encodeCursor(offset + limit) : null }
}

// rate limit แบบง่ายในหน่วยความจำ (ของจริงใช้ Redis) · ต่อผู้ใช้ต่อชนิด
const hits = new Map<string, number[]>()
export function rateLimit(key: string, perMinute: number) {
    const now = Date.now()
    const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000)
    if (recent.length >= perMinute) {
        const p = problem(429, 'RATE_LIMITED', 'ส่งคำขอถี่เกินไป ลองใหม่อีกครั้ง')
        p.headers['Retry-After'] = String(Math.ceil((60_000 - (now - recent[0])) / 1000))
        throw p
    }
    recent.push(now)
    hits.set(key, recent)
}

export const appOrigin = (request: Request) => new URL(request.url).origin
