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

// ข้อความไทยตาม code ของ backend (detail ของ backend เป็นภาษาอังกฤษไว้ debug ไม่แสดงผู้ใช้)
const CODE_MESSAGES: Record<string, string> = {
    UNAUTHENTICATED: 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
    FORBIDDEN: 'คุณไม่มีสิทธิ์ทำรายการนี้',
    NOT_ELIGIBLE: 'คุณไม่อยู่ในกลุ่มผู้ตอบของโพลนี้',
    RESULTS_HIDDEN: 'ยังดูผลโหวตของโพลนี้ไม่ได้',
    POLL_NOT_FOUND: 'ไม่พบโพล',
    NOT_FOUND: 'ไม่พบข้อมูล',
    NO_BALLOT: 'คุณยังไม่ได้ตอบโพลนี้',
    USER_NOT_FOUND: 'ยังไม่พบผู้ใช้นี้ ให้เข้าสู่ระบบด้วย CUNEX ก่อน',
    POLL_LOCKED: 'สถานะโพลเปลี่ยนไปแล้ว กรุณาโหลดหน้าใหม่',
    POLL_NOT_STARTED: 'โพลนี้ยังไม่ถึงเวลาเปิดโหวต',
    POLL_CLOSED: 'โพลนี้ปิดรับคำตอบแล้ว',
    ALREADY_VOTED: 'คุณส่งคำตอบโพลนี้ไปแล้ว',
    CANNOT_REVOKE_SELF: 'ถอดสิทธิ์ผู้ดูแลของตัวเองไม่ได้',
    VERSION_CONFLICT: 'ฉบับร่างถูกแก้จากที่อื่น กรุณาโหลดใหม่ก่อนบันทึก',
    UNPROCESSABLE: 'ข้อมูลไม่ถูกต้อง',
    INVALID_IMAGE_URL: 'ต้องอัปโหลดรูปผ่านระบบ',
    UNKNOWN_FACULTY: 'ไม่พบคณะที่เลือก',
    CLOSES_AT_PASSED: 'เลยเวลาปิดโหวตแล้ว กรุณาเลื่อนเวลาปิดก่อน',
    INVALID_CLOSES_AT: 'เวลาปิดต้องอยู่ในอนาคต',
    IMAGE_TOO_LARGE: 'รูปใหญ่เกิน 5 MB',
    RATE_LIMITED: 'ทำรายการถี่เกินไป รอสักครู่แล้วลองใหม่',
}

// ข้อความที่แสดงกับผู้ใช้ได้ตรงๆ: ปัญหาข้อแรก (backend ส่งเป็นภาษาไทย) > ข้อความตาม code > fallback
export function errorMessage(err: unknown, fallback = 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง') {
    if (err instanceof ApiError) return err.problem.problems?.[0]?.message ?? CODE_MESSAGES[err.code] ?? fallback
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
