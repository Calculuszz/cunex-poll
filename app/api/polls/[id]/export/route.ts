import { NextResponse } from 'next/server'
import { exportPollCsv } from '@/lib/pollResults'
import { isAdmin } from '@/lib/admins'
import { identifiesSender } from '@/lib/polls'
import { CURRENT_USER } from '@/lib/currentUser'

// ส่งออกชุดคำตอบเป็นไฟล์ CSV (ไม่ใช่ JSON) backend เป็นคนเขียนไฟล์เสมอ
// ?withIdentity=1 เพิ่มคอลัมน์ผู้ตอบ เฉพาะแอดมินหรือโพลที่เปิด "ระบุคนส่ง" คนอื่นขอมาได้ไฟล์ที่ไม่มีคอลัมน์นั้น ไม่ใช่ 403 (API contract §5.5)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const requested = new URL(request.url).searchParams.get('withIdentity') === '1'
    // แอดมินขอได้ทุกโพล · เจ้าของได้เมื่อโพลเปิด "ระบุคนส่ง"
    const withIdentity = requested && (await isAdmin(CURRENT_USER.studentId) || await identifiesSender(id))
    const result = await exportPollCsv(id, withIdentity)
    if (result === 'not_found') return NextResponse.json({ error: 'ไม่พบโพล' }, { status: 404 })
    if (result === 'bad_state') {
        return NextResponse.json({ error: 'ส่งออกได้เฉพาะโพลที่กำลังโหวตหรือปิดโหวตแล้ว' }, { status: 409 })
    }
    return new Response(result.csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(result.filename)}"`,
            'Cache-Control': 'no-store',
        },
    })
}
