import React from 'react'
import { notFound } from 'next/navigation'
import { ReviewFooter } from '@/containers/page/dashboard/components/reviewFooter'
import { isAdmin } from '@/lib/admins'
import { CURRENT_USER } from '@/lib/currentUser'
import { getPollDetail } from '@/lib/polls'

// หน้า dashboard ของโพล ตอนนี้ยังว่างไว้ก่อน slug = id ของโพล
// แอดมินที่เปิดโพลที่รออนุมัติจะเห็น footer ยืนยัน/ปฏิเสธ
export async function PollDashboardPage({ slug }: { slug: string }) {
    const [poll, admin] = await Promise.all([getPollDetail(slug), isAdmin(CURRENT_USER.studentId)])
    if (!poll) notFound()

    return (
        <div className='flex min-h-[60vh] flex-col'>
            <h1 className='sr-only'>{poll.title}</h1>
            {admin && poll.type === 'PENDING' && <ReviewFooter pollId={poll.id} />}
        </div>
    )
}
