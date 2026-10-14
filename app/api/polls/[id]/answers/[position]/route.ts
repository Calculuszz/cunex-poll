import { NextResponse } from 'next/server'
import { getTextAnswers } from '@/lib/pollResults'

// คำตอบแบบข้อความทั้งหมดของคำถามหนึ่งข้อ (ใช้กับ "ดูทั้งหมด")
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; position: string }> }) {
    const { id, position } = await params
    const pos = Number(position)
    if (!Number.isInteger(pos) || pos < 1) return NextResponse.json({ error: 'position ไม่ถูกต้อง' }, { status: 400 })
    return NextResponse.json(await getTextAnswers(id, pos))
}
