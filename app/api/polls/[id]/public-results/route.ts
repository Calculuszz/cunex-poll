import { NextResponse } from 'next/server'
import { CURRENT_USER } from '@/lib/currentUser'
import { getVoterResults } from '@/lib/voterResults'

// ผลโหวตสำหรับผู้ตอบ: เฉพาะคำถามแบบเลือก ไม่มีคำตอบข้อความ (กันข้อความที่ระบุตัวตนได้หลุดถึงผู้ตอบคนอื่น)
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const result = await getVoterResults(id, CURRENT_USER.studentId)
    if (result === 'not_found') return NextResponse.json({ error: 'ไม่พบโพล' }, { status: 404 })
    if (result === 'forbidden') return NextResponse.json({ error: 'ยังดูผลโหวตของโพลนี้ไม่ได้' }, { status: 403 })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
}
