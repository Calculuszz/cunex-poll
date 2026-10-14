import { NextResponse } from 'next/server'
import { parseDisplaySettings } from '@/lib/resultDisplay'
import { saveResultDisplay } from '@/lib/polls'

// บันทึกการตั้งค่าเผยแพร่ผลโหวต (เจ้าของโพล) ยังไม่มี auth จริง ต้องเพิ่มการตรวจว่าเป็นเจ้าของ/แอดมินก่อนใช้งานจริง
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'body ต้องเป็น JSON' }, { status: 400 })
    }
    const settings = parseDisplaySettings(body)
    if (!settings) return NextResponse.json({ error: 'การตั้งค่าไม่ถูกต้อง ต้องเลือกรูปแบบกราฟอย่างน้อยหนึ่งแบบ' }, { status: 400 })
    const result = await saveResultDisplay(id, settings)
    if (result === 'not_found') return NextResponse.json({ error: 'ไม่พบโพล' }, { status: 404 })
    if (result === 'bad_state') return NextResponse.json({ error: 'ตั้งค่าได้เฉพาะโพลที่เปิดโหวตแล้ว' }, { status: 409 })
    return NextResponse.json(settings)
}
