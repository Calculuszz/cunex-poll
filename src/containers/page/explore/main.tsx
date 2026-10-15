import React from 'react'
import { PollSearch } from '@/components/common/search'
import { PageNav } from '@/components/common/pageNav'
import { PollGrid } from '@/containers/page/main/components/pollGrid'
import { getExplorePolls } from '@/lib/polls'
import { getExploreVoteStates } from '@/lib/votes'
import { CURRENT_USER } from '@/lib/currentUser'
import { ExploreActions } from './exploreActions'

const PAGE_SIZE = 12

// หน้านี้แสดงเฉพาะโพลที่กำลังเปิดให้กรอก เจ้าของเปิดให้ขึ้นหน้า explore และผู้ใช้มีสิทธิ์ตอบ
// ช่องค้นหาค้นจากทุกหน้า ส่วนการ์ดแบ่งหน้าละ PAGE_SIZE ใบ
export async function ExplorePage({ page: rawPage }: { page?: string }) {
    const [polls, states] = await Promise.all([getExplorePolls(CURRENT_USER.studentId), getExploreVoteStates(CURRENT_USER.studentId)])
    const totalPages = Math.max(1, Math.ceil(polls.length / PAGE_SIZE))
    const page = Math.min(totalPages, Math.max(1, Math.floor(Number(rawPage)) || 1))

    return (
        <div className=' relative flex flex-col gap-2 pb-8'>
            <h1 className=' text-4xl font-bold font-heading'>โพลที่กรอกได้</h1>
            <PollSearch polls={polls} linkTarget='vote' />
            <PollGrid
                polls={polls.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
                empty={{ title: 'ยังไม่มีโพลที่เปิดให้กรอก', description: 'เมื่อมีโพลเปิดโหวต จะแสดงที่นี่ให้เข้าไปตอบได้' }}
                renderAction={(poll) => <ExploreActions pollId={poll.id} state={states.get(poll.id)} />}
            />
            <PageNav page={page} totalPages={totalPages} hrefOf={(n) => `/explore?page=${n}`} />
        </div>
    )
}
