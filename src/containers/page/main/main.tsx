import React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PollSearch } from '@/components/common/search'
import { CreateMenu } from '@/containers/page/main/components/create'
import { PollGrid, type PollGridEmpty } from '@/containers/page/main/components/pollGrid'
import { MainTabs } from '@/containers/widgets/tabs'
import { getPolls } from '@/lib/polls'
import { pollHref } from '@/lib/pollHref'
import type { IPollCardDTO } from '@/dtos/pollcardDto'

// แต่ละแท็บดึงโพลตามสถานะ: พร้อมใช้งาน = อนุมัติแล้วหรือกำลังโหวต, จบโหวต = จบแล้ว, อื่นๆ = ฉบับร่างหรือรออนุมัติ
const TAB_STATUSES: Record<string, IPollCardDTO['type'][]> = {
    ready: ['APPROVED', 'VOTING'],
    close: ['DONE'],
    else: ['DRAFT', 'PENDING'],
}

const TAB_EMPTY: Record<string, PollGridEmpty> = {
    ready: {
        title: 'ยังไม่มีโพลที่พร้อมใช้งาน',
        description: 'โพลที่อนุมัติแล้วหรือกำลังเปิดโหวตจะอยู่ตรงนี้ เริ่มจากสร้างโพลแรกได้เลย',
        action: (
            <Link href='/create' className={cn(buttonVariants(), 'px-4 py-5 font-heading text-base font-bold')}>
                <Plus />
                สร้างโพล
            </Link>
        ),
    },
    close: {
        title: 'ยังไม่มีโพลที่จบโหวต',
        description: 'เมื่อโพลถึงเวลาปิดหรือถูกปิดรับคำตอบ ผลโหวตจะเก็บไว้ที่นี่',
    },
    else: {
        title: 'ไม่มีฉบับร่างหรือโพลที่รออนุมัติ',
        description: 'โพลที่บันทึกเป็นฉบับร่างหรือส่งขออนุมัติแล้วจะแสดงที่นี่',
    },
}

export async function MainPage() {
    const polls = await getPolls()

    // pb-24 เว้นที่ให้การ์ดแถวสุดท้ายเลื่อนพ้นปุ่มเมนูลอยมุมขวาล่าง (สูง 56px + ขอบ 16px)
    return (
        <div className='relative flex flex-col gap-2 pb-24'>
            <h1 className=' text-4xl font-bold font-heading'>โพลของคุณ</h1>
            <PollSearch polls={polls} />
            <MainTabs
                renderPanel={(tab) => (
                    <PollGrid
                        polls={polls.filter((poll) => TAB_STATUSES[tab]?.includes(poll.type))}
                        linkTo={pollHref}
                        empty={TAB_EMPTY[tab]}
                    />
                )}
            />
            <CreateMenu/>
        </div>
    )
}
