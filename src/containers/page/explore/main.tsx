import React from 'react'
import { PollSearch } from '@/components/common/search'
import { Button } from '@/components/ui/button'
import { PollGrid } from '@/containers/page/main/components/pollGrid'
import { MOCK_POLLS } from '@/containers/page/main/mockPolls'

// หน้านี้แสดงเฉพาะโพลที่กำลังเปิดให้กรอก
export function ExplorePage() {
    return (
        <div className=' relative flex flex-col gap-2'>
            <h1 className=' text-4xl font-bold font-heading'>โพลที่กรอกได้</h1>
            <PollSearch />
            <PollGrid
                polls={MOCK_POLLS.filter((poll) => poll.type === 'VOTING')}
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
