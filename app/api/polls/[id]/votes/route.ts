import { NextResponse } from 'next/server'
import { CURRENT_USER } from '@/lib/currentUser'
import { submitVote } from '@/lib/votes'

// ส่งคำตอบ (API contract §4) body: { answers, clientToken }
// clientToken ทำให้ยิงซ้ำได้อย่างปลอดภัย เช่นเน็ตหลุดตอนรอคำตอบแล้วกดส่งใหม่
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'body ต้องเป็น JSON' }, { status: 400 })
    }
    const b = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
    if (typeof b.clientToken !== 'string' || b.clientToken.length < 8 || b.clientToken.length > 100) {
        return NextResponse.json({ error: 'clientToken ไม่ถูกต้อง' }, { status: 400 })
    }
    const result = await submitVote(id, CURRENT_USER.studentId, b.answers, b.clientToken)
    if (!result.ok) return NextResponse.json({ error: result.error, code: result.code }, { status: result.status })
    return NextResponse.json({ ok: true, ...result.value })
}
