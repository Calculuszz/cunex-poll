import { NextResponse } from 'next/server'
import { closePoll, getPollDetail, reviewPoll, savePoll } from '@/lib/polls'
import { parseCreateBody } from '@/lib/pollInput'

// backend ชั่วคราว: GET รายละเอียดโพล, PATCH พิจารณาโพลที่รออนุมัติหรือปิดรับคำตอบ, PUT แก้ไขฉบับร่างหรือส่งขออนุมัติจากฉบับร่าง
// ยังไม่มี auth จึงใครก็เรียกได้ ต้องเพิ่มการตรวจสิทธิ์ก่อนใช้งานจริง

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const poll = await getPollDetail(id)
    if (!poll) return NextResponse.json({ error: 'ไม่พบโพล' }, { status: 404 })
    return NextResponse.json(poll)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'body ต้องเป็น JSON' }, { status: 400 })
    }

    const status = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).status : undefined
    // DONE = ปิดรับคำตอบจากหน้า dashboard
    if (status === 'DONE') {
        const closed = await closePoll(id)
        if (closed === 'not_found') return NextResponse.json({ error: 'ไม่พบโพล' }, { status: 404 })
        if (closed === 'not_voting') {
            return NextResponse.json({ error: 'ปิดรับคำตอบได้เฉพาะโพลที่กำลังโหวต' }, { status: 409 })
        }
        return NextResponse.json({ id, type: status })
    }
    if (status !== 'APPROVED' && status !== 'REJECTED') {
        return NextResponse.json({ error: 'status ต้องเป็น APPROVED, REJECTED หรือ DONE' }, { status: 400 })
    }

    const result = await reviewPoll(id, status)
    if (result === 'not_found') return NextResponse.json({ error: 'ไม่พบโพล' }, { status: 404 })
    if (result === 'not_pending') {
        return NextResponse.json({ error: 'โพลนี้ไม่ได้อยู่ในสถานะรออนุมัติแล้ว' }, { status: 409 })
    }
    return NextResponse.json({ id, type: status })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'body ต้องเป็น JSON' }, { status: 400 })
    }

    const parsed = parseCreateBody(body)
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

    try {
        const result = await savePoll(parsed.value, id)
        if (result === 'not_found') return NextResponse.json({ error: 'ไม่พบโพล' }, { status: 404 })
        if (result === 'not_draft') return NextResponse.json({ error: 'แก้ไขได้เฉพาะโพลฉบับร่าง' }, { status: 409 })
        return NextResponse.json({ id: result.id })
    } catch (err) {
        console.error('แก้ไขโพลไม่สำเร็จ', err)
        return NextResponse.json({ error: 'บันทึกโพลไม่สำเร็จ' }, { status: 500 })
    }
}
