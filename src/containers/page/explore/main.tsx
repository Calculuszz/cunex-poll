import React from 'react'
import { PollSearch } from '@/components/common/search'
import { Button } from '@/components/ui/button'
import { PollGrid } from '@/containers/page/main/components/pollGrid'
import { getPolls } from '@/lib/polls'

// หน้านี้แสดงเฉพาะโพลที่กำลังเปิดให้กรอก
export async function ExplorePage() {
    const allPolls = await getPolls()
    const polls = allPolls.filter((poll) => poll.type === 'VOTING')

    return (
        <div className=' relative flex flex-col gap-2'>
            <h1 className=' text-4xl font-bold font-heading'>โพลที่กรอกได้</h1>
            <PollSearch polls={polls} />
            <PollGrid
                polls={polls}
                empty={{ title: 'ยังไม่มีโพลที่เปิดให้กรอก', description: 'เมื่อมีโพลเปิดโหวต จะแสดงที่นี่ให้เข้าไปตอบได้' }}
                renderAction={() => (
                    // ยังไม่มีหน้าทำโพล จึงยังไม่ได้ผูกปุ่มกับ route ใด
                    <Button className='w-full px-4 py-5'>
                        <span className='font-heading font-bold text-base'>เริ่มทำโพล</span>
                    </Button>
                )}
            />
        </div>
    )
}
