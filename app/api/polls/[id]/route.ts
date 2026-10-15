import { NextResponse } from 'next/server'
import { closePoll, getPollDetail, publishPoll, reviewPoll, savePoll, setRealtime } from '@/lib/polls'
import { CURRENT_USER } from '@/lib/currentUser'
import { parseCreateBody } from '@/lib/pollInput'
import { CLOSE_REASON_MAX } from '@/lib/pollLabels'

// backend ชั่วคราว: GET รายละเอียดโพล, PATCH พิจารณาโพลที่รออนุมัติ / เปิดโหวต (Publish) / ปิดรับคำตอบ / เปิดปิดผลเรียลไทม์, PUT แก้ไขฉบับร่างหรือส่งขออนุมัติจากฉบับร่าง
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

    const b = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
    const status = b.status

    // { realtime } อย่างเดียว = เปิด/ปิดผลเรียลไทม์ แก้ได้เฉพาะก่อนเปิดโหวต
    if (status === undefined && typeof b.realtime === 'boolean') {
        const result = await setRealtime(id, b.realtime)
        if (result === 'not_found') return NextResponse.json({ error: 'ไม่พบโพล' }, { status: 404 })
        if (result === 'locked') {
            return NextResponse.json({ error: 'เปิดโหวตแล้ว เปลี่ยนการแสดงผลแบบเรียลไทม์ไม่ได้' }, { status: 409 })
        }
        return NextResponse.json({ id, realtime: b.realtime })
    }

    // VOTING = กด Publish เปิดโหวตโพลที่อนุมัติแล้ว
    if (status === 'VOTING') {
        const result = await publishPoll(id)
        if (result === 'not_found') return NextResponse.json({ error: 'ไม่พบโพล' }, { status: 404 })
        if (result === 'expired') {
            return NextResponse.json({ error: 'เลยเวลาปิดโหวตแล้ว เปิดโหวตไม่ได้' }, { status: 409 })
        }
        if (result === 'not_approved') {
            return NextResponse.json({ error: 'เปิดโหวตได้เฉพาะโพลที่อนุมัติแล้ว' }, { status: 409 })
        }
        return NextResponse.json({ id, type: status })
    }

    // DONE = ปิดรับคำตอบจากหน้า dashboard เหตุผลไม่บังคับ (System flow §7)
    if (status === 'DONE') {
        if (b.reason !== undefined && b.reason !== null && typeof b.reason !== 'string') {
            return NextResponse.json({ error: 'reason ต้องเป็นข้อความ' }, { status: 400 })
        }
        const reason = typeof b.reason === 'string' ? b.reason.trim() : ''
        if (reason.length > CLOSE_REASON_MAX) {
            return NextResponse.json({ error: `เหตุผลยาวได้ไม่เกิน ${CLOSE_REASON_MAX} ตัวอักษร` }, { status: 400 })
        }
        const closed = await closePoll(id, reason || null, CURRENT_USER.studentId)
        if (closed === 'not_found') return NextResponse.json({ error: 'ไม่พบโพล' }, { status: 404 })
        if (closed === 'not_voting') {
            return NextResponse.json({ error: 'ปิดรับคำตอบได้เฉพาะโพลที่กำลังโหวต' }, { status: 409 })
        }
        return NextResponse.json({ id, type: status })
    }
    if (status !== 'APPROVED' && status !== 'REJECTED') {
        return NextResponse.json({ error: 'status ต้องเป็น APPROVED, REJECTED, VOTING หรือ DONE' }, { status: 400 })
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
