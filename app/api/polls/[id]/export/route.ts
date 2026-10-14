import { NextResponse } from 'next/server'
import { exportPollCsv } from '@/lib/pollResults'

// ส่งออกชุดคำตอบเป็นไฟล์ CSV (ไม่ใช่ JSON) backend เป็นคนเขียนไฟล์เสมอ
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const result = await exportPollCsv(id)
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
