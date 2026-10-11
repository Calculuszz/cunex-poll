import { NextResponse } from 'next/server'
import { removeAdmin } from '@/lib/admins'
import { STUDENT_ID_PATTERN } from '@/lib/studentId'
import { CURRENT_USER } from '@/lib/currentUser'

// backend ชั่วคราว: DELETE ถอนสิทธิ์แอดมิน ห้ามถอนตัวเอง
// ยังไม่มี auth จึงใครก็เรียกได้ ต้องเพิ่มการตรวจสิทธิ์ก่อนใช้งานจริง

export async function DELETE(_request: Request, { params }: { params: Promise<{ studentId: string }> }) {
    const { studentId } = await params
    if (!STUDENT_ID_PATTERN.test(studentId)) {
        return NextResponse.json({ error: 'รหัสนิสิตไม่ถูกต้อง' }, { status: 400 })
    }
    if (studentId === CURRENT_USER.studentId) {
        return NextResponse.json({ error: 'ไม่สามารถถอนสิทธิ์ของตัวเองได้' }, { status: 400 })
    }

    const removed = await removeAdmin(studentId)
    if (!removed) return NextResponse.json({ error: 'ไม่พบแอดมินรหัสนี้' }, { status: 404 })
    return NextResponse.json({ studentId })
}
