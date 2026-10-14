import React from 'react'
import { notFound } from 'next/navigation'
import { ReviewFooter } from '@/containers/page/dashboard/components/reviewFooter'
import { PollStatusTags } from '@/containers/page/dashboard/components/pollStatusTags'
import { PollMetaInfo } from '@/containers/page/dashboard/components/pollMetaInfo'
import { PollActions } from '@/containers/page/dashboard/components/pollActions'
import { ResultsSection } from '@/containers/page/dashboard/components/resultsSection'
import { QuestionPreview } from '@/containers/page/dashboard/components/questionPreview'
import { isAdmin } from '@/lib/admins'
import { CURRENT_USER } from '@/lib/currentUser'
import { getPollDetail } from '@/lib/polls'
import { getPollResults } from '@/lib/pollResults'

const NOT_OPENED_MESSAGE: Partial<Record<string, string>> = {
    PENDING: 'โพลนี้รออนุมัติอยู่ จะเริ่มรับคำตอบหลังอนุมัติ',
    APPROVED: 'โพลนี้อนุมัติแล้ว รอถึงเวลาเปิดโหวต',
    REJECTED: 'โพลนี้ไม่ผ่านการอนุมัติ จึงไม่มีผลโหวต',
}

// หน้ารายละเอียดโพล (มุมมองเจ้าของ/แอดมิน) slug = id ของโพล
// ผลโหวตแสดงเฉพาะโพลที่เปิดโหวตแล้ว (กำลังโหวต/ปิดโหวตแล้ว) สถานะอื่นแสดงคำถามแบบอ่านอย่างเดียวแทน
// แอดมินที่เปิดโพลที่รออนุมัติจะเห็น footer ยืนยัน/ปฏิเสธ
export async function PollDashboardPage({ slug }: { slug: string }) {
    const [poll, admin, results] = await Promise.all([
        getPollDetail(slug),
        isAdmin(CURRENT_USER.studentId),
        getPollResults(slug),
    ])
    if (!poll) notFound()

    const opened = poll.type === 'VOTING' || poll.type === 'DONE'

    return (
        <div className='mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col gap-6 pb-8'>
            <header className='flex flex-col gap-3'>
                <PollStatusTags status={poll.type} scope={poll.scope} realtime={poll.realtime} />
                <h1 className='font-heading text-3xl font-bold break-words'>{poll.title}</h1>
            </header>

            <PollMetaInfo poll={poll} />

            {opened && results ? (
                <>
                    <PollActions pollId={poll.id} voting={poll.type === 'VOTING'} />
                    <ResultsSection results={results} />
                </>
            ) : (
                <>
                    <p className='rounded-2xl bg-inner-bg px-4 py-6 text-center text-ink-500'>
                        {NOT_OPENED_MESSAGE[poll.type] ?? 'โพลนี้ยังไม่เปิดโหวต จึงยังไม่มีผลให้ดู'}
                    </p>
                    {/* ยังไม่มีผลโหวต แต่ดูได้ว่าโพลถามอะไร */}
                    <QuestionPreview items={poll.items} />
                </>
            )}

            {admin && poll.type === 'PENDING' && <ReviewFooter pollId={poll.id} />}
        </div>
    )
}
