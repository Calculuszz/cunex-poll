import { NextResponse } from 'next/server'
import { createPreset, getPresets } from '@/lib/presets'
import { parsePresetBody } from '@/lib/presetInput'

// backend ชั่วคราว: GET preset ของผู้ใช้ปัจจุบัน, POST บันทึก preset ใหม่
// ยังไม่มี auth จึงใช้ผู้ใช้ปัจจุบันเสมอ ต้องเพิ่มการตรวจสิทธิ์ก่อนใช้งานจริง

export async function GET() {
    return NextResponse.json(await getPresets())
}

export async function POST(request: Request) {
    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'body ต้องเป็น JSON' }, { status: 400 })
    }

    const parsed = parsePresetBody(body)
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

    try {
        const id = await createPreset(parsed.value.name, parsed.value.codeKind, parsed.value.codes)
        return NextResponse.json({ id }, { status: 201 })
    } catch (err) {
        console.error('บันทึก preset ไม่สำเร็จ', err)
        return NextResponse.json({ error: 'บันทึก preset ไม่สำเร็จ' }, { status: 500 })
    }
}
