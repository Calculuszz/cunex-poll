import { NextResponse } from 'next/server'
import { addAdmin, getAdmins } from '@/lib/admins'
import { STUDENT_ID_PATTERN } from '@/lib/studentId'
import { CURRENT_USER } from '@/lib/currentUser'

// backend ชั่วคราว: GET รายการแอดมิน, POST เพิ่มแอดมินด้วยรหัสนิสิต 10 หลัก
// ยังไม่มี auth จึงใครก็เรียกได้ ต้องเพิ่มการตรวจสิทธิ์ก่อนใช้งานจริง

export async function GET() {
    return NextResponse.json(await getAdmins())
}

export async function POST(request: Request) {
    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'body ต้องเป็น JSON' }, { status: 400 })
    }

    const studentId = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).studentId : undefined
    if (typeof studentId !== 'string' || !STUDENT_ID_PATTERN.test(studentId)) {
        return NextResponse.json({ error: 'รหัสนิสิตต้องเป็นตัวเลข 10 หลัก' }, { status: 400 })
    }
    if (studentId === CURRENT_USER.studentId) {
        return NextResponse.json({ error: 'รหัสนี้เป็นแอดมินอยู่แล้ว' }, { status: 409 })
    }

    const added = await addAdmin(studentId)
    if (!added) return NextResponse.json({ error: 'รหัสนี้เป็นแอดมินอยู่แล้ว' }, { status: 409 })
    return NextResponse.json({ studentId }, { status: 201 })
}
