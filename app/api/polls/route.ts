import { NextResponse } from 'next/server'
import { getPolls, savePoll } from '@/lib/polls'
import { parseCreateBody } from '@/lib/pollInput'

// backend ชั่วคราว: GET รายการโพล, POST สร้างโพลพร้อมคำถาม/องค์ประกอบ

export async function GET() {
    return NextResponse.json(await getPolls())
}

export async function POST(request: Request) {
    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'body ต้องเป็น JSON' }, { status: 400 })
    }

    const parsed = parseCreateBody(body)
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

    try {
        const result = await savePoll(parsed.value)
        if (typeof result === 'string') return NextResponse.json({ error: 'บันทึกโพลไม่สำเร็จ' }, { status: 500 })
        return NextResponse.json({ id: result.id }, { status: 201 })
    } catch (err) {
        console.error('สร้างโพลไม่สำเร็จ', err)
        return NextResponse.json({ error: 'บันทึกโพลไม่สำเร็จ' }, { status: 500 })
    }
}
