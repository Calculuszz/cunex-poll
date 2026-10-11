import { NextResponse } from 'next/server'
import { getPollDetail, reviewPoll } from '@/lib/polls'

// backend ชั่วคราว: GET รายละเอียดโพล, PATCH พิจารณาโพลที่รออนุมัติ
// ยังไม่มี auth จึงใครก็เรียกได้ ต้องเพิ่มการตรวจสิทธิ์แอดมินก่อนใช้งานจริง

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
    if (status !== 'APPROVED' && status !== 'REJECTED') {
        return NextResponse.json({ error: 'status ต้องเป็น APPROVED หรือ REJECTED' }, { status: 400 })
    }

    const result = await reviewPoll(id, status)
    if (result === 'not_found') return NextResponse.json({ error: 'ไม่พบโพล' }, { status: 404 })
    if (result === 'not_pending') {
        return NextResponse.json({ error: 'โพลนี้ไม่ได้อยู่ในสถานะรออนุมัติแล้ว' }, { status: 409 })
    }
    return NextResponse.json({ id, type: status })
}
