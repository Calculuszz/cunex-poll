import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { getPollDetail } from '@/lib/polls'
import { getPollResults } from '@/lib/pollResults'
import { parseViews } from '@/lib/resultView'
import { RealtimeResults } from './realtimeResults'

// หน้าผลเรียลไทม์ ใช้ได้เฉพาะโพลที่เปิดโหวตแล้ว สถานะอื่นส่งกลับไปหน้ารายละเอียด
export async function RealtimePage({ slug, view, q }: { slug: string; view?: string; q?: string }) {
    const [poll, results] = await Promise.all([getPollDetail(slug), getPollResults(slug)])
    if (!poll || !results) notFound()
    if (poll.type !== 'VOTING' && poll.type !== 'DONE') redirect(`/dashboard/${slug}`)

    return (
        <RealtimeResults
            title={poll.title}
            initial={results}
            initialViews={parseViews(view)}
            initialPosition={q ? Number(q) : undefined}
        />
    )
}
