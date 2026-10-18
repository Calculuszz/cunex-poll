import type { Problem } from './types'

// ชั้นเรียก API กลาง: ทุกหน้าเรียก backend ผ่านที่นี่ที่เดียว
// - base URL: NEXT_PUBLIC_API_BASE_URL (ค่าเริ่มต้น /api/v1 = backend ชั่วคราวในโปรเจกต์นี้)
// - session อยู่ใน cookie httpOnly `sid` จึงส่ง credentials: 'include' ทุกครั้ง ไม่มี bearer token
// - error ทุกตัวแปลงเป็น ApiError ที่มี status + code ตามสัญญา (problem+json)
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1'

export class ApiError extends Error {
    readonly status: number
    readonly code: string
    readonly problem: Problem

    constructor(problem: Problem) {
        super(problem.detail || problem.title)
        this.status = problem.status
        this.code = problem.code
        this.problem = problem
    }
}

export const isApiError = (err: unknown, code?: string): err is ApiError =>
    err instanceof ApiError && (code === undefined || err.code === code)

// ข้อความที่แสดงกับผู้ใช้ได้ตรงๆ
export function errorMessage(err: unknown, fallback = 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง') {
    if (err instanceof ApiError) return err.message || fallback
    if (err instanceof TypeError) return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง'
    return fallback
}

export type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    query?: Record<string, string | number | null | undefined>
    body?: unknown
    headers?: Record<string, string>
    signal?: AbortSignal
    // ให้คำขอไปถึงแม้หน้าถูกปิดไปแล้ว (บันทึกร่างตอนกดย้อนกลับของเบราว์เซอร์)
    keepalive?: boolean
}

export type Requester = <T>(path: string, options?: RequestOptions) => Promise<T>

export function buildUrl(base: string, path: string, query?: RequestOptions['query']) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(query ?? {})) if (v !== null && v !== undefined && v !== '') qs.set(k, String(v))
    const s = qs.toString()
    return `${base}${path}${s ? `?${s}` : ''}`
}

async function toApiError(res: Response): Promise<ApiError> {
    const data = await res.json().catch(() => null)
    if (data && typeof data.code === 'string') return new ApiError({ ...data, status: res.status })
    return new ApiError({ title: 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง', status: res.status, code: `HTTP_${res.status}` })
}

// ใช้ได้ทั้งฝั่ง browser (base แบบ relative) และ server (base แบบเต็ม + แนบ cookie ผ่าน extraHeaders)
export function createRequester(base: string, extraHeaders?: () => Promise<Record<string, string>>, init?: RequestInit): Requester {
    return async <T>(path: string, { method = 'GET', query, body, headers, signal, keepalive }: RequestOptions = {}) => {
        const res = await fetch(buildUrl(base, path, query), {
            ...init,
            method,
            credentials: 'include',
            signal,
            keepalive,
            headers: {
                Accept: 'application/json',
                ...(body !== undefined && { 'Content-Type': 'application/json' }),
                ...(extraHeaders && (await extraHeaders())),
                ...headers,
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        })
        if (!res.ok) throw await toApiError(res)
        if (res.status === 204) return undefined as T
        return (await res.json()) as T
    }
}
