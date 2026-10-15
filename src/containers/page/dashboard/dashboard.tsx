import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { ReviewFooter } from '@/containers/page/dashboard/components/reviewFooter'
import { PollStatusTags } from '@/containers/page/dashboard/components/pollStatusTags'
import { PollMetaInfo } from '@/containers/page/dashboard/components/pollMetaInfo'
import { PollActions } from '@/containers/page/dashboard/components/pollActions'
import { ResultsSection } from '@/containers/page/dashboard/components/resultsSection'
import { QuestionPreview } from '@/containers/page/dashboard/components/questionPreview'
import { PublishAction } from '@/containers/page/dashboard/components/publishAction'
import { isAdmin } from '@/lib/admins'
import { CURRENT_USER } from '@/lib/currentUser'
import { getPollDetail } from '@/lib/polls'
import { getPollResults } from '@/lib/pollResults'

const NOT_OPENED_MESSAGE: Partial<Record<string, string>> = {
    PENDING: 'โพลนี้รออนุมัติอยู่ จะเริ่มรับคำตอบหลังอนุมัติ',
    REJECTED: 'โพลนี้ไม่ผ่านการอนุมัติ จึงไม่มีผลโหวต',
}

// เลยเวลาปิดแล้วหรือยัง ณ ตอนที่ server render (หน้านี้ดึงข้อมูลใหม่ทุก request)
const isPastClose = (close: Date) => new Date(close).getTime() <= Date.now()

// หน้ารายละเอียดโพล (มุมมองเจ้าของ/แอดมิน) slug = id ของโพล
// ผลโหวตแสดงเฉพาะโพลที่เปิดโหวตแล้ว (กำลังโหวต/ปิดโหวตแล้ว) สถานะอื่นแสดงคำถามแบบอ่านอย่างเดียวแทน
// แอดมินที่เปิดโพลที่รออนุมัติจะเห็น footer ยืนยัน/ปฏิเสธ
// view = 'admin' คือหน้า /admin/(slug): เหมือนหน้าเจ้าของแต่เห็นรหัสผู้ตอบในคำตอบรายชุดและไฟล์ส่งออก
// หน้าเจ้าของเห็นรหัสผู้ตอบด้วยเมื่อโพลเปิด "ระบุคนส่ง" (เช่นใช้ทำแบบทดสอบ)
export async function PollDashboardPage({ slug, view = 'owner' }: { slug: string; view?: 'owner' | 'admin' }) {
    const [poll, admin, results] = await Promise.all([
        getPollDetail(slug),
        isAdmin(CURRENT_USER.studentId),
        getPollResults(slug),
    ])
    if (!poll) notFound()
    // ยังไม่มี proxy กันหน้าแอดมิน จึงตรวจที่นี่ด้วย คนที่ไม่ใช่แอดมินไปหน้าเจ้าของแทน
    if (view === 'admin' && !admin) redirect(`/dashboard/${slug}`)

    const opened = poll.type === 'VOTING' || poll.type === 'DONE'
    // เห็นรหัสผู้ตอบ: หน้าแอดมินเสมอ หรือเจ้าของโพลที่เปิด "ระบุคนส่ง" (API ตัดสินซ้ำ)
    const withIdentity = view === 'admin' || (poll.identifySender && poll.scope !== 'C')

    return (
        <div className='mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col gap-6 pb-8'>
            <header className='flex flex-col gap-3'>
                <PollStatusTags status={poll.type} scope={poll.scope} realtime={poll.realtime} />
                <h1 className='font-heading text-3xl font-bold break-words'>{poll.title}</h1>
                {view === 'admin' && <p className='text-sm text-ink-500'>มุมมองผู้ดูแลระบบ · เห็นรหัสผู้ตอบในคำตอบรายชุดและไฟล์ส่งออก</p>}
            </header>

            <PollMetaInfo poll={poll} view={view} />

            {opened && results ? (
                <>
                    <PollActions pollId={poll.id} voting={poll.type === 'VOTING'} />
                    <ResultsSection results={results} withIdentity={withIdentity} />
                </>
            ) : (
                <>
                    {/* อนุมัติแล้ว = เจ้าของ/แอดมินกด Publish เปิดโหวตเองได้ */}
                    {poll.type === 'APPROVED' ? (
                        <PublishAction pollId={poll.id} expired={isPastClose(poll.closeTime)} />
                    ) : (
                        <p className='rounded-2xl bg-inner-bg px-4 py-6 text-center text-ink-500'>
                            {NOT_OPENED_MESSAGE[poll.type] ?? 'โพลนี้ยังไม่เปิดโหวต จึงยังไม่มีผลให้ดู'}
                        </p>
                    )}
                    {/* ยังไม่มีผลโหวต แต่ดูได้ว่าโพลถามอะไร */}
                    <QuestionPreview items={poll.items} />
                </>
            )}

            {admin && poll.type === 'PENDING' && <ReviewFooter pollId={poll.id} />}
        </div>
    )
}
