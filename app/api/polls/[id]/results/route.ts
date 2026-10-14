import { NextResponse } from 'next/server'
import { getPollResults } from '@/lib/pollResults'

// ผลโหวตรวมของโพล หน้าผลเรียลไทม์ดึงซ้ำทุก 5 วินาที
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const results = await getPollResults(id)
    if (!results) return NextResponse.json({ error: 'ไม่พบโพล' }, { status: 404 })
    return NextResponse.json(results, { headers: { 'Cache-Control': 'no-store' } })
}
