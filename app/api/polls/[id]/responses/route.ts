import { NextResponse } from 'next/server'
import { getResponsesPage } from '@/lib/pollResponses'
import { isAdmin } from '@/lib/admins'
import { identifiesSender } from '@/lib/polls'
import { CURRENT_USER } from '@/lib/currentUser'

// คำตอบรายชุด ?page=1&withIdentity=1
// withIdentity จากคนที่ไม่ใช่แอดมินได้ข้อมูลที่ไม่มีรหัสผู้ตอบ ไม่ใช่ 403 (เหมือนกติกา export ใน API contract §5.5)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const url = new URL(request.url)
    const page = Math.max(1, Math.floor(Number(url.searchParams.get('page') ?? 1)) || 1)
    // แอดมินขอได้ทุกโพล · เจ้าของได้เมื่อโพลเปิด "ระบุคนส่ง"
    const withIdentity = url.searchParams.get('withIdentity') === '1'
        && (await isAdmin(CURRENT_USER.studentId) || await identifiesSender(id))
    const result = await getResponsesPage(id, page, withIdentity)
    if (!result) return NextResponse.json({ error: 'ไม่พบโพล' }, { status: 404 })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
}
