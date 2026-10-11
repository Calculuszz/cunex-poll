import React from 'react'
import { PollSearch } from '@/components/common/search'
import { CreateButton } from '@/containers/page/main/components/create'
import { PollGrid } from '@/containers/page/main/components/pollGrid'
import { MOCK_POLLS } from '@/containers/page/main/mockPolls'
import { MainTabs } from '@/containers/widgets/tabs'
import type { IPollCardDTO } from '@/dtos/pollcardDto'

// แต่ละแท็บดึงโพลตามสถานะ: พร้อมใช้งาน = อนุมัติแล้วหรือกำลังโหวต, จบโหวต = จบแล้ว, อื่นๆ = ฉบับร่างหรือรออนุมัติ
const TAB_STATUSES: Record<string, IPollCardDTO['type'][]> = {
    ready: ['APPROVED', 'VOTING'],
    close: ['DONE'],
    else: ['DRAFT', 'PENDING'],
}

export function MainPage() {

    return (
        <div className=' relative flex flex-col gap-2'>
            <h1 className=' text-4xl font-bold font-heading'>โพลของคุณ</h1>
            <PollSearch />
            <MainTabs
                renderPanel={(tab) => (
                    <PollGrid polls={MOCK_POLLS.filter((poll) => TAB_STATUSES[tab]?.includes(poll.type))} />
                )}
            />
            <CreateButton/>
        </div>
    )
}
