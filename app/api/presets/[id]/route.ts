import { NextResponse } from 'next/server'
import { deletePreset, renamePreset } from '@/lib/presets'
import { parsePresetName } from '@/lib/presetInput'

// backend ชั่วคราว: PATCH เปลี่ยนชื่อ preset, DELETE ลบ preset ของผู้ใช้ปัจจุบัน
// ยังไม่มี auth จึงใช้ผู้ใช้ปัจจุบันเสมอ ต้องเพิ่มการตรวจสิทธิ์ก่อนใช้งานจริง

function parseId(raw: string): number | null {
    const id = Number(raw)
    return Number.isInteger(id) && id > 0 ? id : null
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const id = parseId((await params).id)
    if (id === null) return NextResponse.json({ error: 'id ไม่ถูกต้อง' }, { status: 400 })

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'body ต้องเป็น JSON' }, { status: 400 })
    }

    const name = parsePresetName(typeof body === 'object' && body !== null ? (body as Record<string, unknown>).name : undefined)
    if (!name) return NextResponse.json({ error: 'ชื่อ preset ต้องไม่ว่างและไม่เกิน 60 ตัวอักษร' }, { status: 400 })

    try {
        const ok = await renamePreset(id, name)
        if (!ok) return NextResponse.json({ error: 'ไม่พบ preset' }, { status: 404 })
        return NextResponse.json({ id, name })
    } catch (err) {
        console.error('เปลี่ยนชื่อ preset ไม่สำเร็จ', err)
        return NextResponse.json({ error: 'เปลี่ยนชื่อ preset ไม่สำเร็จ' }, { status: 500 })
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const id = parseId((await params).id)
    if (id === null) return NextResponse.json({ error: 'id ไม่ถูกต้อง' }, { status: 400 })

    try {
        const ok = await deletePreset(id)
        if (!ok) return NextResponse.json({ error: 'ไม่พบ preset' }, { status: 404 })
        return NextResponse.json({ id })
    } catch (err) {
        console.error('ลบ preset ไม่สำเร็จ', err)
        return NextResponse.json({ error: 'ลบ preset ไม่สำเร็จ' }, { status: 500 })
    }
}
