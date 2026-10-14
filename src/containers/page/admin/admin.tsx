import { AdminHeading } from "@/containers/page/admin/components/index"
import { ReviewActions } from "@/containers/page/admin/components/reviewActions"
import { AdminTabs } from '@/containers/widgets/tabs'
import { PollSearch } from '@/components/common/search'
import { PollGrid, type PollGridEmpty } from '@/containers/page/main/components/pollGrid'
import { getPolls } from '@/lib/polls'
import { pollHref } from '@/lib/pollHref'
import type { IPollCardDTO } from '@/dtos/pollcardDto'

// แท็บของแอดมินดึงโพลตามสถานะ: รออนุมัติ = PENDING, อนุมัติแล้ว = APPROVED, ปฏิเสธ = REJECTED
const ADMIN_TAB_STATUSES: Record<string, IPollCardDTO['type'][]> = {
    waiting: ['PENDING'],
    accept: ['APPROVED'],
    deny: ['REJECTED'],
}

const ADMIN_TAB_EMPTY: Record<string, PollGridEmpty> = {
    waiting: { title: 'ไม่มีโพลที่รออนุมัติ', description: 'เมื่อมีคนส่งโพลขออนุมัติ จะแสดงที่นี่ให้พิจารณา' },
    accept: { title: 'ยังไม่มีโพลที่อนุมัติแล้ว', description: 'โพลที่กดยืนยันแล้วจะย้ายมาอยู่ที่นี่' },
    deny: { title: 'ยังไม่มีโพลที่ถูกปฏิเสธ', description: 'โพลที่กดปฏิเสธแล้วจะย้ายมาอยู่ที่นี่' },
}

export async function AdminPage() {
    const polls = await getPolls()

    return (
        <div className="flex flex-col gap-4">
            <AdminHeading />
            <PollSearch polls={polls} />
            <AdminTabs
                renderPanel={(tab) => (
                    <PollGrid
                        polls={polls.filter((poll) => ADMIN_TAB_STATUSES[tab]?.includes(poll.type))}
                        // ปุ่มพิจารณาโพลแสดงเฉพาะแท็บรออนุมัติ
                        renderAction={tab === 'waiting' ? (poll) => <ReviewActions pollId={poll.id} /> : undefined}
                        linkTo={pollHref}
                        empty={ADMIN_TAB_EMPTY[tab]}
                    />
                )}
            />
        </div>
    )
}
