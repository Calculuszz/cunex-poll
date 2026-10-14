import React from 'react'
import { PollSearch } from '@/components/common/search'
import { PollGrid } from '@/containers/page/main/components/pollGrid'
import { getPolls } from '@/lib/polls'
import { getExploreVoteStates } from '@/lib/votes'
import { CURRENT_USER } from '@/lib/currentUser'
import { ExploreActions } from './exploreActions'

// หน้านี้แสดงเฉพาะโพลที่กำลังเปิดให้กรอก
export async function ExplorePage() {
    const [allPolls, states] = await Promise.all([getPolls(), getExploreVoteStates(CURRENT_USER.studentId)])
    const polls = allPolls.filter((poll) => poll.type === 'VOTING')

    return (
        <div className=' relative flex flex-col gap-2'>
            <h1 className=' text-4xl font-bold font-heading'>โพลที่กรอกได้</h1>
            <PollSearch polls={polls} />
            <PollGrid
                polls={polls}
                empty={{ title: 'ยังไม่มีโพลที่เปิดให้กรอก', description: 'เมื่อมีโพลเปิดโหวต จะแสดงที่นี่ให้เข้าไปตอบได้' }}
                renderAction={(poll) => <ExploreActions pollId={poll.id} state={states.get(poll.id)} />}
            />
        </div>
    )
}
