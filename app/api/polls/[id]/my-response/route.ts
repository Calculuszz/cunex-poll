import { NextResponse } from 'next/server'
import { CURRENT_USER } from '@/lib/currentUser'
import { saveDraft } from '@/lib/votes'

// บันทึกฉบับร่างคำตอบของผู้ใช้ปัจจุบัน ("โหวตต่อ" ข้ามเครื่องได้)
// ยังไม่มี auth จริง ผู้ตอบคือ CURRENT_USER เสมอ
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'body ต้องเป็น JSON' }, { status: 400 })
    }
    const answers = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).answers ?? {} : undefined
    const result = await saveDraft(id, CURRENT_USER.studentId, answers)
    if (!result.ok) return NextResponse.json({ error: result.error, code: result.code }, { status: result.status })
    return NextResponse.json(result.value)
}
